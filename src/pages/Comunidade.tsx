import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ImageUpload } from '@/components/ImageUpload';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PostComunidade, Comentario } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type PostComAutor = PostComunidade & {
  usuario: {
    id: string;
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

const Comunidade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [conteudo, setConteudo] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [comentariosVisiveis, setComentariosVisiveis] = useState<Record<string, boolean>>({});
  const [comentarios, setComentarios] = useState<Record<string, ComentarioComAutor[]>>({});
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
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

    // Configurar Realtime subscriptions
    const postsChannel = supabase
      .channel('posts_comunidade_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts_comunidade',
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
          table: 'curtidas',
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
          table: 'comentarios',
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
      .from('posts_comunidade')
      .select(`
        *,
        usuario:usuarios(id, nome_exibicao, foto_perfil_url, cargo),
        curtidas(usuario_id)
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
          .from('comentarios')
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

  const criarPost = async () => {
    if (!user || !conteudo.trim()) return;

    const { error } = await supabase
      .from('posts_comunidade')
      .insert({
        usuario_id: user.id,
        conteudo: conteudo,
        imagem_url: imagemUrl
      });

    if (error) {
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({ 
        title: 'Post criado!',
        variant: 'success'
      });
      setConteudo('');
      setImagemUrl(null);
      loadPosts();
    }
  };

  const toggleCurtida = async (postId: string, jaCurtiu: boolean) => {
    if (!user) return;

    try {
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

      // Sempre verificar no banco de dados o estado real antes de fazer qualquer ação
      const { data: existingCurtida } = await supabase
        .from('curtidas')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      const realmenteCurtiu = !!existingCurtida;

      if (realmenteCurtiu) {
        // Se existe, deletar
        const { error } = await supabase
          .from('curtidas')
          .delete()
          .eq('usuario_id', user.id)
          .eq('post_id', postId);
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao remover curtida:', error);
          toast({
            title: 'Erro ao remover curtida',
            description: error.message,
            variant: 'destructive'
          });
          // Reverter mudança otimista
          loadPosts();
        }
      } else {
        // Se não existe, inserir
        const { error } = await supabase
          .from('curtidas')
          .insert({ usuario_id: user.id, post_id: postId });

        // Ignorar erro 409/23505 (duplicata) - pode acontecer em race conditions
        if (error) {
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('409')) {
            // Silenciosamente recarregar - a curtida já existe
          } else {
            console.error('Erro ao adicionar curtida:', error);
            toast({
              title: 'Erro ao curtir',
              description: error.message,
              variant: 'destructive'
            });
            // Reverter mudança otimista
            loadPosts();
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao toggle curtida:', error);
      toast({
        title: 'Erro ao curtir',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive'
      });
      // Reverter mudança otimista
      loadPosts();
    }
  };

  const loadComentarios = async (postId: string) => {
    const { data } = await supabase
      .from('comentarios')
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
      .from('comentarios')
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
      .from('comentarios')
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
      .from('curtidas')
      .delete()
      .eq('post_id', postId);

    // Deletar comentários relacionados
    await supabase
      .from('comentarios')
      .delete()
      .eq('post_id', postId);

    // Deletar o post
    const { error } = await supabase
      .from('posts_comunidade')
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

  const tempoAtras = (data: string) => {
    const segundos = Math.floor((new Date().getTime() - new Date(data).getTime()) / 1000);
    if (segundos < 60) return 'agora';
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    if (segundos < 86400) return `${Math.floor(segundos / 3600)}h`;
    return `${Math.floor(segundos / 86400)}d`;
  };

  // Função para transformar links em texto em elementos clicáveis
  const renderizarComLinks = (texto: string) => {
    // Regex para detectar URLs (http, https, www, etc)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
    
    const partes: Array<{ tipo: 'texto' | 'link'; conteudo: string }> = [];
    let ultimoIndice = 0;
    let match;
    
    // Criar uma nova regex para buscar todas as ocorrências
    const regex = new RegExp(urlRegex.source, urlRegex.flags);
    
    while ((match = regex.exec(texto)) !== null) {
      // Adicionar texto antes do link
      if (match.index > ultimoIndice) {
        partes.push({
          tipo: 'texto',
          conteudo: texto.substring(ultimoIndice, match.index)
        });
      }
      
      // Adicionar o link
      partes.push({
        tipo: 'link',
        conteudo: match[0]
      });
      
      ultimoIndice = regex.lastIndex;
    }
    
    // Adicionar texto restante
    if (ultimoIndice < texto.length) {
      partes.push({
        tipo: 'texto',
        conteudo: texto.substring(ultimoIndice)
      });
    }
    
    // Se não encontrou nenhum link, retornar o texto original
    if (partes.length === 0) {
      return <>{texto}</>;
    }
    
    return (
      <>
        {partes.map((parte, index) => {
          if (parte.tipo === 'link') {
            let url = parte.conteudo;
            // Adicionar https:// se não tiver protocolo
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline break-all"
              >
                {parte.conteudo}
              </a>
            );
          }
          return <span key={index}>{parte.conteudo}</span>;
        })}
      </>
    );
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
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">👥 Legião Oculta</h1>

            {/* Criar Post */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex gap-3 items-start">
                <img
                  src={user?.foto_perfil_url || 'https://via.placeholder.com/40'}
                  alt="Você"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <textarea 
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    placeholder="No que você está pensando?"
                    className="w-full bg-[#0A0A0A] text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                    <ImageUpload onImageUploaded={setImagemUrl} />
                    
                    <button
                      onClick={criarPost}
                      disabled={!conteudo.trim()}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            </div>

        {/* Lista de Posts */}
        <div className="space-y-4">
          {posts.map((post) => {
            const jaCurtiu = post.curtidas.some(c => c.usuario_id === user?.id);
            const totalCurtidas = post.curtidas.length;
            
            return (
              <div key={post.id} className="bg-card rounded-lg p-4 border border-border">
                {/* Autor */}
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={post.usuario?.foto_perfil_url || 'https://via.placeholder.com/40'}
                    alt={post.usuario?.nome_exibicao || 'Usuário'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {post.usuario?.nome_exibicao || 'Anônimo'}
                    </p>
                    <p className="text-sm text-muted-foreground">{tempoAtras(post.created_at)}</p>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="mb-3">
                  <p className="text-foreground whitespace-pre-wrap break-words">
                    {expandedPosts[post.id] || post.conteudo.length <= 400
                      ? renderizarComLinks(post.conteudo)
                      : renderizarComLinks(post.conteudo.slice(0, 400) + '...')}
                  </p>
                  {post.conteudo.length > 400 && (
                    <button
                      onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="text-purple-500 hover:text-purple-400 text-sm font-medium mt-2 transition-colors underline"
                    >
                      {expandedPosts[post.id] ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                </div>

                {/* Imagem */}
                {post.imagem_url && (
                  <div className="w-full rounded-lg mb-3 overflow-hidden flex justify-center bg-[#0A0A0A]">
                    <img
                      src={post.imagem_url}
                      alt="Post"
                      className="max-w-full h-auto rounded-lg object-contain max-h-[600px] sm:max-h-[700px] md:max-h-[800px]"
                      style={{ maxHeight: '80vh' }}
                    />
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center gap-6 text-muted-foreground border-t border-border pt-3">
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
                    <span>{contadoresComentarios[post.id] ?? (comentarios[post.id]?.length || 0)}</span>
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
                </div>

                {/* Comentários */}
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
                                ? renderizarComLinks(comentario.conteudo)
                                : renderizarComLinks(comentario.conteudo.slice(0, 200) + '...')}
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
            <p className="text-muted-foreground">Seja o primeiro a publicar algo!</p>
          </div>
        )}
          </div>
        </div>
        <NewPostButton />
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

export default Comunidade;
