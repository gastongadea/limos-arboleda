import React, { useState, useEffect } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const GoogleSheetsTest = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetInfo, setSheetInfo] = useState(null);
  // const [sheetStructure, setSheetStructure] = useState(null); // Variable no utilizada

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
  }, [isOpen]);

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);
    
    const results = {
      configuration: false,
      connection: false,
      sheetInfo: false,
      structure: false,
      errors: []
    };

    try {
      // Test 1: Configuración
      console.log('=== Test 1: Verificando configuración ===');
      results.configuration = googleSheetsService.isConfigured();
      if (!results.configuration) {
        results.errors.push('Google Sheets no está configurado. Verifica las variables de entorno.');
      } else {
        // Test adicional: Verificar formato de API Key
        const apiKey = googleSheetsService.apiKey;
        if (apiKey && !apiKey.startsWith('AIza')) {
          results.errors.push('La API Key no tiene el formato correcto. Debe empezar con "AIza"');
        }
        
        // Test adicional: Verificar formato de Sheet ID
        const sheetId = googleSheetsService.sheetId;
        if (sheetId && sheetId.length < 20) {
          results.errors.push('El Sheet ID parece ser muy corto. Verifica que sea correcto');
        }
      }

      // Test 2: Conexión
      if (results.configuration) {
        console.log('=== Test 2: Probando conexión ===');
        try {
          results.connection = await googleSheetsService.testConnection();
          if (!results.connection) {
            const status = googleSheetsService.getConnectionStatus();
            results.errors.push(`Error de conexión con Google Sheets API: ${status.lastError || 'Error desconocido'}`);
          }
        } catch (error) {
          results.connection = false;
          results.errors.push(`Error de conexión: ${error.message}`);
        }
      }

      // Test 3: Información de la planilla
      if (results.connection) {
        console.log('=== Test 3: Obteniendo información de la planilla ===');
        try {
          const info = await googleSheetsService.getSheetInfo();
          setSheetInfo(info);
          results.sheetInfo = true;
        } catch (error) {
          results.errors.push(`Error obteniendo información: ${error.message}`);
        }
      }

      // Test 4: Estructura de la planilla
      if (results.connection) {
        console.log('=== Test 4: Verificando estructura de la planilla ===');
        try {
          const structure = await googleSheetsService.ensureSheetStructure();
          // setSheetStructure(structure); // Variable no utilizada
          results.structure = structure;
          if (!structure) {
            results.errors.push('La planilla no tiene la estructura esperada');
          } else {
            // Obtener información adicional
            try {
              const users = await googleSheetsService.getUsers();
              const dates = await googleSheetsService.getAvailableDates();
              results.users = users;
              results.dates = dates;
            } catch (error) {
              console.warn('No se pudieron obtener usuarios o fechas:', error);
            }
          }
        } catch (error) {
          results.errors.push(`Error verificando estructura: ${error.message}`);
        }
      }

      // Test 5: Obtener datos de muestra
      if (results.connection) {
        console.log('=== Test 5: Obteniendo datos de muestra ===');
        try {
          const sampleData = await googleSheetsService.getSheetData(true);
          results.sampleData = sampleData.slice(0, 5); // Primeras 5 filas
        } catch (error) {
          results.errors.push(`Error obteniendo datos: ${error.message}`);
        }
      }

    } catch (error) {
      results.errors.push(`Error general: ${error.message}`);
    } finally {
      setTestResults(results);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status) => {
    return status ? '#4caf50' : '#f44336';
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>🔧 Diagnóstico de Google Sheets</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div>Ejecutando diagnósticos...</div>
          </div>
        ) : testResults ? (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Resumen de resultados */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ margin: '0 0 12px 0' }}>📊 Resumen de Diagnóstico</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{getStatusIcon(testResults.configuration)}</span>
                  <span>Configuración</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{getStatusIcon(testResults.connection)}</span>
                  <span>Conexión</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{getStatusIcon(testResults.sheetInfo)}</span>
                  <span>Información</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{getStatusIcon(testResults.structure)}</span>
                  <span>Estructura</span>
                </div>
              </div>
            </div>

            {/* Información de la planilla */}
            {sheetInfo && (
              <div style={{ 
                background: '#e3f2fd', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>📋 Información de la Planilla</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Título:</strong> {sheetInfo.title}</div>
                  <div><strong>Última modificación:</strong> {new Date(sheetInfo.lastModified).toLocaleString('es-AR')}</div>
                  <div><strong>Hojas:</strong> {sheetInfo.sheets.length}</div>
                  {sheetInfo.sheets.map((sheet, index) => (
                    <div key={index} style={{ marginLeft: 16 }}>
                      • {sheet.title} (ID: {sheet.sheetId})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado de conexión */}
            <div style={{ 
              background: '#f9f9f9', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ margin: '0 0 12px 0' }}>🔗 Estado de Conexión</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <strong>API Key configurada:</strong> {googleSheetsService.apiKey ? '✅ Sí' : '❌ No'}
                </div>
                <div>
                  <strong>Sheet ID configurado:</strong> {googleSheetsService.sheetId ? '✅ Sí' : '❌ No'}
                </div>
                <div>
                  <strong>Estado:</strong> 
                  <span style={{ 
                    color: getStatusColor(testResults.connection),
                    fontWeight: 'bold',
                    marginLeft: 8
                  }}>
                    {testResults.connection ? 'Conectado' : 'Error de conexión'}
                  </span>
                </div>
                {googleSheetsService.lastError && (
                  <div style={{ color: '#f44336' }}>
                    <strong>Último error:</strong> {googleSheetsService.lastError}
                  </div>
                )}
              </div>
            </div>

            {/* Datos de muestra */}
            {testResults.sampleData && (
              <div style={{ 
                background: '#f9f9f9', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ margin: '0 0 12px 0' }}>📄 Datos de Muestra (Primeras 5 filas)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#1976d2', color: 'white' }}>
                        {testResults.sampleData[0]?.map((cell, index) => (
                          <th key={index} style={{ padding: '4px 8px', border: '1px solid #ccc' }}>
                            {index === 0 ? 'Fecha' : index === 1 ? 'Comida' : `Usuario ${index - 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.sampleData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ 
                              padding: '4px 8px', 
                              border: '1px solid #ccc',
                              background: rowIndex === 0 ? '#e3f2fd' : 'white',
                              fontWeight: cellIndex === 1 && cell === 'A' ? 'bold' : 'normal',
                              color: cellIndex === 1 && cell === 'A' ? '#1976d2' : 
                                     cellIndex === 1 && cell === 'C' ? '#f57c00' : 'inherit'
                            }}>
                              {cell || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Información adicional */}
            {(testResults.users || testResults.dates) && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>📊 Información de la Planilla</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {testResults.users && (
                    <div>
                      <strong>👥 Usuarios encontrados ({testResults.users.length}):</strong>
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {testResults.users.map((user, index) => (
                          <span key={index} style={{
                            background: '#4caf50',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '12px'
                          }}>
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {testResults.dates && (
                    <div>
                      <strong>📅 Fechas disponibles ({testResults.dates.length}):</strong>
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {testResults.dates.slice(0, 10).map((date, index) => (
                          <span key={index} style={{
                            background: '#2196f3',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '12px'
                          }}>
                            {new Date(date).toLocaleDateString('es-AR')}
                          </span>
                        ))}
                        {testResults.dates.length > 10 && (
                          <span style={{
                            background: '#666',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '12px'
                          }}>
                            +{testResults.dates.length - 10} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Errores */}
            {testResults.errors.length > 0 && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcdd2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>⚠️ Errores Encontrados</h3>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {testResults.errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: 4, color: '#d32f2f' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            <div style={{ 
              background: '#e8f5e8', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #c8e6c9'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>💡 Recomendaciones</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Verifica que el archivo <code>.env</code> esté en la raíz del proyecto</li>
                <li>Asegúrate de que las variables <code>REACT_APP_GOOGLE_API_KEY</code> y <code>REACT_APP_GOOGLE_SHEET_ID</code> estén configuradas</li>
                <li>Verifica que la API Key tenga permisos para Google Sheets</li>
                <li>Confirma que el Sheet ID sea correcto y la planilla sea accesible</li>
                <li>Reinicia la aplicación después de cambiar las variables de entorno</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            No se pudieron ejecutar los diagnósticos
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={runTests}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Ejecutando...' : '🔄 Ejecutar Diagnósticos'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsTest; 