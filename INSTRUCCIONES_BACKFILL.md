# Instrucciones de Backfill y Recuperación - Workflow Diario de Efemérides

## Resumen de Cambios

Se ha implementado una solución robusta para:

1. **Manejo de categorías inválidas**: Ya no fallan por categorías fuera de la whitelist
2. **Cálculo correcto de fechas**: Ahora usa zona horaria Europe/Madrid (España)
3. **Idempotencia en Supabase**: Upsert + unique constraint evita duplicados
4. **Soporte para backfill**: `TARGET_DATE` permite regenerar fechas específicas

---

## Requisitos Previos - Configuración en Supabase

**IMPORTANTE**: Debe existir una constraint unique en la tabla `ephemerides` para prevenir duplicados:

```sql
ALTER TABLE ephemerides
ADD CONSTRAINT ephemeris_unique_date 
UNIQUE(day, month, year);
```

Si ya existe, omita este paso. Verifique ejecutando:

```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name='ephemerides' AND constraint_type='UNIQUE';
```

---

## Opción 1: Verificar Estado en Supabase

### 1a. Desde Supabase Studio (Web)

1. Abre [console.supabase.com](https://console.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New Query**
4. Ejecuta:

```sql
-- Ver todas las efemérides ordenadas
SELECT day, month, year, title, category, created_at 
FROM ephemerides 
ORDER BY year DESC, month DESC, day DESC;

-- Verificar si existe 14/01/2026
SELECT * FROM ephemerides 
WHERE day=14 AND month=1 AND year=2026;

-- Ver el rango de fechas disponibles
SELECT 
  CONCAT(year, '-', LPAD(month::text, 2, '0'), '-', LPAD(day::text, 2, '0')) as date_str,
  title
FROM ephemerides 
ORDER BY year DESC, month DESC, day DESC 
LIMIT 10;
```

### 1b. Desde Terminal (con `psql`)

```bash
psql "postgresql://user:password@host:port/database" -c \
  "SELECT day, month, year, title FROM ephemerides ORDER BY year DESC, month DESC, day DESC LIMIT 20;"
```

---

## Opción 2: Regenerar Fecha Faltante (14/01/2026)

Si falta la efeméride del 14/01/2026, regenerarla es simple usando el nuevo soporte de `TARGET_DATE`:

### 2a. Desde GitHub Actions UI (Recomendado)

1. Ve a tu repositorio en GitHub
2. **Actions** → **Daily Ephemeris Generation**
3. Click en **Run workflow** (esquina superior derecha)
4. En el campo **target_date**, ingresa: `2026-01-14`
5. Click en **Run workflow**
6. Monitorea el log en tiempo real

**Ventajas**: Simple, sin necesidad de terminal, logs visibles en GitHub.

### 2b. Desde Terminal (con `gh` CLI)

```bash
gh workflow run daily-ephemeris.yml \
  -f target_date="2026-01-14"
```

Requiere:
- [GitHub CLI](https://cli.github.com/) instalado
- `gh auth login` ejecutado previamente

### 2c. Generación Local (Desarrollo)

```bash
# En la raíz del proyecto

# 1. Copiar .env.local con credenciales (si no existe)
# Asegúrate de tener SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

# 2. Ejecutar con TARGET_DATE
TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js

# Ver logs en tiempo real
```

---

## Opción 3: Backfill Múltiples Fechas

Si faltan varias fechas, ejecuta el workflow múltiples veces:

```bash
# Shell script para regenerar rango de fechas
for day in 11 12 13 14 15; do
  echo "Regenerando 2026-01-$day..."
  TARGET_DATE=2026-01-$day node scripts/generate-ephemeris.js
  sleep 2  # Esperar entre ejecuciones para no saturar API
done
```

O desde GitHub Actions, ejecuta el workflow una vez por fecha deseada.

---

## Verificación Post-Regeneración

Después de regenerar, verifica que se insertó correctamente:

```sql
-- Verificar inserción
SELECT * FROM ephemerides 
WHERE day=14 AND month=1 AND year=2026;

-- Verificar que la web lo ve
-- (La web consulta getTodayEphemeris() que obtiene hoy o la más reciente)
```

Luego, **recarga la web** (hard refresh: `Ctrl+Shift+R` o `Cmd+Shift+R`) para ver la efeméride actualizada.

---

## Cómo Funciona la Nueva Lógica

### A. Cálculo de Fechas (Europe/Madrid TZ)

**Antes**: `getTomorrowUTC()` → usaba UTC del runner
**Ahora**: `getTomorrowMadridTimezone()` → calcula para zona horaria España

```javascript
// Si TARGET_DATE=2026-01-14 → genera exactamente esa fecha
// Si TARGET_DATE vacío → genera "mañana" en Europe/Madrid
```

### B. Manejo de Categorías

**Antes**: Si IA devolvía "MEDICAL" → `throw Error` → workflow fallaba
**Ahora**: 
```
MEDICAL → mapeado a SCIENCE (log warning, sin error)
HEALTH → mapeado a SCIENCE
BIOLOGY → mapeado a SCIENCE
Inválida desconocida → fallback a SCIENCE
```

**Log esperado**:
```
⚠️  Category "MEDICAL" not in whitelist, mapped to "SCIENCE"
```

El workflow **continúa sin fallar**.

### C. Inserción Idempotente (Upsert)

**Antes**: `INSERT` → si existe, error
**Ahora**: `UPSERT` con `ON CONFLICT(day,month,year)` → actualiza si existe, inserta si no

**Implicación**: Si ejecutas el workflow dos veces para la misma fecha, la segunda actualiza, no duplica.

---

## Cron Schedule (GitHub Actions)

**Horario**: 01:00 CET (España)

```yaml
- cron: '0 0 * * *'      # 00:00 UTC (01:00 CET invierno)
- cron: '0 23 * * *'     # 23:00 UTC (01:00 CEST verano)
```

Explicación:
- **Invierno (oct-mar)**: España en CET (UTC+1) → 01:00 CET = 00:00 UTC
- **Verano (mar-oct)**: España en CEST (UTC+2) → 01:00 CEST = 23:00 UTC del día anterior
- GitHub Actions no maneja DST automáticamente, por eso dos cron.
- La idempotencia en Supabase evita que ambos cron inserten duplicados durante la transición.

---

## Troubleshooting

### El workflow falla con "Invalid category: X"

**Solución**: Ya está corregido en la nueva versión. Si persiste:

1. Asegúrate de tener los cambios más recientes en `scripts/generate-ephemeris.js`
2. Verifica que `CATEGORY_MAPPING` incluya la categoría problemática
3. Si falta, agrega a `generate-ephemeris.js`:

```javascript
CATEGORY_MAPPING = {
  'NUEVA_CATEGORIA': 'SCIENCE',
  // ...
}
```

### El workflow corre pero la web no muestra la efeméride

**Causas y soluciones**:

1. **No se insertó en Supabase**:
   - Verifica logs de GitHub Actions
   - Consulta la BD: `SELECT COUNT(*) FROM ephemerides WHERE day=14 AND month=1 AND year=2026;`

2. **Se insertó pero en UTC, no en Spain TZ**:
   - Verifica que `getTomorrowMadridTimezone()` se usa en el script
   - Los valores `day, month, year` deben ser para Spain, no UTC

3. **La web aún no se ha renderizado**:
   - Hard refresh del navegador: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
   - Si es Next.js con SSG, espera next build o trigger redeployment

4. **La web obtiene la anterior como fallback**:
   - Es normal si no existe la de hoy. Revisa `getTodayEphemeris()` en `lib/supabaseServer.ts`.
   - Si quieres forzar la más reciente: modifica la query en `supabaseServer.ts` para ordenar por `created_at DESC`

---

## Automático: Cron Diario

Una vez configurado, el workflow se ejecuta automáticamente todos los días a las 01:00 España:

1. ✅ Calcula "mañana" en zona horaria Europe/Madrid
2. ✅ Si ya existe, salta (early exit)
3. ✅ Si no existe, genera con IA + inserta
4. ✅ Si IA devuelve categoría inválida, mapea/fallback automáticamente
5. ✅ Log de warnings, pero nunca falla

**Monitor**: Ve a **Actions** en tu repo GitHub para ver historial de ejecuciones.

---

## Checklist: ¿Está todo OK?

- [ ] Unique constraint creado en Supabase
- [ ] Última efeméride en BD es 15/01/2026 (o más reciente)
- [ ] `scripts/generate-ephemeris.js` tiene `getTomorrowMadridTimezone()`
- [ ] `.github/workflows/daily-ephemeris.yml` tiene dos cron (00:00 y 23:00 UTC)
- [ ] `.github/workflows/daily-ephemeris.yml` soporta `workflow_dispatch` con `target_date`
- [ ] Web muestra la efeméride correcta (hoy o la más reciente si falta hoy)
- [ ] Prueba: ejecuta workflow manualmente con `TARGET_DATE=2026-01-20` → verifica inserción

---

## Referencias Rápidas

| Acción | Comando |
|--------|---------|
| Ver últimas efemérides | `SELECT * FROM ephemerides ORDER BY year DESC, month DESC, day DESC LIMIT 5;` |
| Verificar fecha específica | `SELECT * FROM ephemerides WHERE day=14 AND month=1 AND year=2026;` |
| Contar total | `SELECT COUNT(*) FROM ephemerides;` |
| Regenerar vía GitHub | Actions UI → Run workflow → target_date |
| Regenerar local | `TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js` |
| Ver logs GitHub | Repository → Actions → Daily Ephemeris → Latest run |

---

**¡Implementación completada!** La web ahora se actualiza automáticamente y nunca falla por categorías.
