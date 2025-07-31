# 🔧 Actualizar Google Apps Script para GitHub Pages

## Problema
La aplicación en GitHub Pages no puede escribir en Google Sheets porque el Google Apps Script actual no tiene headers CORS configurados.

## Solución
Necesitas actualizar tu Google Apps Script con la versión que incluye headers CORS.

## Pasos para actualizar

### 1. Ir a Google Apps Script
1. Ve a [script.google.com](https://script.google.com)
2. Abre tu proyecto de Google Apps Script existente

### 2. Reemplazar el código
1. Selecciona todo el código actual (Ctrl+A)
2. Borra el código existente
3. Copia y pega el contenido del archivo `google-apps-script-cors-enabled.js`

### 3. Guardar y desplegar
1. **Guardar** el proyecto (Ctrl+S)
2. **Implementar** → **Nueva implementación**
3. **Tipo**: Aplicación web
4. **Ejecutar como**: Tú mismo
5. **Quién tiene acceso**: Cualquier persona
6. **Implementar**

### 4. Obtener la nueva URL
1. Copia la nueva URL de implementación
2. Actualiza la variable `REACT_APP_GOOGLE_APPS_SCRIPT_URL` en tu configuración

## Cambios principales en el nuevo script

### Headers CORS agregados:
```javascript
.setHeader('Access-Control-Allow-Origin', '*')
.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
.setHeader('Access-Control-Allow-Headers', 'Content-Type')
```

### Funciones mejoradas:
- `doGet()`: Para pruebas de conexión
- `doPost()`: Para operaciones de escritura
- `updateCell()`: Actualizar celdas específicas
- `createRow()`: Crear nuevas filas
- `testConnection()`: Verificar conectividad

## Verificar que funciona

### 1. Test de conexión
Visita la URL de tu Google Apps Script directamente en el navegador. Deberías ver:
```json
{
  "status": "success",
  "message": "Google Apps Script funcionando correctamente",
  "timestamp": "2025-01-XX..."
}
```

### 2. Test desde la aplicación
1. Ve a tu aplicación en GitHub Pages
2. Usa el botón "Configuración" → "🔧 Google Sheets"
3. Verifica que la conexión sea exitosa

## Si sigues teniendo problemas

### Error de CORS persistente:
1. Verifica que hayas desplegado la nueva versión del script
2. Asegúrate de que la URL de implementación sea la correcta
3. Limpia el cache del navegador

### Error de permisos:
1. Verifica que el script tenga permisos para acceder a tu planilla
2. Asegúrate de que la planilla esté compartida con tu cuenta

### Error de estructura:
1. Verifica que tu planilla tenga la estructura correcta:
   - Columna A: Reservada
   - Columna B: Fecha
   - Columna C: Comida (A/C)
   - Columnas D+: Usuarios

## Notas importantes

⚠️ **Seguridad**: Los headers CORS están configurados para permitir acceso desde cualquier origen (`*`). En un entorno de producción, deberías restringir esto a tu dominio específico.

🔒 **Permisos**: El script necesita permisos para leer y escribir en tu planilla de Google Sheets.

📊 **Estructura**: La planilla debe tener la estructura específica que espera la aplicación.

## Contacto
Si tienes problemas después de seguir estos pasos, revisa los logs del Google Apps Script para más detalles sobre los errores. 