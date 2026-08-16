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
      valor TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      synced_at TIMESTAMPTZ,
      CONSTRAINT uq_misa_fecha UNIQUE (fecha)
    )
  `;
  await db`ALTER TABLE misa ALTER COLUMN valor TYPE TEXT`;
  await db`
    CREATE TABLE IF NOT EXISTS reservas_sum (
      id BIGSERIAL PRIMARY KEY,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      hora_inicio VARCHAR(5) NOT NULL,
      hora_fin VARCHAR(5) NOT NULL,
      actividad TEXT NOT NULL DEFAULT '',
      responsable TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario_fecha ON inscripciones (iniciales, fecha)`;
  await db`CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha ON inscripciones (fecha)`;
  await db`CREATE INDEX IF NOT EXISTS idx_reservas_sum_inicio ON reservas_sum (fecha_inicio, hora_inicio)`;
  return true;
}

module.exports = { getSql, ensureSchema };
