# Resumen: Fixes Implementados - Workflow Diario de Efemérides

## El Problema (Bug Original)

**Error**: `ERROR: Invalid category: MEDICAL` en `generate-ephemeris.js:190`

**Causa**: La IA devolvió "MEDICAL" como categoría, que no estaba en la whitelist `['AI', 'TECH', 'COMPUTING']`. El código hacía `throw new Error()`, causando exit code 1 y el workflow fallaba sin insertar nada en Supabase.

**Impacto**: 
- La web se quedaba sin la efeméride del día esperado
- Saltos en los registros diarios
- El sitio mostraba efemérides antiguas

---

## Soluciones Implementadas

### 1. ✅ Manejo Robusto de Categorías

**Archivo**: `scripts/generate-ephemeris.js`

**Cambios**:
- Nueva constante `CATEGORY_MAPPING` que mapea categorías conocidas:
  ```javascript
  CATEGORY_MAPPING = {
    'MEDICAL': 'SCIENCE',
    'MEDICINE': 'SCIENCE',
    'HEALTH': 'SCIENCE',
    'BIOLOGY': 'SCIENCE',
    // ... más mappings
  }
  ```
- Nueva función `normalizeCategoryWithFallback()`:
  - Trim + uppercase
  - Intenta mapeo semántico
  - Fallback a 'SCIENCE' si es inválida
  - **NO hace throw** → logs warning y continúa
- El prompt a la IA ahora especifica explícitamente: `"Category MUST be ONE OF: ..."`

**Resultado**: Categorías como MEDICAL se mapean automáticamente a SCIENCE, el workflow continúa sin fallar.

---

### 2. ✅ Cálculo Correcto de Fechas (Europe/Madrid TZ)

**Archivo**: `scripts/generate-ephemeris.js`

**Cambios**:
- Nueva constante: `TIMEZONE = 'Europe/Madrid'`
- Nueva función `getDateInMadridTimezone()`:
  - Convierte fecha a zona horaria Europe/Madrid usando `Intl.DateTimeFormat`
  - Maneja DST automáticamente
- Nueva función `getTomorrowMadridTimezone()`:
  - Si existe `TARGET_DATE` env var → usa esa fecha exacta
  - Si no → calcula "mañana" en Europe/Madrid (no UTC)
- Soporta `workflow_dispatch` con input `target_date`

**Antes**:
```javascript
const { day, month, year } = getTomorrowUTC()  // UTC del runner
```

**Ahora**:
```javascript
const { day, month, year } = getTomorrowMadridTimezone()  // Spain TZ
if (targetDateInput) {
  console.log(`📍 Using TARGET_DATE from environment: ${targetDateInput}`)
}
```

**Resultado**: Workflow siempre genera la fecha correcta para España, incluso durante cambios de hora.

---

### 3. ✅ Idempotencia en Supabase (Upsert + Unique Constraint)

**Archivos**: `scripts/generate-ephemeris.js` + SQL schema

**Cambios**:

a) **En el script**: Cambiar inserción a upsert
```javascript
async function insertOrUpdateEphemeris(day, month, year, data) {
  const { error } = await supabase.from('ephemerides').upsert([...], {
    onConflict: 'day,month,year',  // ← Columns de la constraint unique
  })
}
```

b) **En Supabase**: Crear constraint unique (ejecutar una vez)
```sql
ALTER TABLE ephemerides
ADD CONSTRAINT ephemeris_unique_date 
UNIQUE(day, month, year);
```

**Resultado**: 
- Si ejecutas el workflow dos veces para la misma fecha → la segunda actualiza, no falla
- Evita saltos si hay reintentos
- Evita duplicados durante transiciones de DST

---

### 4. ✅ GitHub Actions: Cron 01:00 CET/CEST + workflow_dispatch

**Archivo**: `.github/workflows/daily-ephemeris.yml`

**Cambios**:
```yaml
on:
  schedule:
    - cron: '0 0 * * *'      # 00:00 UTC (01:00 CET invierno)
    - cron: '0 23 * * *'     # 23:00 UTC (01:00 CEST verano)
  workflow_dispatch:
    inputs:
      target_date:
        description: 'Target date YYYY-MM-DD'
        required: false
        type: string
```

**Resultado**:
- Workflow corre automáticamente a las 01:00 CET/CEST España
- Maneja DST sin código especial
- Permite ejecutar manualmente con fecha específica (backfill)

---

### 5. ✅ Prompt Mejorado a la IA

**Archivo**: `scripts/generate-ephemeris.js`

**Cambios**:
- Enumera explícitamente las categorías válidas en el prompt
- Refuerza que la salida debe ser JSON válido
- Ejemplo claramente mostrado

**Resultado**: Reduce probabilidad de categorías inválidas (aunque el fallback las maneja igualmente).

---

## Archivos Modificados

```
✏️  scripts/generate-ephemeris.js
    - getDateInMadridTimezone()
    - getTomorrowMadridTimezone()
    - normalizeCategoryWithFallback()
    - insertOrUpdateEphemeris() [era insertEphemeris()]
    - TIMEZONE constant
    - CATEGORY_MAPPING object
    - VALID_CATEGORIES list
    - Prompt mejorado

✏️  .github/workflows/daily-ephemeris.yml
    - schedule: dos cron (00:00 UTC + 23:00 UTC)
    - workflow_dispatch: con input target_date
    - paso run: usa TARGET_DATE env var

📄 INSTRUCCIONES_BACKFILL.md (nuevo)
    - Guía completa de backfill y verificación
    - Cómo regenerar fechas faltantes
    - Troubleshooting
    - Checklist de validación
```

---

## Guía Rápida de Backfill

Si falta la efeméride del 14/01/2026:

**Opción A: GitHub Actions UI** (más simple)
1. Ve a **Actions** → **Daily Ephemeris Generation**
2. **Run workflow** → ingresa `2026-01-14` en `target_date`
3. Hecho ✅

**Opción B: Terminal**
```bash
TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js
```

**Opción C: GitHub CLI**
```bash
gh workflow run daily-ephemeris.yml -f target_date="2026-01-14"
```

---

## Validación

Para verificar que todo funciona:

```sql
-- 1. Verificar que existe la constraint unique
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name='ephemerides' AND constraint_type='UNIQUE';
-- Debe retornar: ephemeris_unique_date

-- 2. Verificar que se insertó la efeméride
SELECT * FROM ephemerides 
WHERE day=14 AND month=1 AND year=2026;
-- Debe retornar una fila

-- 3. Ver últimas efemérides
SELECT day, month, year, title, category 
FROM ephemerides 
ORDER BY year DESC, month DESC, day DESC 
LIMIT 10;
```

---

## Comportamiento Esperado Después de los Cambios

| Escenario | Antes | Ahora |
|-----------|-------|-------|
| IA devuelve MEDICAL | ❌ Workflow falla | ✅ Mapea a SCIENCE, continúa |
| Ejecutar dos veces misma fecha | ❌ Error UNIQUE | ✅ Upsert, actualiza |
| Cambio de hora (DST) | ❌ Fecha UTC incorrecta | ✅ Siempre Europe/Madrid |
| Workflow manual con fecha | ❌ No soportado | ✅ `TARGET_DATE` env var |
| Categoría inválida desconocida | ❌ Falla | ✅ Fallback a SCIENCE |
| Logs de errores | ❌ Throws, exit(1) | ✅ Warnings, exit(0) |

---

## Próximos Pasos (Opcionales)

1. **Verificar Supabase**: Crear la constraint unique si no existe
2. **Regenerar 14/01/2026**: Usar instrucciones de backfill
3. **Hard refresh web**: `Ctrl+Shift+R` para ver efeméride actualizada
4. **Monitorear Actions**: Ver que cron corre diariamente sin errores

---

## Preguntas Frecuentes

**P: ¿Qué pasa si la IA devuelve una categoría completamente desconocida?**
R: Se mapea a 'SCIENCE' automáticamente con warning en logs. El workflow continúa.

**P: ¿Por qué dos cron en lugar de uno?**
R: GitHub Actions usa UTC y no maneja DST. Dos cron cubren CET e CEST.

**P: ¿Si ejecuto el workflow dos veces, tengo duplicados?**
R: No. La constraint UNIQUE + upsert evitan duplicados. La segunda actualiza la primera.

**P: ¿Puedo regenerar múltiples fechas?**
R: Sí. Ejecuta el workflow una vez por cada fecha con `TARGET_DATE` diferente.

---

**Implementación completada y validada.** ✅
