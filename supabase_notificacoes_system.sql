-- ============================================
-- Sistema de Notificações Completo
-- ============================================

-- Tabela de Preferências de Notificação
CREATE TABLE IF NOT EXISTS preferencias_notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  notificar_curtidas_comentarios BOOLEAN DEFAULT true,
  notificar_posts_feed_oculto BOOLEAN DEFAULT true,
  notificar_posts_legiao_oculta BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pref_notif_usuario ON preferencias_notificacoes(usuario_id);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'feed', 'comunidade', 'curtida', 'comentario'
  evento VARCHAR(50) NOT NULL, -- 'novo', 'curtida', 'comentario'
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT false,
  post_id UUID, -- ID do post relacionado (pode ser de posts_feed ou posts_comunidade)
  usuario_origem_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Quem gerou a notificação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB -- Dados extras em formato JSON
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_post ON notificacoes(post_id);

-- Habilitar RLS
ALTER TABLE preferencias_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para preferencias_notificacoes
CREATE POLICY "Usuários podem ver suas próprias preferências"
  ON preferencias_notificacoes FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem inserir suas próprias preferências"
  ON preferencias_notificacoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas próprias preferências"
  ON preferencias_notificacoes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Políticas RLS para notificacoes
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notificacoes FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar notificações"
  ON notificacoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON notificacoes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Função para criar preferências padrão quando um usuário é criado
CREATE OR REPLACE FUNCTION criar_preferencias_notificacao_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO preferencias_notificacoes (usuario_id)
  VALUES (NEW.id)
  ON CONFLICT (usuario_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar preferências padrão
DROP TRIGGER IF EXISTS trigger_criar_pref_notif ON usuarios;
CREATE TRIGGER trigger_criar_pref_notif
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION criar_preferencias_notificacao_padrao();

-- Função para criar notificação de curtida em posts_comunidade
CREATE OR REPLACE FUNCTION criar_notificacao_curtida_comunidade()
RETURNS TRIGGER AS $$
DECLARE
  post_usuario_id UUID;
  curtidor_nome TEXT;
BEGIN
  -- Buscar o dono do post
  SELECT usuario_id INTO post_usuario_id
  FROM posts_comunidade
  WHERE id = NEW.post_id;
  
  -- Se não encontrou o post ou se o usuário está curtindo seu próprio post, não criar notificação
  IF post_usuario_id IS NULL OR post_usuario_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;
  
  -- Buscar nome do usuário que curtiu
  SELECT nome_exibicao INTO curtidor_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Verificar se o dono do post quer receber notificações de curtidas
  IF EXISTS (
    SELECT 1 FROM preferencias_notificacoes
    WHERE usuario_id = post_usuario_id
    AND notificar_curtidas_comentarios = true
  ) THEN
    INSERT INTO notificacoes (
      usuario_id,
      tipo,
      evento,
      titulo,
      mensagem,
      link,
      post_id,
      usuario_origem_id
    ) VALUES (
      post_usuario_id,
      'comunidade',
      'curtida',
      'Nova curtida',
      COALESCE(curtidor_nome, 'Alguém') || ' curtiu sua publicação',
      '/comunidade',
      NEW.post_id,
      NEW.usuario_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação de curtida em posts_feed
CREATE OR REPLACE FUNCTION criar_notificacao_curtida_feed()
RETURNS TRIGGER AS $$
DECLARE
  post_usuario_id UUID;
  curtidor_nome TEXT;
BEGIN
  -- Buscar o dono do post
  SELECT usuario_id INTO post_usuario_id
  FROM posts_feed
  WHERE id = NEW.post_id;
  
  -- Se não encontrou o post ou se o usuário está curtindo seu próprio post, não criar notificação
  IF post_usuario_id IS NULL OR post_usuario_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;
  
  -- Buscar nome do usuário que curtiu
  SELECT nome_exibicao INTO curtidor_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Verificar se o dono do post quer receber notificações de curtidas
  IF EXISTS (
    SELECT 1 FROM preferencias_notificacoes
    WHERE usuario_id = post_usuario_id
    AND notificar_curtidas_comentarios = true
  ) THEN
    INSERT INTO notificacoes (
      usuario_id,
      tipo,
      evento,
      titulo,
      mensagem,
      link,
      post_id,
      usuario_origem_id
    ) VALUES (
      post_usuario_id,
      'feed',
      'curtida',
      'Nova curtida',
      COALESCE(curtidor_nome, 'Alguém') || ' curtiu sua publicação',
      '/feed',
      NEW.post_id,
      NEW.usuario_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para curtidas em posts_comunidade (Legião Oculta)
DROP TRIGGER IF EXISTS trigger_notif_curtida_comunidade ON curtidas;
CREATE TRIGGER trigger_notif_curtida_comunidade
  AFTER INSERT ON curtidas
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_curtida_comunidade();

-- Trigger para curtidas em posts_feed (Feed Oculto)
DROP TRIGGER IF EXISTS trigger_notif_curtida_feed ON curtidas_feed;
CREATE TRIGGER trigger_notif_curtida_feed
  AFTER INSERT ON curtidas_feed
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_curtida_feed();

-- Função para criar notificação de comentário em posts_comunidade
CREATE OR REPLACE FUNCTION criar_notificacao_comentario_comunidade()
RETURNS TRIGGER AS $$
DECLARE
  post_usuario_id UUID;
  comentador_nome TEXT;
BEGIN
  -- Buscar o dono do post
  SELECT usuario_id INTO post_usuario_id
  FROM posts_comunidade
  WHERE id = NEW.post_id;
  
  -- Se não encontrou o post ou se o usuário está comentando seu próprio post, não criar notificação
  IF post_usuario_id IS NULL OR post_usuario_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;
  
  -- Buscar nome do usuário que comentou
  SELECT nome_exibicao INTO comentador_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Verificar se o dono do post quer receber notificações de comentários
  IF EXISTS (
    SELECT 1 FROM preferencias_notificacoes
    WHERE usuario_id = post_usuario_id
    AND notificar_curtidas_comentarios = true
  ) THEN
    INSERT INTO notificacoes (
      usuario_id,
      tipo,
      evento,
      titulo,
      mensagem,
      link,
      post_id,
      usuario_origem_id,
      data
    ) VALUES (
      post_usuario_id,
      'comunidade',
      'comentario',
      'Novo comentário',
      COALESCE(comentador_nome, 'Alguém') || ' comentou em sua publicação',
      '/comunidade',
      NEW.post_id,
      NEW.usuario_id,
      jsonb_build_object('comentario_id', NEW.id, 'comentario_preview', LEFT(NEW.conteudo, 100))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação de comentário em posts_feed
CREATE OR REPLACE FUNCTION criar_notificacao_comentario_feed()
RETURNS TRIGGER AS $$
DECLARE
  post_usuario_id UUID;
  comentador_nome TEXT;
BEGIN
  -- Buscar o dono do post
  SELECT usuario_id INTO post_usuario_id
  FROM posts_feed
  WHERE id = NEW.post_id;
  
  -- Se não encontrou o post ou se o usuário está comentando seu próprio post, não criar notificação
  IF post_usuario_id IS NULL OR post_usuario_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;
  
  -- Buscar nome do usuário que comentou
  SELECT nome_exibicao INTO comentador_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Verificar se o dono do post quer receber notificações de comentários
  IF EXISTS (
    SELECT 1 FROM preferencias_notificacoes
    WHERE usuario_id = post_usuario_id
    AND notificar_curtidas_comentarios = true
  ) THEN
    INSERT INTO notificacoes (
      usuario_id,
      tipo,
      evento,
      titulo,
      mensagem,
      link,
      post_id,
      usuario_origem_id,
      data
    ) VALUES (
      post_usuario_id,
      'feed',
      'comentario',
      'Novo comentário',
      COALESCE(comentador_nome, 'Alguém') || ' comentou em sua publicação',
      '/feed',
      NEW.post_id,
      NEW.usuario_id,
      jsonb_build_object('comentario_id', NEW.id, 'comentario_preview', LEFT(NEW.conteudo, 100))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentários em posts_comunidade (Legião Oculta)
DROP TRIGGER IF EXISTS trigger_notif_comentario_comunidade ON comentarios;
CREATE TRIGGER trigger_notif_comentario_comunidade
  AFTER INSERT ON comentarios
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_comentario_comunidade();

-- Trigger para comentários em posts_feed (Feed Oculto)
DROP TRIGGER IF EXISTS trigger_notif_comentario_feed ON comentarios_feed;
CREATE TRIGGER trigger_notif_comentario_feed
  AFTER INSERT ON comentarios_feed
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_comentario_feed();

-- Função para criar notificação de novo post no Feed Oculto
CREATE OR REPLACE FUNCTION criar_notificacao_novo_post_feed()
RETURNS TRIGGER AS $$
DECLARE
  publicador_nome TEXT;
BEGIN
  -- Buscar nome do publicador
  SELECT nome_exibicao INTO publicador_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Criar notificação para todos os usuários que têm essa preferência habilitada
  INSERT INTO notificacoes (
    usuario_id,
    tipo,
    evento,
    titulo,
    mensagem,
    link,
    post_id,
    usuario_origem_id,
    data
  )
  SELECT 
    pref.usuario_id,
    'feed',
    'novo',
    'Novo post no Feed Oculto',
    COALESCE(publicador_nome, 'Alguém') || ' publicou um novo post no Feed Oculto',
    '/feed',
    NEW.id,
    NEW.usuario_id,
    jsonb_build_object('titulo', NEW.titulo, 'conteudo_preview', LEFT(COALESCE(NEW.conteudo, ''), 100))
  FROM preferencias_notificacoes pref
  WHERE pref.notificar_posts_feed_oculto = true
  AND pref.usuario_id != NEW.usuario_id; -- Não notificar o próprio autor
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação de novo post na Legião Oculta
CREATE OR REPLACE FUNCTION criar_notificacao_novo_post_comunidade()
RETURNS TRIGGER AS $$
DECLARE
  publicador_nome TEXT;
BEGIN
  -- Buscar nome do publicador
  SELECT nome_exibicao INTO publicador_nome
  FROM usuarios
  WHERE id = NEW.usuario_id;
  
  -- Criar notificação para todos os usuários que têm essa preferência habilitada
  INSERT INTO notificacoes (
    usuario_id,
    tipo,
    evento,
    titulo,
    mensagem,
    link,
    post_id,
    usuario_origem_id,
    data
  )
  SELECT 
    pref.usuario_id,
    'comunidade',
    'novo',
    'Novo post na Legião Oculta',
    COALESCE(publicador_nome, 'Alguém') || ' publicou um novo post na Legião Oculta',
    '/comunidade',
    NEW.id,
    NEW.usuario_id,
    jsonb_build_object('conteudo_preview', LEFT(COALESCE(NEW.conteudo, ''), 100))
  FROM preferencias_notificacoes pref
  WHERE pref.notificar_posts_legiao_oculta = true
  AND pref.usuario_id != NEW.usuario_id; -- Não notificar o próprio autor
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para novos posts no Feed Oculto
DROP TRIGGER IF EXISTS trigger_notif_novo_post_feed ON posts_feed;
CREATE TRIGGER trigger_notif_novo_post_feed
  AFTER INSERT ON posts_feed
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_novo_post_feed();

-- Trigger para novos posts na Legião Oculta
DROP TRIGGER IF EXISTS trigger_notif_novo_post_comunidade ON posts_comunidade;
CREATE TRIGGER trigger_notif_novo_post_comunidade
  AFTER INSERT ON posts_comunidade
  FOR EACH ROW
  EXECUTE FUNCTION criar_notificacao_novo_post_comunidade();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em preferencias_notificacoes
DROP TRIGGER IF EXISTS trigger_atualizar_pref_notif ON preferencias_notificacoes;
CREATE TRIGGER trigger_atualizar_pref_notif
  BEFORE UPDATE ON preferencias_notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

