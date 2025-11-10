import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kavhltykeepbmygvmgwq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmhsdHlrZWVwYm15Z3ZtZ3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDgzNjEsImV4cCI6MjA3NjgyNDM2MX0.DxmgMwuwXXdDAcyZzI2GQX7Qoaf9PdkGJLjkIHbEYjk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Usuario = {
  id: string;
  email: string;
  password_hash: string;
  purchase_date: string;
  is_active: boolean;
  nome_exibicao?: string | null;
  foto_perfil_url?: string | null;
  bio?: string | null;
  cargo?: string | null;
  is_publicador?: boolean;
};

export type PostFeed = {
  id: string;
  usuario_id: string;
  titulo: string;
  conteudo: string;
  tipo: 'noticia' | 'aviso' | 'atualizacao';
  imagem_url?: string | null;
  created_at: string;
  updated_at?: string;
};

export type PostComunidade = {
  id: string;
  usuario_id: string;
  conteudo: string;
  imagem_url?: string | null;
  created_at: string;
  total_curtidas?: number;
  total_comentarios?: number;
};

export type Curtida = {
  id: string;
  usuario_id: string;
  post_id: string;
  created_at: string;
};

export type Comentario = {
  id: string;
  usuario_id: string;
  post_id: string;
  conteudo: string;
  created_at: string;
};

export type Modulo = {
  id: string;
  title: string;
  slug: string;
  order_number: number;
  requires_unlock: boolean;
  cover_image_url?: string | null;
  description?: string | null;
  created_at?: string;
};

export type PDF = {
  id: string;
  modulo_id: string;
  title: string;
  file_url: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  background_image_url?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  order_number: number;
  is_active: boolean;
};
