# 🏗️ Arquitectura Técnica - Daily AI Facts

## 📚 Tabla de Contenidos

1. [Overview](#overview)
2. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
3. [Flujo de Datos](#flujo-de-datos)
4. [Seguridad](#seguridad)
5. [Performance](#performance)
6. [Escalabilidad](#escalabilidad)
7. [Deployment](#deployment)

---

## 🎯 Overview

Daily AI Facts es una aplicación **full-stack serverless** que combina:

- **Frontend**: Next.js 16 (App Router) en Vercel
- **Backend**: Supabase (PostgreSQL) para persistencia
- **AI**: OpenAI API para generación de contenido
- **Automation**: GitHub Actions para ejecución programada

```
┌──────────────────────────────────────────────────────┐
│                    USUARIO FINAL                     │
│          https://daily-ai-facts.vercel.app           │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   VERCEL (CDN)      │
         │  - Next.js 16       │
         │  - Runtime: nodejs  │
         │  - Dynamic: true    │
         └──────────┬──────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    ┌─────▼────────┐    ┌────▼──────────────┐
    │  Supabase    │    │ OpenAI API        │
    │  (PostgreSQL)│    │ (Generación)      │
    └──────────────┘    └───────────────────┘
          │
    ┌─────▼──────────────┐
    │ GitHub Actions     │
    │ Cron: 00:00 UTC    │
    │ Gen. automática    │
    └────────────────────┘
```

---

## 🎨 Decisiones Arquitectónicas

### 1. **Next.js App Router (Server Components)**

**Por qué:**
- ✅ Server-side rendering nativo
- ✅ API routes integradas
- ✅ Mejor performance (sin JS innecesario)
- ✅ Seguridad (secrets en servidor)

**Implementación:**
```tsx
// app/page.tsx - Server component
export const runtime = "nodejs"          // Usa Node.js runtime
export const dynamic = "force-dynamic"   // No cachea

export default async function Home() {
  const data = await getTodayEphemeris()  // Query en servidor
  return <EphemerisDisplay data={data} /> // Pasa datos como props
}
```

**Ventajas:**
- Las queries a Supabase corren en servidor (no expone URL/key)
- Datos frescos en cada request
- Validaciones también en servidor

---

### 2. **Supabase para Base de Datos**

**Por qué:**
- ✅ PostgreSQL nativo (confiable)
- ✅ JWT authentication integrado
- ✅ RLS (Row Level Security) disponible
- ✅ API REST automática
- ✅ SDK TypeScript excelente

**Estructura:**

```sql
Table: ephemerides
├── id (BIGINT PK)              -- Primary key auto-increment
├── day (INT)                   -- 1-31
├── month (INT)                 -- 1-12
├── year (INT)                  -- Histórico (ej: 1983)
├── title (VARCHAR)             -- "Google Founded"
├── description (TEXT)          -- Párrafos con contexto
├── category (VARCHAR)          -- "TECH", "AI", "COMPUTING"
├── display_date (VARCHAR)      -- "January 7" (para UI)
├── source_url (VARCHAR)        -- URL verificable
└── created_at (TIMESTAMP)      -- Cuándo se creó

Indices:
└── idx_ephemerides_unique_date (day, month, year) -- Evita duplicados
```

**Ventajas:**
- Índice único previene duplicados automáticamente
- `maybeSingle()` maneja casos con 0 resultados
- Creado_at permite auditoría
- display_date es precalculado (no render-time)

---

### 3. **OpenAI para Generación**

**Por qué:**
- ✅ GPT-4o-mini es rápido y barato
- ✅ JSON mode para respuestas estructuradas
- ✅ Prompt engineering flexible
- ✅ Token usage eficiente

**Prompt Design:**

```javascript
const prompt = `
Generate a HISTORICAL event (from a past year, NOT current year ${currentYear}) 
that occurred on ${monthName} ${day}.

Respond in JSON format ONLY:
{
  "title": "Event Title (5-10 words, include the year)",
  "description": "3-4 sentences with: 
    (1) Event description, 
    (2) Who was involved, 
    (3) Historical year, 
    (4) Why it mattered",
  "category": "TECH or AI or COMPUTING",
  "source_url": "A real Wikipedia URL"
}

IMPORTANT:
- Event MUST be from a PAST year (not ${currentYear})
- Include the exact year it happened
- Include person(s) or organization
- Explain the impact
- Return ONLY valid JSON
`
```

**Temperature: 0.8**
- No tan determinístico (variedad)
- No tan creativo (que no alucine)

---

### 4. **GitHub Actions para Automatización**

**Por qué:**
- ✅ Integración nativa con Git
- ✅ Cron scheduler integrado
- ✅ Secrets management
- ✅ Logs públicos para auditoría
- ✅ Gratis para repos públicos

**Workflow:**

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 00:00 UTC = medianoche UTC
                         # Ejecuta TODOS los días a esa hora

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - checkout                    # Clona repo
      - setup node 18               # Prepara Node
      - npm install                 # Instala deps
      - run script con env secrets  # Ejecuta generador
```

**Secrets (en GitHub → Settings → Secrets):**
```
SUPABASE_URL                  = https://proj.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = eyJ...  (nunca en .env)
OPENAI_API_KEY                = sk-proj-...  (nunca en .env)
```

**Ventajas:**
- Zero maintenance (automático)
- Logs auditables en GitHub
- Fácil de pausar/activar
- Notificaciones de fallos

---

## 🌊 Flujo de Datos

### Scenario 1: Usuario Abre la Web

```
1. Usuario abre: https://daily-ai-facts.vercel.app
                          │
                          ▼
2. Vercel recibe request → Ejecuta app/page.tsx
                          │
                          ▼
3. page.tsx es Server Component (async)
   - Calcula hoy en UTC: { day: 7, month: 1, year: 2026 }
   - Llama: getTodayEphemeris()
                          │
                          ▼
4. supabaseServer.ts ejecuta query:
   SELECT * FROM ephemerides 
   WHERE day=7 AND month=1 AND year=2026
   LIMIT 1
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
     (Existe)                         (No existe)
        │                                   │
        ▼                                   ▼
   Retorna fila              Query fallback: últimas 10
   de hoy                    ORDER BY year DESC, month DESC
        │                    ORDER BY day DESC LIMIT 1
        │                                   │
        └─────────────────┬─────────────────┘
                          │
                          ▼
5. Data se pasa a <EphemerisDisplay />
   - Renderiza fecha: "7th of January"
   - Renderiza año: "1983"
   - Renderiza título + descripción
                          │
                          ▼
6. HTML + CSS entregado al navegador
                          │
                          ▼
7. React hidrata con tipo "use client"
   - Typing effect en descripción
   - Interactividad
```

---

### Scenario 2: GitHub Actions a las 00:00 UTC

```
1. 00:00 UTC → GitHub Actions dispara cron
                          │
                          ▼
2. Workflow checkout + instala deps
                          │
                          ▼
3. Ejecuta: node scripts/generate-ephemeris.js
                          │
                          ▼
4. getTomorrowUTC() → { day: 8, month: 1, year: 2026 }
                          │
                          ▼
5. ephemerisExists(8, 1, 2026)
   SELECT id FROM ephemerides 
   WHERE day=8 AND month=1 AND year=2026 LIMIT 1
        │
     ¿Existe?
     ├─ SÍ → Log "Already exists" → EXIT
     └─ NO → Continuar
                          │
                          ▼
6. OpenAI API call con prompt
   - Genera evento para enero 8
   - Respuesta JSON con: title, description, category, source_url
                          │
                          ▼
7. validateDateInContent()
   - Verifica que contenido mencione "8" y "January"
   - ¿Validación OK? 
     ├─ SÍ → Continuar
     └─ NO → Retry o fail
                          │
                          ▼
8. INSERT INTO ephemerides (
     day=8, month=1, year=2026,
     title, description, category, source_url, ...
   )
   CONSTRAINT: UNIQUE(day, month, year) previene duplicados
                          │
                          ▼
9. Log: "✅ SUCCESS! Ephemeris for January 8 created"
                          │
                          ▼
10. Vercel redeploy automático (si cambió src)
                          │
                          ▼
11. Siguiente día a las 00:00 UTC, usuario ve:
    "8th of January" con nueva efeméride
```

---

## 🔐 Seguridad

### Keys & Secrets

| Key | Dónde | Exposición | Riesgo |
|-----|-------|-----------|--------|
| `SUPABASE_ANON_KEY` | `.env.local` + Frontend | Público | Bajo (RLS protege) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + GitHub Secrets | Solo servidor | Crítico |
| `OPENAI_API_KEY` | `.env.local` + GitHub Secrets | Solo GitHub Actions | Crítico |

**Protecciones:**

1. **Server-Side Only**
   ```tsx
   // lib/supabaseServer.ts - NUNCA se ejecuta en cliente
   // Solo se importa en app/page.tsx (Server Component)
   ```

2. **RLS (Row Level Security)**
   ```sql
   -- Supabase puede proteger tablas si es necesario
   ALTER TABLE ephemerides ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Anyone can read"
   ON ephemerides FOR SELECT USING (true);
   ```

3. **GitHub Secrets**
   - Encriptadas en reposo
   - Solo accesibles en workflows
   - Logs los oculta automáticamente

4. **NEVER commit .env.local**
   ```
   .gitignore
   ├── .env.local       ← Variables sensibles
   ├── .next/           ← Cache
   └── node_modules/    ← Dependencias
   ```

---

## ⚡ Performance

### Frontend Optimizaciones

| Optimización | Técnica | Beneficio |
|---|---|---|
| Server Rendering | Next.js App Router | Menos JS al cliente |
| Dynamic = true | `export const dynamic = "force-dynamic"` | Datos frescos |
| Component Lazy | `"use client"` en EphemerisDisplay | Interactividad opcional |
| Date Formatting | Pre-calculado en servidor | Sin cálculos en cliente |

### Backend Optimizaciones

| Optimización | Técnica | Beneficio |
|---|---|---|
| Índice Único | `UNIQUE(day, month, year)` | Lookups rápidos |
| maybeSingle() | Vs `.single()` | Evita errores |
| Fallback Query | Si no hoy, últimas | Siempre hay datos |
| UTF Timezone | `getUTC*()` | Sin conversiones |

### API Optimizaciones

| Optimización | Técnica | Beneficio |
|---|---|---|
| Temperature 0.8 | Balance creativo/consistencia | Respuestas rápidas |
| GPT-4o-mini | Vs GPT-4 | 10x más barato |
| JSON mode | Vs text parsing | Parsing garantizado |

---

## 📈 Escalabilidad

### Datos

**Crecimiento esperado:**
- 1 efeméride / día
- 365 por año
- ~7 años = 2,555 rows (negligible)

**Supabase soporta:**
- Millones de rows sin problema
- Con índices: queries O(1)
- Backups automáticos

---

### Requests

**Escenario:**
- 1,000 usuarios / día
- Cada request = 1 query SELECT
- ~1,000 queries/día

**Supabase soporta:**
- Free tier: 50,000 queries/mes
- Pro tier: ilimitado
- Connection pooling: 200 simultáneas

---

### OpenAI

**Costo:**
- 1 call/día × 365 = 365 calls/año
- GPT-4o-mini: ~$0.00015 por prompt
- Total: ~$0.05/año 💰

---

## 🚀 Deployment

### Local

```bash
# 1. Clone
git clone https://github.com/AlejandroBarea10/daily-ai-facts.git

# 2. Install
npm install

# 3. Variables (.env.local)
cp .env.local.example .env.local
# Editar con credenciales reales

# 4. Dev
npm run dev
# http://localhost:3000

# 5. Test generador
node scripts/generate-ephemeris.js
```

### Production (Vercel)

```bash
# 1. Connect repo a Vercel
# Dashboard → Add New → Git Repository

# 2. Vercel auto-configura:
# - Build: npm run build
# - Output: .next
# - Runtime: Node.js

# 3. Set Environment Variables
# Vercel Dashboard → Settings → Environment Variables
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
```

### GitHub Actions

```bash
# 1. Push código con .github/workflows/daily-ephemeris.yml
git push origin main

# 2. GitHub Actions → Settings → Secrets
# Agregar:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# 3. Actions tab → Daily Ephemeris Generation
# Verifica que el workflow existe y está enabled
```

---

## 🔄 CI/CD Pipeline

```
Push a GitHub
      │
      ▼
GitHub Actions:
├─ Checkout
├─ Setup Node
├─ npm install
├─ npm run lint (opcional)
├─ npm run build (optional)
└─ Deploy to Vercel (si cambió src)
      │
      ▼
Vercel:
├─ Build Next.js
├─ Deploy a CDN global
└─ Disponible en https://daily-ai-facts.vercel.app
      │
      ▼
Daily Cron (00:00 UTC):
├─ GitHub Actions dispara
├─ Ejecuta generate-ephemeris.js
├─ Inserta en Supabase
└─ Vercel sirve nueva efeméride (cache busted)
```

---

## 📊 Monitoreo

### Logs

**Frontend:**
```bash
# Vercel Functions Logs
# Dashboard → Logs → Function Logs
# Ver llamadas a getTodayEphemeris()
[Supabase] Querying ephemerides for: { day: 7, month: 1, year: 2026 }
[Supabase] Query successful, data returned: { title: '...', date: '7/1' }
```

**Backend:**
```bash
# GitHub Actions Logs
# Repo → Actions → Daily Ephemeris Generation → Latest run
# Ver logs del script
🚀 Starting ephemeris generation...
📝 Requesting AI...
✅ SUCCESS! Ephemeris for January 8 created
```

---

## 🛠️ Troubleshooting Architecture

| Problema | Causa | Solución |
|---|---|---|
| Datos no frescos en Vercel | Cache habilitado | `export const dynamic = "force-dynamic"` |
| PGRST116 error | `.single()` con 0 rows | Usar `.maybeSingle()` |
| Efemérides año actual | Prompt sin restricción | Agregar "NOT current year" |
| Timezone incorrecto | Usar `.getTime()` en vez de UTC | Usar `.getUTC*()` |
| GitHub Actions no corre | Secrets faltantes | Agregar los 3 secrets |

---

**Arquitectura completada: ✅**
