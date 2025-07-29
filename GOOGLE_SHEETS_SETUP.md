# 🔧 Configuración de Google Sheets - Limos Arboleda

Esta guía te ayudará a configurar la integración con Google Sheets para sincronizar los datos de inscripciones de comidas.

## 📋 Requisitos Previos

1. **Cuenta de Google** con acceso a Google Sheets
2. **Proyecto en Google Cloud Console** (gratuito)
3. **Google Sheets API habilitada**

## 🚀 Paso a Paso

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **ID del proyecto** (lo necesitarás más adelante)

### 2. Habilitar Google Sheets API

1. En Google Cloud Console, ve a **"APIs & Services" > "Library"**
2. Busca **"Google Sheets API"**
3. Haz clic en **"Enable"**

### 3. Crear Credenciales (API Key)

1. Ve a **"APIs & Services" > "Credentials"**
2. Haz clic en **"Create Credentials" > "API Key"**
3. Se generará una API Key
4. **IMPORTANTE**: Haz clic en **"Restrict Key"** y configura:
   - **Application restrictions**: "HTTP referrers (web sites)"
   - **Website restrictions**: Agrega tu dominio (ej: `https://gastongadea.github.io/*`)
   - **API restrictions**: Selecciona "Google Sheets API"

### 4. Crear la Planilla de Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com/)
2. Crea una nueva planilla
3. **Estructura requerida**:
   ```
   A1: Fecha    | B1: Comida | C1: MEP | D1: PGG | E1: LMC | etc.
   A2: 01/12    | B2: A      | C2: S   | D2: N   | E2: 12  |
   A3: 01/12    | B3: C      | C3: R   | D3: S   | E3: V   |
   A4: 02/12    | B4: A      | C4:     | D4:     | E4:     |
   A5: 02/12    | B5: C      | C5:     | D5:     | E5:     |
   ```

4. **Formato de fechas**: DD/MM o DD/MM/YYYY
5. **Tipos de comida**: A = Almuerzo, C = Cena
6. **Usuarios**: Una columna por usuario con sus iniciales en el header
7. **Filas de datos**: Cada fila representa una fecha y tipo de comida específicos

### 5. Obtener el Sheet ID

1. Abre tu planilla de Google Sheets
2. En la URL, copia el ID:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
3. El **SHEET_ID** es la parte entre `/d/` y `/edit`

### 6. Configurar Variables de Entorno

1. En la raíz de tu proyecto, crea un archivo `.env`:
   ```bash
   # Google Sheets API Configuration
   REACT_APP_GOOGLE_API_KEY=tu_api_key_aqui
   REACT_APP_GOOGLE_SHEET_ID=tu_sheet_id_aqui
   
   # Opcional: Configuración adicional
   REACT_APP_APP_NAME=Limos Arboleda
   REACT_APP_VERSION=1.1.0
   ```

2. **IMPORTANTE**: 
   - Las variables deben empezar con `REACT_APP_`
   - No uses comillas alrededor de los valores
   - No dejes espacios alrededor del `=`

### 7. Configurar Permisos de la Planilla

1. Abre tu planilla de Google Sheets
2. Haz clic en **"Share"** (Compartir)
3. Cambia a **"Anyone with the link can view"**
4. O agrega la cuenta de servicio de tu API Key como editor

## 🔍 Verificar la Configuración

### Usando el Diagnóstico Integrado

1. Ejecuta la aplicación: `npm start`
2. Haz clic en el botón **"🔧 Google Sheets"**
3. El diagnóstico verificará:
   - ✅ Configuración de variables de entorno
   - ✅ Conexión con Google Sheets API
   - ✅ Acceso a la planilla
   - ✅ Estructura de datos correcta

### Verificación Manual

1. **Verificar API Key**:
   ```bash
   curl "https://sheets.googleapis.com/v4/spreadsheets/[SHEET_ID]?key=[API_KEY]"
   ```

2. **Verificar datos**:
   ```bash
   curl "https://sheets.googleapis.com/v4/spreadsheets/[SHEET_ID]/values/A:Z?key=[API_KEY]"
   ```

## 🛠️ Solución de Problemas

### Error: "Google Sheets no está configurado"

**Causa**: Variables de entorno no configuradas
**Solución**:
1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Asegúrate de que las variables empiecen con `REACT_APP_`
3. Reinicia la aplicación después de cambiar `.env`

### Error: "Error de conexión con Google Sheets API"

**Causa**: API Key inválida o restringida
**Solución**:
1. Verifica que la API Key sea correcta
2. Confirma que Google Sheets API esté habilitada
3. Revisa las restricciones de la API Key

### Error: "No se encontró la fila para la fecha y tipo"

**Causa**: Formato de fecha incorrecto o estructura de planilla incorrecta
**Solución**:
1. Verifica que las fechas estén en formato DD/MM o DD/MM/YYYY
2. Asegúrate de que las fechas estén en la columna A (primera columna)
3. Confirma que los tipos de comida estén en la columna B (segunda columna)
4. Verifica que cada fecha tenga dos filas: una para Almuerzo (A) y otra para Cena (C)

### Error: "No se encontró el usuario"

**Causa**: Usuario no existe en la planilla
**Solución**:
1. Verifica que las iniciales del usuario estén en el header (primera fila)
2. Confirma que no haya espacios extra en las iniciales
3. Asegúrate de que el usuario esté en una columna después de la columna B (Comida)

### Error: "Error al actualizar celda"

**Causa**: Permisos insuficientes
**Solución**:
1. Verifica que la planilla sea editable
2. Confirma que la API Key tenga permisos de escritura
3. Revisa que no haya restricciones de acceso

## 📊 Estructura de Datos Esperada

```
| Fecha | Comida | MEP | PGG | LMC | etc. |
|-------|--------|-----|-----|-----|------|
| 01/12 | A      | S   | N   | 12  |      |
| 01/12 | C      | R   | S   | V   |      |
| 02/12 | A      |     |     |     |      |
| 02/12 | C      |     |     |     |      |
```

### Explicación:
- **Columna A**: Fechas en formato DD/MM
- **Columna B**: Tipo de comida (A = Almuerzo, C = Cena)
- **Columnas C+**: Usuarios con sus inscripciones
- **Filas**: Cada fila representa una fecha y tipo de comida específicos

## 🔒 Seguridad

### Restricciones Recomendadas para API Key:

1. **Application restrictions**: HTTP referrers
2. **Website restrictions**: Solo tu dominio
3. **API restrictions**: Solo Google Sheets API
4. **Cuota**: Configura límites diarios

### Permisos de Planilla:

1. **Lectura**: Cualquiera con el enlace
2. **Escritura**: Solo usuarios autorizados o API Key
3. **Auditoría**: Revisa regularmente el acceso

## 📱 Uso en la Aplicación

### Sincronización Automática:

1. Activa el toggle **"🌐 Sincronizar con Google Sheets"**
2. Los datos se sincronizarán automáticamente
3. El estado se muestra con ✅ Conectado o ❌ Error

### Funcionalidades:

- **Lectura**: Carga datos existentes de la planilla
- **Escritura**: Guarda nuevas inscripciones
- **Sincronización**: Mantiene datos actualizados
- **Cache**: Mejora el rendimiento con cache local

## 🆘 Soporte

Si tienes problemas:

1. Usa el **diagnóstico integrado** (botón 🔧 Google Sheets)
2. Revisa la **consola del navegador** para errores detallados
3. Verifica la **documentación de Google Sheets API**
4. Contacta al desarrollador con los logs de error

## 📝 Notas Importantes

- **Variables de entorno**: Solo funcionan en desarrollo local
- **Despliegue**: Para GitHub Pages, usa variables de entorno del servidor
- **Límites**: Google Sheets API tiene límites de cuota
- **Cache**: Los datos se cachean por 5 minutos para mejor rendimiento
- **Backup**: Siempre mantén respaldos locales de tus datos 