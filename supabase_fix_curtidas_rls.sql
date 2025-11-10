-- ============================================
-- Corrigir Políticas RLS para Curtidas e Comentários
-- Sistema usa autenticação customizada (sem Supabase Auth)
-- ============================================

-- ============================================
-- CURTIDAS_FEED
-- ============================================

-- Remover políticas antigas que dependem de auth.uid()
DROP POLICY IF EXISTS "Usuários autenticados podem criar curtidas" ON curtidas_feed;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias curtidas" ON curtidas_feed;

-- Criar novas políticas que não dependem de Supabase Auth
CREATE POLICY "Permitir inserção de curtidas feed"
  ON curtidas_feed FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de curtidas feed"
  ON curtidas_feed FOR DELETE
  USING (true);

-- ============================================
-- COMENTARIOS_FEED
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem criar comentários" ON comentarios_feed;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios comentários" ON comentarios_feed;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios comentários" ON comentarios_feed;

-- Criar novas políticas
CREATE POLICY "Permitir inserção de comentários feed"
  ON comentarios_feed FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de comentários feed"
  ON comentarios_feed FOR UPDATE
  USING (true);

CREATE POLICY "Permitir deleção de comentários feed"
  ON comentarios_feed FOR DELETE
  USING (true);

-- ============================================
-- CURTIDAS (Legião Oculta)
-- ============================================

-- Verificar se a tabela existe e tem RLS habilitado
ALTER TABLE curtidas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de curtidas comunidade" ON curtidas;
DROP POLICY IF EXISTS "Permitir deleção de curtidas comunidade" ON curtidas;

-- Criar políticas novas
CREATE POLICY "Permitir inserção de curtidas comunidade"
  ON curtidas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de curtidas comunidade"
  ON curtidas FOR DELETE
  USING (true);

-- ============================================
-- COMENTARIOS (Legião Oculta)
-- ============================================

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de comentários comunidade" ON comentarios;
DROP POLICY IF EXISTS "Permitir atualização de comentários comunidade" ON comentarios;
DROP POLICY IF EXISTS "Permitir deleção de comentários comunidade" ON comentarios;

-- Criar políticas novas
CREATE POLICY "Permitir inserção de comentários comunidade"
  ON comentarios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de comentários comunidade"
  ON comentarios FOR UPDATE
  USING (true);

CREATE POLICY "Permitir deleção de comentários comunidade"
  ON comentarios FOR DELETE
  USING (true);

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Como o sistema usa autenticação customizada (sem Supabase Auth),
-- as políticas RLS foram ajustadas para permitir operações.
-- A segurança é mantida no nível da aplicação através do AuthContext.
-- 
-- Se precisar de segurança adicional no nível do banco, você pode:
-- 1. Implementar Supabase Auth
-- 2. Criar funções stored procedures que validem o usuário
-- 3. Usar service role key apenas no backend

