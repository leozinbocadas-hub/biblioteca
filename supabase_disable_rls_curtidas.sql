-- ============================================
-- Desabilitar RLS nas tabelas de Curtidas e Comentários
-- Para evitar problemas de permissão com autenticação customizada
-- ============================================

-- Desabilitar RLS nas tabelas de curtidas
ALTER TABLE curtidas_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE curtidas DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS nas tabelas de comentários
ALTER TABLE comentarios_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA:
-- ============================================
-- O RLS foi desabilitado nessas tabelas porque o sistema
-- usa autenticação customizada (não Supabase Auth).
-- A segurança é mantida no nível da aplicação através do AuthContext.

