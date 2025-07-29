# 🍽️ Guía de Sincronización con Google Sheets - Limos Arboleda

## 📋 Resumen

El sistema **ya tiene implementada** la funcionalidad para guardar las comidas en Google Sheets. Solo necesitas configurarlo correctamente.

## ✅ Estado Actual

La funcionalidad ya está implementada en:
- ✅ `src/services/googleSheetsService.js` - Servicio completo de Google Sheets
- ✅ `src/App.js` - Función `handleSubmit` que guarda en Google Sheets
- ✅ `src/components/SyncDebugger.js` - Herramienta de diagnóstico
- ✅ Configuración de variables de entorno

## 🚀 Pasos para Activar la Sincronización

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Google Sheets Configuration
REACT_APP_GOOGLE_API_KEY=tu_api_key_aqui
REACT_APP_GOOGLE_SHEET_ID=tu_sheet_id_aqui

# App Configuration
REACT_APP_APP_NAME=Limos Arboleda
REACT_APP_VERSION=1.1.0
```

### 2. Obtener API Key de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**
4. Crea credenciales → API Key
5. Restringe la API Key a:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Tu dominio (ej: `https://gastongadea.github.io/*`)
   - **API restrictions**: Google Sheets API

### 3. Crear la Planilla de Google Sheets

Crea una nueva planilla con esta estructura (columna A reservada):

```
| A1: (vacío) | B1: Fecha | C1: Comida | D1: MEP | E1: PGG | F1: LMC | etc. |
|-------------|-----------|------------|---------|---------|---------|------|
| A2: (vacío) | B2: 01/12 | C2: A      | D2: S   | E2: N   | F2: 12  |      |
| A3: (vacío) | B3: 01/12 | C3: C      | D3: R   | E3: S   | F3: V   |      |
| A4: (vacío) | B4: 02/12 | C4: A      | D4:     | E4:     | F4:     |      |
| A5: (vacío) | B5: 02/12 | C5: C      | D5:     | E5:     | F5:     |      |
```

**Formato requerido:**
- **Columna A**: Reservada (vacía)
- **Columna B**: Fechas en formato DD/MM (header: "Fecha")
- **Columna C**: Tipo de comida (header: "Comida", valores: A = Almuerzo, C = Cena)
- **Columnas D+**: Usuarios con sus iniciales en el header
- **Filas**: Cada fila representa una fecha y tipo de comida específicos

**Nota**: Si tu planilla tiene una hoja llamada "Data", el sistema la detectará automáticamente.

### 4. Obtener el Sheet ID

1. Abre tu planilla de Google Sheets
2. Copia el ID de la URL: `https://docs.google.com/spreadsheets/d/`**`1WrFLSer4NyYDjmuPqvyhagsWfoAr1NkgY7HQyHjF7a8`**`/edit`
3. El ID es la parte resaltada

### 5. Activar la Sincronización en la App

1. Abre la aplicación
2. Busca el toggle **"🌐 Sincronizar con Google Sheets"**
3. Actívalo
4. Verifica que aparezca **"✅ Conectado"**

## 🔧 Verificar la Configuración

### Usar el Debug de Sincronización

1. En la aplicación, busca el botón **"🐛 Debug de Sincronización"**
2. Haz clic para abrir el panel de diagnóstico
3. Verifica que todas las secciones muestren ✅

### Verificar en la Consola

Abre las herramientas de desarrollador (F12) y verifica que no haya errores relacionados con Google Sheets.

## 📊 Cómo Funciona la Sincronización

### Al Guardar Comidas

1. **Usuario selecciona comidas** para diferentes días
2. **Hace clic en "Guardar"** o se activa el auto-guardado
3. **Se guarda en localStorage** (siempre)
4. **Si Google Sheets está activado**:
   - Se conecta a la planilla
   - Busca la fila correspondiente a la fecha y tipo de comida
   - Si no existe, la crea automáticamente
   - Actualiza la celda del usuario con su selección
   - Muestra mensaje de éxito

### Al Cargar Datos

1. **Usuario selecciona sus iniciales**
2. **Si Google Sheets está activado**:
   - Carga datos desde la planilla
   - Sincroniza con localStorage
3. **Si no está activado**:
   - Carga solo desde localStorage

## 🛠️ Solución de Problemas

### Error: "Google Sheets no está configurado"

**Solución:**
1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Asegúrate de que las variables empiecen con `REACT_APP_`
3. Reinicia la aplicación después de cambiar `.env`

### Error: "Error de conexión con Google Sheets API"

**Solución:**
1. Verifica que la API Key sea correcta
2. Confirma que Google Sheets API esté habilitada
3. Revisa las restricciones de la API Key

### Error: "No se encontró el usuario"

**Solución:**
1. Verifica que las iniciales del usuario estén en el header de la planilla
2. Confirma que no haya espacios extra en las iniciales
3. Asegúrate de que el usuario esté en una columna después de la columna B

### Error: "No se encontró la fila para la fecha"

**Solución:**
1. Verifica que las fechas estén en formato DD/MM
2. Confirma que cada fecha tenga dos filas: una para Almuerzo (A) y otra para Cena (C)
3. El sistema creará automáticamente las filas faltantes

## 📱 Uso Diario

### Para Usuarios

1. **Selecciona tus iniciales** en el dropdown
2. **Anótate a las comidas** para los días que quieras
3. **Activa el toggle de Google Sheets** si quieres sincronización
4. **Los datos se guardan automáticamente** en Google Sheets

### Para Administradores

1. **Accede al panel de configuración** (clave: `admin123`)
2. **Usa el diagnóstico de Google Sheets** para verificar la conexión
3. **Monitorea la sincronización** con el debug integrado

## 🔒 Seguridad

### Recomendaciones

1. **Restringe la API Key** a tu dominio específico
2. **Configura límites de cuota** en Google Cloud Console
3. **Revisa regularmente** el acceso a la planilla
4. **Mantén respaldos** de los datos importantes

### Permisos de Planilla

1. **Lectura**: Cualquiera con el enlace
2. **Escritura**: Solo usuarios autorizados o API Key
3. **Auditoría**: Revisa regularmente el acceso

## 📈 Beneficios de la Sincronización

### ✅ Ventajas

- **Datos centralizados** en Google Sheets
- **Acceso desde cualquier lugar** con internet
- **Backup automático** en la nube
- **Colaboración en tiempo real**
- **Análisis avanzado** con herramientas de Google
- **Historial completo** de cambios

### ⚠️ Consideraciones

- **Requiere conexión a internet** para sincronizar
- **Límites de API** de Google (1000 requests/día gratis)
- **Configuración inicial** más compleja
- **Dependencia** de servicios externos

## 🆘 Soporte

Si tienes problemas:

1. **Usa el diagnóstico integrado** (botón 🐛 Debug)
2. **Revisa la consola del navegador** para errores detallados
3. **Verifica la documentación** de Google Sheets API
4. **Contacta al desarrollador** con los logs de error

## 📝 Notas Importantes

- **Variables de entorno**: Solo funcionan en desarrollo local
- **Despliegue**: Para GitHub Pages, usa variables de entorno del servidor
- **Límites**: Google Sheets API tiene límites de cuota
- **Cache**: Los datos se cachean por 5 minutos para mejor rendimiento
- **Backup**: Siempre mantén respaldos locales de tus datos

## 🚨 Error 401 - Problemas de Autenticación

Si recibes el error "Error al crear fila: 401", sigue estos pasos:

### 🔍 Diagnóstico del Error 401

**Causa**: Problema de autenticación/autorización con Google Sheets API

### ✅ Soluciones Paso a Paso

1. **Verificar API Key**:
   - Asegúrate de que la API Key sea correcta
   - Verifica que no tenga espacios extra
   - Confirma que esté activa en Google Cloud Console

2. **Habilitar Google Sheets API**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Selecciona tu proyecto
   - Ve a "APIs & Services" → "Library"
   - Busca "Google Sheets API"
   - Haz clic en "Enable"

3. **Configurar Restricciones de API Key**:
   - Ve a "APIs & Services" → "Credentials"
   - Edita tu API Key
   - En "Application restrictions": "HTTP referrers (web sites)"
   - En "Website restrictions": Agrega tu dominio
   - En "API restrictions": Selecciona "Google Sheets API"

4. **Permisos de Planilla**:
   - Abre tu planilla de Google Sheets
   - Haz clic en "Compartir" (esquina superior derecha)
   - Cambia a "Cualquier persona con el enlace puede editar"
   - O agrega tu email como editor

5. **Verificar Cuota**:
   - Google Sheets API tiene límite de 1000 requests/día gratis
   - Ve a Google Cloud Console → APIs & Services → Quotas
   - Verifica que no hayas excedido el límite

6. **Estructura de Planilla**:
   - Si tu planilla tiene una hoja llamada "Data", el sistema la detectará automáticamente
   - Si no, funcionará con la hoja por defecto

### 🔧 Herramientas de Diagnóstico

Usa el **🔍 Validador de Estructura de Planilla** para verificar:
- Configuración de Google Sheets
- Estructura de tu planilla
- Permisos y acceso
- Errores específicos

---

**¡La funcionalidad ya está implementada! Solo necesitas configurarla correctamente siguiendo esta guía.** 