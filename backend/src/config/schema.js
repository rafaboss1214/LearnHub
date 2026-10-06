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
];

async function ensureDatabaseSchema() {
  for (const statement of statements) {
    await pool.query(statement);
  }
  const [columns] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'tipo_usuario'");
  if (!columns[0].Type.includes("'admin'")) {
    await pool.query("ALTER TABLE usuarios MODIFY tipo_usuario ENUM('colaborador', 'diretor', 'admin') NOT NULL DEFAULT 'colaborador'");
  }
}

module.exports = { ensureDatabaseSchema };
