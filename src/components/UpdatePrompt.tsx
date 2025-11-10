import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UpdatePrompt = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      
      reg = registration;
      setRegistration(registration);

      // Verificar atualizações periodicamente
      const checkForUpdates = () => {
        registration.update();
      };

      // Listener para detectar quando uma nova versão está disponível
      const handleUpdateFound = () => {
        const newWorker = registration.installing || registration.waiting;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' && 
              navigator.serviceWorker.controller &&
              !updateAvailable
            ) {
              // Nova versão disponível
              setUpdateAvailable(true);
            }
          });
        }
      };

      registration.addEventListener('updatefound', handleUpdateFound);

      // Verificar se já há um service worker esperando
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }

      // Verificar atualizações ao focar na janela
      const handleFocus = () => {
        checkForUpdates();
      };

      // Verificar atualizações periodicamente (a cada 60 segundos)
      const interval = setInterval(checkForUpdates, 60000);

      window.addEventListener('focus', handleFocus);

      // Verificar imediatamente ao carregar (após 5 segundos)
      setTimeout(checkForUpdates, 5000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
        registration.removeEventListener('updatefound', handleUpdateFound);
      };
    });

    // Listener global para mudanças de controller
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [updateAvailable]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Enviar mensagem para o service worker pular a espera
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Aguardar um pouco antes de recarregar
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Se não há worker esperando, apenas recarregar para pegar atualização
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-[#1A1A1A] border border-purple-500/30 rounded-lg p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Atualização disponível</h3>
            <p className="text-sm text-gray-400 mb-3">
              Uma nova versão do app está disponível. Deseja atualizar agora?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar agora
              </Button>
              <Button
                onClick={() => setUpdateAvailable(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

