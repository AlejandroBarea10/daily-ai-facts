# 🤖 Generación Automática de Efemérides con IA

## ¿Qué es?

Un sistema completamente automatizado que genera una **efeméride nueva cada día** para el día siguiente (UTC) usando OpenAI, sin duplicados y con validación de fecha.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│ GitHub Actions (Scheduled)          │
│ - Ejecuta diariamente a las 00:00 UTC
│ - Llama: node scripts/generate-ephemeris.js
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ scripts/generate-ephemeris.js       │
│ - Calcula mañana (UTC)              │
│ - Verifica si existe en Supabase    │
│ - Llama OpenAI para generar         │
│ - Valida fecha en respuesta         │
│ - Inserta en tabla ephemerides      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Supabase (Database)                 │
│ - Tabla: ephemerides                │
│ - Service Role Key (para escribir)  │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Next.js Frontend (Web)              │
│ - Lee datos con Anon Key            │
│ - Muestra efeméride del día         │
│ - No puede ver claves sensibles     │
└─────────────────────────────────────┘
```

---

## 📋 Requisitos Previos

### 1. Cuenta OpenAI
- Ve a https://platform.openai.com/account/api-keys
- Crea una API key
- **Guardala segura** (solo la verás una vez)

### 2. Service Role Key de Supabase
- Dashboard Supabase → Settings → API
- Copia la **Service Role Secret** (no es la anon key)
- ⚠️ **NUNCA la expongas en el frontend**

### 3. Tabla `ephemerides` Actualizada

La tabla necesita una columna adicional. En Supabase SQL Editor, ejecuta:

```sql
-- Agregar columnas si no existen
ALTER TABLE ephemerides 
  ADD COLUMN IF NOT EXISTS display_date VARCHAR,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR;

-- Añadir índice único por fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_ephemerides_unique_date 
ON ephemerides(day, month, year);
```

---

## 🔑 Configuración Local

### 1. Actualizar `.env.local`

Abre tu `.env.local` y añade:

```dotenv
# Supabase Anon Key (para frontend - ya tienes esto)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx

# Service Role Key (SOLO para scripts server-side)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxx
```

### 2. NO Versionear `.env.local`

Ya debe estar en `.gitignore`:
```
.env.local
```

---

## ▶️ Ejecutar Manualmente (Local)

Para probar el script en tu máquina:

```bash
# Estar en el directorio del proyecto
cd /ruta/a/daily-ai-facts

# Ejecutar el script
node scripts/generate-ephemeris.js
```

**Salida esperada:**

```
🚀 Starting ephemeris generation...

📅 Target date: January 7, 2026
🔍 Checking if ephemeris already exists...
✓ No existing ephemeris found. Proceeding with generation.

📝 Requesting AI to generate ephemeris for January 7, 2026...

✓ Generated ephemeris:
  Title: First commercial color television broadcast
  Category: TECH
  Description: On January 7, 1928, Baird Television demonstrated...

🔐 Validating date consistency...
✓ Date validation passed!

💾 Inserting into Supabase...
✅ SUCCESS! Ephemeris for January 7, 2026 has been created:
   Title: First commercial color television broadcast
   Category: TECH
   Source: https://en.wikipedia.org/wiki/...
```

---

## ⚙️ Configuración Automática (GitHub Actions)

### 1. Añadir Secrets en GitHub

En tu repositorio GitHub:
1. Ve a **Settings → Secrets and variables → Actions**
2. Haz click en **New repository secret**
3. Añade los siguientes secrets:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | https://your-project.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu Service Role Key |
| `OPENAI_API_KEY` | Tu OpenAI API Key |

### 2. El Workflow Se Ejecuta Automáticamente

Una vez que hayas:
1. ✅ Pusheado el código a GitHub (incluyendo `.github/workflows/daily-ephemeris.yml`)
2. ✅ Añadido los secrets

**El sistema generará automáticamente una efeméride cada día a las 00:00 UTC.**

### 3. Ver los Logs

En GitHub:
1. Ve a tu repositorio
2. Click en **Actions**
3. Click en **Daily Ephemeris Generation**
4. Ver los logs de cada ejecución

---

## 🔐 Seguridad

### ✅ Implementado

| Aspecto | Cómo |
|--------|-----|
| Service Role Key privada | Guardada en GitHub Secrets (no en código) |
| OpenAI API Key privada | Guardada en GitHub Secrets (no en código) |
| Frontend seguro | Solo ve datos finales, no claves |
| Sin duplicados | Verifica antes de insertar |
| Validación de fecha | AI response debe contener fecha exacta |

---

## 🛡️ Validaciones del Script

### 1. Verificación de Existencia
Si ya existe efeméride para esa fecha, **no inserta nada**.

### 2. Validación de Respuesta de OpenAI
Asegura que la IA devolvió un JSON válido con:
- `title` (string)
- `description` (string)
- `category` ("AI" | "TECH" | "COMPUTING")
- `source_url` (URL válida que comienza con http)

### 3. Validación de Fecha
**Crítico:** Verifica que la descripción contiene:
- El día correcto
- El mes correcto (por nombre)
- El año correcto

Si falla, **no inserta nada** y el script reporta error.

---

## 📊 Tabla `ephemerides` - Estructura Final

```
Columna         | Tipo      | Descripción
----------------|-----------|-------------------------------------
id              | BIGINT    | PK, auto-increment
day             | INTEGER   | 1-31
month           | INTEGER   | 1-12
year            | INTEGER   | ej: 2026
title           | TEXT      | Título de la efeméride
description     | TEXT      | 1-2 frases
category        | TEXT      | "AI", "TECH", "COMPUTING"
display_date    | VARCHAR   | "January 7" (para mostrar en UI)
source_url      | VARCHAR   | URL verificable del evento
created_at      | TIMESTAMP | Creado automáticamente
```

**Índices:**
- PK en `id`
- UNIQUE en `(day, month, year)` - evita duplicados

---

## 🧪 Casos de Prueba

### Test 1: Ejecución Normal
```bash
node scripts/generate-ephemeris.js
```
**Esperado:** ✅ Se genera y inserta correctamente

### Test 2: Duplicado
Ejecuta el script dos veces seguidas:
```bash
node scripts/generate-ephemeris.js
node scripts/generate-ephemeris.js
```
**Esperado:** 
- Primera: ✅ Se inserta
- Segunda: ⚠️ "Ephemeris already exists. Skipping."

### Test 3: Fallo de IA (URL inválida)
Si OpenAI devuelve una URL sin "http":
**Esperado:** ❌ Script falla, no inserta nada

### Test 4: Fallo de Fecha
Si OpenAI devuelve fecha incorrecta:
**Esperado:** ❌ Script falla con "Date validation failed"

---

## 🚨 Troubleshooting

| Problema | Solución |
|----------|----------|
| `Error: Missing SUPABASE_URL` | Verifica `.env.local` o GitHub Secrets |
| `Error: Invalid ephemeris structure` | OpenAI devolvió JSON malformado |
| `Date validation failed` | La IA generó fecha incorrecta. Reintentar. |
| `Failed to insert ephemeris` | Error de conexión a Supabase |
| GitHub Actions no ejecuta | Verifica que `.github/workflows/daily-ephemeris.yml` está en `main` |

---

## 📅 Cronograma

El workflow está configurado para:
- **Ejecutarse:** Todos los días
- **Hora:** 00:00 UTC (medianoche UTC)
- **Genera:** Efeméride para el día siguiente

Puedes cambiar la hora editando `.github/workflows/daily-ephemeris.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # ← Cambiar esto
```

[Documentación de sintaxis cron](https://crontab.guru/)

---

## ✨ Resultado Final

Cada día, automáticamente:
1. ✅ Se calcula mañana (UTC)
2. ✅ Se verifica que no existe
3. ✅ Se genera con OpenAI
4. ✅ Se valida fecha
5. ✅ Se inserta en Supabase
6. ✅ Aparece en la web http://localhost:3000

**Sin intervención manual. Sin duplicados. 100% automático. 🚀**
