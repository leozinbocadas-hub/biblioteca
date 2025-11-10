-- ============================================
-- Políticas RLS para permitir admins deletarem posts
-- Feed Oculto e Legião Oculta
-- ============================================

-- ============================================
-- POLÍTICAS PARA POSTS_FEED (Feed Oculto)
-- ============================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE posts_feed ENABLE ROW LEVEL SECURITY;

-- Política para permitir admins deletarem qualquer post do feed
CREATE POLICY "Admins podem deletar posts do feed"
  ON posts_feed FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- Se não estiver usando Supabase Auth, use esta versão alternativa:
-- (Descomente e ajuste conforme sua autenticação)
/*
CREATE POLICY "Admins podem deletar posts do feed (sem auth)"
  ON posts_feed FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.cargo = 'admin'
    )
  );
*/

-- ============================================
-- POLÍTICAS PARA POSTS_COMUNIDADE (Legião Oculta)
-- ============================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE posts_comunidade ENABLE ROW LEVEL SECURITY;

-- Política para permitir admins deletarem qualquer post da comunidade
CREATE POLICY "Admins podem deletar posts da comunidade"
  ON posts_comunidade FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- Versão alternativa se não estiver usando Supabase Auth:
/*
CREATE POLICY "Admins podem deletar posts da comunidade (sem auth)"
  ON posts_comunidade FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.cargo = 'admin'
    )
  );
*/

-- ============================================
-- POLÍTICAS PARA CURTIDAS E COMENTÁRIOS
-- (Para deletar quando o post pai for deletado)
-- ============================================

-- Curtidas Feed
ALTER TABLE curtidas_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem deletar curtidas do feed"
  ON curtidas_feed FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- Comentários Feed
ALTER TABLE comentarios_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem deletar comentários do feed"
  ON comentarios_feed FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- Curtidas Comunidade
ALTER TABLE curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem deletar curtidas da comunidade"
  ON curtidas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- Comentários Comunidade
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem deletar comentários da comunidade"
  ON comentarios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND LOWER(usuarios.cargo) = 'admin'
    )
  );

-- ============================================
-- ALTERNATIVA: DESABILITAR RLS (se não usar Supabase Auth)
-- ============================================
-- Se você não estiver usando Supabase Auth e estiver com problemas de permissão,
-- descomente as linhas abaixo para desabilitar RLS nas tabelas:

-- ALTER TABLE posts_feed DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts_comunidade DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE curtidas_feed DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE comentarios_feed DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE curtidas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Se você não estiver usando Supabase Auth (autenticação customizada),
-- as políticas RLS que verificam JWT claims podem não funcionar.
-- Nesse caso, você tem duas opções:
-- 
-- 1. Desabilitar RLS nas tabelas (veja código acima)
-- 2. Ajustar as políticas para não depender de JWT claims
--
-- A verificação de admin é feita no código frontend também como
-- camada adicional de segurança.

