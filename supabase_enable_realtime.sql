-- ============================================
-- Habilitar Realtime para Sistema de Notificações
-- ============================================

-- Habilitar Realtime para tabela de notificações
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;

-- Habilitar Realtime para tabela de preferencias_notificacoes
ALTER PUBLICATION supabase_realtime ADD TABLE preferencias_notificacoes;

-- Habilitar Realtime para tabelas relacionadas (para atualização instantânea)
ALTER PUBLICATION supabase_realtime ADD TABLE posts_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE posts_comunidade;
ALTER PUBLICATION supabase_realtime ADD TABLE curtidas_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE curtidas;
ALTER PUBLICATION supabase_realtime ADD TABLE comentarios_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE comentarios;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;

-- Criar preferências padrão para usuários existentes que não têm
INSERT INTO preferencias_notificacoes (usuario_id, notificar_curtidas_comentarios, notificar_posts_feed_oculto, notificar_posts_legiao_oculta)
SELECT 
  id,
  true,
  true,
  true
FROM usuarios
WHERE id NOT IN (SELECT usuario_id FROM preferencias_notificacoes)
ON CONFLICT (usuario_id) DO NOTHING;

