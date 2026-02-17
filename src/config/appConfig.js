// Configuración centralizada de la aplicación Limos Arboleda

export const APP_CONFIG = {
  // Información de la aplicación
  APP_NAME: 'Limos Arboleda',
  APP_VERSION: '1.1.0',
  APP_DESCRIPTION: 'Sistema de inscripción de comidas para Limos Arboleda',
  
  // Configuración de seguridad
  SECURITY: {
    ADMIN_PASSWORD: 'admin123',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    MAX_LOGIN_ATTEMPTS: 3,
  },
  
  // Configuración de datos
  DATA: {
    STORAGE_KEY: 'limos_arboleda_data',
    BACKUP_KEY: 'limos_arboleda_backup',
    AUTO_BACKUP_INTERVAL: 10, // Cada 10 inscripciones
    CLEANUP_DAYS: 90, // Limpiar datos de más de 90 días
    MAX_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB
  },
  
  // Configuración de fechas
  DATES: {
    DEFAULT_DAYS_VIEW: 30,
    SUMMARY_DAYS: 7,
    MAX_DAYS_FORWARD: 365,
    TIMEZONE: 'America/Argentina/Buenos_Aires',
  },
  
  // Configuración de sincronización
  SYNC: {
    TIMEOUT: 10000, // 10 segundos
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 segundo
    AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
  },
  
  // Configuración de UI
  UI: {
    THEME: {
      PRIMARY_COLOR: '#1976d2',
      SECONDARY_COLOR: '#4caf50',
      WARNING_COLOR: '#ff9800',
      ERROR_COLOR: '#f44336',
      SUCCESS_COLOR: '#4caf50',
      INFO_COLOR: '#2196f3',
    },
    ANIMATIONS: {
      ENABLED: true,
      DURATION: 300,
    },
    NOTIFICATIONS: {
      AUTO_HIDE: true,
      HIDE_DELAY: 5000, // 5 segundos
      MAX_VISIBLE: 3,
    },
  },
  
  // Configuración de usuarios
  USERS: {
    INITIALS: [
      'MEP', 'GG', 'IJC', 'MMR', 'LMC', 'PAB', 'JBA', 'IC', 'ELF', 'FIG', 'AS',
      'FAM', 'JOA', 'FMA', 'JPS', 'FEC', 'TA', 'H1', 'H2', 'Invitados', 'Plan'
    ],
    TYPES: {
      RESIDENTE: 'Residente',
      HUESPED: 'Huésped',
      INVITADO: 'Invitado',
      PLAN: 'Plan',
    },
  },
  
  // Configuración de comidas
  MEALS: {
    ALMUERZO: {
      name: 'Almuerzo',
      options: [
        { valor: 'S', label: 'Si' },
        { valor: 'R', label: 'Reg' },
        { valor: 'N', label: 'No' },
        { valor: '12', label: '12' },
        { valor: '12:30', label: '12:30' },
        { valor: 'V', label: 'Vian' },
        { valor: 'San', label: 'San' },
        { valor: 'T', label: 'Tarde' },
        { valor: 'RT', label: 'Reg Tarde' },
      ],
    },
    CENA: {
      name: 'Cena',
      options: [
        { valor: 'S', label: 'Si' },
        { valor: 'R', label: 'Reg' },
        { valor: 'N', label: 'No' },
        { valor: 'V', label: 'Vian' },
        { valor: 'T', label: 'Tarde' },
        { valor: 'RT', label: 'Reg Tarde' },
        { valor: 'VRM', label: 'Vian Reg Mañana' },
      ],
    },
  },
  
  // Configuración de validaciones
  VALIDATION: {
    MIN_INITIALS_LENGTH: 2,
    MAX_INITIALS_LENGTH: 10,
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
    ALLOWED_MEAL_TYPES: ['Almuerzo', 'Cena'],
  },
  
  // Configuración de exportación/importación
  EXPORT: {
    FORMATS: ['json'],
    DEFAULT_FILENAME: 'limos_arboleda_backup',
    COMPRESSION: false,
  },
  
  // Configuración de estadísticas
  STATS: {
    DEFAULT_PERIOD: '7dias',
    PERIODS: {
      '7dias': { label: 'Últimos 7 días', days: 7 },
      '30dias': { label: 'Últimos 30 días', days: 30 },
      'mes': { label: 'Este mes', days: null },
    },
    TOP_LIMIT: 5,
    RECENT_ACTIVITY_LIMIT: 7,
  },
  
  // Configuración de errores
  ERRORS: {
    MESSAGES: {
      INVALID_DATE: 'Fecha inválida',
      INVALID_USER: 'Usuario inválido',
      INVALID_MEAL: 'Tipo de comida inválido',
      INVALID_OPTION: 'Opción inválida',
      STORAGE_ERROR: 'Error de almacenamiento',
      SYNC_ERROR: 'Error de sincronización',
      NETWORK_ERROR: 'Error de conexión',
      PERMISSION_ERROR: 'Error de permisos',
    },
    LOGGING: {
      ENABLED: true,
      LEVEL: 'error', // 'debug', 'info', 'warn', 'error'
    },
  },
  
  // Configuración de desarrollo
  DEVELOPMENT: {
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    MOCK_DATA: false,
  },
};

// Funciones de utilidad para la configuración
export const getConfig = (path) => {
  const keys = path.split('.');
  let value = APP_CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
};

export const setConfig = (path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = APP_CONFIG;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
};

export const validateConfig = () => {
  const errors = [];
  
  // Validar configuración requerida
  if (!APP_CONFIG.APP_NAME) {
    errors.push('APP_NAME es requerido');
  }
  
  if (!APP_CONFIG.SECURITY.ADMIN_PASSWORD) {
    errors.push('ADMIN_PASSWORD es requerido');
  }
  
  if (!APP_CONFIG.USERS.INITIALS || APP_CONFIG.USERS.INITIALS.length === 0) {
    errors.push('INITIALS debe tener al menos un usuario');
  }
  
  if (!APP_CONFIG.MEALS.ALMUERZO.options || APP_CONFIG.MEALS.ALMUERZO.options.length === 0) {
    errors.push('Opciones de almuerzo son requeridas');
  }
  
  if (!APP_CONFIG.MEALS.CENA.options || APP_CONFIG.MEALS.CENA.options.length === 0) {
    errors.push('Opciones de cena son requeridas');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Configuración específica por entorno
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const envConfigs = {
    development: {
      DEBUG_MODE: true,
      LOG_LEVEL: 'debug',
      MOCK_DATA: false,
    },
    production: {
      DEBUG_MODE: false,
      LOG_LEVEL: 'error',
      MOCK_DATA: false,
    },
    test: {
      DEBUG_MODE: true,
      LOG_LEVEL: 'debug',
      MOCK_DATA: true,
    },
  };
  
  return {
    ...APP_CONFIG,
    DEVELOPMENT: {
      ...APP_CONFIG.DEVELOPMENT,
      ...envConfigs[env],
    },
  };
};

export default APP_CONFIG; 