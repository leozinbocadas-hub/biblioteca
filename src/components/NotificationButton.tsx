import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useToast } from '@/hooks/use-toast';

export const NotificationButton = () => {
  const [aberto, setAberto] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notificacoes,
    notificacoesNaoLidas,
    permissaoNotificacoes,
    solicitarPermissao,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotifications();

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

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificacoesNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
              {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 bg-[#1A1A1A] border-gray-800" align="end">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-lg">Notificações</h3>
            {notificacoes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={marcarTodasComoLidas}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
          
          {permissaoNotificacoes !== 'granted' && (
            <div className="mb-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Ativar notificações
                  </p>
                  <p className="text-xs text-gray-400">
                    Receba alertas sobre novidades
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAtivarNotificacoes}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Ativar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notificacao.lida ? 'bg-purple-900/10' : ''
                  }`}
                  onClick={() => {
                    marcarComoLida(notificacao.id);
                    if (notificacao.link) {
                      navigate(notificacao.link);
                      setAberto(false);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getIconeTipo(notificacao.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            !notificacao.lida ? 'text-white' : 'text-gray-300'
                          }`}
                        >
                          {notificacao.titulo}
                        </p>
                        {!notificacao.lida && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {notificacao.mensagem}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatarTempo(notificacao.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notificacoes.length > 0 && (
          <div className="p-3 border-t border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-purple-400 hover:text-purple-300"
              onClick={() => {
                setAberto(false);
                navigate('/notificacoes');
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

