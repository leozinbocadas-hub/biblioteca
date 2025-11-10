-- ============================================
-- Criar usuário admin Bruno
-- ============================================

INSERT INTO usuarios (
  email,
  password_hash,
  nome_exibicao,
  cargo,
  is_publicador,
  is_active,
  purchase_date
) VALUES (
  'bruno@adminbiblioteca.com',
  'adminbruno0307',
  'Bruno',
  'admin',
  true,
  true,
  NOW()
);

-- Verificar se o usuário foi criado
SELECT id, email, nome_exibicao, cargo, is_publicador, is_active
FROM usuarios
WHERE email = 'bruno@adminbiblioteca.com';

