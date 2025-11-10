-- ============================================
-- Tabelas para Feed Oculto - Curtidas e Comentários
-- ============================================

-- Tabela de Curtidas para Posts do Feed
CREATE TABLE IF NOT EXISTS curtidas_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts_feed(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, post_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_curtidas_feed_usuario ON curtidas_feed(usuario_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_feed_post ON curtidas_feed(post_id);

-- Tabela de Comentários para Posts do Feed
CREATE TABLE IF NOT EXISTS comentarios_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts_feed(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comentarios_feed_usuario ON comentarios_feed(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_feed_post ON comentarios_feed(post_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_feed_created ON comentarios_feed(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE curtidas_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_feed ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para curtidas_feed
CREATE POLICY "Usuários podem ver todas as curtidas"
  ON curtidas_feed FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar curtidas"
  ON curtidas_feed FOR INSERT
  WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem deletar suas próprias curtidas"
  ON curtidas_feed FOR DELETE
  USING (auth.uid()::text = usuario_id::text);

-- Políticas RLS para comentarios_feed
CREATE POLICY "Usuários podem ver todos os comentários"
  ON comentarios_feed FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar comentários"
  ON comentarios_feed FOR INSERT
  WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON comentarios_feed FOR UPDATE
  USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON comentarios_feed FOR DELETE
  USING (auth.uid()::text = usuario_id::text);

-- NOTA: Se você não estiver usando Supabase Auth, pode precisar ajustar as políticas RLS
-- ou desabilitá-las se estiver usando autenticação customizada.

