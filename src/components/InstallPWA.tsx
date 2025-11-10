import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado (standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Se já instalado, não mostrar banner
    if (standalone) return;

    let promptCaptured = false;

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      // NÃO prevenir - deixar Chrome mostrar ícone de instalação
      // Apenas salvar o evento para uso no banner customizado
      setDeferredPrompt(e);
      promptCaptured = true;
      
      // Só mostrar banner customizado após 3 segundos
      setTimeout(() => {
        // Verificar se usuário já fechou o banner antes
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (!dismissed) {
          setShowBanner(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Para iOS e Desktop (fallback se evento não disparar)
    setTimeout(() => {
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed && !promptCaptured && !standalone) {
        setShowBanner(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Se for iOS ou não tiver prompt, mostrar instruções
      if (isIOS) {
        toast.info('Para instalar no iOS', {
          description: 'Toque no ícone de compartilhar e selecione "Adicionar à Tela de Início"',
          duration: 8000,
        });
      } else {
        toast.info('Como instalar no computador', {
          description: 'Use o menu do navegador (⋮) e selecione "Instalar Biblioteca Mística" ou procure pelo ícone de instalação na barra de endereço',
          duration: 10000,
        });
      }
      return;
    }

    // Mostrar prompt nativo
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!', {
        description: 'Você pode acessar a Biblioteca Mística direto da tela inicial',
      });
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Lembrar que usuário fechou (por 7 dias)
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem('pwa_install_dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Não mostrar se já instalado ou se banner foi fechado
  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] md:max-w-md z-50 animate-in slide-in-from-top-5 duration-500">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-accent rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-sm mb-1">
              Instalar Biblioteca Mística
            </h3>
            <p className="text-xs text-muted-foreground">
              {isIOS 
                ? 'Acesse rapidamente da sua tela inicial. Toque em compartilhar e "Adicionar à Tela de Início"'
                : 'Instale o app para acesso rápido e uso offline'
              }
            </p>
          </div>
        </div>

        {!isIOS && (
          <Button 
            onClick={handleInstall}
            className="w-full"
            size="sm"
          >
            Instalar App
          </Button>
        )}
      </div>
    </div>
  );
};
