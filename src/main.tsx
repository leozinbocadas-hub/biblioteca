import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ============================================
// PWA: ATUALIZAÇÕES AUTOMÁTICAS
// ============================================
// O componente UpdatePrompt cuida das atualizações
// Este código apenas garante que atualizações sejam aplicadas quando disponíveis
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // Detectar mudanças no service worker e recarregar automaticamente
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('🔄 Service Worker atualizado! Recarregando aplicação...');
    window.location.reload();
  });
}

// ============================================
// PWA: DETECTAR QUANDO APP FOI INSTALADO
// ============================================

window.addEventListener('appinstalled', () => {
  console.log('🎉 Biblioteca Mística instalada com sucesso!');
});

// ============================================
// PWA: PROMPT DE INSTALAÇÃO CUSTOMIZADO
// ============================================

let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // NÃO prevenir - deixar Chrome mostrar ícone de instalação
  // Apenas salvar o evento para uso posterior no banner customizado
  deferredPrompt = e;
  
  console.log('💡 PWA pode ser instalado!');
});

// Função para mostrar prompt de instalação (usar em um botão)
export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('⚠️ Prompt de instalação não disponível');
    return false;
  }
  
  // Mostrar prompt
  deferredPrompt.prompt();
  
  // Aguardar resposta do usuário
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`👤 Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} instalação`);
  
  // Limpar prompt
  deferredPrompt = null;
  
  return outcome === 'accepted';
};

// ============================================
// RENDERIZAR APP
// ============================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('❌ Root element não encontrado');
}

createRoot(rootElement).render(<App />);

console.log('🚀 Biblioteca Mística iniciada!');
console.log('📍 URL:', window.location.href);
console.log('📱 Mobile:', /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
console.log('💻 Standalone:', window.matchMedia('(display-mode: standalone)').matches);
