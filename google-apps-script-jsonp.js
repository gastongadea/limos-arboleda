function doGet(e) {
  try {
    // Obtener parámetros de la URL
    const action = e.parameter.action;
    const sheetId = e.parameter.sheetId;
    const dataParam = e.parameter.data;
    const callback = e.parameter.callback;
    
    // Parsear datos si están presentes
    let data = {};
    if (dataParam) {
      try {
        data = JSON.parse(dataParam);
      } catch (parseError) {
        console.error('Error parseando datos:', parseError);
      }
    }
    
    // Procesar la acción
    let result;
    switch (action) {
      case 'testConnection':
        result = { status: 'success', message: 'Google Apps Script funcionando correctamente', timestamp: new Date().toISOString() };
        break;
        
      case 'updateCell':
        result = updateCell(sheetId, data.range, data.value);
        break;
        
      case 'createRow':
        result = createRow(sheetId, data.rowData, data.sheetName);
        break;
        
      default:
        result = { success: false, error: 'Acción no reconocida: ' + action };
    }
    
    // Si hay callback, usar JSONP
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(result)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Si no hay callback, usar JSON normal
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error en doGet:', error);
    const errorResult = { success: false, error: error.toString() };
    
    if (e.parameter.callback) {
      const jsonpResponse = `${e.parameter.callback}(${JSON.stringify(errorResult)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const sheetId = requestData.sheetId;
    const data = requestData.data || {};
    
    let result;
    switch (action) {
      case 'testConnection':
        result = { status: 'success', message: 'Google Apps Script funcionando correctamente', timestamp: new Date().toISOString() };
        break;
        
      case 'updateCell':
        result = updateCell(sheetId, data.range, data.value);
        break;
        
      case 'createRow':
        result = createRow(sheetId, data.rowData, data.sheetName);
        break;
        
      default:
        result = { success: false, error: 'Acción no reconocida: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error en doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateCell(sheetId, range, value) {
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getActiveSheet();
    
    // Intentar con hoja "Data" si existe
    try {
      const dataSheet = spreadsheet.getSheetByName('Data');
      if (dataSheet) {
        dataSheet.getRange(range).setValue(value);
        return { success: true, message: `Celda ${range} actualizada con valor: ${value}` };
      }
    } catch (sheetError) {
      console.log('Hoja "Data" no encontrada, usando hoja activa');
    }
    
    // Usar hoja activa como fallback
    sheet.getRange(range).setValue(value);
    return { success: true, message: `Celda ${range} actualizada con valor: ${value}` };
    
  } catch (error) {
    console.error('Error actualizando celda:', error);
    return { success: false, error: error.toString() };
  }
}

function createRow(sheetId, rowData, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheet;
    
    if (sheetName) {
      try {
        sheet = spreadsheet.getSheetByName(sheetName);
      } catch (sheetError) {
        console.log(`Hoja "${sheetName}" no encontrada, usando hoja activa`);
        sheet = spreadsheet.getActiveSheet();
      }
    } else {
      sheet = spreadsheet.getActiveSheet();
    }
    
    // Encontrar la última fila con datos
    const lastRow = sheet.getLastRow();
    const targetRow = lastRow + 1;
    
    // Insertar la fila
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, message: `Fila creada en posición ${targetRow}` };
    
  } catch (error) {
    console.error('Error creando fila:', error);
    return { success: false, error: error.toString() };
  }
} 