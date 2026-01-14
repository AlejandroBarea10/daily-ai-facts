-- ============================================================================
-- Setup de Supabase para Efemérides Diarias
-- ============================================================================
-- 
-- Ejecuta este script en Supabase SQL Editor para:
-- 1. Crear la tabla ephemerides (si no existe)
-- 2. Añadir constraint unique para idempotencia
-- 3. Crear índices para mejorar queries
-- 4. Verificar configuración

-- ============================================================================
-- 1. Crear tabla ephemerides (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ephemerides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fecha (día, mes, año)
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 3000),
  
  -- Contenido de la efeméride
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  display_date TEXT,  -- Formato: "January 15"
  source_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint unique para idempotencia
  UNIQUE(day, month, year)
);

-- ============================================================================
-- 2. Crear índices para queries frecuentes
-- ============================================================================

-- Índice para búsquedas por fecha (consultas diarias de hoy)
CREATE INDEX IF NOT EXISTS idx_ephemerides_date 
ON ephemerides(year, month, day);

-- Índice para ordenamiento por fecha (queries de "más reciente")
CREATE INDEX IF NOT EXISTS idx_ephemerides_date_recent 
ON ephemerides(year DESC, month DESC, day DESC);

-- Índice para categoría (filtros por tipo)
CREATE INDEX IF NOT EXISTS idx_ephemerides_category 
ON ephemerides(category);

-- ============================================================================
-- 3. Crear función de trigger para updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_ephemerides_updated_at 
ON ephemerides;

CREATE TRIGGER trigger_ephemerides_updated_at
    BEFORE UPDATE ON ephemerides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Row Level Security (RLS) - Lectura pública, escritura privada
-- ============================================================================

ALTER TABLE ephemerides ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer
CREATE POLICY ephemerides_read_all 
ON ephemerides FOR SELECT 
TO anon, authenticated 
USING (true);

-- Política: Solo service role puede escribir (desde el workflow)
CREATE POLICY ephemerides_write_service_role 
ON ephemerides FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Política: Solo service role puede actualizar (desde el workflow)
CREATE POLICY ephemerides_update_service_role 
ON ephemerides FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- 5. Verificación y Diagnostics
-- ============================================================================

-- Ver si la tabla existe y su estructura
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'ephemerides';

-- Ver si la constraint unique existe
-- SELECT constraint_name 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'ephemerides' AND constraint_type = 'UNIQUE';

-- Ver los índices
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename = 'ephemerides';

-- Contar registros
-- SELECT COUNT(*) as total_ephemerides FROM ephemerides;

-- Ver últimas 5 efemérides
-- SELECT day, month, year, title, category, created_at 
-- FROM ephemerides 
-- ORDER BY year DESC, month DESC, day DESC 
-- LIMIT 5;

-- Verificar si existe la efeméride del 14/01/2026
-- SELECT * FROM ephemerides 
-- WHERE day = 14 AND month = 1 AND year = 2026;

-- ============================================================================
-- 6. Migración desde tabla antigua (si aplica)
-- ============================================================================

-- Si tienes efemérides en otra tabla, copia aquí:
-- INSERT INTO ephemerides (day, month, year, title, description, category, display_date, source_url)
-- SELECT day, month, year, title, description, category, display_date, source_url
-- FROM old_ephemerides_table
-- ON CONFLICT (day, month, year) DO NOTHING;  -- Evita duplicados

-- ============================================================================
-- 7. Reset (para desarrollo/testing - ¡CUIDADO!)
-- ============================================================================

-- Limpiar todos los registros (solo si necesitas empezar de cero)
-- DELETE FROM ephemerides;
-- ALTER SEQUENCE ephemerides_id_seq RESTART WITH 1;

-- Borrar tabla completa (¡IRREVERSIBLE!)
-- DROP TABLE IF EXISTS ephemerides CASCADE;
