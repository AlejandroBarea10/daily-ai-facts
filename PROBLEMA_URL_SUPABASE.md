# 🔴 PROBLEMA IDENTIFICADO: URL de Supabase Inválida

## El Error Real

```
Error: getaddrinfo ENOTFOUND tu-proyecto.supabase.co (ENOTFOUND)
```

**Significa:** La URL en `.env.local` no es válida. Tienes un placeholder en lugar de tu URL real.

---

## ✅ Cómo Obtener tu URL Real de Supabase

### Paso 1: Ve a Supabase Dashboard
https://supabase.com/dashboard

### Paso 2: Selecciona tu Proyecto
Si tienes múltiples proyectos, asegúrate de seleccionar el correcto.

### Paso 3: Ve a Settings → API
1. Click en **Settings** (engranaje) en la barra lateral
2. Click en **API**
3. En la sección **Project API keys**, verás:
   - **Project URL** - Esta es tu `SUPABASE_URL`
   - **anon public** - Esta es tu `SUPABASE_ANON_KEY`

### Paso 4: Copia los Valores
El **Project URL** debe verse así:
```
https://xyzabcdefghijklmnopqr.supabase.co
```

(Con tu propio ID de proyecto, NO "tu-proyecto")

---

## 📝 Editar `.env.local` Correctamente

Abre `.env.local` y reemplaza:

**ANTES (incorrecto):**
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

**DESPUÉS (correcto):**
```
SUPABASE_URL=https://sewcklyyykejucijsjgo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_EPFIHIb3mBJ1iRZFexHyOQ_d4pBZwUf
```

⚠️ **Asegúrate de:**
- No hay espacios extras al final
- La URL termina en `.supabase.co`
- La URL NO termina en `/`

---

## 🚀 Después de Arreglar `.env.local`

1. Guarda el archivo
2. Ejecuta: `npm run dev`
3. Busca en los logs:
   ```
   [Supabase] Client initialized successfully
   [Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
   [Supabase] Query successful, data returned: { ... }
   ```

Si ves eso, ¡funcionó! 🎉

---

## ✓ Verificación

Cuando ejecutes `npm run dev`, estos logs indican que está funcionando:

```
[Supabase] Initializing server-side client...
[Supabase] URL: ✓ Present
[Supabase] Key: ✓ Present
[Supabase] Client initialized successfully
[Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
[Supabase] Query successful, data returned: { title: '...', date: '6/1' }
```

Si ves:
```
[Supabase] No ephemeris found for this date (expected)
```

Significa que la conexión funciona pero **no hay datos** para hoy. Inserta un registro en Supabase.

---

## 📍 Dónde Está tu ID de Proyecto

En el **Project URL** de Supabase:

```
https://XXXXXXXXXXXXX.supabase.co
         ↑
         Este es tu ID único
```

Ese ID es lo que reemplaza a "tu-proyecto".
