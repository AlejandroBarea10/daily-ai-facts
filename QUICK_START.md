# 🚀 Quick Start - Referencia Rápida

## 1️⃣ Setup Inmediato (5 minutos)

### En Supabase SQL Editor:
```sql
-- Crear constraint unique para idempotencia
ALTER TABLE ephemerides
ADD CONSTRAINT ephemeris_unique_date 
UNIQUE(day, month, year);

-- Verificar que existe
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name='ephemerides' AND constraint_type='UNIQUE';
```

### En tu terminal:
```bash
cd daily-ai-facts
git add .
git commit -m "fix: categorías robusto, timezone Spain, upsert"
git push
```

## 2️⃣ Regenerar Fecha Faltante (2026-01-14)

### Opción A: GitHub UI (más fácil)
1. Actions → Daily Ephemeris Generation
2. Run workflow → `target_date`: `2026-01-14`
3. ✅ Done

### Opción B: Terminal
```bash
TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js
```

### Opción C: Script de backfill
```bash
node scripts/backfill-dates.js 2026-01-14
```

## 3️⃣ Verificar en Supabase

```sql
-- Ver si se insertó
SELECT day, month, year, title, category 
FROM ephemerides 
WHERE day=14 AND month=1 AND year=2026;

-- Ver últimas 5
SELECT day, month, year, title 
FROM ephemerides 
ORDER BY year DESC, month DESC, day DESC LIMIT 5;
```

## 4️⃣ Verificar en la Web

- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
- Debe mostrar la efeméride del día (o la más reciente si no existe la de hoy)

---

## 🔑 Key Points

| What | Where | Why |
|------|-------|-----|
| **Manejo de categorías** | `generate-ephemeris.js:normalizeCategoryWithFallback()` | Nunca falla por MEDICAL, etc. |
| **Timezone España** | `generate-ephemeris.js:getTomorrowMadridTimezone()` | Fecha correcta para España |
| **Upsert** | `generate-ephemeris.js:insertOrUpdateEphemeris()` | Idempotente, no duplicados |
| **Cron 01:00 CET** | `.github/workflows/daily-ephemeris.yml` | Dos cron para manejar DST |
| **Backfill** | `TARGET_DATE` env var | Regenerar fechas específicas |

---

## 🐛 Si Algo Falla

```bash
# Ver logs en GitHub Actions
# Actions → Daily Ephemeris Generation → Latest run → Logs

# Verificar sintaxis
node -c scripts/generate-ephemeris.js

# Test local
TARGET_DATE=2026-12-25 node scripts/generate-ephemeris.js

# Ver en Supabase
# SELECT * FROM ephemerides WHERE year=2026;
```

---

## 📞 Soporte

- **Documentación completa**: [INSTRUCCIONES_BACKFILL.md](./INSTRUCCIONES_BACKFILL.md)
- **Cambios explicados**: [RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md)
- **Plan de pruebas**: [docs/PLAN_VALIDACION.md](./docs/PLAN_VALIDACION.md)
- **SQL setup**: [docs/SUPABASE_SETUP.sql](./docs/SUPABASE_SETUP.sql)

---

**✅ Listo. El workflow nunca falla por categorías.** 🎉
