# 🎯 Diagrama de Solución - Workflow Efemérides

## Antes (Error MEDICAL)

```
┌─────────────────┐
│  GitHub Actions │
│  Cron 00:00 UTC │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ generate-ephemeris.js           │
│ getTomorrowUTC() → Fecha UTC ❌  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ OpenAI (gpt-4o-mini)            │
│ Prompt genérico                 │
│ Respuesta: {category: "MEDICAL"}│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Validación Categoría            │
│ "MEDICAL" ∉ ['AI','TECH','COMP']│
│ throw Error("Invalid category")  │ ❌ FALLA
└────────┬────────────────────────┘
         │
         ▼
  ❌ exit(1) / WORKFLOW FALLA
  ❌ No inserta en Supabase
  ❌ Web se queda sin efeméride
```

---

## Después (Solución Robusta)

```
┌──────────────────────────┐
│  GitHub Actions          │
│  Cron 00:00 UTC          │
│  Cron 23:00 UTC          │ ← Dos para CET/CEST
│  workflow_dispatch input │ ← Backfill
└───────────┬──────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ generate-ephemeris.js                 │
│ getTomorrowMadridTimezone()           │ ✅ Europe/Madrid TZ
│ (o TARGET_DATE si existe)             │
└───────────┬─────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ OpenAI (gpt-4o-mini)                  │
│ Prompt mejorado:                      │
│ "category MUST be one of: ..."        │ ← Refuerzo
│ Respuesta: {category: "MEDICAL"}      │
└───────────┬─────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ normalizeCategoryWithFallback()        │ ✅ Nueva función
│ "MEDICAL" → busca en MAPPING          │
│ Encuentra: MEDICAL → SCIENCE          │
│ Log: ⚠️ mapped to "SCIENCE"           │
│ Continúa (NO throw)                   │ ✅ Sin error
└───────────┬─────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ insertOrUpdateEphemeris()             │ ✅ Upsert
│ supabase.upsert([...], {              │
│   onConflict: 'day,month,year'        │
│ })                                    │
└───────────┬─────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│ Supabase DB                           │
│ constraint unique(day, month, year)   │ ✅ Constraint
│ Si existe → UPDATE                    │ ✅ Idempotencia
│ Si no → INSERT                        │
└───────────┬─────────────────────────────┘
            │
            ▼
  ✅ exit(0) / WORKFLOW EXITOSO
  ✅ Inserta/actualiza en Supabase
  ✅ Web muestra efeméride correcta
```

---

## Flujos Específicos

### Flujo 1: Generación Normal (Cron Diario)

```
01:00 CET (España)
       │
       ▼
GitHub Actions dispara
       │
       ├─→ getTomorrowMadridTimezone()
       │
       ├─→ OpenAI genera histórico para mañana
       │
       ├─→ Normaliza categoría (fallback si inválida)
       │
       ├─→ Upsert en Supabase (día, mes, año)
       │
       └─→ ✅ SUCCESS: Efeméride lista para hoy 23:59
                       (web la muestra mañana a las 01:00)
```

### Flujo 2: Backfill Manual (Regenerar Fecha)

```
Usuario: "TARGET_DATE=2026-01-14"
       │
       ▼
Opción A: GitHub Actions UI
       ├─→ Run workflow → target_date: 2026-01-14
       │
Opción B: Terminal
       ├─→ TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js
       │
Opción C: Script Helper
       ├─→ node scripts/backfill-dates.js 2026-01-14
       │
       ▼
getTomorrowMadridTimezone() usa TARGET_DATE exacto
       │
       ├─→ OpenAI genera para 14/01
       │
       ├─→ Normaliza categoría
       │
       ├─→ Upsert (día=14, mes=1, año=2026)
       │
       └─→ ✅ Efeméride creada/actualizada
```

### Flujo 3: Idempotencia (Ejecutar Dos Veces)

```
Ejecución 1 (TARGET_DATE=2026-01-20)
       │
       ├─→ Genera efeméride
       │
       └─→ INSERT en BD
              created_at: 2026-01-13 10:00:00
              updated_at: 2026-01-13 10:00:00

Ejecución 2 (TARGET_DATE=2026-01-20, misma fecha)
       │
       ├─→ Genera efeméride (potencialmente diferente)
       │
       └─→ UPSERT en BD
              Constraint unique(day=20, month=1, year=2026) → EXISTE
              UPDATE en lugar de INSERT
              created_at: 2026-01-13 10:00:00 (sin cambio)
              updated_at: 2026-01-13 10:05:00 (actualizado)

✅ Resultado: Una sola fila, datos actualizados, SIN ERROR
```

---

## Comparativa de Categorías

```
Input AI: "MEDICAL"

┌─────────────────────────────────┐
│        ANTES (❌ Falla)          │
├─────────────────────────────────┤
│ if (category ∉ ['AI',...])      │
│   throw Error(...)              │
│ exit(1)                         │
│ ❌ Workflow falla               │
└─────────────────────────────────┘

            VS

┌─────────────────────────────────┐
│       DESPUÉS (✅ Continúa)      │
├─────────────────────────────────┤
│ normalized = "MEDICAL"          │
│ if (MAPPING["MEDICAL"])         │
│   mapped = "SCIENCE"            │
│   log warning                   │
│ category = mapped               │
│ continue...                     │
│ ✅ Workflow continúa            │
└─────────────────────────────────┘
```

---

## Timeline: Cron con DST

```
INVIERNO (Octubre - Marzo)
CET = UTC+1 → 01:00 CET = 00:00 UTC

Cron 1: "0 0 * * *" → 00:00 UTC = 01:00 CET ✅
Cron 2: "0 23 * * *" → 23:00 UTC = 00:00 CET (día siguiente) ❌ (no aplica)

VERANO (Marzo - Octubre)  
CEST = UTC+2 → 01:00 CEST = 23:00 UTC (día anterior)

Cron 1: "0 0 * * *" → 00:00 UTC = 02:00 CEST ❌ (no aplica)
Cron 2: "0 23 * * *" → 23:00 UTC = 01:00 CEST ✅

Transición:
- Durante cambios de hora, ambos cron pueden disparar
- PERO: constraint unique + upsert evita duplicados
- Resultado: idempotente, siempre una sola entrada por fecha
```

---

## Verificación en Web

```
┌──────────────────────────────────┐
│ Web Load (next.js)               │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ getTodayEphemeris()              │
│ (lib/supabaseServer.ts)          │
└────────┬─────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │ ¿Existe hoy?   │
    └─┬──────────┬───┘
      │          │
   SÍ │          │ NO
      │          │
      ▼          ▼
   ┌──────┐  ┌─────────────────────┐
   │Retorna│ │Busca más reciente   │
   │ hoy   │ │(order by year, month,
   │       │ │        day DESC)    │
   └──────┘  └──────────┬──────────┘
             │
             ▼
          ┌──────────────┐
          │ Retorna eso  │
          │ + Log: not   │
          │ today (warn) │
          └──────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ EphemerisDisplay()   │
    │ Renderiza en web     │
    └──────────────────────┘
```

---

## Setup Supabase (SQL)

```sql
┌────────────────────────────────────────┐
│ Tabla: ephemerides                     │
├────────────────────────────────────────┤
│ day, month, year, title, description   │
│ category, display_date, source_url     │
│ created_at, updated_at                 │
│                                        │
│ CONSTRAINT unique(day, month, year)    │ ← IMPORTANTE
│ INDEX (year, month, day)               │ ← Performance
└────────────────────────────────────────┘
         │
         ▼
    ✅ Idempotencia
    ✅ Queries rápidas
```

---

## Resumen: De Error a Excelencia

```
ANTES                           AHORA
──────────────────────────────────────────────
❌ Falla por categoría         ✅ Mapea automáticamente
❌ Fecha UTC incorrecta        ✅ Europe/Madrid timezone
❌ Duplicados en reintentos    ✅ Upsert idempotente
❌ Cron a hora incorrecta      ✅ Dos cron DST-aware
❌ Sin backfill                ✅ TARGET_DATE fácil
❌ Web con saltos              ✅ Web actualizada diariamente
──────────────────────────────────────────────
🔴 FRÁGIL                      🟢 ROBUSTO
```

---

**Diagrama completo de la solución implementada** ✅
