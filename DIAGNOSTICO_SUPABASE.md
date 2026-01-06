# 🔧 Diagnóstico de Conexión Supabase

## ✅ Cambios Realizados

He mejorado `lib/supabaseServer.ts` con **logs detallados de diagnóstico** para identificar exactamente dónde falla la conexión.

---

## 📊 Qué Se Agregó

### 1. Logs de Inicialización del Cliente
```typescript
console.log('[Supabase] Initializing server-side client...')
console.log('[Supabase] URL:', supabaseUrl ? '✓ Present' : '✗ Missing')
console.log('[Supabase] Key:', supabaseAnonKey ? '✓ Present' : '✗ Missing')
console.log('[Supabase] Client initialized successfully')
```

### 2. Logs de la Consulta
```typescript
console.log('[Supabase] Querying ephemerides for:', { day, month, year })
```

### 3. Logs Detallados de Errores
```typescript
console.error('[Supabase] Query error:', {
  code: error.code,
  message: error.message,
  status: error.status,
})
```

### 4. Logs de Éxito
```typescript
console.log('[Supabase] Query successful, data returned:', {
  title: data.title,
  date: `${data.day}/${data.month}`,
})
```

---

## 🚀 Cómo Interpretar los Logs

Cuando ejecutes `npm run dev`, busca en la consola (terminal):

### ✅ Éxito - Verás:
```
[Supabase] Initializing server-side client...
[Supabase] URL: ✓ Present
[Supabase] Key: ✓ Present
[Supabase] Client initialized successfully
[Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
[Supabase] Query successful, data returned: { title: 'Steve Jobs introduces the iPhone', date: '6/1' }
```

### ❌ Falta la URL:
```
[Supabase] Initializing server-side client...
[Supabase] URL: ✗ Missing
[Supabase] Key: ✓ Present
Error: Missing SUPABASE_URL...
```
**Solución:** Verifica que `.env.local` tiene `SUPABASE_URL`

### ❌ Falta la Key:
```
[Supabase] Initializing server-side client...
[Supabase] URL: ✓ Present
[Supabase] Key: ✗ Missing
Error: Missing SUPABASE_ANON_KEY...
```
**Solución:** Verifica que `.env.local` tiene `SUPABASE_ANON_KEY`

### ❌ Error de conexión (fetch failed):
```
[Supabase] Initializing server-side client...
[Supabase] URL: ✓ Present
[Supabase] Key: ✓ Present
[Supabase] Client initialized successfully
[Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
[Supabase] Fatal error during query: {
  name: 'TypeError',
  message: 'fetch failed',
  ...
}
```
**Posibles causas:**
1. **URL malformada** - Verifica que SUPABASE_URL es exacto (ej: sin espacios)
2. **Conexión de red** - Firewall bloqueando Supabase
3. **RLS policies incorrectas** - La tabla `ephemerides` no permite SELECT para `anon`

### ❌ No hay datos para hoy:
```
[Supabase] Querying ephemerides for: { day: 6, month: 1, year: 2026 }
[Supabase] No ephemeris found for this date (expected)
```
**Solución:** Inserta un registro en Supabase con `day=6, month=1, year=2026`

### ❌ Error de código desconocido:
```
[Supabase] Query error: {
  code: 'PGRST123',
  message: 'some error',
  status: 400
}
[Supabase] Unexpected error code: PGRST123
```
**Solución:** Busca el código en la documentación de Supabase

---

## 🔍 Lo Que Se Verificó

✅ **Cliente es server-side:** Solo usa `createClient()`, no `createBrowserClient()`
✅ **Variables de entorno:** Se leen directamente de `process.env`
✅ **URL sin modificaciones:** Se usa exactamente como está en `.env.local`
✅ **Logs solo en servidor:** No se ejecutan en el navegador
✅ **Gestión de errores:** Cada tipo de error tiene su propio log

---

## 🐛 Si Sigue Fallando

Ejecuta `npm run dev` y copia aquí los logs de `[Supabase]` que veas en la terminal.

Eso te dirá exactamente:
1. Si las variables de entorno se cargan
2. Si el cliente se inicializa correctamente
3. Dónde exactamente falla (URL, conexión, query, etc.)

---

## 📝 Resumen de Cambios

| Cambio | Ubicación |
|--------|-----------|
| Logs de inicialización | Top del archivo, cuando se carga el módulo |
| Logs de query | Inicio de `getTodayEphemeris()` |
| Logs de error detallados | En el manejo de errores |
| Logs de éxito | Cuando se obtienen datos |

**Sin cambios:** Lógica, componentes, UI, o estructura del proyecto.

---

## ✨ Próximo Paso

Ejecuta: `npm run dev`

Copia los logs `[Supabase]` que veas y esos te dirán exactamente qué está mal.
