-- LearnUp — Script completo de base de datos
-- Pegar en el SQL Editor de Supabase y presionar Run

-- 1. Columna telefono en usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono TEXT;

-- 2. Arreglar trigger de usuarios
DROP TRIGGER IF EXISTS usuarios_updated_at ON usuarios;
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Tabla talleres
CREATE TABLE IF NOT EXISTS talleres (
  id                BIGSERIAL     PRIMARY KEY,
  titulo            TEXT          NOT NULL,
  descripcion       TEXT,
  categoria         TEXT          NOT NULL DEFAULT 'Otros',
  fecha             DATE          NOT NULL,
  hora              TEXT,
  duracion          TEXT,
  precio            NUMERIC(10,2) NOT NULL DEFAULT 0,
  modalidad         TEXT          NOT NULL DEFAULT 'presencial'
                                  CHECK (modalidad IN ('presencial','virtual','hibrido')),
  ubicacion         TEXT,
  cupos_totales     INTEGER       NOT NULL DEFAULT 10,
  cupos_disponibles INTEGER       NOT NULL DEFAULT 10,
  instructor_id     BIGINT        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado_validacion TEXT          NOT NULL DEFAULT 'pendiente' 
                                  CHECK (estado_validacion IN ('pendiente', 'aprobado', 'rechazado')),
  activo            BOOLEAN       NOT NULL DEFAULT true,
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Si la tabla ya existe, añadimos las columnas
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS estado_validacion TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_validacion IN ('pendiente', 'aprobado', 'rechazado'));
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;


-- 4. Trigger para talleres
DROP TRIGGER IF EXISTS talleres_updated_at ON talleres;
CREATE TRIGGER talleres_updated_at
  BEFORE UPDATE ON talleres
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Tabla inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
  id            BIGSERIAL   PRIMARY KEY,
  taller_id     BIGINT      NOT NULL REFERENCES talleres(id) ON DELETE CASCADE,
  estudiante_id BIGINT      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  inscrito_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(taller_id, estudiante_id)
);

-- 6. Sprint 3: Búsqueda y Solicitudes
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(3,1) NOT NULL DEFAULT 5.0;
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS num_calificaciones INTEGER NOT NULL DEFAULT 1;

ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS estado_solicitud TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_solicitud IN ('pendiente', 'aceptada', 'rechazada'));
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS mensaje_solicitud TEXT;
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

-- 7. Verificar resultado
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
