# Guía de Integración Supabase - Daily AI Facts

## ✅ Cambios Realizados

### 1. **Dependencias Instaladas**
- `@supabase/supabase-js` ✓

### 2. **Archivos Creados**
- `lib/supabaseServer.ts` - Cliente Supabase server-side (sin exposición de claves)
- `.env.local.example` - Plantilla de variables de entorno

### 3. **Archivos Modificados**
- `app/page.tsx` - Ahora es un componente `async` que obtiene datos del servidor
- `components/ephemeris-display.tsx` - Ahora recibe datos como props y maneja el estado "sin datos"

---

## 🔧 Configuración (Paso a Paso)

### Paso 1: Crear/Configurar Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto o usa uno existente
3. En el Dashboard, ve a **Settings > API**
4. Copia:
   - **Project URL** (ej: `https://xyzabc.supabase.co`)
   - **anon public** key

### Paso 2: Crear la Tabla en Supabase

Ve a **SQL Editor** en Supabase y ejecuta:

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

-- Índices para búsquedas rápidas
CREATE INDEX idx_ephemerides_date ON ephemerides(day, month, year);
```

### Paso 3: Insertar Datos de Ejemplo

```sql
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

### Paso 4: Configurar Variables de Entorno Locales

1. Copia `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Abre `.env.local` y reemplaza los valores:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### Paso 5: Verificar que las Claves NO están en el Frontend

Las claves se definen en `.env.local` (NO en `.env.local.example` con valores reales).
El archivo `lib/supabaseServer.ts` lee estas variables:
- `process.env.SUPABASE_URL` ✓ (solo accesible en servidor)
- `process.env.SUPABASE_ANON_KEY` ✓ (solo accesible en servidor)

**Nunca uses `NEXT_PUBLIC_` prefijo para estas variables.**

---

## 🚀 Comando para Probar en Local

```bash
npm run dev
```

Esto inicia el servidor de desarrollo en `http://localhost:3000`

**Espera a ver**: 
- ✓ La página carga sin errores
- ✓ Si hay efeméride para hoy (6/1), muestra el contenido
- ✓ Si NO hay efeméride, muestra "No hay efeméride para hoy"

---

## 🔍 Flujo de Datos

```
1. Usuario accede a http://localhost:3000
2. Next.js ejecuta la función `Home()` en el SERVIDOR
3. Home() llama a getTodayEphemeris() desde lib/supabaseServer.ts
4. getTodayEphemeris():
   - Obtiene hoy en UTC (day, month, year)
   - Consulta Supabase tabla `ephemerides` con filtros
   - Retorna el dato o null
5. El dato se pasa a <EphemerisDisplay data={ephemerisData} />
6. El componente renderiza el contenido (o el estado "sin datos")
```

---

## ⚠️ Notas Importantes

1. **Las claves están SOLO en el servidor**: El cliente (`ephemeris-display.tsx`) es un componente "use client" pero recibe los datos como props. Nunca se exponen las claves.

2. **Sin datos no rompe el diseño**: Si no hay efeméride para hoy, el componente muestra un estado amigable manteniendo el layout visual.

3. **Zona horaria UTC**: La consulta siempre usa UTC (`getUTCDate()`, `getUTCMonth()`, `getUTCFullYear()`).

4. **Caché (Opcional)**: Si quieres cachear la respuesta para evitar múltiples consultas:
   ```tsx
   export const revalidate = 3600; // 1 hora en segundos
   ```
   Añade esto en `app/page.tsx` después de los imports.

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `Error: Missing SUPABASE_URL...` | Verifica que `.env.local` existe y tiene los valores correctos |
| `No hay efemérise para hoy` | Inserta datos en Supabase con day=6, month=1, year=2007 |
| `Error de conexión a Supabase` | Verifica que la URL y key son correctas, y que el proyecto está activo |
| Página carga lentamente | Considera agregar `revalidate = 3600` para cachear resultados |

---

## 📋 Checklist Final

- [x] @supabase/supabase-js instalado
- [x] `lib/supabaseServer.ts` creado con cliente server-side
- [x] `app/page.tsx` modificado para ser async y consultar datos
- [x] `ephemeris-display.tsx` modificado para recibir props
- [x] `.env.local.example` creado
- [ ] `.env.local` creado con tus valores reales
- [ ] Tabla `ephemerides` creada en Supabase
- [ ] Datos de ejemplo insertados
- [ ] `npm run dev` ejecutado sin errores
- [ ] Página muestra datos o estado "sin datos"
