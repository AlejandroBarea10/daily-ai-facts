# 🗄️ Actualización de Tabla en Supabase

## SQL para Preparar la Tabla `ephemerides`

Ejecuta este SQL en **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Agregar columnas nuevas (si no existen)
ALTER TABLE ephemerides 
  ADD COLUMN IF NOT EXISTS display_date VARCHAR,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR;

-- 2. Crear índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_ephemerides_unique_date 
ON ephemerides(day, month, year);

-- 3. Verificar estructura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ephemerides'
ORDER BY ordinal_position;
```

---

## ✅ Resultado Esperado

Después de ejecutar el SQL anterior, verás:

```
column_name    | data_type | is_nullable
---------------|-----------|------------
id             | bigint    | NO
day            | integer   | NO
month          | integer   | NO
year           | integer   | NO
title          | text      | NO
description    | text      | NO
category       | text      | YES
display_date   | character varying | YES
source_url     | character varying | YES
created_at     | timestamp with time zone | YES
```

---

## 📋 Estructura de Datos Completa

### Tabla: `ephemerides`

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | BIGINT | NO | SERIAL | Primary Key |
| `day` | INTEGER | NO | — | Día (1-31) |
| `month` | INTEGER | NO | — | Mes (1-12) |
| `year` | INTEGER | NO | — | Año (ej: 2026) |
| `title` | TEXT | NO | — | Título del evento |
| `description` | TEXT | NO | — | Descripción (1-2 frases) |
| `category` | VARCHAR | YES | NULL | "AI" \| "TECH" \| "COMPUTING" |
| `display_date` | VARCHAR | YES | NULL | "January 7" (para UI) |
| `source_url` | VARCHAR | YES | NULL | URL del evento |
| `created_at` | TIMESTAMP | YES | NOW() | Fecha de creación |

### Índices

```sql
-- Primary Key
PRIMARY KEY (id)

-- Único: una efeméride por día
UNIQUE INDEX idx_ephemerides_unique_date (day, month, year)

-- Para búsquedas rápidas
INDEX idx_ephemerides_date (day, month, year)
```

---

## 🔄 Migración Paso a Paso

Si ya tienes una tabla con datos:

### Opción 1: Safe (Recomendado)
```sql
-- Paso 1: Verificar estado actual
SELECT COUNT(*) as total_ephemerides FROM ephemerides;

-- Paso 2: Agregar columnas nuevas
ALTER TABLE ephemerides 
  ADD COLUMN IF NOT EXISTS display_date VARCHAR,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR;

-- Paso 3: Llenar display_date con datos existentes (opcional)
UPDATE ephemerides 
SET display_date = TO_CHAR(TO_DATE(CONCAT(day, '/', month, '/', year), 'DD/MM/YYYY'), 'Month D')
WHERE display_date IS NULL;

-- Paso 4: Crear índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_ephemerides_unique_date 
ON ephemerides(day, month, year);

-- Paso 5: Verificar
SELECT * FROM ephemerides LIMIT 1;
```

### Opción 2: Nuclear (Comienza de cero)
```sql
-- ⚠️ CUIDADO: Esto BORRA todos los datos
DROP TABLE IF EXISTS ephemerides CASCADE;

-- Crear tabla nueva
CREATE TABLE ephemerides (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR,
  display_date VARCHAR,
  source_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day, month, year)
);

-- Crear índice
CREATE INDEX idx_ephemerides_date ON ephemerides(day, month, year);

-- Verificar
SELECT * FROM ephemerides;
```

---

## 🚀 Inserción Manual de Prueba

Para comprobar que la tabla está lista:

```sql
INSERT INTO ephemerides (day, month, year, title, description, category, display_date, source_url)
VALUES (
  6,
  1,
  2026,
  'Steve Jobs introduces the first iPhone',
  'At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing.',
  'TECH',
  'January 6',
  'https://en.wikipedia.org/wiki/IPhone'
);

-- Verificar
SELECT * FROM ephemerides WHERE day = 6 AND month = 1 AND year = 2026;
```

**Resultado esperado:**
```
id | day | month | year | title | description | category | display_date | source_url | created_at
---|-----|-------|------|-------|-------------|----------|--------------|----------|----------
1  | 6   | 1     | 2026 | Steve Jobs... | At Macworld... | TECH | January 6 | https://... | 2026-01-06...
```

---

## ✓ Verificación Final

Ejecuta esto para confirmar que todo está listo:

```sql
-- 1. Verificar estructura
\d ephemerides

-- 2. Contar registros
SELECT COUNT(*) as total FROM ephemerides;

-- 3. Ver índices
SELECT indexname FROM pg_indexes WHERE tablename = 'ephemerides';

-- 4. Probar insert
INSERT INTO ephemerides (day, month, year, title, description)
VALUES (1, 1, 2026, 'Test', 'Test event');

-- 5. Probar unique constraint
INSERT INTO ephemerides (day, month, year, title, description)
VALUES (1, 1, 2026, 'Test Duplicate', 'Should fail');
-- Esperado: ERROR - violación de constraint único

-- 6. Limpiar
DELETE FROM ephemerides WHERE title = 'Test';
```

---

## 📝 Notas

- Las columnas nuevas (`display_date`, `source_url`) son **opcionales** en la inserción
- El script `generate-ephemeris.js` **siempre las completará** con datos reales
- Si faltan datos en columns existentes, **la inserción falla** (validación en script)
- El índice único **previene automáticamente duplicados** a nivel de BD

---

## 🆘 Si Algo Falla

| Error | Causa | Solución |
|-------|-------|----------|
| `duplicate key value violates unique constraint` | Ya existe ephemeris para esa fecha | El script lo detecta y SKIPS automáticamente |
| `column "display_date" does not exist` | No ejecutaste ALTER TABLE | Ejecuta el SQL de arriba |
| `permission denied` | No tienes permisos en Supabase | Usa cuenta admin o Service Role |
| `syntax error` | SQL malformado | Copia exactamente del archivo arriba |

---

**Una vez completado esto, el script `generate-ephemeris.js` podrá insertar correctamente. ✅**
