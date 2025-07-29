import React, { useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const GoogleSheetsAPITest = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const runAPITests = async () => {
    setLoading(true);
    setTestResults(null);
    
    const results = {
      apiKeyTest: false,
      sheetAccessTest: false,
      permissionsTest: false,
      errors: [],
      details: {}
    };

    try {
      // Test 1: Verificar API Key directamente
      setCurrentTest('Verificando API Key...');
      console.log('=== Test 1: Verificando API Key ===');
      
      const apiKey = googleSheetsService.apiKey;
      const sheetId = googleSheetsService.sheetId;
      
      if (!apiKey) {
        results.errors.push('API Key no encontrada');
      } else if (!apiKey.startsWith('AIza')) {
        results.errors.push('API Key no tiene formato válido (debe empezar con AIza)');
      } else {
        results.apiKeyTest = true;
        results.details.apiKey = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`;
      }

      // Test 2: Probar acceso básico a la planilla
      if (results.apiKeyTest) {
        setCurrentTest('Probando acceso a la planilla...');
        console.log('=== Test 2: Probando acceso a la planilla ===');
        
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`
          );
          
          if (response.ok) {
            const data = await response.json();
            results.sheetAccessTest = true;
            results.details.sheetInfo = {
              title: data.properties.title,
              sheets: data.sheets.length,
              lastModified: data.properties.modifiedTime
            };
            console.log('✅ Acceso a planilla exitoso:', data.properties.title);
          } else {
            const errorData = await response.text();
            console.error('❌ Error de acceso:', response.status, errorData);
            
            if (response.status === 403) {
              results.errors.push('Error 403: Sin permisos. Verifica que la API Key tenga acceso a Google Sheets');
            } else if (response.status === 404) {
              results.errors.push('Error 404: Planilla no encontrada. Verifica el Sheet ID');
            } else {
              results.errors.push(`Error ${response.status}: ${errorData}`);
            }
          }
        } catch (error) {
          console.error('❌ Error de red:', error);
          results.errors.push(`Error de red: ${error.message}`);
        }
      }

      // Test 3: Probar lectura de datos
      if (results.sheetAccessTest) {
        setCurrentTest('Probando lectura de datos...');
        console.log('=== Test 3: Probando lectura de datos ===');
        
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z10?key=${apiKey}`
          );
          
          if (response.ok) {
            const data = await response.json();
            results.permissionsTest = true;
            results.details.dataTest = {
              rows: data.values ? data.values.length : 0,
              columns: data.values && data.values[0] ? data.values[0].length : 0,
              sampleData: data.values ? data.values.slice(0, 3) : []
            };
            console.log('✅ Lectura de datos exitosa');
          } else {
            const errorData = await response.text();
            console.error('❌ Error de lectura:', response.status, errorData);
            results.errors.push(`Error de lectura: ${response.status} - ${errorData}`);
          }
        } catch (error) {
          console.error('❌ Error de lectura:', error);
          results.errors.push(`Error de lectura: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('❌ Error general:', error);
      results.errors.push(`Error general: ${error.message}`);
    } finally {
      setTestResults(results);
      setLoading(false);
      setCurrentTest('');
    }
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
      zIndex: 10001,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>🔍 Test de API Google Sheets</h2>
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
            <div style={{ marginBottom: 16 }}>Ejecutando tests de API...</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{currentTest}</div>
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
              <h3 style={{ margin: '0 0 12px 0' }}>📊 Resultados de Tests de API</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.apiKeyTest ? '✅' : '❌'}</span>
                  <span>API Key</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.sheetAccessTest ? '✅' : '❌'}</span>
                  <span>Acceso Planilla</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.permissionsTest ? '✅' : '❌'}</span>
                  <span>Lectura Datos</span>
                </div>
              </div>
            </div>

            {/* Detalles de la planilla */}
            {testResults.details.sheetInfo && (
              <div style={{ 
                background: '#e3f2fd', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>📋 Información de la Planilla</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Título:</strong> {testResults.details.sheetInfo.title}</div>
                  <div><strong>Hojas:</strong> {testResults.details.sheetInfo.sheets}</div>
                  <div><strong>Última modificación:</strong> {new Date(testResults.details.sheetInfo.lastModified).toLocaleString('es-AR')}</div>
                </div>
              </div>
            )}

            {/* Test de datos */}
            {testResults.details.dataTest && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>📄 Test de Lectura de Datos</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Filas leídas:</strong> {testResults.details.dataTest.rows}</div>
                  <div><strong>Columnas leídas:</strong> {testResults.details.dataTest.columns}</div>
                  {testResults.details.dataTest.sampleData.length > 0 && (
                    <div>
                      <strong>Datos de muestra:</strong>
                      <div style={{ marginTop: 8, fontSize: '12px', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                        {testResults.details.dataTest.sampleData.map((row, index) => (
                          <div key={index} style={{ marginBottom: 4 }}>
                            Fila {index + 1}: {row.join(' | ')}
                          </div>
                        ))}
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

            {/* Soluciones */}
            <div style={{ 
              background: '#fff3e0', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #ffcc02'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>🛠️ Soluciones Comunes</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>Error 403:</strong> Verifica que Google Sheets API esté habilitada en Google Cloud Console</li>
                <li><strong>Error 404:</strong> Verifica que el Sheet ID sea correcto y la planilla sea accesible</li>
                <li><strong>API Key inválida:</strong> Verifica que la API Key tenga permisos para Google Sheets</li>
                <li><strong>Sin permisos:</strong> Verifica que la planilla sea pública o que la API Key tenga acceso</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            Haz clic en "Ejecutar Tests" para comenzar el diagnóstico
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={runAPITests}
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
            {loading ? 'Ejecutando...' : '🔍 Ejecutar Tests de API'}
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

export default GoogleSheetsAPITest; 