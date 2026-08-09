# Guía detallada: Neon + Vercel para Limos

Orden recomendado: **Neon → push del código → Vercel → importar datos → conectar la app**.

---

## Paso 0 — Subir el código a GitHub (obligatorio)

En tu PC, en la carpeta del proyecto, el código de la API (`api/`, `sql/`, etc.) tiene que estar en GitHub para que Vercel lo despliegue.

```powershell
cd C:\Users\gasto\Documents\Repos\Limos
git add api sql docs src/services/dataService.js src/services/neonApiService.js src/App.js src/config public/index.html package.json package-lock.json vercel.json scripts/update-meta-tags.js
git commit -m "feat: API Neon + Vercel como base intermedia"
git push
```

Si no subís esto, Vercel no va a tener los endpoints `/api/health`, `/api/inscripciones`, etc.

---

## Paso 1 — Connection string en Neon

1. Entrá a [console.neon.tech](https://console.neon.tech).
2. Abrí el proyecto **limos**.
3. En el dashboard, buscá **Connection string** / **Connect**.
4. Elegí:
   - Database: normalmente `neondb` (o la que creaste).
   - Role: el usuario que te da Neon.
   - **Pooled connection** (recomendado para Vercel serverless).
5. Copiá la URL. Se ve así:

```text
postgresql://USER:PASSWORD@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

**Guardala en un bloc de notas.** Esa es tu `DATABASE_URL`.  
No la subas a GitHub ni la pegues en el chat público.

### (Opcional) Crear tablas a mano

1. En Neon: **SQL Editor** → New query.
2. Abrí el archivo del repo `sql/schema.sql`, copiá todo el contenido y ejecutalo (**Run**).
3. Si no lo hacés ahora, la API crea las tablas solas en el primer request (`ensureSchema`).

---

## Paso 2 — Cuenta y proyecto en Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión (ideal: con la misma cuenta de GitHub).
2. **Add New… → Project**.
3. Importá el repo **`gastongadea/limos-arboleda`**.
4. Antes de Deploy, abrí **Environment Variables** y cargá estas (Production + Preview):

| Nombre | Valor | De dónde sale |
|--------|--------|----------------|
| `DATABASE_URL` | La connection string de Neon | Paso 1 |
| `GOOGLE_API_KEY` | Tu API key de Sheets | Igual que `REACT_APP_GOOGLE_API_KEY` del `.env` local |
| `GOOGLE_SHEET_ID` | ID de la planilla | Igual que `REACT_APP_GOOGLE_SHEET_ID` |
| `GOOGLE_APPS_SCRIPT_URL` | URL `/exec` del script | Igual que `REACT_APP_GOOGLE_APPS_SCRIPT_URL` |
| `CORS_ORIGINS` | `https://gastongadea.github.io` | Origen de GitHub Pages |
| `SYNC_SELF_URL` | (después del deploy) `https://TU-PROYECTO.vercel.app` | Lo completás en el Paso 3 |

Notas:

- En Vercel **no** hace falta el prefijo `REACT_APP_` para las variables de la API.
- Podés dejar `SYNC_SELF_URL` vacío al primer deploy y agregarla después.

5. **Framework Preset**: si Vercel detecta Create React App, está bien. Las rutas `api/*.js` se despliegan igual como Serverless Functions.
6. Click **Deploy** y esperá que termine.

---

## Paso 3 — Verificar que la API vive

1. En Vercel → tu proyecto → **Domains** / overview: copiá la URL, por ejemplo:

```text
https://limos-arboleda.vercel.app
```

(el nombre exacto puede variar).

2. Abrí en el navegador:

```text
https://TU-PROYECTO.vercel.app/api/health
```

Respuesta esperada (algo así):

```json
{ "ok": true, "db": true, "timestamp": "..." }
```

Si `ok: false` o error 500:

- Revisá que `DATABASE_URL` esté bien (pooled + `sslmode=require`).
- En Vercel → **Deployments** → el último deploy → **Functions** / logs.

3. Agregá/edita en Vercel la variable:

```text
SYNC_SELF_URL=https://TU-PROYECTO.vercel.app
```

y redeploy (Deployments → ⋮ → Redeploy) para que quede activa.

---

## Paso 4 — Importar la planilla a Neon (una vez)

Esto copia lo que ya tenés en Google Sheets hacia Neon.

### Opción A — Desde el navegador / PowerShell

```powershell
Invoke-RestMethod -Method POST -Uri "https://TU-PROYECTO.vercel.app/api/import-from-sheets"
```

Debería devolver algo como `{ "success": true, "imported": 1234 }`.

### Opción B — Desde la app (después del Paso 5)

Configuración → clave admin → **Importar planilla a Neon**.

### Verificar en Neon

SQL Editor:

```sql
SELECT COUNT(*) FROM inscripciones;
SELECT * FROM inscripciones ORDER BY updated_at DESC LIMIT 20;
```

---

## Paso 5 — Conectar el frontend a la API

### Local (para probar con `npm start`)

En tu archivo `.env` agregá una línea (reemplazá la URL):

```env
REACT_APP_API_URL=https://TU-PROYECTO.vercel.app
```

Reiniciá el servidor (`Ctrl+C` y `npm start`).  
Create React App solo lee `.env` al arrancar.

### Producción (GitHub Pages)

1. En `public/index.html` (o vía `scripts/update-meta-tags.js` si agregás la var al `.env`):

```html
<meta name="api-url" content="https://TU-PROYECTO.vercel.app" />
```

2. Commit + push (y el workflow de Pages / `npm run deploy` que uses).

Sin `REACT_APP_API_URL` / meta `api-url`, la app **sigue usando solo Google Sheets**.

---

## Paso 6 — Probar el flujo completo

1. Abrí la app (local o Pages).
2. Elegí un comensal, cambiá una comida, esperá el auto-guardado.
3. En Neon:

```sql
SELECT * FROM inscripciones
WHERE synced_at IS NULL OR synced_at < updated_at
ORDER BY updated_at DESC;
```

4. Forzá sync a la planilla:

```powershell
Invoke-RestMethod -Method POST -Uri "https://TU-PROYECTO.vercel.app/api/sync-sheets"
```

o el botón **Sync Neon → planilla** en Configuración.

5. Abrí la planilla y confirmá que la celda se actualizó.

---

## Resumen de “qué hace cada cosa”

| Pieza | Qué es |
|--------|--------|
| **Neon** | Base Postgres donde la app lee/escribe rápido |
| **Vercel `api/`** | Backend que habla con Neon y con Sheets |
| **GitHub Pages** | Solo el frontend React |
| **Google Sheets** | Espejo / planilla; se actualiza después (sync) |

---

## Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| `/api/health` 404 | El código `api/` no está en el branch que Vercel despliega; hacé push |
| `/api/health` 500 `DATABASE_URL` | Variable mal cargada o connection string sin pooled/ssl |
| Import da 0 | Planilla vacía, API key sin acceso, o Sheet ID incorrecto |
| App sigue lenta / Sheets | Falta `REACT_APP_API_URL` o meta `api-url` |
| Sync falla “fila no encontrada” | Falta la fecha A/C en la hoja Data; el sync no crea filas nuevas aún |
| CORS en el navegador | Agregá `CORS_ORIGINS=https://gastongadea.github.io` en Vercel |
| Error de cron `*/2 * * * *` en Hobby | Solo se permiten crons **1 vez por día**. Hay 2 crons diarios: import planilla→Neon (`0 10`) y sync Neon→planilla (`0 9`) |
| Edición manual en la planilla | El import diario (10:00 UTC ≈ 07:00 Argentina) trae esos cambios a Neon; **en conflicto gana la planilla** |
| `NetworkError when attempting to fetch` en local | CORS: la API ahora permite `localhost`. Redeploy Vercel tras actualizar `api/_lib/cors.js` |
| Pantalla en blanco en `*.vercel.app` | Ese dominio es **solo la API**. La app se abre en GitHub Pages, no en Vercel |

---

## Checklist rápido

- [ ] Push del código con carpeta `api/` a GitHub  
- [ ] `DATABASE_URL` copiada de Neon (pooled)  
- [ ] Proyecto Vercel importado del repo  
- [ ] Env en Vercel: `DATABASE_URL`, `GOOGLE_*`  
- [ ] `https://…vercel.app/api/health` → `ok: true`  
- [ ] `POST …/api/import-from-sheets`  
- [ ] `REACT_APP_API_URL` / meta `api-url` apuntando a Vercel  
- [ ] Probar guardar una comida y verla en Neon + luego en Sheets  
