import { useState, useRef, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        title="Adicionar emoji"
      >
        <Smile className="w-5 h-5 text-gray-400 hover:text-purple-400" />
      </button>

      {showPicker && (
        <>
          {/* Overlay escuro no mobile */}
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setShowPicker(false)} />
          
          <div className="fixed sm:absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 sm:top-auto sm:left-auto sm:bottom-12 z-50">
            <div className="w-[90vw] max-w-[350px] sm:w-auto">
              <EmojiPickerReact
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width="100%"
                height={400}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
