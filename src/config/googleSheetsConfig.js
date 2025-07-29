// Configuración de Google Sheets
// Este archivo lee las variables de entorno de manera más directa

const googleSheetsConfig = {
  // Intentar leer las variables de entorno de diferentes maneras
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 
          window.REACT_APP_GOOGLE_API_KEY || 
          null,
  
  sheetId: process.env.REACT_APP_GOOGLE_SHEET_ID || 
           window.REACT_APP_GOOGLE_SHEET_ID || 
           null,
  
  // Configuración adicional
  appName: process.env.REACT_APP_APP_NAME || 'Limos Arboleda',
  version: process.env.REACT_APP_VERSION || '1.1.0',
  
  // Verificar si está configurado
  isConfigured() {
    return !!(this.apiKey && this.sheetId);
  },
  
  // Obtener estado de configuración
  getConfigStatus() {
    return {
      apiKey: !!this.apiKey,
      sheetId: !!this.sheetId,
      configured: this.isConfigured(),
      nodeEnv: process.env.NODE_ENV,
      apiKeyPreview: this.apiKey ? 
        `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 
        null,
      sheetIdPreview: this.sheetId ? 
        `${this.sheetId.substring(0, 10)}...${this.sheetId.substring(this.sheetId.length - 4)}` : 
        null
    };
  },
  
  // Debug: mostrar información en consola
  debug() {
    console.log('=== GOOGLE SHEETS CONFIG DEBUG ===');
    console.log('API Key configurada:', !!this.apiKey);
    console.log('Sheet ID configurado:', !!this.sheetId);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Todas las variables de entorno:', process.env);
    
    if (this.apiKey) {
      console.log('API Key preview:', this.apiKeyPreview);
    }
    if (this.sheetId) {
      console.log('Sheet ID preview:', this.sheetIdPreview);
    }
  }
};

// Ejecutar debug automáticamente en desarrollo
if (process.env.NODE_ENV === 'development') {
  googleSheetsConfig.debug();
}

export default googleSheetsConfig; 