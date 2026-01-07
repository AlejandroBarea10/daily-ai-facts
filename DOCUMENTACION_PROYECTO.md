# 📅 Daily AI Facts - Documentación Completa del Proyecto

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Flujo del Proyecto](#flujo-del-proyecto)
3. [Componentes Principales](#componentes-principales)
4. [Setup Inicial](#setup-inicial)
5. [Desarrollo Paso a Paso](#desarrollo-paso-a-paso)
6. [Arquitectura Final](#arquitectura-final)
7. [Características Implementadas](#características-implementadas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

**Daily AI Facts** es una aplicación web que muestra una **efeméride histórica diferente cada día**, generada automáticamente con IA (OpenAI) y almacenada en una base de datos (Supabase).

### Objetivos Alcanzados
- ✅ Integración con Supabase para almacenamiento dinámico
- ✅ Generación automática diaria de contenido con OpenAI
- ✅ Sistema de efemérides históricas (eventos del pasado)
- ✅ UI bonita con formato de fecha elegante
- ✅ Automatización con GitHub Actions (cron diario 00:00 UTC)
- ✅ Despliegue en Vercel sin cache issues

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript + React
- **Backend**: Supabase (PostgreSQL + RLS)
- **AI**: OpenAI API (GPT-4o-mini)
- **Deployment**: Vercel + GitHub Actions
- **Database**: PostgreSQL (Supabase)

---

## 🔄 Flujo del Proyecto

```
┌─────────────────────────────────────┐
│   GitHub Actions (00:00 UTC)        │
│   Ejecuta: scripts/generate-ephemeris.js
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   getTomorrowUTC()                  │
│   Calcula: día+1 en UTC             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   ephemerisExists()                 │
│   ¿Ya existe para esa fecha?        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
    (Sí) Skip      (No) Continuar
       │               │
       │               ▼
       │    ┌─────────────────────────┐
       │    │   OpenAI API            │
       │    │   Prompt: evento        │
       │    │   histórico + contexto  │
       │    └────────────┬────────────┘
       │                 │
       │                 ▼
       │    ┌─────────────────────────┐
       │    │   validateDateInContent │
       │    │   ¿Contiene fecha?      │
       │    └────────────┬────────────┘
       │                 │
       │         ┌───────┴───────┐
       │         │               │
       │       (Sí)           (No) Retry
       │         │
       │         ▼
       │    ┌─────────────────────────┐
       │    │   insertEphemeris()     │
       │    │   Inserta en Supabase   │
       │    └────────────┬────────────┘
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌───────────────┐
        │   Vercel      │
        │   Redeploy    │
        │   (opcional)  │
        └───────────────┘
                │
                ▼
        ┌───────────────────────┐
        │   Usuario ve:         │
        │ 🌟 Nueva efeméride    │
        │ 📅 Fecha bonita       │
        │ 📝 Historia + Contexto│
        └───────────────────────┘
```

---

## 🏗️ Componentes Principales

### 1. **Frontend (Next.js)**

#### `app/page.tsx` - Página Principal
```tsx
export const runtime = "nodejs"
export const dynamic = "force-dynamic"  // Deshabilita cache

export default async function Home() {
  const ephemerisData = await getTodayEphemeris()
  return <EphemerisDisplay data={ephemerisData} />
}
```

**Qué hace:**
- Server-side component (async)
- Obtiene la efeméride desde Supabase
- Fuerza dynamic rendering (no cachea en Vercel)
- Pasa datos al componente de UI

#### `components/ephemeris-display.tsx` - Componente de Visualización
```tsx
export function EphemerisDisplay({ data }: EphemerisDisplayProps) {
  // Muestra:
  // - Fecha bonita: "7th of January"
  // - Año histórico: "1983"
  // - Título: "Introduction of TCP/IP"
  // - Descripción con typing effect
  // - Categoría: "COMPUTING"
}
```

**Features:**
- Efecto typing en la descripción
- Soporte para modo "sin datos"
- Responsive (mobile + desktop)
- Terminal-style UI

#### `lib/formatDate.ts` - Utilidades de Fecha
```ts
formatDateLong(7, 1)  // "7th of January"
getMonthName(1)       // "January"
getDayWithSuffix(7)   // "7th"
```

**Sufijos ordinales:**
- 1, 21, 31 → "st"
- 2, 22 → "nd"
- 3, 23 → "rd"
- 4-20, 24-30 → "th"

---

### 2. **Backend Server (Supabase)**

#### Tabla: `ephemerides`
```sql
CREATE TABLE ephemerides (
  id BIGINT PRIMARY KEY,
  day INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR,
  display_date VARCHAR,
  source_url VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX idx_ephemerides_unique_date 
ON ephemerides(day, month, year);
```

**Campos:**
- `day`, `month`, `year` → Identifican la efeméride (ej: 7, 1, 1983)
- `title` → "Introduction of TCP/IP"
- `description` → Historia completa con contexto
- `category` → "TECH", "AI", "COMPUTING"
- `display_date` → "January 7" (para UI)
- `source_url` → URL verificable de Wikipedia
- `created_at` → Fecha de creación

#### `lib/supabaseServer.ts` - Cliente Seguro
```ts
export async function getTodayEphemeris() {
  const { day, month, year } = getTodayUTC()
  
  // Intenta traer la de hoy
  const { data: todayData } = await supabase
    .from('ephemerides')
    .select('*')
    .eq('day', day)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()
  
  if (todayData) return todayData
  
  // Fallback: la más reciente disponible
  const { data: latestData } = await supabase
    .from('ephemerides')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  return latestData || null
}
```

**Key features:**
- Solo corre en servidor (nunca se expone la clave)
- Usa `maybeSingle()` para evitar errores si no existe
- Fallback a la efeméride más reciente
- Logs detallados en desarrollo

---

### 3. **Generación Automática (Script Node.js)**

#### `scripts/generate-ephemeris.js` - ~300 líneas

**Flujo:**

1. **getTomorrowUTC()**
   ```js
   // Calcula mañana en UTC
   const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
   return { day, month, year }
   ```

2. **ephemerisExists()**
   ```js
   // Comprueba si ya existe para esa fecha
   const { data } = await supabase
     .from('ephemerides')
     .select('id')
     .eq('day', day)
     .eq('month', month)
     .eq('year', year)
     .maybeSingle()
   ```

3. **generateEphemerisWithAI()**
   ```js
   // Prompt para OpenAI
   const prompt = `
     Genera un evento histórico (pasado, no ${currentYear})
     que ocurrió en ${monthName} ${day}
     
     Incluye:
     - Año exacto (ej: 1983)
     - Persona/organización
     - Por qué fue importante
   `
   
   const response = await openai.chat.completions.create({
     model: 'gpt-4o-mini',
     messages: [{ role: 'user', content: prompt }],
     temperature: 0.8
   })
   ```

4. **validateDateInContent()**
   ```js
   // Verifica que OpenAI incluyó la fecha correcta
   const content = `${title} ${description}`.toLowerCase()
   return content.includes(day) && 
          content.includes(monthName)
   ```

5. **insertEphemeris()**
   ```js
   // Inserta en Supabase con SERVICE_ROLE_KEY
   await supabase.from('ephemerides').insert([{
     day, month, year,
     title, description, category,
     display_date: `${monthName} ${day}`,
     source_url
   }])
   ```

---

### 4. **Automatización (GitHub Actions)**

#### `.github/workflows/daily-ephemeris.yml`
```yaml
name: Daily Ephemeris Generation

on:
  schedule:
    - cron: '0 0 * * *'  # 00:00 UTC cada día

jobs:
  generate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate ephemeris
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: node scripts/generate-ephemeris.js
```

**Requisitos en GitHub:**
- 3 Secrets configurados:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`

---

## 🚀 Setup Inicial

### Paso 1: Clonar y Instalar
```bash
git clone <repo>
cd daily-ai-facts
npm install
```

### Paso 2: Variables de Entorno
Crear `.env.local`:
```
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=pk_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-proj-...
```

### Paso 3: Preparar Base de Datos
En Supabase SQL Editor:
```sql
CREATE TABLE ephemerides (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR,
  display_date VARCHAR,
  source_url VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX idx_ephemerides_unique_date 
ON ephemerides(day, month, year);
```

### Paso 4: Probar Localmente
```bash
# Terminal 1: Frontend
npm run dev
# http://localhost:3000

# Terminal 2: Generar efeméride
node scripts/generate-ephemeris.js
```

### Paso 5: Desplegar
```bash
git push origin main
# Vercel hace redeploy automático

# GitHub Actions correrá cada día a las 00:00 UTC
```

---

## 📈 Desarrollo Paso a Paso

### **Fase 1: Supabase Integration (Día 1-2)**

**Problema:** La web mostraba datos hardcodeados.

**Solución:**
1. Crear tabla en Supabase
2. Crear cliente seguro en `lib/supabaseServer.ts`
3. Modificar `app/page.tsx` para ser async
4. Pasar datos a componente como props

**Desafíos resueltos:**
- TypeError: fetch failed → Agregar `runtime = "nodejs"` + Undici
- Variables de entorno no cargaban → Limpiar `.next` cache
- Componente esperaba hardcoded → Crear interface `EphemerisDisplayProps`

---

### **Fase 2: OpenAI Integration (Día 3)**

**Problema:** Necesitábamos generar contenido automático.

**Solución:**
1. Instalar SDK de OpenAI
2. Crear `scripts/generate-ephemeris.js` con:
   - Cálculo de mañana en UTC
   - Validación de duplicados
   - Llamada a OpenAI con prompt estructurado
   - Validación de respuesta
   - Inserción en Supabase

**Mejoras:**
- Manejo robusto de errores
- Logs detallados
- Validación de fecha en contenido

---

### **Fase 3: GitHub Actions (Día 4)**

**Problema:** El script corría manual, no automático.

**Solución:**
1. Crear workflow en `.github/workflows/daily-ephemeris.yml`
2. Schedule cron: `0 0 * * *` (00:00 UTC)
3. Configurar 3 GitHub Secrets
4. Workflow ejecuta `node scripts/generate-ephemeris.js`

**Beneficio:** Cero mantenimiento, automático todos los días.

---

### **Fase 4: UI Improvements (Día 5)**

**Problema:** Fecha se mostraba como "1/7", sin contexto histórico.

**Solución 1 - Formato de Fecha:**
1. Crear `lib/formatDate.ts` con funciones de utilidad
2. Implementar sufijos ordinales (1st, 2nd, 3rd, 4th)
3. Mostrar "7th of January" en grande
4. Agregar año histórico prominente

**Solución 2 - Contenido Histórico:**
1. Actualizar prompt de OpenAI para:
   - Solo eventos históricos (año < actual)
   - Incluir persona/organización
   - Explicar impacto
   - Texto más largo (3-4 oraciones)
2. Ajustar validación (solo día + mes, no año)

---

### **Fase 5: Producción Fixes (Día 6)**

**Problema 1: PGRST116 Error**
- Causa: `.single()` lanza error si 0 filas
- Solución: Cambiar a `.maybeSingle()`

**Problema 2: No mostraba nada**
- Causa: Cache de Next.js
- Solución: Agregar `export const dynamic = "force-dynamic"`

**Problema 3: Día incorrecto en Vercel**
- Causa: Timezone local vs UTC
- Solución: Asegurar `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`

**Problema 4: No había efeméride para hoy**
- Causa: Script genera para mañana
- Solución: Agregar fallback a efeméride más reciente

---

## 🏛️ Arquitectura Final

```
daily-ai-facts/
├── 📁 app/
│   ├── page.tsx              ← Servidor async, fuerza dynamic
│   ├── layout.tsx            ← Layout principal
│   └── globals.css           ← Estilos globales
│
├── 📁 components/
│   ├── ephemeris-display.tsx ← UI principal con typing effect
│   ├── terminal-header.tsx   ← Encabezado
│   └── terminal-footer.tsx   ← Pie de página
│
├── 📁 lib/
│   ├── supabaseServer.ts     ← Cliente Supabase seguro (servidor)
│   ├── formatDate.ts         ← Utilidades de fecha
│   └── utils.ts              ← Helpers varios
│
├── 📁 scripts/
│   └── generate-ephemeris.js ← Generador automático con IA
│
├── 📁 .github/workflows/
│   └── daily-ephemeris.yml   ← Cron automático (00:00 UTC)
│
├── .env.local                ← Variables de entorno (local)
├── package.json              ← Dependencias + scripts
├── next.config.mjs           ← Config de Next.js
└── tsconfig.json             ← Config de TypeScript
```

---

## ✨ Características Implementadas

### ✅ Core Features
- [x] Supabase para almacenamiento dinámico
- [x] OpenAI para generación de contenido
- [x] Efemérides históricas (eventos del pasado)
- [x] Generación automática diaria
- [x] GitHub Actions para automatización
- [x] Despliegue en Vercel
- [x] Validación de duplicados
- [x] Fallback a efeméride más reciente

### ✅ UI/UX
- [x] Formato de fecha bonito ("7th of January")
- [x] Año histórico destacado
- [x] Efecto typing en descripción
- [x] Responsive design (mobile + desktop)
- [x] Terminal-style estética
- [x] Modo sin datos elegante

### ✅ Backend
- [x] Cliente Supabase server-only (seguro)
- [x] Queries optimizadas
- [x] Índices únicos para duplicados
- [x] Logging detallado
- [x] Manejo robusto de errores

### ✅ DevOps
- [x] GitHub Actions cron (00:00 UTC)
- [x] Environment variables en Secrets
- [x] Auto-redeploy en Vercel
- [x] No cache en producción
- [x] UTC timezone en todas partes

---

## 🐛 Troubleshooting

### Error: "TypeError: fetch failed"
**Causa:** Next.js bundler interfiriendo con fetch
**Solución:**
```tsx
export const runtime = "nodejs"  // En app/page.tsx
```
+ Instalar undici + importarlo en supabaseServer.ts

---

### Error: "PGRST116: Cannot coerce result to single JSON object"
**Causa:** `.single()` cuando hay 0 filas
**Solución:**
```ts
.maybeSingle()  // En lugar de .single()
```

---

### Error: "No data en Vercel pero sí en local"
**Causa:** Cache de Next.js
**Solución:**
```tsx
export const dynamic = "force-dynamic"  // En app/page.tsx
```

---

### Error: "Ephemeris siempre del año actual"
**Causa:** Prompt de OpenAI no especificaba "años pasados"
**Solución:** Agregar al prompt:
```
Genera evento histórico (pasado, NO del año ${currentYear})
```

---

### Error: "GitHub Actions no corre"
**Checklist:**
- [ ] Workflow está en `.github/workflows/daily-ephemeris.yml`
- [ ] 3 GitHub Secrets configurados correctamente
- [ ] Cron syntax correcto: `0 0 * * *`
- [ ] Push incluye el workflow file

---

## 🎓 Lecciones Aprendidas

1. **Timezone es critico**: Siempre usar UTC en servidor
2. **Cache en Vercel**: `force-dynamic` es necesario si datos cambian
3. **Validación de IA**: OpenAI puede "alucinar", validar output
4. **Server vs Cliente**: Nunca expongas keys en frontend
5. **Fallbacks**: Siempre ten plan B si datos no existen
6. **Logs**: Son vitales para debugging en producción

---

## 🚀 Próximos Pasos Opcionales

- [ ] Agregar historial de efemérides pasadas
- [ ] Sistema de favoritos
- [ ] Compartir en redes sociales
- [ ] Multi-idioma
- [ ] Caché inteligente de OpenAI
- [ ] Analytics de visitas
- [ ] Notificaciones diarias

---

**Proyecto completado: ✅**

Última actualización: 7 de enero, 2026
