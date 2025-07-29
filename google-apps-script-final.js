// Google Apps Script para Limos Arboleda
// Versión final - sin headers CORS

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Apps Script funcionando correctamente',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Parsear datos de entrada
    const requestData = JSON.parse(e.postData.contents);
    const { action, sheetId, data } = requestData;
    
    console.log('📝 doPost llamado con:', { action, sheetId, data });
    
    // Verificar parámetros
    if (!action || !sheetId) {
      console.log('❌ Faltan parámetros:', { action, sheetId });
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'Faltan parámetros requeridos',
          received: { action, sheetId: !!sheetId }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obtener planilla
    console.log('📊 Abriendo planilla:', sheetId);
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    if (!spreadsheet) {
      console.log('❌ No se pudo abrir la planilla');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'No se pudo abrir la planilla',
          sheetId: sheetId
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('✅ Planilla abierta:', spreadsheet.getName());
    
    // Ejecutar acción
    let result;
    switch (action) {
      case 'updateCell':
        console.log('🔄 Ejecutando updateCell');
        result = updateCell(spreadsheet, data);
        break;
      case 'createRow':
        console.log('🔄 Ejecutando createRow');
        result = createRow(spreadsheet, data);
        break;
      case 'testConnection':
        console.log('🔄 Ejecutando testConnection');
        result = testConnection(spreadsheet);
        break;
      default:
        console.log('❌ Acción no reconocida:', action);
        return ContentService
          .createTextOutput(JSON.stringify({ 
            error: 'Acción no reconocida: ' + action,
            availableActions: ['updateCell', 'createRow', 'testConnection']
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('✅ Resultado:', result);
    
    // Retornar resultado exitoso
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        data: result,
        action: action
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error en doPost:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Error interno del servidor', 
        details: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateCell(spreadsheet, data) {
  const { range, value, sheetName } = data;
  
  console.log('📝 updateCell:', { range, value, sheetName });
  
  if (!range || value === undefined) {
    throw new Error('Faltan parámetros: range y value son requeridos');
  }
  
  // Obtener hoja
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
      console.log('📄 Usando hoja específica:', sheetName);
    } catch (e) {
      sheet = spreadsheet.getSheets()[0];
      console.log('📄 Usando primera hoja (fallback)');
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
    console.log('📄 Usando primera hoja');
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  console.log('📄 Hoja obtenida:', sheet.getName());
  
  // Actualizar celda
  sheet.getRange(range).setValue(value);
  console.log('✅ Celda actualizada:', range, '=', value);
  
  return {
    message: `Celda ${range} actualizada con valor: ${value}`,
    sheetName: sheet.getName(),
    range: range,
    value: value
  };
}

function createRow(spreadsheet, data) {
  const { rowData, sheetName } = data;
  
  console.log('📝 createRow:', { rowData, sheetName });
  
  if (!rowData || !Array.isArray(rowData)) {
    throw new Error('rowData debe ser un array');
  }
  
  // Obtener hoja
  let sheet;
  if (sheetName) {
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
      console.log('📄 Usando hoja específica:', sheetName);
    } catch (e) {
      sheet = spreadsheet.getSheets()[0];
      console.log('📄 Usando primera hoja (fallback)');
    }
  } else {
    sheet = spreadsheet.getSheets()[0];
    console.log('📄 Usando primera hoja');
  }
  
  if (!sheet) {
    throw new Error('No se pudo obtener la hoja');
  }
  
  console.log('📄 Hoja obtenida:', sheet.getName());
  
  // Obtener última fila
  const lastRow = sheet.getLastRow();
  const targetRow = lastRow + 1;
  
  console.log('📊 Última fila:', lastRow, 'Nueva fila:', targetRow);
  
  // Crear rango
  const range = sheet.getRange(targetRow, 1, 1, rowData.length);
  
  // Insertar datos
  range.setValues([rowData]);
  console.log('✅ Fila creada:', targetRow, 'Datos:', rowData);
  
  return {
    message: `Fila creada en la posición ${targetRow}`,
    rowNumber: targetRow,
    sheetName: sheet.getName(),
    data: rowData
  };
}

function testConnection(spreadsheet) {
  console.log('🔗 testConnection');
  
  const result = {
    message: 'Conexión exitosa',
    sheetTitle: spreadsheet.getName(),
    sheetId: spreadsheet.getId(),
    sheets: spreadsheet.getSheets().map(sheet => ({
      name: sheet.getName(),
      id: sheet.getSheetId()
    }))
  };
  
  console.log('✅ Test connection resultado:', result);
  return result;
} 