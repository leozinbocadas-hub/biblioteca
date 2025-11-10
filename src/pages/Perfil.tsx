import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Bell } from 'lucide-react';

const IMGBB_API_KEY = '55f36cf170ead780461094f42b006c12';

const Perfil = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [perfil, setPerfil] = useState({
    nome_exibicao: '',
    bio: '',
    cargo: '',
    foto_perfil_url: ''
  });
  const [perfilTemp, setPerfilTemp] = useState(perfil);
  const [meusPosts, setMeusPosts] = useState<any[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [preferenciasNotificacao, setPreferenciasNotificacao] = useState({
    notificar_curtidas_comentarios: true,
    notificar_posts_feed_oculto: true,
    notificar_posts_legiao_oculta: true,
  });
  const [carregandoPrefs, setCarregandoPrefs] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPerfil();
    loadMeusPosts();
    loadPreferenciasNotificacao();

    // Configurar Realtime subscription para atualização de foto de perfil
    const perfilChannel = supabase
      .channel('perfil_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          // Atualizar perfil local
          await loadPerfil();
          // Atualizar AuthContext
          if (payload.new) {
            const updatedUser = {
              ...user,
              nome_exibicao: payload.new.nome_exibicao || user.nome_exibicao,
              bio: payload.new.bio || user.bio,
              foto_perfil_url: payload.new.foto_perfil_url || user.foto_perfil_url,
            };
            setUser(updatedUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(perfilChannel);
    };
  }, [user, navigate]);

  const loadPerfil = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('nome_exibicao, bio, cargo, foto_perfil_url')
      .eq('id', user.id)
      .single();

    if (error) {
      toast({
        title: 'Erro ao carregar perfil',
        description: error.message,
        variant: 'destructive'
      });
    } else if (data) {
      const perfilData = {
        nome_exibicao: data.nome_exibicao || '',
        bio: data.bio || '',
        cargo: data.cargo || 'Membro',
        foto_perfil_url: data.foto_perfil_url || ''
      };
      setPerfil(perfilData);
      setPerfilTemp(perfilData);
    }
    setLoading(false);
  };

  const loadMeusPosts = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('posts_comunidade')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setMeusPosts(data);
    }
  };

  const loadPreferenciasNotificacao = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('preferencias_notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar preferências:', error);
      // Criar preferências padrão se não existir
      const { data: novaPref } = await supabase
        .from('preferencias_notificacoes')
        .insert({
          usuario_id: user.id,
          notificar_curtidas_comentarios: true,
          notificar_posts_feed_oculto: true,
          notificar_posts_legiao_oculta: true,
        })
        .select()
        .single();

      if (novaPref) {
        setPreferenciasNotificacao({
          notificar_curtidas_comentarios: novaPref.notificar_curtidas_comentarios ?? true,
          notificar_posts_feed_oculto: novaPref.notificar_posts_feed_oculto ?? true,
          notificar_posts_legiao_oculta: novaPref.notificar_posts_legiao_oculta ?? true,
        });
      }
    } else if (data) {
      setPreferenciasNotificacao({
        notificar_curtidas_comentarios: data.notificar_curtidas_comentarios ?? true,
        notificar_posts_feed_oculto: data.notificar_posts_feed_oculto ?? true,
        notificar_posts_legiao_oculta: data.notificar_posts_legiao_oculta ?? true,
      });
    } else {
      // Criar preferências padrão se não existir
      const { data: novaPref } = await supabase
        .from('preferencias_notificacoes')
        .insert({
          usuario_id: user.id,
          notificar_curtidas_comentarios: true,
          notificar_posts_feed_oculto: true,
          notificar_posts_legiao_oculta: true,
        })
        .select()
        .single();

      if (novaPref) {
        setPreferenciasNotificacao({
          notificar_curtidas_comentarios: novaPref.notificar_curtidas_comentarios ?? true,
          notificar_posts_feed_oculto: novaPref.notificar_posts_feed_oculto ?? true,
          notificar_posts_legiao_oculta: novaPref.notificar_posts_legiao_oculta ?? true,
        });
      }
    }
  };

  const atualizarPreferenciaNotificacao = async (
    campo: 'notificar_curtidas_comentarios' | 'notificar_posts_feed_oculto' | 'notificar_posts_legiao_oculta',
    valor: boolean
  ) => {
    if (!user || carregandoPrefs) return;

    setCarregandoPrefs(true);
    const novoValor = { [campo]: valor };
    setPreferenciasNotificacao(prev => ({ ...prev, ...novoValor }));

    const { error } = await supabase
      .from('preferencias_notificacoes')
      .upsert({
        usuario_id: user.id,
        ...preferenciasNotificacao,
        ...novoValor,
      }, {
        onConflict: 'usuario_id'
      });

    if (error) {
      console.error('Erro ao atualizar preferência:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      });
      // Reverter mudança
      setPreferenciasNotificacao(prev => ({ ...prev, [campo]: !valor }));
    } else {
      toast({
        title: 'Preferência atualizada!',
        description: 'Sua configuração foi salva com sucesso.',
      });
    }

    setCarregandoPrefs(false);
  };

  const salvarPerfil = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('usuarios')
      .update({
        nome_exibicao: perfilTemp.nome_exibicao,
        bio: perfilTemp.bio,
        foto_perfil_url: perfilTemp.foto_perfil_url
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Perfil atualizado!' });
      setPerfil(perfilTemp);
      setEditando(false);
      
      // Atualizar AuthContext para que todos os componentes vejam a mudança instantaneamente
      if (user) {
        setUser({
          ...user,
          nome_exibicao: perfilTemp.nome_exibicao,
          bio: perfilTemp.bio,
          foto_perfil_url: perfilTemp.foto_perfil_url
        });
      }
    }
  };

  const cancelarEdicao = () => {
    setPerfilTemp(perfil);
    setEditando(false);
  };

  const handleUploadFotoPerfil = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem válida',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Imagem muito grande. Máximo 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploadingFoto(true);

    try {
      // Upload para ImgBB
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        
        // Atualizar no Supabase
        const { error } = await supabase
          .from('usuarios')
          .update({ foto_perfil_url: imageUrl })
          .eq('id', user!.id);

        if (error) throw error;

        toast({
          title: 'Foto atualizada!',
          description: 'Sua foto de perfil foi atualizada com sucesso'
        });
        
        // Atualizar estado local
        setPerfil({ ...perfil, foto_perfil_url: imageUrl });
        setPerfilTemp({ ...perfilTemp, foto_perfil_url: imageUrl });
        
        // Atualizar AuthContext para que todos os componentes vejam a mudança instantaneamente
        if (user) {
          setUser({
            ...user,
            foto_perfil_url: imageUrl
          });
        }
      }
    } catch (error) {
      console.error('Erro upload:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Erro ao atualizar foto de perfil',
        variant: 'destructive'
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
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
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8 overflow-x-hidden">
        <Navbar />
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          <div className="max-w-2xl mx-auto w-full overflow-x-hidden">
            {/* Header do Perfil */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-900 rounded-t-lg h-32" />

        <div className="bg-card rounded-b-lg p-6 -mt-16 border border-border border-t-0">
          {/* Foto de Perfil */}
          <div className="relative w-32 h-32 mx-auto -mt-16 mb-4">
            <img
              src={perfil.foto_perfil_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full border-4 border-card object-cover"
            />
            
            {/* Botão de Câmera (Upload) */}
            <label 
              htmlFor="upload-foto-perfil"
              className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            >
              <Camera className="w-5 h-5 text-white" />
              <input
                id="upload-foto-perfil"
                type="file"
                accept="image/*"
                onChange={handleUploadFotoPerfil}
                className="hidden"
              />
            </label>
            
            {/* Loading durante upload */}
            {uploadingFoto && (
              <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Modo Visualização */}
          {!editando && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {perfil.nome_exibicao || user?.email}
              </h2>
              <p className="text-purple-400 mt-1">{perfil.cargo}</p>
              {perfil.bio && (
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">{perfil.bio}</p>
              )}

              <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{user?.email}</p>
              </div>

              <Button
                onClick={() => setEditando(true)}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
              >
                Editar Perfil
              </Button>
            </div>
          )}

          {/* Modo Edição */}
          {editando && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome de Exibição</label>
                <Input
                  value={perfilTemp.nome_exibicao}
                  onChange={(e) => setPerfilTemp({ ...perfilTemp, nome_exibicao: e.target.value })}
                  className="mt-1"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Bio</label>
                <Textarea
                  value={perfilTemp.bio}
                  onChange={(e) => setPerfilTemp({ ...perfilTemp, bio: e.target.value })}
                  className="mt-1"
                  rows={3}
                  placeholder="Conte um pouco sobre você"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={salvarPerfil} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Salvar
                </Button>
                <Button onClick={cancelarEdicao} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Configurações de Notificação */}
        <div className="mt-8 bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-purple-500" />
            <h3 className="text-xl font-bold text-foreground">Configurações de Notificação</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="notif-curtidas" className="text-base font-semibold text-foreground cursor-pointer">
                  Notificação curtidas/comentários no seu post
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba notificações quando alguém curtir ou comentar em suas publicações
                </p>
              </div>
              <Switch
                id="notif-curtidas"
                checked={preferenciasNotificacao.notificar_curtidas_comentarios}
                onCheckedChange={(checked) =>
                  atualizarPreferenciaNotificacao('notificar_curtidas_comentarios', checked)
                }
                disabled={carregandoPrefs}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="notif-feed" className="text-base font-semibold text-foreground cursor-pointer">
                  Notificação Posts novos Feed Oculto
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba notificações quando novos posts forem publicados no Feed Oculto
                </p>
              </div>
              <Switch
                id="notif-feed"
                checked={preferenciasNotificacao.notificar_posts_feed_oculto}
                onCheckedChange={(checked) =>
                  atualizarPreferenciaNotificacao('notificar_posts_feed_oculto', checked)
                }
                disabled={carregandoPrefs}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="notif-legiao" className="text-base font-semibold text-foreground cursor-pointer">
                  Notificação Posts novos Legião Oculta
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba notificações quando novos posts forem publicados na Legião Oculta
                </p>
              </div>
              <Switch
                id="notif-legiao"
                checked={preferenciasNotificacao.notificar_posts_legiao_oculta}
                onCheckedChange={(checked) =>
                  atualizarPreferenciaNotificacao('notificar_posts_legiao_oculta', checked)
                }
                disabled={carregandoPrefs}
              />
            </div>
          </div>
        </div>

        {/* Seção de Posts do Usuário */}
        <div className="mt-8 w-full max-w-full overflow-hidden">
          <h3 className="text-xl font-bold text-foreground mb-4">Suas Publicações</h3>
          <div className="space-y-3 w-full max-w-full">
            {meusPosts.map((post) => {
              const isExpanded = expandedPosts[post.id];
              const shouldTruncate = post.conteudo.length > 300;
              const displayContent = isExpanded || !shouldTruncate
                ? post.conteudo
                : post.conteudo.slice(0, 300) + '...';

              return (
                <div key={post.id} className="bg-card rounded-lg p-4 border border-border w-full max-w-full overflow-hidden">
                  <div className="mb-2 w-full max-w-full overflow-hidden">
                    <p className="text-foreground whitespace-pre-wrap break-all">
                      {displayContent}
                    </p>
                    {shouldTruncate && (
                      <button
                        onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="text-purple-500 hover:text-purple-400 text-sm font-medium mt-2 transition-colors underline"
                      >
                        {isExpanded ? 'Ver menos' : 'Ver mais'}
                      </button>
                    )}
                  </div>
                  {post.imagem_url && (
                    <img
                      src={post.imagem_url}
                      alt="Post"
                      className="w-full max-w-full h-48 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">{formatarData(post.created_at)}</p>
                </div>
              );
            })}
            {meusPosts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Você ainda não fez nenhuma publicação.
              </p>
            )}
          </div>
        </div>
        </div>
        </div>
        <NewPostButton />
        <BottomNav />
      </div>
    </>
  );
};

export default Perfil;
