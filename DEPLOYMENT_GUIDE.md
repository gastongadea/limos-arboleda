# 🚀 Guía de Despliegue - GitHub Pages + Vercel Proxy

Esta guía te ayudará a desplegar la aplicación "Comidas de Arboleda" en GitHub Pages usando un proxy de Vercel para evitar problemas de CORS.

## 📋 Requisitos Previos

1. **Cuenta de GitHub** con el repositorio del proyecto
2. **Cuenta de Vercel** (gratuita)
3. **Google Sheets API** configurada
4. **Google Apps Script** configurado

## 🔧 Paso 1: Configurar el Proxy de Vercel

### 1.1 Crear cuenta en Vercel
- Ve a [vercel.com](https://vercel.com)
- Regístrate con tu cuenta de GitHub

### 1.2 Desplegar el Proxy
1. **Fork o clona** este repositorio
2. **Conecta** el repositorio a Vercel
3. **Configura las variables de entorno** en Vercel:
   - `REACT_APP_GOOGLE_API_KEY`: Tu API key de Google
   - `REACT_APP_GOOGLE_SHEET_ID`: ID de tu planilla de Google Sheets
   - `REACT_APP_GOOGLE_APPS_SCRIPT_URL`: URL de tu Google Apps Script

### 1.3 Obtener la URL del Proxy
Después del despliegue, Vercel te dará una URL como:
```
https://tu-app.vercel.app
```

## 🔧 Paso 2: Configurar GitHub Pages

### 2.1 Actualizar la configuración
Edita el archivo `src/config/ghPagesConfig.js` y cambia:
```javascript
VERCEL_PROXY_URL: 'https://tu-app.vercel.app/api/proxy',
```
Por tu URL real de Vercel.

### 2.2 Configurar GitHub Pages
1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` (o tu rama principal)
5. **Folder**: `/ (root)`
6. **Save**

### 2.3 Configurar GitHub Actions (Opcional)
Crea el archivo `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

## 🔧 Paso 3: Configurar Google Apps Script

### 3.1 Crear el Script
1. Ve a [script.google.com](https://script.google.com) o **Extensiones > Apps Script** en tu planilla.
2. **Nuevo proyecto** (o abre el proyecto ya vinculado a la planilla).
3. Copia el contenido de **`google-apps-script.js`** (incluye la acción `updateCells` para guardado en lote).  
   Si usas otra variante (`google-apps-script-cors-enabled.js`, `google-apps-script-cors-fixed.js`, `google-apps-script-jsonp.js`, etc.), asegurá de que el archivo tenga la acción **`updateCells`**; si no, la app mostrará "Acción no reconocida: updateCells".
4. **Guardar** y **Implementar** → **Nueva implementación** (o **Gestionar implementaciones** → **Editar** → **Nueva versión**).
5. **Tipo**: Aplicación web
6. **Ejecutar como**: Tú mismo
7. **Quién tiene acceso**: Cualquier persona
8. **Implementar**

### 3.2 Obtener la URL
Copia la URL de la implementación y configúrala en Vercel.

### 3.3 Si aparece "Acción no reconocida: updateCells"
- El script desplegado debe incluir la acción **updateCells** (guardado en lote). Usá una versión actualizada de `google-apps-script.js` o `google-apps-script-cors-enabled.js` del repo, guardá en Apps Script y creá una **nueva versión** de la implementación.
- **Ejecutar como la cuenta propietaria**: La implementación "Ejecutar como: Yo" usa la cuenta con la que desplegaste. Esa cuenta debe ser **propietaria** de la planilla o tener permiso de **Editor**. Si la planilla es de otro usuario, dale a esa cuenta acceso de editor a la planilla o creá el script desde la misma cuenta que es dueña del Sheet (Extensiones > Apps Script desde la propia planilla).
- Si seguís con error, en el editor de Apps Script revisá que en el `switch (action)` exista `case 'updateCells':` y la función `updateCells(spreadsheet, data)`.

### 3.4 Depurar con la consola del navegador
1. Abrí la app en el navegador y abrí **Herramientas de desarrollo** (F12 o clic derecho → Inspeccionar).
2. Andá a la pestaña **Consola** (Console).
3. Intentá guardar cambios. Deberías ver mensajes como:
   - `📤 Action enviada: updateCells` → confirma que la app envía la acción correcta.
   - `📤 URL (base, para probar en navegador): ...` → podés copiar la URL (completa, sin recortar) y abrirla en otra pestaña para ver la respuesta cruda del script.
   - Si hay error: `📥 Respuesta del script (error): {...}` → ahí ves exactamente qué devolvió Apps Script.
4. Si la acción enviada es `updateCells` pero el script responde "no reconocida", el código desplegado en Apps Script **no tiene** el `case 'updateCells'`. Copiá de nuevo el archivo `google-apps-script-cors-enabled.js` del repo en el editor, guardá y creá una **nueva versión** de la implementación (Implementar → Gestionar implementaciones → Editar → Nueva versión → Desplegar).
5. La app tiene **fallback**: si el script no reconoce `updateCells`, guarda celda por celda (`updateCell`), así podés seguir usando la app mientras corregís el script.

## 🔧 Paso 4: Configurar Google Sheets

### 4.1 Crear la Planilla
1. Crea una nueva planilla de Google Sheets
2. Configura la estructura:
   - **Columna A**: Reservada
   - **Columna B**: Fecha
   - **Columna C**: Comida (A/C)
   - **Columna D+**: Usuarios

### 4.2 Configurar Permisos
1. **Compartir** la planilla
2. **Dar acceso** a tu cuenta de Google Apps Script
3. **Permisos**: Editor

## 🔧 Paso 5: Configurar Google Sheets API

### 5.1 Habilitar la API
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. **Crear proyecto** o seleccionar existente
3. **Habilitar** Google Sheets API
4. **Crear credenciales** → API Key
5. **Restringir** la API key a Google Sheets API

### 5.2 Configurar Variables de Entorno
En Vercel, configura:
- `REACT_APP_GOOGLE_API_KEY`: Tu API key
- `REACT_APP_GOOGLE_SHEET_ID`: ID de tu planilla
- `REACT_APP_GOOGLE_APPS_SCRIPT_URL`: URL de tu script

## 🚀 Paso 6: Desplegar

### 6.1 Desplegar en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Seguir las instrucciones
```

### 6.2 Desplegar en GitHub Pages
```bash
# Construir la aplicación
npm run build

# Subir a GitHub
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## 🔍 Paso 7: Verificar el Despliegue

### 7.1 Verificar Vercel
- Visita tu URL de Vercel
- Prueba el endpoint: `https://tu-app.vercel.app/api/proxy`
- Deberías ver una respuesta JSON

### 7.2 Verificar GitHub Pages
- Visita tu URL de GitHub Pages
- Usa el botón "🔍 Diagnóstico"
- Verifica que Google Apps Script esté funcionando

## 🛠️ Solución de Problemas

### Error de CORS
- Verifica que el proxy de Vercel esté configurado correctamente
- Asegúrate de que las variables de entorno estén configuradas

### Error de Google Apps Script
- Verifica que el script tenga permisos para escribir en la planilla
- Asegúrate de que la URL del script sea correcta

### Error de API Key
- Verifica que la API key esté restringida correctamente
- Asegúrate de que Google Sheets API esté habilitada

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Vercel
2. Verifica la consola del navegador
3. Usa el botón de diagnóstico en la aplicación
4. Revisa la configuración de variables de entorno

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Haz cambios en tu código
2. Sube a GitHub
3. Vercel se actualizará automáticamente
4. GitHub Pages se actualizará según tu configuración 