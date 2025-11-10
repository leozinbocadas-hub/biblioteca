import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

const IMGBB_API_KEY = '55f36cf170ead780461094f42b006c12';

interface ImageUploadProps {
  onImageUploaded: (url: string | null) => void;
}

export const ImageUpload = ({ onImageUploaded }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  console.log('🟢 Componente ImageUpload montado - usando ImgBB API');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚪ Nenhum arquivo selecionado');
      return;
    }

    console.log('📷 Arquivo selecionado:', {
      nome: file.name,
      tamanho: `${(file.size / 1024).toFixed(2)} KB`,
      tipo: file.type
    });

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Tipo de arquivo inválido:', file.type);
      alert('Por favor, selecione uma imagem válida');
      return;
    }
    console.log('✅ Tipo de arquivo válido');

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande:', file.size, 'bytes');
      alert('Imagem muito grande. Máximo 5MB');
      return;
    }
    console.log('✅ Tamanho do arquivo válido');

    // Preview local
    console.log('📸 Gerando preview local...');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      console.log('✅ Preview local gerado');
    };
    reader.readAsDataURL(file);

    // Upload para ImgBB
    setUploading(true);
    console.log('🚀 Iniciando upload para ImgBB...');
    console.log('🔑 Usando API Key:', IMGBB_API_KEY.substring(0, 10) + '...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      console.log('📦 FormData preparado');

      const url = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
      console.log('🌐 URL da requisição:', url);
      console.log('📤 Enviando requisição para ImgBB...');
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Dados completos do ImgBB:', data);
      
      if (data.success) {
        console.log('✅ Upload bem-sucedido!');
        console.log('🖼️ URL da imagem:', data.data.url);
        console.log('🔗 URL de display:', data.data.display_url);
        console.log('📏 Tamanho original:', data.data.size);
        
        onImageUploaded(data.data.url);
        console.log('✅ URL enviada para componente pai');
      } else {
        console.error('❌ Upload falhou - success=false');
        throw new Error('Upload falhou');
      }
    } catch (error) {
      console.error('❌ ERRO COMPLETO NO UPLOAD:', error);
      console.error('❌ Tipo do erro:', error instanceof Error ? error.message : typeof error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setPreview(null);
      onImageUploaded(null);
    } finally {
      setUploading(false);
      console.log('🏁 Processo de upload finalizado');
    }
  };

  const removeImage = () => {
    console.log('🗑️ Removendo imagem...');
    setPreview(null);
    onImageUploaded(null);
    console.log('✅ Imagem removida');
  };

  return (
    <div>
      {!preview ? (
        <label className="flex items-center gap-2 cursor-pointer text-purple-400 hover:text-purple-300 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Enviando para ImgBB...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-5 h-5" />
              <span className="text-sm">Adicionar Foto</span>
            </>
          )}
        </label>
      ) : (
        <div className="relative inline-block mt-3">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg max-h-64 object-cover"
          />
          <button
            onClick={removeImage}
            type="button"
            className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
