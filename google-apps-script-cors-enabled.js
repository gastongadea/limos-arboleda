// Google Apps Script para Limos Arboleda
// Versión con CORS habilitado para GitHub Pages

function doGet(e) {
  try {
    // Si hay parámetros, procesar como petición de datos
    if (e.parameter.action) {
      return processRequest(e.parameter);
    }
    
    // Si no hay parámetros, responder con estado de funcionamiento
    const response = ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Apps Script funcionando correctamente',
      timestamp: new Date().toISOString()
    }));
    
    response.setMimeType(ContentService.MimeType.JSON);
    return response;
  } catch (error) {
    console.error('❌ Error en doGet:', error);
    
    const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.toString()
    }));
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    return errorResponse;
  }
}

function doPost(e) {
  try {
    // Parsear datos de entrada
    const requestData = JSON.parse(e.postData.contents);
    return processRequest(requestData);
  } catch (error) {
    console.error('❌ Error en doPost:', error);
    
    const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.toString()
    }));
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    return errorResponse;
  }
}

function processRequest(requestData) {
  try {
    // Extraer parámetros (pueden venir de GET o POST)
    const action = requestData.action;
    const sheetId = requestData.sheetId;
    let data = requestData.data;
    
    // Si data viene como string (desde GET), parsearlo
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (parseError) {
        console.log('⚠️ No se pudo parsear data como JSON:', data);
        data = {};
      }
    }
    
    console.log('📝 Procesando petición:', { action, sheetId, data });
    
    // Verificar parámetros
    if (!action || !sheetId) {
      console.log('❌ Faltan parámetros:', { action, sheetId });
      const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
        error: 'Faltan parámetros requeridos',
        received: { action, sheetId: !!sheetId }
      }));
      errorResponse.setMimeType(ContentService.MimeType.JSON);
      return errorResponse;
    }
    
    // Obtener planilla
    console.log('📊 Abriendo planilla:', sheetId);
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    if (!spreadsheet) {
      console.log('❌ No se pudo abrir la planilla');
      const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
        error: 'No se pudo abrir la planilla',
        sheetId: sheetId
      }));
      errorResponse.setMimeType(ContentService.MimeType.JSON);
      return errorResponse;
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
        const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
          error: 'Acción no reconocida: ' + action,
          availableActions: ['updateCell', 'createRow', 'testConnection']
        }));
        errorResponse.setMimeType(ContentService.MimeType.JSON);
        return errorResponse;
    }
    
    console.log('✅ Resultado:', result);
    
    // Retornar resultado exitoso
    const successResponse = ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      data: result,
      action: action
    }));
    successResponse.setMimeType(ContentService.MimeType.JSON);
    return successResponse;
      
  } catch (error) {
    console.error('❌ Error procesando petición:', error);
    
    const errorResponse = ContentService.createTextOutput(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.toString()
    }));
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    return errorResponse;
  }
}

function updateCell(spreadsheet, data) {
  const { range, value, sheetName } = data;
  
  console.log('📝 updateCell:', { range, value, sheetName });
  
  try {
    // Intentar con hoja específica primero
    let sheet = spreadsheet.getSheetByName(sheetName || 'Data');
    if (!sheet) {
      // Si no existe, usar la primera hoja
      sheet = spreadsheet.getSheets()[0];
      console.log('⚠️ Usando primera hoja:', sheet.getName());
    }
    
    // Actualizar la celda
    sheet.getRange(range).setValue(value);
    
    console.log(`✅ Celda ${range} actualizada con valor: ${value}`);
    
    return {
      success: true,
      range: range,
      value: value,
      sheetName: sheet.getName()
    };
    
  } catch (error) {
    console.error('❌ Error actualizando celda:', error);
    throw new Error(`Error actualizando celda ${range}: ${error.message}`);
  }
}

function createRow(spreadsheet, data) {
  const { rowData, sheetName } = data;
  
  console.log('📝 createRow:', { rowData, sheetName });
  
  try {
    // Intentar con hoja específica primero
    let sheet = spreadsheet.getSheetByName(sheetName || 'Data');
    if (!sheet) {
      // Si no existe, usar la primera hoja
      sheet = spreadsheet.getSheets()[0];
      console.log('⚠️ Usando primera hoja:', sheet.getName());
    }
    
    // Agregar la fila al final
    const lastRow = sheet.getLastRow();
    const targetRow = lastRow + 1;
    
    // Insertar la fila
    if (rowData && rowData.length > 0) {
      const range = sheet.getRange(targetRow, 1, 1, rowData.length);
      range.setValues([rowData]);
    }
    
    console.log(`✅ Fila creada en posición ${targetRow}`);
    
    return {
      success: true,
      rowNumber: targetRow,
      rowData: rowData,
      sheetName: sheet.getName()
    };
    
  } catch (error) {
    console.error('❌ Error creando fila:', error);
    throw new Error(`Error creando fila: ${error.message}`);
  }
}

function testConnection(spreadsheet) {
  console.log('🔍 Test de conexión iniciado');
  
  try {
    const sheetName = spreadsheet.getName();
    const sheets = spreadsheet.getSheets();
    
    console.log('✅ Conexión exitosa');
    
    return {
      success: true,
      spreadsheetName: sheetName,
      sheetsCount: sheets.length,
      sheets: sheets.map(sheet => ({
        name: sheet.getName(),
        id: sheet.getSheetId()
      })),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en test de conexión:', error);
    throw new Error(`Error en test de conexión: ${error.message}`);
  }
} 