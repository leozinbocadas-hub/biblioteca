import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useIsPublicador } from '@/hooks/useIsPublicador';
import { EmojiPicker } from '@/components/EmojiPicker';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPublicador } = useIsPublicador();
  const [novoPost, setNovoPost] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'postagens' as 'postagens' | 'aviso' | 'atualizacao',
    imagem_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);
  const conteudoRef = useRef<HTMLTextAreaElement>(null);

  const criarPost = async () => {
    if (!user) return;
    
    if (!novoPost.titulo.trim() || !novoPost.conteudo.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e conteúdo',
        variant: 'destructive'
      });
      return;
    }

    // Publicadores não têm limite de caracteres
    if (!isPublicador) {
      if (novoPost.titulo.length > 100) {
        toast({
          title: 'Título muito longo',
          description: 'O título deve ter no máximo 100 caracteres',
          variant: 'destructive'
        });
        return;
      }

      if (novoPost.conteudo.length > 1000) {
        toast({
          title: 'Conteúdo muito longo',
          description: 'O conteúdo deve ter no máximo 1000 caracteres',
          variant: 'destructive'
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('posts_feed')
        .insert({
          usuario_id: user.id,
          titulo: novoPost.titulo,
          conteudo: novoPost.conteudo,
          tipo: novoPost.tipo,
          imagem_url: novoPost.imagem_url || null
        });

      if (error) throw error;

      toast({
        title: 'Post publicado!',
        description: 'Seu post foi publicado com sucesso',
        variant: 'success'
      });

      // Resetar formulário
      setNovoPost({ titulo: '', conteudo: '', tipo: 'postagens', imagem_url: '' });
      onOpenChange(false);
      
      // Callback para recarregar feed
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-purple-500/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">🔮 Criar Novo Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Tipo</label>
            <Select
              value={novoPost.tipo}
              onValueChange={(value: 'postagens' | 'aviso' | 'atualizacao') =>
                setNovoPost({ ...novoPost, tipo: value })
              }
            >
              <SelectTrigger className="bg-[#0A0A0A] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-gray-700">
                <SelectItem value="aviso">⚠️ Aviso</SelectItem>
                <SelectItem value="atualizacao">🔄 Atualização</SelectItem>
                <SelectItem value="postagens">👁️‍🗨️ Postagens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Título {!isPublicador && <span className="text-xs text-gray-500">(max 100 caracteres)</span>}
            </label>
            <div className="flex gap-2 items-center">
              <Input
                ref={tituloRef}
                value={novoPost.titulo}
                onChange={(e) => setNovoPost({ ...novoPost, titulo: e.target.value })}
                className="bg-[#0A0A0A] border-gray-700 text-white flex-1"
                placeholder="Título do post"
                maxLength={isPublicador ? undefined : 100}
              />
              <EmojiPicker 
                onEmojiSelect={(emoji) => {
                  const input = tituloRef.current;
                  if (input) {
                    const start = input.selectionStart || 0;
                    const end = input.selectionEnd || 0;
                    const newText = novoPost.titulo.substring(0, start) + emoji + novoPost.titulo.substring(end);
                    setNovoPost({ ...novoPost, titulo: newText });
                    setTimeout(() => {
                      input.focus();
                      input.setSelectionRange(start + emoji.length, start + emoji.length);
                    }, 0);
                  } else {
                    setNovoPost({ ...novoPost, titulo: novoPost.titulo + emoji });
                  }
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {novoPost.titulo.length}{!isPublicador && '/100'}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Conteúdo {!isPublicador && <span className="text-xs text-gray-500">(max 1000 caracteres)</span>}
            </label>
            <div className="relative">
              <Textarea
                ref={conteudoRef}
                value={novoPost.conteudo}
                onChange={(e) => setNovoPost({ ...novoPost, conteudo: e.target.value })}
                className="bg-[#0A0A0A] border-gray-700 text-white min-h-[150px]"
                placeholder="Conteúdo do post"
                maxLength={isPublicador ? undefined : 1000}
              />
              <div className="absolute bottom-2 right-2">
                <EmojiPicker 
                  onEmojiSelect={(emoji) => {
                    const textarea = conteudoRef.current;
                    if (textarea) {
                      const start = textarea.selectionStart || 0;
                      const end = textarea.selectionEnd || 0;
                      const newText = novoPost.conteudo.substring(0, start) + emoji + novoPost.conteudo.substring(end);
                      setNovoPost({ ...novoPost, conteudo: newText });
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                      }, 0);
                    } else {
                      setNovoPost({ ...novoPost, conteudo: novoPost.conteudo + emoji });
                    }
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {novoPost.conteudo.length}{!isPublicador && '/1000'}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Imagem (opcional)</label>
            <ImageUpload 
              onImageUploaded={(url) => setNovoPost({ ...novoPost, imagem_url: url || '' })}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={criarPost}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
