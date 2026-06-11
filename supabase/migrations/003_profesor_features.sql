-- ================================================================
-- Migration 003: Profesor panel features
-- Run this in your Supabase SQL Editor
-- ================================================================

-- ── Extend rutinas table ─────────────────────────────────────────
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS nivel        text    DEFAULT 'principiante';
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS estado       text    DEFAULT 'activa' CHECK (estado IN ('activa', 'borrador', 'archivada'));
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS es_plantilla boolean DEFAULT false;

-- ── Private observations by profesor on students ─────────────────
CREATE TABLE IF NOT EXISTS observaciones_alumno (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   uuid        NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  profesor_id uuid        NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  contenido   text        NOT NULL,
  tipo        text        DEFAULT 'nota' CHECK (tipo IN ('nota', 'alerta', 'logro')),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obs_alumno ON observaciones_alumno (alumno_id, created_at DESC);

ALTER TABLE observaciones_alumno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obs_profesor_own" ON observaciones_alumno FOR ALL
  USING (profesor_id IN (SELECT id FROM profesores WHERE user_id = auth.uid()));

CREATE POLICY "obs_admin" ON observaciones_alumno FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── Profesor can read series_log of their students ────────────────
DO $$ BEGIN
  CREATE POLICY "series_log_profesor_read" ON series_log FOR SELECT
    USING (sesion_id IN (
      SELECT s.id FROM sesiones s
      JOIN alumnos a ON s.alumno_id = a.id
      JOIN profesores p ON a.profesor_id = p.id
      WHERE p.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
