# ✅ Checklist de Verificación - Conexión Supabase

## 1️⃣ Verificar Archivo `.env.local`

Abre `.env.local` y confirma:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

- [ ] SUPABASE_URL no está vacío
- [ ] SUPABASE_ANON_KEY no está vacío
- [ ] No hay espacios extras al final de las líneas
- [ ] El archivo NO tiene comillas alrededor de los valores

---

## 2️⃣ Verificar que `lib/supabaseServer.ts` es Correcto

- [ ] Usa `import { createClient } from '@supabase/supabase-js'`
- [ ] NO usa `createBrowserClient`
- [ ] Lee `process.env.SUPABASE_URL` (sin prefijo NEXT_PUBLIC_)
- [ ] Lee `process.env.SUPABASE_ANON_KEY` (sin prefijo NEXT_PUBLIC_)
- [ ] Tiene logs `[Supabase]` para diagnóstico

---

## 3️⃣ Verificar Supabase Dashboard

Ve a https://supabase.com/dashboard:

- [ ] Proyecto existe y está activo
- [ ] Tabla `ephemerides` existe en la BD
- [ ] Tabla tiene columnas: `day`, `month`, `year`, `title`, `description`
- [ ] RLS (Row Level Security) está **HABILITADO**
- [ ] Existe policy de **SELECT** para rol `anon` (anonymous)

### Para verificar la policy:

1. Ve a tu tabla `ephemerides`
2. Abre el menú "..." → **Authentication** → **RLS**
3. Busca una policy que permita SELECT para usuarios anónimos
4. Si no existe, crea una:
   ```sql
   CREATE POLICY "Allow public select on ephemerides"
   ON public.ephemerides
   FOR SELECT
   USING (true);
   ```

---

## 4️⃣ Verificar que Hay Datos en la Tabla

En Supabase SQL Editor, ejecuta:

```sql
SELECT * FROM ephemerides WHERE day = 6 AND month = 1;
```

- [ ] Retorna al menos 1 fila
- [ ] La fila tiene `title` y `description` llenos
- [ ] Los valores de `day`, `month`, `year` son correctos

---

## 5️⃣ Verificar `.gitignore`

Abre `.gitignore` y confirma:

- [ ] Tiene `.env.local` en la lista (para no exponer claves)
- [ ] Tiene `.env.*.local` en la lista

**NO debe tener:**
- [ ] `.env.local.example` NO debe estar ignorado (es público)

---

## 6️⃣ Verificar que NO hay Errores de TypeScript

En la terminal, ve a la carpeta del proyecto y ejecuta:

```bash
npx tsc --noEmit
```

- [ ] No hay errores de TypeScript
- [ ] No hay errores de imports

---

## 7️⃣ Ejecutar y Ver Logs

```bash
npm run dev
```

Busca en la terminal logs que empiezan con `[Supabase]`:

- [ ] `[Supabase] Initializing server-side client...`
- [ ] `[Supabase] URL: ✓ Present`
- [ ] `[Supabase] Key: ✓ Present`
- [ ] `[Supabase] Client initialized successfully`
- [ ] `[Supabase] Querying ephemerides for:` (con día, mes actual)

**Si ves estos logs, la conexión funciona.**

---

## 8️⃣ Si Sigue Fallando

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| `[Supabase] URL: ✗ Missing` | SUPABASE_URL no en `.env.local` | Copiar desde Supabase Dashboard |
| `[Supabase] Key: ✗ Missing` | SUPABASE_ANON_KEY no en `.env.local` | Copiar desde Supabase Dashboard |
| `fetch failed` después de "Client initialized" | URL inválida o sin acceso a internet | Verificar que URL es exacta (sin espacios) |
| `PGRST` error code | Error en la query de Supabase | Ver el mensaje exacto en los logs |
| `No ephemeris found for this date` | No hay datos en la BD | Insertar un registro con day=6, month=1 |

---

## ✨ Checklist Completo?

Si marcaste todo ✅, la conexión debe funcionar.

**Siguiente paso:** Ejecuta `npm run dev` y verifica los logs `[Supabase]` en la terminal.
