# 🔧 Guía de Google Apps Script - Solución al Error 401

## 🚨 Problema Identificado

El error 401 que estás viendo indica que **Google Sheets API no soporta API Keys para escritura**, solo para lectura. Para escribir en Google Sheets necesitas autenticación OAuth2 o Service Account.

## ✅ Solución: Google Apps Script

He implementado una solución usando **Google Apps Script** que actúa como proxy para manejar la escritura sin problemas de autenticación.

## 🚀 Configuración Paso a Paso

### 1. Crear Google Apps Script

1. Ve a [Google Apps Script](https://script.google.com/)
2. Haz clic en **"Nuevo proyecto"**
3. Cambia el nombre del proyecto a **"Limos Arboleda - Sheets Proxy"**

### 2. Copiar el Código

1. Elimina todo el código existente en el editor
2. Copia y pega el código del archivo `google-apps-script.js` que creé
3. Guarda el proyecto (Ctrl+S)

### 3. Configurar Permisos

1. Haz clic en **"Ejecutar"** → **"doPost"**
2. Google te pedirá autorización
3. Haz clic en **"Revisar permisos"**
4. Selecciona tu cuenta de Google
5. Haz clic en **"Avanzado"** → **"Ir a [Nombre del proyecto] (no seguro)"**
6. Haz clic en **"Permitir"**

### 4. Desplegar como Web App

1. Haz clic en **"Implementar"** → **"Nueva implementación"**
2. Selecciona **"Aplicación web"**
3. Configura:
   - **Descripción**: "Limos Arboleda Sheets Proxy"
   - **Ejecutar como**: "Yo mismo"
   - **Quién tiene acceso**: "Cualquier persona"
4. Haz clic en **"Implementar"**
5. Copia la **URL de la aplicación web**

### 5. Configurar Variables de Entorno

Actualiza tu archivo `.env`:

```bash
# API Key para lectura
REACT_APP_GOOGLE_API_KEY=AIzaSyDgOo8w4Y-YBLmD_w4R0tscQ60JMZXs7xc

# ID de la planilla
REACT_APP_GOOGLE_SHEET_ID=19GUM8wCktmXqTEVQQoC0MRXCJboG5NHpw-XiR-8V4zk

# URL del Google Apps Script (para escritura)
REACT_APP_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbw2gmgiHq8kqtlm8MKpKMxM7RdeKSYvsW1D31AyolTlYBt9_pHkfauRyt6xq6K5XyQMnw/exec
```

## 🔍 Verificar Configuración

### Usar el Validador de Estructura

1. Abre la aplicación
2. Ve al panel de administración (clave: `admin123`)
3. Busca el botón **"🔍 Validador de Estructura de Planilla"**
4. Haz clic para verificar que todo esté configurado correctamente

### Probar Escritura

1. Selecciona un usuario
2. Anótate a una comida
3. Activa el toggle de Google Sheets
4. Haz clic en "Guardar"
5. Verifica que no aparezcan errores 401

## 📋 Estructura de Planilla Requerida

Tu planilla debe tener esta estructura:

```
| A1: (reservada) | B1: Fecha | C1: Comida | D1: MEP | E1: PGG | F1: LMC | etc. |
|-----------------|-----------|------------|---------|---------|---------|------|
| A2: (reservada) | B2: 01/12 | C2: A      | D2: S   | E2: N   | F2: 12  |      |
| A3: (reservada) | B3: 01/12 | C3: C      | D3: R   | E3: S   | F3: V   |      |
```

**Notas importantes:**
- **Columna A**: Reservada (puede tener contenido)
- **Columna B**: Fechas en formato DD/MM
- **Columna C**: Tipo de comida (A = Almuerzo, C = Cena)
- **Columnas D+**: Usuarios con sus iniciales

## 🛠️ Funciones del Google Apps Script

El script incluye las siguientes funciones:

### `updateCell`
- Actualiza una celda específica
- Parámetros: `range` (ej: "D5"), `value`, `sheetName` (opcional)

### `createRow`
- Crea una nueva fila
- Parámetros: `rowData` (array), `sheetName` (opcional)

### `testConnection`
- Prueba la conexión con la planilla
- Retorna información básica

### `validateStructure`
- Valida la estructura de la planilla
- Verifica headers y formato

## 🔒 Seguridad

### Permisos del Google Apps Script

- **Ejecutar como**: Tu cuenta (para acceder a tus planillas)
- **Acceso**: Cualquier persona (para que la app pueda llamarlo)
- **Scope**: Solo acceso a Google Sheets

### Recomendaciones

1. **Revisa regularmente** los logs del Google Apps Script
2. **Monitorea el uso** en Google Cloud Console
3. **Mantén actualizado** el script si hay cambios
4. **Haz respaldos** de tu planilla regularmente

## 🆘 Solución de Problemas

### Error: "Google Apps Script URL no configurada"

**Solución:**
1. Verifica que `REACT_APP_GOOGLE_APPS_SCRIPT_URL` esté en tu `.env`
2. Confirma que la URL sea correcta
3. Asegúrate de que el script esté desplegado

### Error: "No se pudo abrir la planilla"

**Solución:**
1. Verifica que el `REACT_APP_GOOGLE_SHEET_ID` sea correcto
2. Asegúrate de que la planilla sea accesible
3. Confirma que el script tenga permisos

### Error: "Acción no reconocida"

**Solución:**
1. Verifica que el código del Google Apps Script esté completo
2. Confirma que la función `doPost` esté implementada
3. Revisa los logs del script

### Error: "Faltan parámetros"

**Solución:**
1. Verifica que la aplicación esté enviando todos los datos necesarios
2. Confirma que el formato de los datos sea correcto
3. Revisa la consola del navegador para errores

## 📊 Monitoreo

### Logs del Google Apps Script

1. Ve a [Google Apps Script](https://script.google.com/)
2. Abre tu proyecto
3. Ve a **"Ejecuciones"** para ver los logs
4. Revisa **"Registros"** para errores detallados

### Métricas de Uso

- **Requests por día**: Google Apps Script tiene límites
- **Tiempo de respuesta**: Monitorea el rendimiento
- **Errores**: Revisa regularmente los logs

## 🎯 Ventajas de esta Solución

### ✅ Beneficios

- **Sin problemas de autenticación**: Google Apps Script maneja la autenticación
- **Fácil de configurar**: Solo necesitas copiar y pegar código
- **Seguro**: Ejecuta con tus permisos de Google
- **Flexible**: Fácil de modificar y extender
- **Gratuito**: Sin costos adicionales

### ⚠️ Consideraciones

- **Límites de Google Apps Script**: 20,000 requests/día gratis
- **Tiempo de respuesta**: Puede ser ligeramente más lento
- **Dependencia**: Requiere que el script esté activo

## 📝 Notas Importantes

- **Siempre haz respaldos** de tu planilla antes de hacer cambios
- **Prueba en una planilla de desarrollo** antes de usar en producción
- **Mantén actualizado** el código del Google Apps Script
- **Monitorea regularmente** el uso y los errores

---

**¡Con esta configuración, el error 401 debería desaparecer y la escritura en Google Sheets funcionará correctamente!** 