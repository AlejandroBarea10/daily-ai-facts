# 🚀 Quick Setup - Sistema Automático de Efemérides

## 5 Pasos para Activar Generación Automática

### 1️⃣ Obtener OpenAI API Key

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia la clave (solo la verás una vez)

### 2️⃣ Obtener Service Role Key de Supabase

1. Dashboard Supabase → Settings → API
2. Copia **Service Role Secret** (NO es la anon key)

### 3️⃣ Actualizar `.env.local`

Abre `.env.local` y añade:

```dotenv
# Ya tienes esto:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx

# Añade esto:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
OPENAI_API_KEY=sk-proj-xxxxx
```

### 4️⃣ Actualizar Tabla en Supabase

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
ALTER TABLE ephemerides 
  ADD COLUMN IF NOT EXISTS display_date VARCHAR,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ephemerides_unique_date 
ON ephemerides(day, month, year);
```

### 5️⃣ Configurar GitHub Actions (Automático)

1. Push tu código a GitHub (incluye `.github/workflows/daily-ephemeris.yml`)
2. Ve a **GitHub Repo → Settings → Secrets and variables → Actions**
3. Añade 3 secrets:
   - `SUPABASE_URL` = tu URL de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = tu Service Role Key
   - `OPENAI_API_KEY` = tu OpenAI API Key

**¡Listo! ✅**

---

## 🧪 Probar Localmente

```bash
node scripts/generate-ephemeris.js
```

Verás output como:

```
✅ SUCCESS! Ephemeris for January 7, 2026 has been created:
   Title: First broadcast of color television
   Category: TECH
```

---

## 📅 Qué Sucede Automáticamente

- **Diariamente** a las 00:00 UTC
- Se genera efeméride para **mañana**
- Se inserta en Supabase **sin duplicados**
- Aparece en la web de forma automática

**Cero intervención manual.**

---

## ⚙️ Configuración Avanzada

Ver `SISTEMA_GENERACION_AUTOMATICA.md` para:
- Cambiar horario de ejecución
- Ver logs en GitHub Actions
- Troubleshooting
- Validaciones detalladas
