import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, Trash2, Check, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Notificacoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notificacoes,
    notificacoesNaoLidas,
    permissaoNotificacoes,
    solicitarPermissao,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao,
    limparTodas,
  } = useNotifications();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const formatarTempo = (data: string) => {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'agora';
    }
  };

  const formatarDataCompleta = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'modulo':
        return '📚';
      case 'feed':
        return '📰';
      case 'comunidade':
        return '👥';
      default:
        return '🔔';
    }
  };

  const handleAtivarNotificacoes = async () => {
    const permitido = await solicitarPermissao();
    if (permitido) {
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá notificações sobre novidades.',
      });
    } else {
      toast({
        title: 'Permissão negada',
        description: 'Por favor, permita notificações nas configurações do navegador.',
        variant: 'destructive',
      });
    }
  };

  const handleClickNotificacao = (notificacao: any) => {
    marcarComoLida(notificacao.id);
    if (notificacao.link) {
      navigate(notificacao.link);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8">
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">🔔 Notificações</h1>
              {notificacoes.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={marcarTodasComoLidas}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marcar todas como lidas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Deseja realmente limpar todas as notificações?')) {
                        limparTodas();
                        toast({
                          title: 'Notificações limpas',
                          description: 'Todas as notificações foram removidas.',
                        });
                      }
                    }}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar todas
                  </Button>
                </div>
              )}
            </div>

            {/* Configurações de Notificações */}
            <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Configurações</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-white">
                      Notificações Push
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Receba notificações no navegador
                    </p>
                  </div>
                  {permissaoNotificacoes === 'granted' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-400">Ativado</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleAtivarNotificacoes}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Ativar
                    </Button>
                  )}
                </div>

                {permissaoNotificacoes === 'denied' && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      As notificações foram bloqueadas. Para ativar, acesse as configurações do navegador e permita notificações para este site.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{notificacoes.length}</p>
              </div>
              <div className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Não lidas</p>
                <p className="text-2xl font-bold text-purple-400">{notificacoesNaoLidas}</p>
              </div>
            </div>

            {/* Lista de Notificações */}
            {notificacoes.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-lg p-12 text-center border border-gray-800">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-400 text-sm">
                  Você será notificado quando houver novidades em módulos, feed ou comunidade.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificacoes.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={`bg-[#1A1A1A] rounded-lg p-4 border transition-colors ${
                      !notificacao.lida
                        ? 'border-purple-500/30 bg-purple-900/10'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="text-3xl flex-shrink-0">
                        {getIconeTipo(notificacao.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`font-semibold ${
                                  !notificacao.lida ? 'text-white' : 'text-gray-300'
                                }`}
                              >
                                {notificacao.titulo}
                              </h3>
                              {!notificacao.lida && (
                                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {notificacao.mensagem}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!notificacao.lida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoLida(notificacao.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removerNotificacao(notificacao.id);
                                toast({
                                  title: 'Notificação removida',
                                });
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatarTempo(notificacao.created_at)}
                          </p>
                          {notificacao.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClickNotificacao(notificacao)}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              Ver detalhes →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Notificacoes;

