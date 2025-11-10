import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const SupportButton = () => {
  const location = useLocation();
  
  // Mostrar apenas no dashboard (rotas logadas, exceto login)
  const shouldShow = location.pathname !== '/login' && location.pathname !== '/';
  
  if (!shouldShow) return null;

  const handleSupport = () => {
    window.open('https://wa.me/5537991270876', '_blank');
  };

  return (
    <button
      onClick={handleSupport}
      className="fixed bottom-24 right-6 sm:bottom-24 md:bottom-24 lg:bottom-8 lg:right-8 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Suporte via WhatsApp
      </span>
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></span>
    </button>
  );
};
