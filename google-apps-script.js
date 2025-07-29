// Google Apps Script para manejar escritura en Google Sheets
// Este script actúa como proxy para evitar problemas de autenticación

function doPost(e) {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Manejar preflight OPTIONS request
  if (e.parameter.method === 'OPTIONS') {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders(headers);
  }
  try {
    // Parsear los datos de entrada
    const requestData = JSON.parse(e.postData.contents);
    const { action, sheetId, data } = requestData;
    
    // Verificar que tenemos los datos necesarios
    if (!action || !sheetId) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Faltan parámetros requeridos' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    // Obtener la planilla
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    if (!spreadsheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'No se pudo abrir la planilla' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    let result;
    
    // Ejecutar la acción correspondiente
    switch (action) {
      case 'updateCell':
        result = updateCell(spreadsheet, data);
        break;
      case 'createRow':
        result = createRow(spreadsheet, data);
        break;
      case 'testConnection':
        result = testConnection(spreadsheet);
        break;
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'Acción no reconocida: ' + action }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders(headers);
    }
    
    // Retornar resultado exitoso
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('Error en doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Error interno del servidor', 
        details: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// Función para manejar peticiones GET y OPTIONS (CORS)
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: 'Google Apps Script funcionando correctamente',
      timestamp: new Date().toISOString(),
      cors: 'enabled'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// Función para actualizar una celda específica
function updateCell(spreadsheet, data) {
  const { range, value, sheetName } = data;
  
  if (!range || value === undefined) {
    throw new Error('Faltan parámetros: range y value son requeridos');
  }
  
  // Obtener la hoja correcta
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (e) {
      // Si no encuentra la hoja específica, usar la primera
      sheet = spreadsheet.getSheets()[0];
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  // Actualizar la celda
  sheet.getRange(range).setValue(value);
  
  return {
    message: `Celda ${range} actualizada con valor: ${value}`,
    sheetName: sheet.getName()
  };
}

// Función para crear una nueva fila
function createRow(spreadsheet, data) {
  const { rowData, sheetName } = data;
  
  if (!rowData || !Array.isArray(rowData)) {
    throw new Error('rowData debe ser un array');
  }
  
  // Obtener la hoja correcta
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (e) {
      // Si no encuentra la hoja específica, usar la primera
      sheet = spreadsheet.getSheets()[0];
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  // Obtener la última fila con datos
  const lastRow = sheet.getLastRow();
  const targetRow = lastRow + 1;
  
  // Crear el rango para la nueva fila
  const range = sheet.getRange(targetRow, 1, 1, rowData.length);
  
  // Insertar los datos
  range.setValues([rowData]);
  
  return {
    message: `Fila creada en la posición ${targetRow}`,
    rowNumber: targetRow,
    sheetName: sheet.getName(),
    data: rowData
  };
}

// Función para probar la conexión
function testConnection(spreadsheet) {
  return {
    message: 'Conexión exitosa',
    sheetTitle: spreadsheet.getName(),
    sheetId: spreadsheet.getId(),
    sheets: spreadsheet.getSheets().map(sheet => ({
      name: sheet.getName(),
      id: sheet.getSheetId()
    }))
  };
}

// Función para obtener información de la planilla
function getSheetInfo(spreadsheet) {
  const sheets = spreadsheet.getSheets();
  const sheetInfo = sheets.map(sheet => ({
    name: sheet.getName(),
    id: sheet.getSheetId(),
    lastRow: sheet.getLastRow(),
    lastColumn: sheet.getLastColumn()
  }));
  
  return {
    title: spreadsheet.getName(),
    id: spreadsheet.getId(),
    sheets: sheetInfo
  };
}

// Función para validar la estructura de la planilla
function validateStructure(spreadsheet) {
  const sheet = spreadsheet.getSheets()[0]; // Usar la primera hoja
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return {
      valid: false,
      error: 'La planilla está vacía'
    };
  }
  
  const header = data[0];
  const issues = [];
  const recommendations = [];
  
  // Verificar estructura básica
  if (header.length < 4) {
    issues.push('La planilla debe tener al menos 4 columnas');
    recommendations.push('Agregar columnas: A (reservada), B (Fecha), C (Comida), D+ (Usuarios)');
  }
  
  // Verificar headers específicos
  if (header[1] !== 'Fecha') {
    issues.push('La columna B debe contener "Fecha"');
    recommendations.push('Cambiar el header de la columna B a "Fecha"');
  }
  
  if (header[2] !== 'Comida') {
    issues.push('La columna C debe contener "Comida"');
    recommendations.push('Cambiar el header de la columna C a "Comida"');
  }
  
  // Verificar usuarios
  const users = header.slice(3);
  if (users.length === 0) {
    issues.push('No hay usuarios definidos');
    recommendations.push('Agregar iniciales de usuarios en las columnas D en adelante');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations,
    structure: {
      totalColumns: header.length,
      totalRows: data.length,
      users: users.filter(u => u && u.toString().trim() !== '')
    }
  };
}

// Función para limpiar datos de prueba
function cleanupTestData(spreadsheet) {
  const sheet = spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  
  let deletedRows = 0;
  
  // Buscar filas que contengan "TEST" y eliminarlas
  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    if (row.some(cell => cell && cell.toString().includes('TEST'))) {
      sheet.deleteRow(i + 1);
      deletedRows++;
    }
  }
  
  return {
    message: `${deletedRows} filas de prueba eliminadas`,
    deletedRows
  };
} 