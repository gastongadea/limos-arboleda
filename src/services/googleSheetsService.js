import envLoader from '../config/envLoader';
import metaConfig from '../config/metaConfig';

// Servicio para conectar con Google Sheets API
class GoogleSheetsService {
  constructor() {
    // Usar MetaConfig como fallback para GitHub Pages
    this.apiKey = envLoader.getEnvVar('REACT_APP_GOOGLE_API_KEY') || metaConfig.get('REACT_APP_GOOGLE_API_KEY');
    this.sheetId = envLoader.getEnvVar('REACT_APP_GOOGLE_SHEET_ID') || metaConfig.get('REACT_APP_GOOGLE_SHEET_ID');
    this.appsScriptUrl = envLoader.getEnvVar('REACT_APP_GOOGLE_APPS_SCRIPT_URL') || metaConfig.get('REACT_APP_GOOGLE_APPS_SCRIPT_URL');
    this.serviceAccountEmail = envLoader.getEnvVar('REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL');
    this.privateKey = envLoader.getEnvVar('REACT_APP_GOOGLE_PRIVATE_KEY');
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos (aumentado)
    this.lastError = null;
    this.connectionStatus = 'unknown'; // 'connected', 'error', 'unknown'
    this.maxRows = 1000; // Limitar a 1000 filas máximo
  }

  // Verificar configuración
  isConfigured() {
    // Para lectura: solo necesitamos API Key y Sheet ID
    // Para escritura: necesitamos Google Apps Script URL
    const readConfigured = !!(this.apiKey && this.sheetId);
    const writeConfigured = !!(this.appsScriptUrl && this.sheetId);
    
    if (!readConfigured) {
      console.warn('Google Sheets no está configurado para lectura. Verifica REACT_APP_GOOGLE_API_KEY y REACT_APP_GOOGLE_SHEET_ID en .env');
    }
    
    if (!writeConfigured) {
      console.warn('Google Sheets no está configurado para escritura. Verifica REACT_APP_GOOGLE_APPS_SCRIPT_URL en .env');
    }
    
    return { read: readConfigured, write: writeConfigured };
  }

  // Verificar si Google Apps Script está funcionando
  async testGoogleAppsScript() {
    try {
      if (!this.appsScriptUrl) {
        return { working: false, error: 'URL no configurada' };
      }

      // Determinar si estamos en desarrollo o producción
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isGitHubPages = window.location.hostname.includes('github.io');
      
      // DEBUG: Log de depuración para entender el entorno
      console.log('🔍 DEBUG - testGoogleAppsScript - Entorno detectado:');
      console.log('  - NODE_ENV:', process.env.NODE_ENV);
      console.log('  - hostname:', window.location.hostname);
      console.log('  - isDevelopment:', isDevelopment);
      console.log('  - isLocalhost:', isLocalhost);
      console.log('  - isGitHubPages:', isGitHubPages);
      
      // En desarrollo local: intentar proxy local primero
      if (isDevelopment && isLocalhost) {
        try {
          console.log('🔄 [VERSIÓN ACTUALIZADA] testGoogleAppsScript - Intentando proxy local...');
          const proxyUrl = 'http://localhost:3001/proxy/google-apps-script';
          const proxyResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: this.appsScriptUrl,
              data: {
                action: 'testConnection',
                sheetId: this.sheetId,
                data: {}
              }
            })
          });

          if (proxyResponse.ok) {
            const result = await proxyResponse.json();
            return { working: true, data: result };
          }
        } catch (proxyError) {
          console.log('Proxy local no disponible, usando llamada directa...');
        }
      }
      
      // En GitHub Pages o producción: usar petición GET para evitar CORS
      console.log('🔄 [VERSIÓN FINAL] testGoogleAppsScript - Llamando directamente a Google Apps Script con GET...');
      
      // Convertir datos a parámetros de URL para petición GET
      const params = new URLSearchParams({
        action: 'testConnection',
        sheetId: this.sheetId,
        data: JSON.stringify({})
      });
      
      const url = `${this.appsScriptUrl}?${params.toString()}`;
      console.log('URL de petición test:', url);
      
             // Usar JSONP para evitar CORS completamente
       return new Promise((resolve, reject) => {
         const script = document.createElement('script');
         const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
         let isCompleted = false;
         
         // Función de limpieza segura
         const cleanup = () => {
           if (isCompleted) return;
           isCompleted = true;
           
           try {
             if (script.parentNode) {
               document.head.removeChild(script);
             }
           } catch (e) {
             console.warn('Error limpiando script JSONP:', e);
           }
           
           try {
             delete window[callbackName];
           } catch (e) {
             console.warn('Error eliminando callback JSONP:', e);
           }
         };
         
         // Crear función de callback global
         window[callbackName] = function(data) {
           cleanup();
           clearTimeout(timeout);
           resolve({ working: true, data: data });
         };
         
         // Configurar timeout
         const timeout = setTimeout(() => {
           cleanup();
           reject(new Error('Timeout en petición JSONP'));
         }, 10000);
         
         // Crear URL con callback
         const jsonpUrl = `${url}&callback=${callbackName}`;
         script.src = jsonpUrl;
         script.onerror = () => {
           cleanup();
           clearTimeout(timeout);
           reject(new Error('Error cargando script JSONP'));
         };
         
         document.head.appendChild(script);
       });
    } catch (error) {
      return { working: false, error: error.message };
    }
  }

  // Obtener token de acceso para Service Account
  async getAccessToken() {
    try {
      if (!this.serviceAccountEmail || !this.privateKey) {
        throw new Error('Service Account no configurado');
      }

      // Crear JWT para Service Account
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: this.serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hora
        iat: now
      };

      // Codificar JWT (simplificado - en producción usar librería)
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      
      // Nota: En un entorno real, necesitarías una librería para firmar JWT
      // Por ahora, usaremos un enfoque alternativo
      
      console.log('Service Account configurado, pero JWT signing requiere librería adicional');
      throw new Error('JWT signing no implementado en frontend');
      
    } catch (error) {
      console.error('Error obteniendo access token:', error);
      throw error;
    }
  }

  // Método alternativo: usar Google Apps Script como proxy
  async callGoogleAppsScript(action, data) {
    // Determinar si estamos en desarrollo o producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // DEBUG: Log de depuración para entender el entorno
    console.log('🔍 DEBUG - Entorno detectado:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - hostname:', window.location.hostname);
    console.log('  - isDevelopment:', isDevelopment);
    console.log('  - isLocalhost:', isLocalhost);
    console.log('  - isGitHubPages:', isGitHubPages);
    
    try {
      if (!this.appsScriptUrl) {
        throw new Error('Google Apps Script URL no configurada');
      }

      console.log('🔄 Llamando a Google Apps Script...');
      console.log('Action:', action);
      console.log('Data:', data);
      
      // En desarrollo local: intentar proxy local primero
      if (isDevelopment && isLocalhost) {
        try {
          console.log('🔄 [VERSIÓN ACTUALIZADA] Intentando proxy local...');
          const proxyUrl = 'http://localhost:3001/proxy/google-apps-script';
          const proxyResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: this.appsScriptUrl,
              data: {
                action,
                sheetId: this.sheetId,
                data
              }
            })
          });

          if (proxyResponse.ok) {
            const result = await proxyResponse.json();
            console.log('✅ Respuesta del proxy local:', result);
            
            if (result.success === false) {
              throw new Error(`Error en Apps Script: ${result.error || 'Error desconocido'}`);
            }
            
            return result;
          }
        } catch (proxyError) {
          console.log('Proxy local no disponible, usando llamada directa...');
        }
      }
      
      // En GitHub Pages o producción: usar petición GET para evitar CORS
      console.log('🔄 [VERSIÓN FINAL] Llamando directamente a Google Apps Script con GET...');
      
      // Convertir datos a parámetros de URL para petición GET
      const params = new URLSearchParams({
        action: action,
        sheetId: this.sheetId,
        data: JSON.stringify(data)
      });
      
      const url = `${this.appsScriptUrl}?${params.toString()}`;
      console.log('URL de petición:', url);
      
             // Usar JSONP para evitar CORS completamente
       return new Promise((resolve, reject) => {
         const script = document.createElement('script');
         const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
         let isCompleted = false;
         
         // Función de limpieza segura
         const cleanup = () => {
           if (isCompleted) return;
           isCompleted = true;
           
           try {
             if (script.parentNode) {
               document.head.removeChild(script);
             }
           } catch (e) {
             console.warn('Error limpiando script JSONP:', e);
           }
           
           try {
             delete window[callbackName];
           } catch (e) {
             console.warn('Error eliminando callback JSONP:', e);
           }
         };
         
         // Crear función de callback global
         window[callbackName] = function(data) {
           cleanup();
           clearTimeout(timeout);
           console.log('✅ Respuesta directa de Google Apps Script:', data);
           
           // Verificar si la operación fue exitosa
           if (data.success === false) {
             reject(new Error(`Error en Apps Script: ${data.error || 'Error desconocido'}`));
           } else {
             resolve(data);
           }
         };
         
         // Configurar timeout
         const timeout = setTimeout(() => {
           cleanup();
           reject(new Error('Timeout en petición JSONP'));
         }, 10000);
         
         // Crear URL con callback
         const jsonpUrl = `${url}&callback=${callbackName}`;
         script.src = jsonpUrl;
         script.onerror = () => {
           cleanup();
           clearTimeout(timeout);
           reject(new Error('Error cargando script JSONP'));
         };
         
         document.head.appendChild(script);
       });
      
    } catch (error) {
      console.error('Error llamando Google Apps Script:', error);
      
      // Si hay error de CORS en GitHub Pages, mostrar mensaje específico
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        if (isGitHubPages) {
          console.warn('💡 Error de CORS en GitHub Pages. Verifica que el Google Apps Script esté configurado para permitir peticiones desde tu dominio.');
        } else if (isDevelopment && isLocalhost) {
          console.warn('💡 Sugerencia: Ejecuta el proxy server con: node proxy-server.js');
        }
      }
      
      throw error;
    }
  }

  // Test de conexión
  async testConnection() {
    try {
      if (!this.isConfigured().read) {
        throw new Error('Google Sheets no está configurado para lectura');
      }

      const response = await fetch(
        `${this.baseUrl}/${this.sheetId}?key=${this.apiKey}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de conexión: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      this.connectionStatus = 'connected';
      this.lastError = null;
      
      return {
        connected: true,
        sheetTitle: data.properties.title,
        sheetId: data.spreadsheetId
      };
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      console.error('Error en test de conexión:', error);
      throw error;
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      lastError: this.lastError,
      configured: this.isConfigured()
    };
  }

  // Obtener datos de la planilla con cache
  async getSheetData(forceRefresh = false) {
    try {
      if (!this.isConfigured().read) {
        throw new Error('Google Sheets no está configurado para lectura');
      }

      // Verificar cache
      const cacheKey = 'sheetData';
      const cached = this.cache.get(cacheKey);
      
      if (!forceRefresh && cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('Usando datos en cache de Google Sheets');
        return cached.data;
      }

      console.log('Obteniendo datos frescos de Google Sheets...');
      
      // Intentar obtener datos de la hoja "Data" específicamente, limitando filas
      let response = await fetch(
        `${this.baseUrl}/${this.sheetId}/values/Data!A1:Z${this.maxRows}?key=${this.apiKey}`
      );
      
      // Si falla, intentar sin especificar hoja
      if (!response.ok) {
        console.log('Intentando sin especificar hoja...');
        response = await fetch(
          `${this.baseUrl}/${this.sheetId}/values/A1:Z${this.maxRows}?key=${this.apiKey}`
        );
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al obtener datos: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const sheetData = data.values || [];
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: sheetData,
        timestamp: Date.now()
      });
      
      this.connectionStatus = 'connected';
      this.lastError = null;
      
      console.log(`Datos obtenidos: ${sheetData.length} filas`);
      return sheetData;
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      console.error('Error al obtener datos de Google Sheets:', error);
      throw error;
    }
  }

  // Obtener datos optimizados para un rango de fechas específico
  async getSheetDataForDates(startDate, endDate, forceRefresh = false) {
    try {
      if (!this.isConfigured().read) {
        throw new Error('Google Sheets no está configurado para lectura');
      }

      // Verificar cache específico para fechas
      const cacheKey = `sheetData_${startDate}_${endDate}`;
      const cached = this.cache.get(cacheKey);
      
      if (!forceRefresh && cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('Usando datos en cache para fechas específicas');
        return cached.data;
      }

      console.log(`Obteniendo datos para fechas: ${startDate} - ${endDate}`);
      
      // Obtener todos los datos y filtrar por fechas
      const allData = await this.getSheetData(forceRefresh);
      
      // Filtrar solo las filas que están en el rango de fechas
      const filteredData = allData.filter((row, index) => {
        if (index === 0) return true; // Siempre incluir headers
        
        const fechaCell = row[1]; // Columna B: Fecha
        if (!fechaCell) return false;
        
        const fecha = this.parseDate(fechaCell);
        if (!fecha) return false;
        
        return fecha >= startDate && fecha <= endDate;
      });
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: filteredData,
        timestamp: Date.now()
      });
      
      console.log(`Datos filtrados: ${filteredData.length} filas de ${allData.length} total`);
      return filteredData;
    } catch (error) {
      console.error('Error al obtener datos para fechas específicas:', error);
      throw error;
    }
  }

  // Limpiar cache
  clearCache() {
    this.cache.clear();
    console.log('Cache de Google Sheets limpiado');
  }

  // Actualizar una celda específica usando Google Apps Script
  async updateCell(range, value) {
    try {
      if (!this.isConfigured().write) {
        throw new Error('Google Sheets no está configurado para escritura');
      }

      console.log(`Actualizando celda ${range} con valor: ${value}`);
      
      // Usar Google Apps Script para escritura
      const result = await this.callGoogleAppsScript('updateCell', {
        range,
        value
      });
      
      // Limpiar cache después de actualizar
      this.clearCache();
      
      console.log(`Celda ${range} actualizada exitosamente`);
      return result;
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error.message;
      console.error('Error al actualizar celda:', error);
      throw error;
    }
  }

  // Parsear fecha de diferentes formatos
  parseDate(dateString) {
    if (!dateString) return null;
    
    const str = dateString.toString().trim();
    
    // Formato DD/M/YY o DD/MM/YYYY
    if (str.includes('/') && str.split('/').length === 3) {
      const [day, month, year] = str.split('/');
      // Si el año tiene 2 dígitos, asumir 20xx
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    // Formato YYYY-MM-DD
    if (str.includes('-') && str.split('-').length === 3) {
      return str;
    }
    
    return null;
  }

  // Buscar fila por fecha y tipo de comida
  findRowByDateAndType(sheetData, targetDate, comidaType) {
    if (!sheetData || sheetData.length < 2) {
      console.warn('Datos de planilla insuficientes para buscar fecha y tipo');
      return null;
    }
    
    // Convertir fecha ISO a formato DD/M/YY para comparar con la planilla
    const [year, month, day] = targetDate.split('-').map(Number);
    const targetDateFormatted = `${day}/${month}/${year.toString().slice(-2)}`;
    
    for (let row = 1; row < sheetData.length; row++) {
      const rowData = sheetData[row];
      if (!rowData || rowData.length < 3) continue; // Necesitamos al menos 3 columnas
      
      // En tu estructura: Columna A (índice 0) está reservada, fechas en B (índice 1), tipo en C (índice 2)
      const fechaCell = rowData[1]; // Columna B: Fecha
      const tipoCell = rowData[2];  // Columna C: Comida (A/C)
      
      if (!fechaCell || !tipoCell) continue;
      
      const fechaCellStr = fechaCell.toString().trim();
      const tipo = tipoCell.toString().trim().toUpperCase();
      
      if (fechaCellStr === targetDateFormatted && tipo === comidaType) {
        return {
          row: row,
          data: rowData,
          fecha: targetDate,
          tipo: tipo
        };
      }
    }
    
    return null;
  }

  // Buscar columna de usuario por iniciales
  findUserColumn(sheetData, iniciales) {
    if (!sheetData || sheetData.length < 1) {
      console.warn('Datos de planilla insuficientes para buscar usuario');
      return null;
    }
    
    const headerRow = sheetData[0]; // Primera fila: títulos
    
    // En tu estructura: Columna A reservada, B fecha, C tipo, D+ usuarios
    for (let col = 3; col < headerRow.length; col++) { // Empezar desde columna D (índice 3)
      const userCell = headerRow[col];
      if (userCell && userCell.toString().toUpperCase() === iniciales.toUpperCase()) {
        return {
          col: col,
          letter: this.numberToColumnLetter(col + 1),
          iniciales: userCell.toString()
        };
      }
    }
    
    return null;
  }

  // Crear fila para una fecha y tipo de comida usando Google Apps Script
  async createRowForDate(date, comidaType) {
    try {
      // Convertir fecha ISO a formato DD/M/YY
      const [year, month, day] = date.split('-').map(Number);
      const dateFormatted = `${day}/${month}/${year.toString().slice(-2)}`;
      
      // Obtener datos actuales para determinar el número de columnas
      const sheetData = await this.getSheetData();
      const numColumns = sheetData[0] ? sheetData[0].length : 4; // Mínimo 4 columnas (A reservada, B fecha, C tipo, D+ usuarios)
      
      // Crear fila con estructura correcta: [reservada, fecha, tipo, usuarios...]
      const newRow = ['', dateFormatted, comidaType]; // Columna A reservada, fecha en B, tipo en C
      for (let i = 3; i < numColumns; i++) {
        newRow.push(''); // Celdas vacías para cada usuario (desde columna D)
      }
      
      // Usar Google Apps Script para crear la fila
      const result = await this.callGoogleAppsScript('createRow', {
        rowData: newRow,
        sheetName: 'Data' // Intentar con hoja "Data" primero
      });
      
      // Limpiar cache para que se recarguen los datos
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error al crear fila:', error);
      throw error;
    }
  }

  // Guardar inscripción en Google Sheets (versión optimizada - sin verificación redundante)
  async saveInscripcion(inscripcion) {
    try {
      // Obtener datos actuales de la planilla
      const sheetData = await this.getSheetData();
      
      // Determinar tipo de comida (A = Almuerzo, C = Cena)
      const comidaType = inscripcion.comida === 'Almuerzo' ? 'A' : 'C';
      
      // Buscar fila por fecha y tipo de comida
      let rowInfo = this.findRowByDateAndType(sheetData, inscripcion.fecha, comidaType);
      
      // Si no existe la fila, crearla automáticamente
      if (!rowInfo) {
        await this.createRowForDate(inscripcion.fecha, comidaType);
        
        // Recargar datos y buscar la fila nuevamente
        const newSheetData = await this.getSheetData(true); // forceRefresh = true
        rowInfo = this.findRowByDateAndType(newSheetData, inscripcion.fecha, comidaType);
        
        if (!rowInfo) {
          throw new Error(`No se pudo crear la fila para la fecha ${inscripcion.fecha} y tipo ${comidaType}`);
        }
      }
      
      // Buscar columna del usuario
      const userCol = this.findUserColumn(sheetData, inscripcion.iniciales);
      if (!userCol) {
        throw new Error(`No se encontró el usuario ${inscripcion.iniciales}`);
      }
      
      // Convertir coordenadas a formato A1
      const range = `${userCol.letter}${rowInfo.row + 1}`;
      
      // Actualizar la celda directamente (la verificación ya se hizo en handleSubmit)
      await this.updateCell(range, inscripcion.opcion);
      
      return true;
    } catch (error) {
      console.error('Error al guardar inscripción en Google Sheets:', error);
      throw error;
    }
  }

  // Convertir número de columna a letra (1=A, 2=B, etc.)
  numberToColumnLetter(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  // Verificar y crear fechas faltantes
  async ensureDatesExist(dias) {
    try {
      const sheetData = await this.getSheetData();
      const fechasFaltantes = [];
      
      // Verificar cada fecha
      dias.forEach(dia => {
        const almuerzoRow = this.findRowByDateAndType(sheetData, dia, 'A');
        const cenaRow = this.findRowByDateAndType(sheetData, dia, 'C');
        
        if (!almuerzoRow) {
          fechasFaltantes.push({ fecha: dia, tipo: 'A' });
        }
        if (!cenaRow) {
          fechasFaltantes.push({ fecha: dia, tipo: 'C' });
        }
      });
      
      // Crear fechas faltantes
      if (fechasFaltantes.length > 0) {
        for (const fechaInfo of fechasFaltantes) {
          await this.createRowForDate(fechaInfo.fecha, fechaInfo.tipo);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar fechas:', error);
      throw error;
    }
  }

  // Obtener inscripciones de un usuario
  async getUserInscripciones(iniciales, dias) {
    try {
      // Asegurar que todas las fechas existan
      await this.ensureDatesExist(dias);
      
      // Optimización: usar datos filtrados por fechas si hay muchas fechas
      let sheetData;
      if (dias.length > 7) {
        // Si hay más de 7 días, filtrar por rango de fechas
        const dates = dias.map(d => new Date(d));
        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));
        sheetData = await this.getSheetDataForDates(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], true);
      } else {
        // Si son pocos días, usar cache normal
        sheetData = await this.getSheetData(true);
      }
      
      const userCol = this.findUserColumn(sheetData, iniciales);
      
      if (!userCol) {
        return {};
      }
      
      const inscripciones = {};
      
      dias.forEach(dia => {
        inscripciones[dia] = { Almuerzo: '', Cena: '' };
        
        // Buscar almuerzo (tipo A)
        const almuerzoRow = this.findRowByDateAndType(sheetData, dia, 'A');
        if (almuerzoRow && almuerzoRow.data[userCol.col]) {
          inscripciones[dia].Almuerzo = almuerzoRow.data[userCol.col] || '';
        }
        
        // Buscar cena (tipo C)
        const cenaRow = this.findRowByDateAndType(sheetData, dia, 'C');
        if (cenaRow && cenaRow.data[userCol.col]) {
          inscripciones[dia].Cena = cenaRow.data[userCol.col] || '';
        }
      });
      
      return inscripciones;
    } catch (error) {
      console.error('Error al obtener inscripciones del usuario:', error);
      return {};
    }
  }

  // Obtener información de la planilla
  async getSheetInfo() {
    try {
      if (!this.isConfigured().read) {
        throw new Error('Google Sheets no está configurado para lectura');
      }

      const response = await fetch(
        `${this.baseUrl}/${this.sheetId}?key=${this.apiKey}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener información: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return {
        title: data.properties.title,
        sheetId: data.spreadsheetId,
        sheets: data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId
        }))
      };
    } catch (error) {
      console.error('Error al obtener información de la planilla:', error);
      throw error;
    }
  }

  // Crear o verificar estructura de la planilla
  async ensureSheetStructure() {
    try {
      const sheetData = await this.getSheetData();
      
      if (sheetData.length < 1) {
        console.warn('La planilla está vacía');
        return false;
      }
      
      const headerRow = sheetData[0];
      
      console.log('Estructura de la planilla:');
      console.log('Headers:', headerRow);
      
      // Verificar estructura básica
      if (headerRow.length < 4) {
        console.warn('La planilla debe tener al menos 4 columnas: A (reservada), B (Fecha), C (Comida), y al menos un usuario');
        return false;
      }
      
      if (headerRow[1] !== 'Fecha' || headerRow[2] !== 'Comida') {
        console.warn('Las columnas B y C deben ser "Fecha" y "Comida" respectivamente');
        return false;
      }
      
      // Verificar que hay usuarios
      const usuarios = headerRow.slice(3);
      if (usuarios.length === 0) {
        console.warn('No se encontraron usuarios en la planilla');
        return false;
      }
      
      console.log('Usuarios encontrados:', usuarios);
      
      return true;
    } catch (error) {
      console.error('Error verificando estructura de la planilla:', error);
      return false;
    }
  }

  // Obtener lista de usuarios de la planilla
  async getUsers() {
    try {
      const sheetData = await this.getSheetData();
      if (!sheetData || sheetData.length < 1) {
        return [];
      }
      
      const headerRow = sheetData[0];
      // Los usuarios están desde la columna D en adelante (índice 3+)
      return headerRow.slice(3).filter(user => user && user.trim() !== '');
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  }

  // Obtener fechas disponibles
  async getAvailableDates() {
    try {
      const sheetData = await this.getSheetData();
      if (!sheetData || sheetData.length < 2) {
        return [];
      }
      
      const dates = new Set();
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (row && row.length > 1 && row[1]) { // Fecha en columna B
          dates.add(row[1]);
        }
      }
      
      return Array.from(dates).sort();
    } catch (error) {
      console.error('Error al obtener fechas disponibles:', error);
      return [];
    }
  }
}

const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService; 