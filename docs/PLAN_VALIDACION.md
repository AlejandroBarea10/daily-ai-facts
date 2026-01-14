# Plan de Validación - Workflow Efemérides

## 1. Pre-Validación (Antes de Ejecutar)

### 1.1 Verificar cambios en el código

```bash
cd daily-ai-facts

# Ver archivos modificados
git diff scripts/generate-ephemeris.js | head -100
git diff .github/workflows/daily-ephemeris.yml | head -50

# Verificar que los nuevos archivos existen
ls -la RESUMEN_CAMBIOS.md
ls -la INSTRUCCIONES_BACKFILL.md
ls -la scripts/backfill-dates.js
ls -la docs/SUPABASE_SETUP.sql
```

### 1.2 Validar sintaxis JavaScript

```bash
# Verificar que el script no tiene errores de sintaxis
node -c scripts/generate-ephemeris.js
node -c scripts/backfill-dates.js

# Si no retorna nada, está OK. Si retorna error, hay problema.
```

## 2. Setup en Supabase

### 2.1 Crear constraint unique (si no existe)

En Supabase SQL Editor:

```sql
-- Verificar si existe
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'ephemerides' AND constraint_type = 'UNIQUE';

-- Si no existe, crear:
ALTER TABLE ephemerides
ADD CONSTRAINT ephemeris_unique_date 
UNIQUE(day, month, year);
```

### 2.2 Verificar estructura de tabla

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ephemerides' 
ORDER BY ordinal_position;

-- Esperado:
-- id | uuid
-- day | integer
-- month | integer
-- year | integer
-- title | text
-- description | text
-- category | text
-- display_date | text
-- source_url | text
-- created_at | timestamp with time zone
-- updated_at | timestamp with time zone
```

## 3. Test Local

### 3.1 Verificar variables de entorno

```bash
# Asegúrate que .env.local tiene:
grep SUPABASE_URL .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local
grep OPENAI_API_KEY .env.local

# Deben retornar los valores (no vacío)
```

### 3.2 Test: Generar fecha futura

```bash
# Generar para 2026-12-25 (futura, no falla por "ya existe")
TARGET_DATE=2026-12-25 node scripts/generate-ephemeris.js

# Esperado: ✅ SUCCESS! mensaje y los detalles de la efeméride
```

Verificar en Supabase:

```sql
SELECT * FROM ephemerides 
WHERE day=25 AND month=12 AND year=2026;

-- Debe retornar una fila con los datos generados
```

### 3.3 Test: Generar misma fecha dos veces (idempotencia)

```bash
# Primera ejecución
TARGET_DATE=2026-01-20 node scripts/generate-ephemeris.js

# Segunda ejecución (misma fecha)
TARGET_DATE=2026-01-20 node scripts/generate-ephemeris.js

# Esperado: Ambas exitosas, segunda actualiza el registro (no falla)
```

Verificar:

```sql
SELECT created_at, updated_at FROM ephemerides 
WHERE day=20 AND month=1 AND year=2026;

-- created_at debe ser igual
-- updated_at segunda debe ser mayor que la primera
```

### 3.4 Test: Categoría inválida (MEDICAL)

Temporalmente, modificar el script para simular respuesta con MEDICAL:

```bash
# En generate-ephemeris.js, en generateEphemerisWithAI(), después de parsear:
# Agregar temporalmente:
# ephemeris.category = "MEDICAL"  // Simular IA devolviendo inválido

# Ejecutar:
TARGET_DATE=2026-02-10 node scripts/generate-ephemeris.js

# Esperado:
# ⚠️  Category "MEDICAL" not in whitelist, mapped to "SCIENCE"
# ✅ SUCCESS!

# El script NO falla, mapea a SCIENCE automáticamente
```

Verificar:

```sql
SELECT category FROM ephemerides 
WHERE day=10 AND month=2 AND year=2026;

-- Debe ser: SCIENCE (no MEDICAL)
```

### 3.5 Test: Cálculo de zona horaria

Verificar que `getTomorrowMadridTimezone()` funciona:

```bash
# Crear un pequeño test
cat > test-tz.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const TIMEZONE = 'Europe/Madrid'

function getDateInMadridTimezone(dateString = null) {
  let date
  if (dateString) {
    date = new Date(dateString + 'T00:00:00')
  } else {
    date = new Date()
  }

  const formatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const parts = formatter.formatToParts(date)
  const year = parseInt(parts.find(p => p.type === 'year').value)
  const month = parseInt(parts.find(p => p.type === 'month').value)
  const day = parseInt(parts.find(p => p.type === 'day').value)

  return { day, month, year, dateObj: date }
}

// Test
console.log('Hoy en Madrid:', getDateInMadridTimezone())
console.log('2026-01-14 en Madrid:', getDateInMadridTimezone('2026-01-14'))
EOF

node test-tz.js

# Esperado:
# Hoy en Madrid: { day: XX, month: XX, year: 2026 }  (fecha actual)
# 2026-01-14 en Madrid: { day: 14, month: 1, year: 2026 }
```

## 4. Test: GitHub Actions

### 4.1 Ejecutar workflow manual

1. Ve a **GitHub** → tu repositorio
2. **Actions** → **Daily Ephemeris Generation**
3. Click **Run workflow** (esquina superior derecha)
4. En el campo "target_date", ingresa: `2026-03-15`
5. Click **Run workflow**

Monitorear:
- Logs deben mostrar:
  ```
  📅 Target date: March 15, 2026
  📝 Requesting AI to generate historical ephemeris for March 15...
  ✓ Generated ephemeris
  ✅ SUCCESS! Ephemeris for March 15, 2026 has been created/updated
  ```
- Si hay warning de categoría, debe decir `⚠️  Category ... mapped to ...` (no throw)

### 4.2 Verificar en Supabase

```sql
SELECT * FROM ephemerides 
WHERE day=15 AND month=3 AND year=2026;

-- Debe existir la efeméride
```

### 4.3 Test del cron automático

El cron está configurado en:
```yaml
schedule:
  - cron: '0 0 * * *'      # 00:00 UTC (01:00 CET invierno)
  - cron: '0 23 * * *'     # 23:00 UTC (01:00 CEST verano)
```

**No necesita test inmediato**, pero verifica que en los próximos días:
- Actions → Daily Ephemeris Generation aparece con "scheduled" en el historial
- Las efemérides se generan automáticamente (una nueva cada día)

## 5. Test de la Web

### 5.1 Ver la efeméride actualizada

1. Abre la web: `http://localhost:3000` (o tu URL)
2. Hard refresh: `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac)
3. Debe mostrar una efeméride (la de hoy o la más reciente)
4. Verifica que no hay errores en Console

### 5.2 Verificar fallback

En `lib/supabaseServer.ts`, la función `getTodayEphemeris()`:
- Busca efeméride exacta del día (usando UTC)
- Si no existe, retorna la más reciente

Esto es **correcto para evitar saltos visibles** en la web.

## 6. Checklist Final

- [ ] Constraint unique creado en Supabase
- [ ] Script `generate-ephemeris.js` tiene todas las nuevas funciones
- [ ] Workflow `.github/workflows/daily-ephemeris.yml` tiene dos cron
- [ ] Workflow soporta `workflow_dispatch` con `target_date` input
- [ ] Test local de generación exitosa
- [ ] Test local de idempotencia (dos veces misma fecha)
- [ ] Test local de categoría inválida (mapea sin fallar)
- [ ] Test GitHub Actions manual (genera fecha específica)
- [ ] Efemérides aparecen en Supabase
- [ ] Web muestra efeméride actualizada
- [ ] No hay errores en consola de navegador
- [ ] Documentación completa (RESUMEN_CAMBIOS.md, INSTRUCCIONES_BACKFILL.md)

## 7. Troubleshooting

| Problema | Solución |
|----------|----------|
| "Invalid category: X" | Ya no debería ocurrir, pero si lo hace, verifica CATEGORY_MAPPING |
| Efeméride no aparece en web | Hard refresh, verifica BD, revisa logs de GitHub Actions |
| Dos cron causan duplicados | La constraint unique + upsert lo evitan |
| Workflow falla en GitHub Actions | Revisa que secrets SUPABASE_URL, etc. están set |
| TypeError: ... is not a function | Verifica sintaxis JavaScript con `node -c` |

---

**Una vez validado todo, los criterios de aceptación se cumplen:**

✅ El workflow corre diariamente "para España" y genera la fecha correcta.
✅ Nunca falla por categorías fuera de lista (como MEDICAL).
✅ Reintentos/manual runs no generan saltos ni duplicados.
✅ La web muestra la efeméride del día correcto y el fallback está controlado.
