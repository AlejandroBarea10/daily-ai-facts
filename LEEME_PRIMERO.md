🎯 **ERROR CORREGIDO: `ERROR: Invalid category: MEDICAL`**

---

## ⚡ TL;DR - Setup en 5 Minutos

### 1. Supabase (1 min)
Ejecuta en SQL Editor:
```sql
ALTER TABLE ephemerides
ADD CONSTRAINT ephemeris_unique_date UNIQUE(day, month, year);
```

### 2. GitHub (1 min)
```bash
git add .
git commit -m "fix: categorías, timezone, upsert"
git push
```

### 3. Verificar (1 min)
En GitHub Actions → Daily Ephemeris → debe ejecutar sin errores

### 4. Backfill (si falta 14/01)
```bash
TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js
```

### 5. Web
Hard refresh: `Ctrl+Shift+R`

**¡Hecho!** ✅

---

## 📚 ¿Qué Cambió?

| Problema | Solución |
|----------|----------|
| "MEDICAL" → falla | → mapea a SCIENCE automáticamente |
| Fecha UTC incorrecta | → calcula en Spain timezone |
| Duplicados en reintentos | → upsert (actualiza, no falla) |
| Cron a hora incorrecta | → dos cron para CET/CEST |
| Sin backfill | → TARGET_DATE env variable |

---

## 📖 Documentos (en Orden de Lectura)

1. **[README_IMPLEMENTACION.md](./README_IMPLEMENTACION.md)** ← Empieza aquí
2. **[QUICK_START.md](./QUICK_START.md)** - Referencia rápida
3. **[DIAGRAMA_SOLUCION.md](./DIAGRAMA_SOLUCION.md)** - Visuales
4. Otros documentos - Ver [INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)

---

## 🔗 Links Rápidos

- 📝 Ver cambios en código: [RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md)
- 🔄 Regenerar fechas: [INSTRUCCIONES_BACKFILL.md](./INSTRUCCIONES_BACKFILL.md)
- 🧪 Plan de tests: [docs/PLAN_VALIDACION.md](./docs/PLAN_VALIDACION.md)
- 🗄️ SQL setup: [docs/SUPABASE_SETUP.sql](./docs/SUPABASE_SETUP.sql)

---

## ✅ Estado

```
✅ Categorías inválidas → mapean automáticamente
✅ Fechas → siempre correctas (Spain timezone)
✅ Duplicados → imposibles (upsert + constraint)
✅ DST → automático (dos cron)
✅ Backfill → fácil (TARGET_DATE)
✅ Documentación → completa

LISTO PARA PRODUCCIÓN 🚀
```

---

**Siguiente paso:** Abre [README_IMPLEMENTACION.md](./README_IMPLEMENTACION.md)
