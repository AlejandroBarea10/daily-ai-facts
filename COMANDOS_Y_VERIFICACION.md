# ⚡ Inicio Rápido - Comandos y Verificación

## 🚀 Comandos Esenciales

### 1. Ejecutar Web en Local
```bash
npm run dev
```

Abre: http://localhost:3000

**Resultado esperado:**
```
✓ Página carga sin errores
✓ Muestra efeméride del 6/1 (si existe en Supabase)
✓ O muestra "No hay efeméride para hoy"
✓ Logs [Supabase] en terminal
```

---

### 2. Limpiar Cache de Next.js
```bash
Remove-Item -Recurse -Force .next
```

**Cuándo usarlo:**
- Después de cambiar `.env.local`
- Cuando hay errores raros de cache
- Antes de probar generación automática

---

### 3. Generar Efeméride Localmente
```bash
node scripts/generate-ephemeris.js
```

**Requisitos previos:**
- `.env.local` con SUPABASE_SERVICE_ROLE_KEY
- `.env.local` con OPENAI_API_KEY
- Tabla `ephemerides` preparada en Supabase

**Resultado esperado:**
```
🚀 Starting ephemeris generation...

📅 Target date: January 7, 2026
🔍 Checking if ephemeris already exists...
✓ No existing ephemeris found. Proceeding with generation.

📝 Requesting AI to generate ephemeris for January 7, 2026...

✓ Generated ephemeris:
  Title: [título generado]
  Category: TECH
  Description: [descripción generada]

🔐 Validating date consistency...
✓ Date validation passed!

💾 Inserting into Supabase...
✅ SUCCESS! Ephemeris for January 7, 2026 has been created:
   Title: [título]
   Category: TECH
   Source: [URL]
```

---

### 4. Ver Logs de GitHub Actions
```
GitHub → Tu Repositorio → Actions → Daily Ephemeris Generation
```

**Clic en la última ejecución para ver logs completos**

---

## ✅ Verificaciones

### Verificación 1: Variables de Entorno

**Archivo: `.env.local`**
```bash
# Verifica que tiene:
echo $env:SUPABASE_URL
echo $env:SUPABASE_ANON_KEY
echo $env:SUPABASE_SERVICE_ROLE_KEY
echo $env:OPENAI_API_KEY
```

**Resultado esperado:**
```
✅ Todos muestran valores (no vacíos)
```

---

### Verificación 2: Tabla en Supabase

**En Supabase SQL Editor, ejecuta:**
```sql
SELECT COUNT(*) as total FROM ephemerides;
```

**Resultado esperado:**
```
total
------
  1+
```

(Debe haber al menos 1 registro)

---

### Verificación 3: Tabla Tiene Columnas Nuevas

**En Supabase SQL Editor, ejecuta:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ephemerides'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
id              ✅
day             ✅
month           ✅
year            ✅
title           ✅
description     ✅
category        ✅
display_date    ✅ (columna nueva)
source_url      ✅ (columna nueva)
created_at      ✅
```

---

### Verificación 4: Índice Único

**En Supabase SQL Editor, ejecuta:**
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'ephemerides';
```

**Resultado esperado:**
```
idx_ephemerides_unique_date  ✅
idx_ephemerides_date         ✅
```

---

### Verificación 5: GitHub Secrets Configurados

**GitHub → Settings → Secrets and variables → Actions**

**Verifica que existen:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`

**Resultado esperado:**
```
3 secrets configured ✅
```

---

### Verificación 6: Workflow de GitHub

**GitHub → Actions → Daily Ephemeris Generation**

**Verifica que:**
- [ ] El workflow existe
- [ ] Tiene historia de ejecuciones (si ya pasó 00:00 UTC)
- [ ] Los logs muestran éxito o el error exacto

---

## 🧪 Prueba End-to-End

### Paso 1: Preparar
```bash
# Limpiar cache
Remove-Item -Recurse -Force .next

# Verificar .env.local tiene todas 5 variables
```

### Paso 2: Ejecutar Script Localmente
```bash
node scripts/generate-ephemeris.js
```

**Resultado esperado:** ✅ SUCCESS

### Paso 3: Verificar en Web
```bash
npm run dev
```

Abre: http://localhost:3000

**Resultado esperado:** Muestra la nueva efeméride generada

### Paso 4: Verificar en Supabase
**En SQL Editor:**
```sql
SELECT * FROM ephemerides ORDER BY created_at DESC LIMIT 1;
```

**Resultado esperado:** El registro más reciente es el que acabas de generar

### Paso 5: Probar Duplicado
```bash
node scripts/generate-ephemeris.js
```

**Resultado esperado:**
```
⚠️  Ephemeris for [date] already exists. Skipping.
```

---

## 🐛 Debugging

### Si falla: "fetch failed"
```bash
# Verifica que .env.local tiene SUPABASE_URL
# Verifica que la URL es exacta (sin espacios)
# Limpia .next
Remove-Item -Recurse -Force .next
```

### Si falla: "Missing environment variable"
```bash
# Verifica que todas 5 variables están en .env.local
echo $env:SUPABASE_URL
echo $env:OPENAI_API_KEY
# Etc.
```

### Si falla: "Invalid ephemeris structure"
```bash
# OpenAI devolvió JSON malformado
# Intenta de nuevo mañana (problema temporal)
```

### Si falla: "Date validation failed"
```bash
# OpenAI generó fecha incorrecta
# Script correctamente rechaza
# Intenta de nuevo mañana
```

---

## 📊 Logs Esperados

### npm run dev (Frontend)
```
✓ Ready in 643ms
[Supabase] Initializing server-side client...
[Supabase] URL: ✓ Present
[Supabase] Key: ✓ Present
[Supabase] Client initialized successfully
[Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
[Supabase] Query successful, data returned: { title: '...', date: '6/1' }
GET / 200 in 3.0s
```

### node scripts/generate-ephemeris.js
```
🚀 Starting ephemeris generation...

📅 Target date: January 7, 2026
🔍 Checking if ephemeris already exists...
✓ No existing ephemeris found. Proceeding with generation.

📝 Requesting AI to generate ephemeris for January 7, 2026...

✓ Generated ephemeris:
  Title: First color television broadcast
  Category: TECH
  Description: On January 7, 1928...

🔐 Validating date consistency...
✓ Date validation passed!

💾 Inserting into Supabase...
✅ SUCCESS! Ephemeris for January 7, 2026 has been created:
```

### GitHub Actions
```
✓ Checkout code
✓ Setup Node.js
✓ Install dependencies
✓ Generate ephemeris for tomorrow
✅ Ephemeris generated successfully for tomorrow
```

---

## 🎯 Checklist Pre-Activación

Antes de hacer push a GitHub:

```
Código:
  ☐ app/page.tsx tiene export const runtime = "nodejs"
  ☐ lib/supabaseServer.ts usa Undici
  ☐ scripts/generate-ephemeris.js existe
  ☐ .github/workflows/daily-ephemeris.yml existe

Configuración:
  ☐ .env.local tiene SUPABASE_URL
  ☐ .env.local tiene SUPABASE_ANON_KEY
  ☐ .env.local tiene SUPABASE_SERVICE_ROLE_KEY
  ☐ .env.local tiene OPENAI_API_KEY
  ☐ .env.local NO está versionado (en .gitignore)

Base de Datos:
  ☐ Tabla ephemerides existe
  ☐ Columna display_date existe
  ☐ Columna source_url existe
  ☐ Índice único creado
  ☐ Al menos 1 efeméride de prueba

Tests Locales:
  ☐ npm run dev funciona
  ☐ node scripts/generate-ephemeris.js funciona
  ☐ Página muestra efeméride correcta
  ☐ Script detecta duplicados

GitHub:
  ☐ Código pusheado
  ☐ .github/workflows/ incluido
  ☐ 3 Secrets creados
  ☐ Workflow visible en Actions tab
```

---

## 🚀 Comando Final

Una vez verificado todo:

```bash
git add .
git commit -m "feat: add automated ephemeris generation with AI"
git push origin main
```

**GitHub Actions hará el resto automáticamente cada día a las 00:00 UTC.**

---

**¡Listo para despegar! 🚀**
