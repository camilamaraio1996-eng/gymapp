-- ================================================================
-- Migration 002: Full alumno feature set
-- Run this in your Supabase SQL Editor
-- ================================================================

-- ── Extend ejercicios table ──────────────────────────────────────
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS dia            int  DEFAULT 1 CHECK (dia BETWEEN 1 AND 7);
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS grupo_muscular text;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS imagen_url     text;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS video_url      text;

-- ── Training sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id             uuid        NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  rutina_id             uuid        REFERENCES rutinas(id) ON DELETE SET NULL,
  rutina_nombre         text,
  dia                   int,
  dia_label             text,
  iniciada_at           timestamptz NOT NULL DEFAULT now(),
  finalizada_at         timestamptz,
  duracion_segundos     int,
  volumen_total_kg      decimal(10,2) DEFAULT 0,
  ejercicios_completados int         DEFAULT 0,
  series_completadas    int         DEFAULT 0,
  notas                 text,
  created_at            timestamptz DEFAULT now()
);

-- ── Logged sets per session ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS series_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id         uuid        NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  ejercicio_id      uuid        REFERENCES ejercicios(id) ON DELETE SET NULL,
  ejercicio_nombre  text        NOT NULL,
  numero_serie      int         NOT NULL,
  peso_kg           decimal(6,2),
  repeticiones      int,
  esfuerzo          int         CHECK (esfuerzo BETWEEN 1 AND 10),
  nota              text,
  completada_at     timestamptz DEFAULT now()
);

-- ── Body measurements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mediciones (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id         uuid    NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha             date    NOT NULL DEFAULT CURRENT_DATE,
  peso_kg           decimal(5,2),
  masa_muscular_kg  decimal(5,2),
  grasa_pct         decimal(4,1),
  notas             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (alumno_id, fecha)
);

-- ── Personal records ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marcas_personales (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id         uuid    NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  ejercicio_nombre  text    NOT NULL,
  ejercicio_id      uuid    REFERENCES ejercicios(id) ON DELETE SET NULL,
  peso_kg           decimal(6,2),
  repeticiones      int,
  fecha             date    DEFAULT CURRENT_DATE,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  UNIQUE (alumno_id, ejercicio_nombre)
);

-- ── Exercise favorites / difficulty flags ────────────────────────
CREATE TABLE IF NOT EXISTS ejercicio_estados (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id     uuid    NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  ejercicio_id  uuid    NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  favorito      boolean DEFAULT false,
  dificil       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (alumno_id, ejercicio_id)
);

-- ── Messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  de_user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  para_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido     text        NOT NULL,
  tipo          text        DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'archivo')),
  url_archivo   text,
  leido         boolean     DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sesiones_alumno   ON sesiones (alumno_id, iniciada_at DESC);
CREATE INDEX IF NOT EXISTS idx_series_log_sesion ON series_log (sesion_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_alumno ON mediciones (alumno_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_marcas_alumno     ON marcas_personales (alumno_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_de       ON mensajes (de_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_para     ON mensajes (para_user_id, leido, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE sesiones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mediciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas_personales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicio_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes          ENABLE ROW LEVEL SECURITY;

-- sesiones
CREATE POLICY "sesiones_own" ON sesiones FOR ALL
  USING (alumno_id IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));
CREATE POLICY "sesiones_admin" ON sesiones FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "sesiones_profesor_read" ON sesiones FOR SELECT
  USING (alumno_id IN (
    SELECT a.id FROM alumnos a JOIN profesores p ON a.profesor_id = p.id WHERE p.user_id = auth.uid()
  ));

-- series_log
CREATE POLICY "series_log_own" ON series_log FOR ALL
  USING (sesion_id IN (
    SELECT s.id FROM sesiones s JOIN alumnos a ON s.alumno_id = a.id WHERE a.user_id = auth.uid()
  ));

-- mediciones
CREATE POLICY "mediciones_own" ON mediciones FOR ALL
  USING (alumno_id IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));
CREATE POLICY "mediciones_admin" ON mediciones FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "mediciones_profesor_read" ON mediciones FOR SELECT
  USING (alumno_id IN (
    SELECT a.id FROM alumnos a JOIN profesores p ON a.profesor_id = p.id WHERE p.user_id = auth.uid()
  ));

-- marcas_personales
CREATE POLICY "marcas_own" ON marcas_personales FOR ALL
  USING (alumno_id IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));
CREATE POLICY "marcas_profesor_read" ON marcas_personales FOR SELECT
  USING (alumno_id IN (
    SELECT a.id FROM alumnos a JOIN profesores p ON a.profesor_id = p.id WHERE p.user_id = auth.uid()
  ));

-- ejercicio_estados
CREATE POLICY "ej_estados_own" ON ejercicio_estados FOR ALL
  USING (alumno_id IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));

-- mensajes
CREATE POLICY "mensajes_participant" ON mensajes FOR ALL
  USING (de_user_id = auth.uid() OR para_user_id = auth.uid());

-- ── Auto-update personal records on new set ──────────────────────
CREATE OR REPLACE FUNCTION fn_update_marcas()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.peso_kg IS NOT NULL AND NEW.repeticiones IS NOT NULL THEN
    INSERT INTO marcas_personales (alumno_id, ejercicio_nombre, ejercicio_id, peso_kg, repeticiones, fecha)
    SELECT s.alumno_id, NEW.ejercicio_nombre, NEW.ejercicio_id, NEW.peso_kg, NEW.repeticiones, CURRENT_DATE
    FROM sesiones s WHERE s.id = NEW.sesion_id
    ON CONFLICT (alumno_id, ejercicio_nombre) DO UPDATE SET
      peso_kg      = CASE WHEN EXCLUDED.peso_kg > marcas_personales.peso_kg THEN EXCLUDED.peso_kg ELSE marcas_personales.peso_kg END,
      repeticiones = CASE WHEN EXCLUDED.peso_kg > marcas_personales.peso_kg THEN EXCLUDED.repeticiones ELSE marcas_personales.repeticiones END,
      fecha        = CASE WHEN EXCLUDED.peso_kg > marcas_personales.peso_kg THEN EXCLUDED.fecha ELSE marcas_personales.fecha END,
      updated_at   = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_marcas ON series_log;
CREATE TRIGGER trg_update_marcas
  AFTER INSERT ON series_log
  FOR EACH ROW EXECUTE FUNCTION fn_update_marcas();
