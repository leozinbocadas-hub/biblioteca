import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export type TipoNotificacao = 'modulo' | 'feed' | 'comunidade';
export type TipoEvento = 'novo' | 'atualizacao' | 'comentario' | 'curtida';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  evento: TipoEvento;
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  created_at: string;
  data?: {
    post_id?: string;
    modulo_id?: string;
    usuario_id?: string;
    comentario_id?: string;
    comentario_preview?: string;
    titulo?: string;
    conteudo_preview?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState<NotificationPermission>('default');

  // Carregar notificações do banco de dados
  const carregarNotificacoes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao carregar notificações:', error);
      return;
    }

    if (data) {
      const notifs: Notificacao[] = data.map((n: any) => ({
        id: n.id,
        tipo: n.tipo as TipoNotificacao,
        evento: n.evento as TipoEvento,
        titulo: n.titulo,
        mensagem: n.mensagem,
        link: n.link || undefined,
        lida: n.lida,
        created_at: n.created_at,
        data: n.data || undefined,
      }));

      setNotificacoes(notifs);
      setNotificacoesNaoLidas(notifs.filter(n => !n.lida).length);
    }
  };

  // Carregar notificações quando o usuário mudar
  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      setNotificacoesNaoLidas(0);
      return;
    }

    carregarNotificacoes();

    // Verificar permissão de notificações
    if ('Notification' in window) {
      setPermissaoNotificacoes(Notification.permission);
    }

    // Configurar Realtime subscription para notificações
    const channel = supabase
      .channel(`notificacoes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const novaNotif = payload.new as any;
          const notificacao: Notificacao = {
            id: novaNotif.id,
            tipo: novaNotif.tipo as TipoNotificacao,
            evento: novaNotif.evento as TipoEvento,
            titulo: novaNotif.titulo,
            mensagem: novaNotif.mensagem,
            link: novaNotif.link || undefined,
            lida: novaNotif.lida,
            created_at: novaNotif.created_at,
            data: novaNotif.data || undefined,
          };

          setNotificacoes(prev => [notificacao, ...prev]);
          setNotificacoesNaoLidas(prev => prev + 1);

          // Mostrar notificação push se permitido
          if (permissaoNotificacoes === 'granted') {
            new Notification(notificacao.titulo, {
              body: notificacao.mensagem,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: notificacao.id,
              requireInteraction: false,
            }).onclick = () => {
              if (notificacao.link) {
                window.focus();
                window.location.href = notificacao.link;
              }
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permissaoNotificacoes]);

  // Solicitar permissão de notificações push
  const solicitarPermissao = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissaoNotificacoes('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermissaoNotificacoes('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissaoNotificacoes(permission);
    return permission === 'granted';
  };

  // Adicionar nova notificação (manter compatibilidade, mas agora usa banco)
  const adicionarNotificacao = async (
    tipo: TipoNotificacao,
    evento: TipoEvento,
    titulo: string,
    mensagem: string,
    link?: string,
    data?: Notificacao['data']
  ) => {
    if (!user) return null;

    const { data: novaNotif, error } = await supabase
      .from('notificacoes')
      .insert({
        usuario_id: user.id,
        tipo,
        evento,
        titulo,
        mensagem,
        link,
        lida: false,
        data: data || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }

    if (novaNotif) {
      const notificacao: Notificacao = {
        id: novaNotif.id,
        tipo: novaNotif.tipo as TipoNotificacao,
        evento: novaNotif.evento as TipoEvento,
        titulo: novaNotif.titulo,
        mensagem: novaNotif.mensagem,
        link: novaNotif.link || undefined,
        lida: false,
        created_at: novaNotif.created_at,
        data: novaNotif.data || undefined,
      };

      setNotificacoes(prev => [notificacao, ...prev]);
      setNotificacoesNaoLidas(prev => prev + 1);

      // Mostrar notificação push se permitido
      if (permissaoNotificacoes === 'granted') {
        new Notification(titulo, {
          body: mensagem,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: notificacao.id,
          requireInteraction: false,
        }).onclick = () => {
          if (link) {
            window.focus();
            window.location.href = link;
          }
        };
      }

      return notificacao;
    }

    return null;
  };

  // Marcar notificação como lida
  const marcarComoLida = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return;
    }

    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
    setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('usuario_id', user.id)
      .eq('lida', false);

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return;
    }

    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNotificacoesNaoLidas(0);
  };

  // Remover notificação
  const removerNotificacao = async (id: string) => {
    if (!user) return;

    const notif = notificacoes.find(n => n.id === id);
    const eraLida = notif?.lida || false;

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id);

    if (error) {
      console.error('Erro ao remover notificação:', error);
      return;
    }

    setNotificacoes(prev => prev.filter(n => n.id !== id));
    if (!eraLida) {
      setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
    }
  };

  // Limpar todas as notificações
  const limparTodas = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('usuario_id', user.id);

    if (error) {
      console.error('Erro ao limpar notificações:', error);
      return;
    }

    setNotificacoes([]);
    setNotificacoesNaoLidas(0);
  };

  return {
    notificacoes,
    notificacoesNaoLidas,
    permissaoNotificacoes,
    solicitarPermissao,
    adicionarNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao,
    limparTodas,
    recarregar: carregarNotificacoes,
  };
};

