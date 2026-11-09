const { pool } = require("./database");

const statements = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('colaborador', 'diretor', 'admin') NOT NULL DEFAULT 'colaborador',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_email (email)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS perfis_usuarios (
    usuario_id INT UNSIGNED NOT NULL,
    tipo_comunidade ENUM('aluno', 'responsavel', 'comunidade') NULL,
    descricao VARCHAR(280) NULL,
    cep CHAR(8) NULL,
    rua VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NULL,
    estado CHAR(2) NULL,
    numero VARCHAR(20) NULL,
    complemento VARCHAR(120) NULL,
    habilidades VARCHAR(200) NULL,
    evidencia_institucional VARCHAR(1000) NULL,
    status_institucional ENUM('nao_verificada', 'pendente', 'aprovada', 'recusada') NULL,
    motivo_institucional VARCHAR(1000) NULL,
    avatar_mime VARCHAR(32) NULL,
    avatar_data MEDIUMBLOB NULL,
    avatar_updated_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_recuperacao_hash (token_hash),
    KEY idx_recuperacao_usuario (usuario_id, created_at),
    CONSTRAINT fk_recuperacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS projetos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(180) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    imagem_url TEXT NULL,
    status ENUM('publicado', 'concluido') NOT NULL DEFAULT 'publicado',
    criador_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_projetos_status (status),
    KEY idx_projetos_criador (criador_id),
    CONSTRAINT fk_projetos_criador
      FOREIGN KEY (criador_id) REFERENCES usuarios (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS projeto_midias (
    projeto_id INT UNSIGNED NOT NULL,
    capa_mime VARCHAR(32) NOT NULL,
    capa_data MEDIUMBLOB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (projeto_id),
    CONSTRAINT fk_midia_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS projetos_favoritos (
    projeto_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (projeto_id, usuario_id),
    CONSTRAINT fk_favoritos_projeto
      FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS projetos_apoios (
    projeto_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (projeto_id, usuario_id),
    CONSTRAINT fk_apoios_projeto
      FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE,
    CONSTRAINT fk_apoios_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS comentarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    projeto_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NULL,
    texto VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comentarios_projeto (projeto_id),
    CONSTRAINT fk_comentarios_projeto
      FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE,
    CONSTRAINT fk_comentarios_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS projeto_categorias_apoio (
    projeto_id INT UNSIGNED NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    PRIMARY KEY (projeto_id, categoria),
    CONSTRAINT fk_categoria_apoio_projeto
      FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS solicitacoes_colaboracao (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    projeto_id INT UNSIGNED NOT NULL,
    escola_id INT UNSIGNED NOT NULL,
    colaborador_id INT UNSIGNED NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    descricao VARCHAR(1500) NOT NULL,
    disponibilidade VARCHAR(200) NULL,
    status ENUM('pendente', 'aceita', 'recusada', 'concluida') NOT NULL DEFAULT 'pendente',
    motivo_recusa VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_solicitacoes_projeto (projeto_id),
    KEY idx_solicitacoes_escola_status (escola_id, status),
    KEY idx_solicitacoes_colaborador_status (colaborador_id, status),
    CONSTRAINT fk_solicitacao_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_solicitacao_escola FOREIGN KEY (escola_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitacao_colaborador FOREIGN KEY (colaborador_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS mensagens_colaboracao (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    solicitacao_id INT UNSIGNED NOT NULL,
    remetente_id INT UNSIGNED NOT NULL,
    destinatario_id INT UNSIGNED NOT NULL,
    texto VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_mensagens_solicitacao (solicitacao_id, id),
    KEY idx_mensagens_destinatario (destinatario_id, read_at),
    CONSTRAINT fk_mensagem_solicitacao FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_colaboracao (id) ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_remetente FOREIGN KEY (remetente_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS encerramentos_colaboracao (
    solicitacao_id INT UNSIGNED NOT NULL,
    solicitado_por INT UNSIGNED NOT NULL,
    escola_confirmou BOOLEAN NOT NULL DEFAULT FALSE,
    colaborador_confirmou BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (solicitacao_id),
    CONSTRAINT fk_encerramento_solicitacao FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_colaboracao (id) ON DELETE CASCADE,
    CONSTRAINT fk_encerramento_usuario FOREIGN KEY (solicitado_por) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS recompensas_participacao (
    solicitacao_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    pontos INT UNSIGNED NOT NULL DEFAULT 20,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (solicitacao_id),
    KEY idx_recompensas_usuario (usuario_id),
    CONSTRAINT fk_recompensa_solicitacao FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_colaboracao (id) ON DELETE CASCADE,
    CONSTRAINT fk_recompensa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS certificados (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    solicitacao_id INT UNSIGNED NOT NULL,
    codigo CHAR(40) NOT NULL,
    snapshot TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_certificado_solicitacao (solicitacao_id),
    UNIQUE KEY uk_certificado_codigo (codigo),
    CONSTRAINT fk_certificado_solicitacao FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_colaboracao (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS denuncias_projetos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    projeto_id INT UNSIGNED NOT NULL,
    denunciante_id INT UNSIGNED NOT NULL,
    motivo VARCHAR(80) NOT NULL,
    detalhes VARCHAR(1000) NOT NULL,
    status ENUM('pendente', 'em_analise', 'arquivada') NOT NULL DEFAULT 'pendente',
    moderador_id INT UNSIGNED NULL,
    nota_moderacao VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_denuncias_status (status, updated_at),
    UNIQUE KEY uk_denuncia_ativa (projeto_id, denunciante_id, status),
    CONSTRAINT fk_denuncia_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE CASCADE,
    CONSTRAINT fk_denuncia_usuario FOREIGN KEY (denunciante_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_denuncia_moderador FOREIGN KEY (moderador_id) REFERENCES usuarios (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

async function ensureDatabaseSchema() {
  for (const statement of statements) {
    await pool.query(statement);
  }
  const [columns] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'tipo_usuario'");
  if (!columns[0].Type.includes("'admin'")) {
    await pool.query("ALTER TABLE usuarios MODIFY tipo_usuario ENUM('colaborador', 'diretor', 'admin') NOT NULL DEFAULT 'colaborador'");
  }
  const [tokenVersion] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'token_version'");
  if (!tokenVersion.length) {
    await pool.query("ALTER TABLE usuarios ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER tipo_usuario");
  }
  await pool.query(`INSERT IGNORE INTO perfis_usuarios (usuario_id, status_institucional)
                    SELECT id, IF(tipo_usuario='diretor','nao_verificada',NULL) FROM usuarios`);
}

module.exports = { ensureDatabaseSchema };
