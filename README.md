# 📅 Daily AI Facts

Una aplicación que muestra **una efeméride histórica diferente cada día**, generada automáticamente con IA y almacenada en Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)

**Live Demo**: https://daily-ai-facts.vercel.app

---

## ✨ Características

- 🤖 **Generación con IA**: OpenAI genera efemérides históricas automáticamente
- 📅 **Actualización diaria**: GitHub Actions cron a las 00:00 UTC
- 🌍 **UTC-aware**: Siempre calcula fechas en UTC
- 💾 **Supabase**: Base de datos PostgreSQL segura
- 🎨 **UI hermosa**: Formato de fecha elegante ("7th of January")
- 🔐 **Seguro**: Claves nunca expuestas en frontend
- 🚀 **Vercel**: Despliegue en CDN global
- ⚡ **Rápido**: Server-side rendering, sin caché innecesario

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│           USUARIO FINAL                     │
│    https://daily-ai-facts.vercel.app        │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
    ┌─────────┐          ┌─────────────┐
    │ Vercel  │          │ GitHub      │
    │ (Next)  │          │ Actions     │
    └────┬────┘          │ (Cron)      │
         │               └──────┬──────┘
         │                      │
         └──────────┬───────────┘
                    ▼
             ┌─────────────────┐
             │   Supabase      │
             │ (PostgreSQL)    │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │   OpenAI API    │
             │  (Generación)   │
             └─────────────────┘
```

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone
git clone https://github.com/AlejandroBarea10/daily-ai-facts.git
cd daily-ai-facts

# 2. Install
npm install

# 3. Configurar .env.local
cp .env.local.example .env.local
# Edita con:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (opcional para script local)
# - OPENAI_API_KEY (opcional para script local)

# 4. Preparar DB (en Supabase SQL Editor)
# Ver ARQUITECTURA_TECNICA.md → Schema

# 5. Dev server
npm run dev
# http://localhost:3000

# 6. Generar efeméride (opcional)
node scripts/generate-ephemeris.js
```

---

## 📋 Estructura del Proyecto

```
daily-ai-facts/
├── app/
│   ├── page.tsx              ← Página principal (server component)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ephemeris-display.tsx ← UI principal
│   ├── terminal-header.tsx
│   └── terminal-footer.tsx
├── lib/
│   ├── supabaseServer.ts     ← Cliente Supabase (server-only)
│   ├── formatDate.ts         ← Utilidades de fecha
│   └── utils.ts
├── scripts/
│   └── generate-ephemeris.js ← Generador automático
├── .github/workflows/
│   └── daily-ephemeris.yml   ← Cron automation (00:00 UTC)
├── .env.local                ← Secretos locales
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## 🔧 Configuración

### Variables de Entorno

**.env.local**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=pk_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (solo para script)
OPENAI_API_KEY=sk-proj-...        (solo para script)
```

### GitHub Secrets

Para GitHub Actions (necesarios para automatización):

1. Ve a **Settings → Secrets and variables → Actions**
2. Crea 3 secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

---

## 📚 Documentación

### Para entender el proyecto:
- 📖 [**DOCUMENTACION_PROYECTO.md**](./DOCUMENTACION_PROYECTO.md) - Guía completa paso a paso
- 🏗️ [**ARQUITECTURA_TECNICA.md**](./ARQUITECTURA_TECNICA.md) - Detalles técnicos y decisiones

### Resumen rápido:

**Cómo funciona:**

1. **Usuario abre la web** → Vercel ejecuta `app/page.tsx` (server component)
2. `page.tsx` calcula "hoy" en UTC
3. Query a Supabase: busca efeméride para hoy
4. Si no existe, fallback a la más reciente
5. React hidrata el componente con typing effect

**Automatización diaria:**

1. GitHub Actions cron: **00:00 UTC cada día**
2. Ejecuta `scripts/generate-ephemeris.js`
3. Calcula "mañana" en UTC
4. OpenAI genera evento histórico
5. Valida que contenga la fecha
6. Inserta en Supabase
7. Vercel sirve la nueva efeméride

---

## 🔐 Seguridad

- ✅ **Claves server-only**: SUPABASE_SERVICE_ROLE_KEY y OPENAI_API_KEY nunca en cliente
- ✅ **TypeScript**: Type safety en todo el código
- ✅ **UTC timezone**: Evita issues de timezone
- ✅ **Validación**: OpenAI response validado antes de insertar
- ✅ **Índice único**: Duplicados prevenidos por DB
- ✅ **Logs seguros**: GitHub Actions oculta secrets automáticamente

---

## ⚡ Performance

- **Frontend**: Server-side rendering + dynamic routes (no caché)
- **Database**: Índice único en (day, month, year) para lookups O(1)
- **AI**: GPT-4o-mini (rápido y económico)
- **Deployment**: Vercel CDN global

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **AI** | OpenAI API (GPT-4o-mini) |
| **Automation** | GitHub Actions |
| **Deployment** | Vercel |
| **HTTP Client** | Undici (Node.js fetch) |

---

## 📈 Roadmap

- [ ] Historial de efemérides
- [ ] Filtrado por categoría
- [ ] Sistema de favoritos
- [ ] Share en redes sociales
- [ ] Multi-idioma
- [ ] Caché inteligente OpenAI
- [ ] Analytics

---

## 🐛 Troubleshooting

### "No mostraba nada en Vercel"
```tsx
export const dynamic = "force-dynamic"  // Agregado en app/page.tsx
```

### "PGRST116 error"
```ts
.maybeSingle()  // En lugar de .single()
```

### "Efemérides del año actual"
Actualizado prompt para:
```
"Genera evento histórico (pasado, NO del año ${currentYear})"
```

Ver **DOCUMENTACION_PROYECTO.md** para más soluciones.

---

## 📄 Licencia

MIT License - Libre para usar y modificar

---

## 👤 Autor

Creado como proyecto de aprendizaje en Next.js, Supabase y OpenAI.

---

## 🔗 Enlaces

- [Live App](https://daily-ai-facts.vercel.app)
- [GitHub Repo](https://github.com/AlejandroBarea10/daily-ai-facts)
- [Documentación Completa](./DOCUMENTACION_PROYECTO.md)
- [Arquitectura Técnica](./ARQUITECTURA_TECNICA.md)

---

**Last updated**: 7 de enero, 2026 ✅
