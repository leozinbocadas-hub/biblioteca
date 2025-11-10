import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PostFeed, Comentario } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type PostComAutor = PostFeed & {
  usuario: {
    nome_exibicao: string | null;
    foto_perfil_url: string | null;
    cargo: string | null;
  };
  curtidas: Array<{ usuario_id: string }>;
};

type ComentarioComAutor = Comentario & {
  usuario: {
    nome_exibicao: string | null;
    foto_perfil_url: string | null;
  };
};

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [comentariosVisiveis, setComentariosVisiveis] = useState<Record<string, boolean>>({});
  const [comentarios, setComentarios] = useState<Record<string, ComentarioComAutor[]>>({});
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [contadoresComentarios, setContadoresComentarios] = useState<Record<string, number>>({});
  const [dialogDeletar, setDialogDeletar] = useState<{ open: boolean; postId: string | null }>({
    open: false,
    postId: null,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadPosts();
    
    // Carregar contadores de comentários para todos os posts
    const carregarContadores = async () => {
      if (posts.length > 0) {
        const postIds = posts.map(p => p.id);
        const { data } = await supabase
          .from('comentarios_feed')
          .select('post_id')
          .in('post_id', postIds);
        
        if (data) {
          const contadores: Record<string, number> = {};
          data.forEach(c => {
            contadores[c.post_id] = (contadores[c.post_id] || 0) + 1;
          });
          // Atualizar comentários com contadores
          Object.keys(contadores).forEach(postId => {
            if (!comentarios[postId]) {
              setComentarios(prev => ({ ...prev, [postId]: [] }));
            }
          });
        }
      }
    };
    
    if (posts.length > 0) {
      carregarContadores();
    }

    // Configurar Realtime subscriptions
    const postsChannel = supabase
      .channel('posts_feed_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts_feed',
        },
        () => {
          loadPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'curtidas_feed',
        },
        () => {
          loadPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comentarios_feed',
        },
        (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (postId) {
            loadComentarios(postId);
            // Atualizar contador
            loadContadorComentarios(postId).then(count => {
              setContadoresComentarios(prev => ({ ...prev, [postId]: count }));
            });
            // Atualizar posts para refletir mudanças
            loadPosts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [user, navigate]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts_feed')
      .select(`
        *,
        usuario:usuarios(nome_exibicao, foto_perfil_url, cargo),
        curtidas:curtidas_feed(usuario_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar posts',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setPosts(data as PostComAutor[]);
      
      // Carregar contadores de comentários para todos os posts
      if (data && data.length > 0) {
        const postIds = data.map(p => p.id);
        const { data: comentariosData } = await supabase
          .from('comentarios_feed')
          .select('post_id')
          .in('post_id', postIds);
        
        if (comentariosData) {
          const contadores: Record<string, number> = {};
          comentariosData.forEach(c => {
            contadores[c.post_id] = (contadores[c.post_id] || 0) + 1;
          });
          
          // Carregar comentários completos para posts que já foram abertos
          Object.keys(contadores).forEach(postId => {
            setContadoresComentarios(prev => ({ ...prev, [postId]: contadores[postId] }));
            if (comentariosVisiveis[postId]) {
              loadComentarios(postId);
            }
          });
        }
      }
    }
    setLoading(false);
  };

  const toggleCurtida = async (postId: string, jaCurtiu: boolean) => {
    if (!user) return;

    // Atualização otimista - atualizar estado local imediatamente
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const curtidasAtuais = post.curtidas || [];
        const jaTemCurtida = curtidasAtuais.some((c: any) => c.usuario_id === user.id);
        
        if (jaTemCurtida && jaCurtiu) {
          // Remover curtida
          return {
            ...post,
            curtidas: curtidasAtuais.filter((c: any) => c.usuario_id !== user.id)
          };
        } else if (!jaTemCurtida && !jaCurtiu) {
          // Adicionar curtida
          return {
            ...post,
            curtidas: [...curtidasAtuais, { usuario_id: user.id }]
          };
        }
      }
      return post;
    }));

    // Atualizar no banco
    if (jaCurtiu) {
      await supabase
        .from('curtidas_feed')
        .delete()
        .eq('usuario_id', user.id)
        .eq('post_id', postId);
    } else {
      await supabase
        .from('curtidas_feed')
        .insert({ usuario_id: user.id, post_id: postId });
    }
    
    // Realtime subscription vai garantir que está sincronizado
  };

  const loadComentarios = async (postId: string) => {
    const { data } = await supabase
      .from('comentarios_feed')
      .select(`
        *,
        usuario:usuarios(nome_exibicao, foto_perfil_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComentarios(prev => ({ ...prev, [postId]: data as ComentarioComAutor[] }));
    }
  };

  // Carregar contador de comentários para um post específico
  const loadContadorComentarios = async (postId: string) => {
    const { count } = await supabase
      .from('comentarios_feed')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    
    return count || 0;
  };

  const toggleComentarios = (postId: string) => {
    const novoEstado = !comentariosVisiveis[postId];
    setComentariosVisiveis(prev => ({ ...prev, [postId]: novoEstado }));
    
    if (novoEstado && !comentarios[postId]) {
      loadComentarios(postId);
    }
  };

  const adicionarComentario = async (postId: string) => {
    if (!user || !novoComentario[postId]?.trim()) return;

    const conteudoComentario = novoComentario[postId];
    
    // Limpar input imediatamente
    setNovoComentario(prev => ({ ...prev, [postId]: '' }));
    
    // Atualização otimista - adicionar comentário localmente imediatamente
    const novoComentarioLocal: ComentarioComAutor = {
      id: `temp-${Date.now()}`,
      usuario_id: user.id,
      post_id: postId,
      conteudo: conteudoComentario,
      created_at: new Date().toISOString(),
      usuario: {
        nome_exibicao: user.nome_exibicao || null,
        foto_perfil_url: user.foto_perfil_url || null
      }
    };
    
    setComentarios(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), novoComentarioLocal]
    }));
    
    // Atualizar contador imediatamente
    setContadoresComentarios(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));

    // Inserir no banco
    const { data, error } = await supabase
      .from('comentarios_feed')
      .insert({
        usuario_id: user.id,
        post_id: postId,
        conteudo: conteudoComentario
      })
      .select(`
        *,
        usuario:usuarios(nome_exibicao, foto_perfil_url)
      `)
      .single();

    if (error) {
      // Reverter mudança otimista em caso de erro
      setComentarios(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== novoComentarioLocal.id)
      }));
      setContadoresComentarios(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 1) - 1)
      }));
      setNovoComentario(prev => ({ ...prev, [postId]: conteudoComentario }));
      
      toast({
        title: 'Erro ao comentar',
        description: error.message,
        variant: 'destructive'
      });
    } else if (data) {
      // Substituir comentário temporário pelo real
      setComentarios(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c => 
          c.id === novoComentarioLocal.id ? data as ComentarioComAutor : c
        )
      }));
    }
  };

  const abrirDialogDeletar = (postId: string) => {
    if (!user) return;
    
    // Verificar se é admin
    if (user.cargo?.toLowerCase() !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem deletar posts.',
        variant: 'destructive'
      });
      return;
    }

    setDialogDeletar({ open: true, postId });
  };

  const deletarPost = async () => {
    if (!dialogDeletar.postId) return;

    const postId = dialogDeletar.postId;

    // Deletar curtidas relacionadas
    await supabase
      .from('curtidas_feed')
      .delete()
      .eq('post_id', postId);

    // Deletar comentários relacionados
    await supabase
      .from('comentarios_feed')
      .delete()
      .eq('post_id', postId);

    // Deletar o post
    const { error } = await supabase
      .from('posts_feed')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Erro ao deletar post',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Post deletado',
        description: 'O post foi removido com sucesso.',
        variant: 'success',
      });
      loadPosts();
    }

    setDialogDeletar({ open: false, postId: null });
  };

  const isAdmin = user?.cargo?.toLowerCase() === 'admin';

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'noticia': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'postagens': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'aviso': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'atualizacao': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getBadgeEmoji = (tipo: string) => {
    switch (tipo) {
      case 'aviso': return '⚠️';
      case 'atualizacao': return '🔄';
      case 'postagens': return '👁️‍🗨️';
      case 'noticia': return '👁️‍🗨️'; // Compatibilidade com posts antigos
      default: return '';
    }
  };

  const getBadgeLabel = (tipo: string) => {
    // Normalizar tipo antigo para novo
    if (tipo === 'noticia') return 'Postagens';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8">
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">📰 Feed Oculto</h1>
            </div>

        <div className="space-y-4">
          {posts.map((post) => {
            const isExpanded = expandedPosts[post.id];
            const shouldTruncate = post.conteudo.length > 400;
            const displayContent = isExpanded || !shouldTruncate 
              ? post.conteudo 
              : post.conteudo.slice(0, 400) + '...';

            return (
              <div key={post.id} className="bg-card rounded-lg p-6 border border-border">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getBadgeColor(post.tipo)}`}>
                  {getBadgeEmoji(post.tipo)} {getBadgeLabel(post.tipo)}
                </span>

                {post.imagem_url && (
                  <img
                    src={post.imagem_url}
                    alt={post.titulo}
                    className="w-full h-48 object-cover rounded-lg mt-4 max-w-full"
                  />
                )}

                <h2 className="text-2xl font-bold text-foreground mt-4 overflow-hidden text-ellipsis line-clamp-2 break-words">
                  {post.titulo}
                </h2>
                
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                  {displayContent}
                </p>

                {shouldTruncate && (
                  <button
                    onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !isExpanded }))}
                    className="text-purple-500 hover:text-purple-400 text-sm font-medium mt-2 transition-colors underline"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.usuario?.foto_perfil_url || 'https://via.placeholder.com/32'}
                      alt={post.usuario?.nome_exibicao || 'Usuário'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-foreground">{post.usuario?.nome_exibicao || 'Anônimo'}</p>
                      <p className="text-xs">{post.usuario?.cargo || 'Membro'}</p>
                    </div>
                  </div>
                  <span>{formatarData(post.created_at)}</span>
                </div>

                {/* Ações: Curtir e Comentar */}
                <div className="flex items-center gap-6 text-muted-foreground border-t border-border pt-3 mt-4">
                  {(() => {
                    const jaCurtiu = post.curtidas?.some((c: any) => c.usuario_id === user?.id) || false;
                    const totalCurtidas = post.curtidas?.length || 0;
                    
                    return (
                      <>
                        <button
                          onClick={() => toggleCurtida(post.id, jaCurtiu)}
                          className={`flex items-center gap-2 transition-colors ${
                            jaCurtiu ? 'text-red-500' : 'hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${jaCurtiu ? 'fill-current' : ''}`} />
                          <span>{totalCurtidas}</span>
                        </button>
                        <button
                          onClick={() => toggleComentarios(post.id)}
                          className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>
                            {contadoresComentarios[post.id] ?? (comentarios[post.id]?.length || 0)}
                          </span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => abrirDialogDeletar(post.id)}
                            className="flex items-center gap-2 hover:text-red-400 transition-colors ml-auto"
                            title="Deletar post (Admin)"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Seção de Comentários */}
                {comentariosVisiveis[post.id] && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    {comentarios[post.id]?.map((comentario) => {
                      const isCommentExpanded = expandedComments[comentario.id];
                      const shouldTruncateComment = comentario.conteudo.length > 200;
                      
                      return (
                        <div key={comentario.id} className="flex gap-2">
                          <img
                            src={comentario.usuario?.foto_perfil_url || 'https://via.placeholder.com/32'}
                            alt={comentario.usuario?.nome_exibicao || 'Usuário'}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 bg-muted rounded-lg p-2 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {comentario.usuario?.nome_exibicao || 'Anônimo'}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {isCommentExpanded || !shouldTruncateComment
                                ? comentario.conteudo
                                : comentario.conteudo.slice(0, 200) + '...'}
                            </p>
                            {shouldTruncateComment && (
                              <button
                                onClick={() => setExpandedComments(prev => ({ ...prev, [comentario.id]: !prev[comentario.id] }))}
                                className="text-purple-500 hover:text-purple-400 text-xs font-medium mt-1 transition-colors underline"
                              >
                                {isCommentExpanded ? 'Ver menos' : 'Ver mais'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Adicionar Comentário */}
                    <div className="flex gap-2">
                      <img
                        src={user?.foto_perfil_url || 'https://via.placeholder.com/32'}
                        alt="Você"
                        className="w-8 h-8 rounded-full"
                      />
                      <Input
                        placeholder="Escreva um comentário..."
                        className="flex-1"
                        value={novoComentario[post.id] || ''}
                        onChange={(e) =>
                          setNovoComentario(prev => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            adicionarComentario(post.id);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum post publicado ainda.</p>
          </div>
        )}
          </div>
        </div>
        <NewPostButton onPostCreated={loadPosts} />
        <BottomNav />
        
        {/* Dialog de Confirmação de Exclusão */}
        <ConfirmDialog
          open={dialogDeletar.open}
          onOpenChange={(open) => setDialogDeletar({ open, postId: dialogDeletar.postId })}
          onConfirm={deletarPost}
          title="Deletar Post"
          description="Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita."
          confirmText="Deletar"
          cancelText="Cancelar"
          variant="destructive"
        />
      </div>
    </>
  );
};

export default Feed;
