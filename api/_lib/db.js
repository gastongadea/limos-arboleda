const { neon } = require('@neondatabase/serverless');

let sql = null;

function getSql() {
  if (sql) return sql;
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL (o NEON_DATABASE_URL) no configurada');
  }
  sql = neon(url);
  return sql;
}

async function ensureSchema() {
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id BIGSERIAL PRIMARY KEY,
      fecha DATE NOT NULL,
      comida VARCHAR(20) NOT NULL CHECK (comida IN ('Almuerzo', 'Cena')),
      iniciales VARCHAR(50) NOT NULL,
      opcion TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      synced_at TIMESTAMPTZ,
      CONSTRAINT uq_inscripcion UNIQUE (fecha, comida, iniciales)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS misa (
      id BIGSERIAL PRIMARY KEY,
      fecha DATE NOT NULL,
      valor VARCHAR(5) NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      synced_at TIMESTAMPTZ,
      CONSTRAINT uq_misa_fecha UNIQUE (fecha)
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario_fecha ON inscripciones (iniciales, fecha)`;
  await db`CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha ON inscripciones (fecha)`;
  return true;
}

module.exports = { getSql, ensureSchema };
