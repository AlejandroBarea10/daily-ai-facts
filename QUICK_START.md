# 🚀 Quick Start - Integración Supabase

## En 5 minutos

### 1. Copiar variables de entorno
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores de Supabase:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-key-here
```

### 2. Crear tabla en Supabase
Ve a **Supabase Dashboard → SQL Editor** y ejecuta:

```sql
CREATE TABLE ephemerides (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day, month, year)
);

CREATE INDEX idx_ephemerides_date ON ephemerides(day, month, year);
```

### 3. Insertar efeméride de hoy
```sql
-- Para hoy (6 de enero)
INSERT INTO ephemerides (day, month, year, title, description, category)
VALUES (
  6,
  1,
  2007,
  'Steve Jobs introduces the iPhone',
  'At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing and ushering in the smartphone era.',
  'TECH'
);
```

### 4. Probar en local
```bash
npm run dev
```

Abre http://localhost:3000

---

## ✅ Checklist

- [ ] `.env.local` creado con valores reales
- [ ] Tabla `ephemerides` creada en Supabase
- [ ] Al menos una efeméride insertada (con día/mes de hoy)
- [ ] `npm run dev` ejecutado sin errores
- [ ] Página muestra la efeméride o "No hay efeméride para hoy"

---

## 📚 Documentación Completa

- **SUPABASE_SETUP.md** - Guía detallada paso a paso
- **SQL_EXAMPLES.md** - Ejemplos de SQL para insertar más datos
- **INTEGRATION_SUMMARY.md** - Resumen técnico de la integración

---

## 🔑 Variables de Entorno

### Cómo obtener tus valores:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Abre **Settings → API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`

⚠️ **Nunca compartas tu `.env.local`** - contiene claves sensibles

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| `Missing SUPABASE_URL...` | Verifica `.env.local` existe y tiene valores |
| `relation "ephemerides" does not exist` | Crea la tabla en Supabase (ver paso 2) |
| `No hay efemérise para hoy` | Inserta un registro con el día/mes actual |
| Página carga muy lentamente | Espera a que Supabase responda (normal en primeras veces) |

---

## ✨ Listo

¡Tu integración está completa! La web ahora muestra efemérides desde Supabase sin exponer claves sensibles.
