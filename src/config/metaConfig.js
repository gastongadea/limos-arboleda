// Servicio para leer configuración desde meta tags
// Útil para GitHub Pages donde las variables de entorno no están disponibles

class MetaConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const config = {};
    
    // Leer meta tags
    const metaTags = document.querySelectorAll('meta[name^="google-"], meta[name^="app-"]');
    
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name');
      const value = meta.getAttribute('content');
      
      // Convertir nombres de meta tags a variables de entorno
      switch (name) {
        case 'google-api-key':
          config.REACT_APP_GOOGLE_API_KEY = value;
          break;
        case 'google-sheet-id':
          config.REACT_APP_GOOGLE_SHEET_ID = value;
          break;
        case 'google-apps-script-url':
          config.REACT_APP_GOOGLE_APPS_SCRIPT_URL = value;
          break;
        case 'app-name':
          config.REACT_APP_APP_NAME = value;
          break;
        case 'app-version':
          config.REACT_APP_VERSION = value;
          break;
        default:
          // Ignorar meta tags no reconocidos
          break;
      }
    });

    return config;
  }

  get(key) {
    // Prioridad: 1. Variables de entorno reales, 2. Meta tags
    return process.env[key] || this.config[key];
  }

  isConfigured() {
    const apiKey = this.get('REACT_APP_GOOGLE_API_KEY');
    const sheetId = this.get('REACT_APP_GOOGLE_SHEET_ID');
    
    return !!(apiKey && sheetId && apiKey !== 'REACT_APP_GOOGLE_API_KEY' && sheetId !== 'REACT_APP_GOOGLE_SHEET_ID');
  }

  getConfig() {
    return {
      apiKey: this.get('REACT_APP_GOOGLE_API_KEY'),
      sheetId: this.get('REACT_APP_GOOGLE_SHEET_ID'),
      appsScriptUrl: this.get('REACT_APP_GOOGLE_APPS_SCRIPT_URL'),
      appName: this.get('REACT_APP_APP_NAME') || 'Limos Arboleda',
      version: this.get('REACT_APP_VERSION') || '1.1.0'
    };
  }

  // Método para debug
  debug() {
    console.log('🔧 MetaConfig Debug:');
    console.log('Variables de entorno reales:', {
      REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Configurada' : '❌ No configurada',
      REACT_APP_GOOGLE_SHEET_ID: process.env.REACT_APP_GOOGLE_SHEET_ID ? '✅ Configurada' : '❌ No configurada',
      REACT_APP_GOOGLE_APPS_SCRIPT_URL: process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL ? '✅ Configurada' : '❌ No configurada'
    });
    console.log('Meta tags cargados:', this.config);
    console.log('Configuración final:', this.getConfig());
    console.log('¿Está configurado?', this.isConfigured());
  }
}

// Instancia singleton
const metaConfig = new MetaConfig();

export default metaConfig; 