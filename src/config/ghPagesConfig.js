// Configuración específica para GitHub Pages
// Usa el proxy de Vercel para evitar problemas de CORS

const GH_PAGES_CONFIG = {
  // URL del proxy de Vercel (debes desplegar el proxy en Vercel)
  VERCEL_PROXY_URL: 'https://tu-app.vercel.app/api/proxy',
  
  // Configuración de Google Sheets (configurar en variables de entorno de Vercel)
  GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,
  GOOGLE_SHEET_ID: process.env.REACT_APP_GOOGLE_SHEET_ID,
  GOOGLE_APPS_SCRIPT_URL: process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL,
  
  // Configuración de la aplicación
  APP_NAME: 'Comidas de Arboleda',
  VERSION: '1.0.0',
  
  // Configuración de cache
  CACHE_TIMEOUT: 10 * 60 * 1000, // 10 minutos
  
  // Configuración de sincronización
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Función para obtener la URL del proxy según el entorno
export const getProxyUrl = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment && isLocalhost) {
    return 'http://localhost:3001/proxy/google-apps-script';
  }
  
  // En producción, usar el proxy de Vercel
  return GH_PAGES_CONFIG.VERCEL_PROXY_URL;
};

// Función para verificar si estamos en GitHub Pages
export const isGitHubPages = () => {
  return window.location.hostname.includes('github.io') || 
         window.location.hostname.includes('pages.dev') ||
         window.location.hostname.includes('vercel.app');
};

// Función para obtener configuración según el entorno
export const getConfig = () => {
  return {
    ...GH_PAGES_CONFIG,
    isDevelopment: process.env.NODE_ENV === 'development',
    isGitHubPages: isGitHubPages(),
    proxyUrl: getProxyUrl(),
  };
};

export default GH_PAGES_CONFIG; 