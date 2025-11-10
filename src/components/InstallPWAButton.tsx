import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      console.log('✅ Prompt de instalação capturado');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('⚠️ Prompt não disponível');
      return;
    }

    try {
      console.log('🚀 Instalando...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`✅ Resultado: ${outcome}`);
      
      if (outcome === 'accepted') {
        setShowButton(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ Erro ao instalar:', error);
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7F4EF0] to-[#642FDF] text-white rounded-lg hover:opacity-90 transition-all shadow-lg font-semibold w-full sm:w-auto"
      aria-label="Instalar Biblioteca Mística"
    >
      <Download size={20} />
      <span>Instalar App</span>
    </button>
  );
}
