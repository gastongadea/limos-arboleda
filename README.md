# 🍽️ Limos Arboleda - Sistema de Inscripción de Comidas

Sistema de inscripción de comidas para Limos Arboleda - **Versión Frontend Only v1.1.0**

## 🌟 Características

- **Frontend Only**: Funciona completamente en el navegador sin necesidad de backend
- **Almacenamiento Local**: Los datos se guardan en el localStorage del navegador
- **🌐 Sincronización con Google Sheets**: Guarda y sincroniza datos con planillas de Google
- **Interfaz Intuitiva**: Diseño limpio y fácil de usar con animaciones suaves
- **Gestión de Datos**: Exportar/importar datos para respaldo con validaciones
- **Estadísticas Avanzadas**: Panel completo de estadísticas y análisis
- **Auto-guardado**: Guardado automático de cambios
- **Notificaciones**: Sistema de notificaciones con diferentes tipos
- **Validaciones Mejoradas**: Validación robusta de datos y entrada
- **Backup Automático**: Respaldo automático cada 10 inscripciones
- **Responsive**: Funciona en dispositivos móviles y desktop
- **GitHub Pages**: Desplegado automáticamente en GitHub Pages
- **🔧 Herramientas de Diagnóstico**: Debug y pruebas de sincronización integradas

## 🚀 Demo en Vivo

**🌐 [Ver aplicación](https://limos-arboleda.vercel.app/)** (el link de GitHub Pages redirige acá)

## 📋 Funcionalidades

### Para Usuarios
- ✅ Seleccionar iniciales de usuario
- ✅ Anotarse a almuerzo y cena para los próximos 30 días
- ✅ Ver resumen de comensales
- ✅ Diferentes opciones según el tipo de comida
- ✅ Interfaz especial para "Plan" e "Invitados" (números)
- ✅ Auto-guardado de cambios
- ✅ Notificaciones de estado
- ✅ Validación en tiempo real
- ✅ 🌐 Sincronización automática con Google Sheets
- ✅ 📱 Acceso desde cualquier dispositivo con internet

### Para Administradores
- 🔐 Panel de configuración (clave: `admin123`)
- 📊 Gestión de datos (exportar/importar)
- 📈 Estadísticas avanzadas con filtros
- 🗑️ Limpiar todos los datos
- 🔄 Backup automático y restauración
- 📋 Información del sistema
- 🔧 Diagnóstico de Google Sheets
- 🌐 Configuración de sincronización
- 🧪 Probador de conexión con Google Sheets
- 🐛 Debug de sincronización en tiempo real

## 🛠️ Tecnologías

- **React 18** - Framework de frontend
- **React Modal** - Modales para configuración
- **LocalStorage** - Almacenamiento local
- **Google Sheets API** - Sincronización con planillas
- **GitHub Pages** - Hosting gratuito
- **gh-pages** - Despliegue automático

## 📦 Instalación y Uso

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/gastongadea/limos-arboleda.git
cd limos-arboleda

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
```

### Despliegue

```bash
# Construir para producción
npm run build

# Desplegar a GitHub Pages
npm run deploy
```

## 📁 Estructura del Proyecto

```
limos-arboleda/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── StatsComponent.js         # Componente de estadísticas
│   ├── config/
│   │   └── appConfig.js              # Configuración centralizada
│   ├── services/
│   │   ├── localStorageService.js    # Servicio de almacenamiento local
│   │   └── googleSheetsService.js    # Servicio de Google Sheets
│   ├── utils/
│   │   └── dateUtils.js              # Utilidades de fechas mejoradas
│   ├── App.js                        # Componente principal mejorado
│   ├── App.css                       # Estilos CSS modernos
│   ├── index.js                      # Punto de entrada
│   └── index.css                     # Estilos globales
├── package.json
└── README.md
```

## 🔧 Configuración

### Variables de Entorno
Para usar la sincronización con Google Sheets, crear un archivo `.env` en la raíz del proyecto:

```bash
# Google Sheets API Configuration
REACT_APP_GOOGLE_API_KEY=your_google_api_key_here
REACT_APP_GOOGLE_SHEET_ID=your_google_sheet_id_here
```

### Configuración de Google Sheets API

**📖 Guía Completa**: Ver [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) para instrucciones detalladas.

**Resumen rápido**:
1. **Crear proyecto** en [Google Cloud Console](https://console.cloud.google.com/)
2. **Habilitar Google Sheets API**
3. **Crear API Key** con restricciones apropiadas
4. **Crear planilla** con estructura específica
5. **Configurar .env** con API Key y Sheet ID
6. **Usar diagnóstico integrado** para verificar configuración

### Personalización
- **Iniciales**: Editar el array `inicialesLista` en `App.js`
- **Opciones de comida**: Modificar `opcionesAlmuerzo` y `opcionesCena` en `App.js`
- **Clave de admin**: Cambiar `CLAVE_ADMIN` en `App.js`

## 📊 Gestión de Datos

### Exportar Datos
- Hacer clic en "Datos" → "📤 Exportar Datos"
- Se descarga un archivo JSON con todos los datos

### Importar Datos
- Hacer clic en "Datos" → Seleccionar archivo JSON → "📥 Importar Datos"
- Los datos se restauran desde el archivo

### Respaldo Automático
Los datos se guardan automáticamente en el localStorage del navegador.

## 🌐 Despliegue en GitHub Pages

El proyecto está configurado para desplegarse automáticamente en GitHub Pages:

1. **Configuración**: El `package.json` incluye la URL de GitHub Pages
2. **Scripts**: `predeploy` y `deploy` para automatizar el proceso
3. **Workflow**: GitHub Actions para despliegue automático

### URL de Producción
```
https://limos-arboleda.vercel.app/
```

## 🔒 Seguridad

- **Datos Locales**: Los datos solo se almacenan en el navegador del usuario
- **Sin Backend**: No hay servidor que pueda ser comprometido
- **Clave de Admin**: Protección básica para funciones administrativas
- **Validaciones**: Validación robusta de entrada de datos
- **Backup Automático**: Respaldo automático para prevenir pérdida de datos
- **Migración de Datos**: Actualización automática de versiones de datos

## 📱 Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Gastón Gadea**
- GitHub: [@gastongadea](https://github.com/gastongadea)

## 🆕 Novedades v1.1.0

### ✨ Nuevas Funcionalidades
- **Panel de Estadísticas**: Análisis completo con filtros por período y usuario
- **Auto-guardado**: Guardado automático después de 2 segundos sin cambios
- **Sistema de Notificaciones**: Notificaciones con diferentes tipos (info, success, error, warning)
- **Validaciones Mejoradas**: Validación en tiempo real de entrada de datos
- **Backup Automático**: Respaldo automático cada 10 inscripciones
- **Migración de Datos**: Actualización automática entre versiones
- **Integración Google Sheets**: Sincronización completa con planillas de Google
- **Diagnóstico Integrado**: Herramienta para verificar la configuración

### 🔧 Mejoras Técnicas
- **Código Optimizado**: Uso de useCallback y mejor manejo de estados
- **Manejo de Errores**: Sistema robusto de manejo y recuperación de errores
- **Configuración Centralizada**: Archivo de configuración unificado
- **Estilos Modernos**: CSS con variables, animaciones y diseño responsive
- **Utilidades de Fechas**: Funciones avanzadas para manejo de fechas

### 🎨 Mejoras de UX/UI
- **Animaciones Suaves**: Transiciones y efectos visuales mejorados
- **Feedback Visual**: Mejor respuesta visual a las acciones del usuario
- **Interfaz Responsive**: Mejor adaptación a diferentes tamaños de pantalla
- **Accesibilidad**: Mejoras en navegación por teclado y focus visible

## 🌐 Sincronización con Google Sheets

El sistema incluye sincronización completa con Google Sheets para almacenar y compartir datos entre usuarios.

### 🚀 Configuración Rápida

1. **Crear planilla de Google Sheets** con la estructura requerida
2. **Configurar API Key** de Google Cloud Console
3. **Activar sincronización** en la aplicación
4. **¡Listo!** Los datos se sincronizan automáticamente

### 📋 Estructura de Planilla Requerida

```
| Fecha | Comida | MEP | PGG | LMC | etc. |
|-------|--------|-----|-----|-----|------|
| 01/12 | A      | S   | N   | 12  |      |
| 01/12 | C      | R   | S   | V   |      |
| 02/12 | A      |     |     |     |      |
| 02/12 | C      |     |     |     |      |
```

### 🔧 Herramientas de Diagnóstico

- **🐛 Debug de Sincronización**: Analiza el estado de la sincronización
- **🧪 Probador de Google Sheets**: Prueba la conexión y configuración
- **📊 Estado en Tiempo Real**: Monitorea el estado de la conexión

### 📖 Documentación Completa

Para instrucciones detalladas, ver:
- [GUIA_GOOGLE_SHEETS.md](GUIA_GOOGLE_SHEETS.md) - Guía completa de configuración
- [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) - Documentación técnica

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisar los [Issues](https://github.com/gastongadea/limos-arboleda/issues) existentes
2. Crear un nuevo Issue con detalles del problema
3. Contactar al autor

---

**✅ Nota**: Esta versión incluye sincronización con Google Sheets para compartir datos entre usuarios. Los datos se almacenan tanto localmente como en la nube para máxima seguridad.
