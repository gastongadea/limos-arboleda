// Google Apps Script para Limos Arboleda
// Versión corregida con sintaxis correcta para CORS

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'success',
    message: 'Google Apps Script funcionando correctamente',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  }));
  
  // Configurar headers CORS usando la sintaxis correcta
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // Aplicar headers usando la sintaxis correcta
  for (const [key, value] of Object.entries(headers)) {
    output.addHeader(key, value);
  }
  
  return output;
}

function doPost(e) {
  try {
    // Parsear datos de entrada
    const requestData = JSON.parse(e.postData.contents);
    const { action, sheetId, data } = requestData;
    
    // Verificar parámetros
    if (!action || !sheetId) {
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify({ 
        error: 'Faltan parámetros requeridos',
        received: { action, sheetId: !!sheetId }
      }));
      
      // Agregar headers CORS
      output.addHeader('Access-Control-Allow-Origin', '*');
      output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return output;
    }
    
    // Obtener planilla
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    if (!spreadsheet) {
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify({ 
        error: 'No se pudo abrir la planilla',
        sheetId: sheetId
      }));
      
      // Agregar headers CORS
      output.addHeader('Access-Control-Allow-Origin', '*');
      output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return output;
    }
    
    // Ejecutar acción
    let result;
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
        const output = ContentService.createTextOutput();
        output.setMimeType(ContentService.MimeType.JSON);
        output.setContent(JSON.stringify({ 
          error: 'Acción no reconocida: ' + action,
          availableActions: ['updateCell', 'createRow', 'testConnection']
        }));
        
        // Agregar headers CORS
        output.addHeader('Access-Control-Allow-Origin', '*');
        output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return output;
    }
    
    // Retornar resultado exitoso
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ 
      success: true, 
      data: result,
      action: action
    }));
    
    // Agregar headers CORS
    output.addHeader('Access-Control-Allow-Origin', '*');
    output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
      
  } catch (error) {
    console.error('Error en doPost:', error);
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.toString(),
      stack: error.stack
    }));
    
    // Agregar headers CORS
    output.addHeader('Access-Control-Allow-Origin', '*');
    output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
  }
}

function updateCell(spreadsheet, data) {
  const { range, value, sheetName } = data;
  
  if (!range || value === undefined) {
    throw new Error('Faltan parámetros: range y value son requeridos');
  }
  
  // Obtener hoja
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (e) {
      sheet = spreadsheet.getSheets()[0];
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  // Actualizar celda
  sheet.getRange(range).setValue(value);
  
  return {
    message: `Celda ${range} actualizada con valor: ${value}`,
    sheetName: sheet.getName(),
    range: range,
    value: value
  };
}

function createRow(spreadsheet, data) {
  const { rowData, sheetName } = data;
  
  if (!rowData || !Array.isArray(rowData)) {
    throw new Error('rowData debe ser un array');
  }
  
  // Obtener hoja
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (e) {
      sheet = spreadsheet.getSheets()[0];
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  // Obtener última fila
  const lastRow = sheet.getLastRow();
  const targetRow = lastRow + 1;
  
  // Crear rango
  const range = sheet.getRange(targetRow, 1, 1, rowData.length);
  
  // Insertar datos
  range.setValues([rowData]);
  
  return {
    message: `Fila creada en la posición ${targetRow}`,
    rowNumber: targetRow,
    sheetName: sheet.getName(),
    data: rowData
  };
}

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