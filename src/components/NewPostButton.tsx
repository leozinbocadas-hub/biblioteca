import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { useIsPublicador } from '@/hooks/useIsPublicador';

interface NewPostButtonProps {
  onPostCreated?: () => void;
}

export const NewPostButton = ({ onPostCreated }: NewPostButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isPublicador, loading } = useIsPublicador();

  // Não mostrar nada se estiver carregando ou não for publicador
  if (loading || !isPublicador) {
    return null;
  }

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-24 lg:bottom-8 lg:right-24 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Criar novo post"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          🔮 Criar Novo Post
        </span>
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-green-600 animate-ping opacity-20"></span>
      </button>

      {/* Modal */}
      <CreatePostModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onPostCreated={onPostCreated}
      />
    </>
  );
};
