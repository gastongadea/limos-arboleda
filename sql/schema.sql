-- Schema Neon (Postgres) para Limos Arboleda
-- Fuente rápida de la app; Google Sheets se sincroniza en segundo plano.

CREATE TABLE IF NOT EXISTS inscripciones (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  comida VARCHAR(20) NOT NULL CHECK (comida IN ('Almuerzo', 'Cena')),
  iniciales VARCHAR(50) NOT NULL,
  opcion TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  CONSTRAINT uq_inscripcion UNIQUE (fecha, comida, iniciales)
);

CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario_fecha
  ON inscripciones (iniciales, fecha);

CREATE INDEX IF NOT EXISTS idx_inscripciones_fecha
  ON inscripciones (fecha);

CREATE INDEX IF NOT EXISTS idx_inscripciones_pending
  ON inscripciones (updated_at)
  WHERE synced_at IS NULL OR synced_at < updated_at;

CREATE TABLE IF NOT EXISTS misa (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  valor TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  CONSTRAINT uq_misa_fecha UNIQUE (fecha)
);

CREATE INDEX IF NOT EXISTS idx_misa_pending
  ON misa (updated_at)
  WHERE synced_at IS NULL OR synced_at < updated_at;

CREATE TABLE IF NOT EXISTS reservas_sum (
  id BIGSERIAL PRIMARY KEY,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  hora_inicio VARCHAR(5) NOT NULL,
  hora_fin VARCHAR(5) NOT NULL,
  actividad TEXT NOT NULL DEFAULT '',
  responsable TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservas_sum_inicio
  ON reservas_sum (fecha_inicio, hora_inicio);

