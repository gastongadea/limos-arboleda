import React, { useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const GoogleSheetsDemo = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const runDemo = async () => {
    setLoading(true);
    setTestResults(null);
    
    const results = {
      connection: false,
      readTest: false,
      writeTest: false,
      structureTest: false,
      errors: [],
      details: {}
    };

    try {
      // Test 1: Conexión básica
      setCurrentTest('Probando conexión...');
      console.log('=== Demo: Test de Conexión ===');
      
      try {
        const connectionStatus = await googleSheetsService.testConnection();
        results.connection = connectionStatus;
        if (connectionStatus) {
          console.log('✅ Conexión exitosa');
        } else {
          results.errors.push('Error de conexión');
        }
      } catch (error) {
        results.errors.push(`Error de conexión: ${error.message}`);
      }

      // Test 2: Lectura de datos
      if (results.connection) {
        setCurrentTest('Probando lectura de datos...');
        console.log('=== Demo: Test de Lectura ===');
        
        try {
          const sheetData = await googleSheetsService.getSheetData(true);
          results.readTest = true;
          results.details.sheetData = {
            rows: sheetData.length,
            columns: sheetData[0] ? sheetData[0].length : 0,
            sampleData: sheetData.slice(0, 3)
          };
          console.log('✅ Lectura exitosa');
        } catch (error) {
          results.errors.push(`Error de lectura: ${error.message}`);
        }
      }

      // Test 3: Verificar estructura
      if (results.readTest) {
        setCurrentTest('Verificando estructura...');
        console.log('=== Demo: Test de Estructura ===');
        
        try {
          const structure = await googleSheetsService.ensureSheetStructure();
          results.structureTest = structure;
          if (structure) {
            console.log('✅ Estructura correcta');
          } else {
            results.errors.push('Estructura de planilla incorrecta');
          }
        } catch (error) {
          results.errors.push(`Error de estructura: ${error.message}`);
        }
      }

      // Test 4: Obtener información
      if (results.connection) {
        setCurrentTest('Obteniendo información...');
        console.log('=== Demo: Información de Planilla ===');
        
        try {
          const sheetInfo = await googleSheetsService.getSheetInfo();
          results.details.sheetInfo = sheetInfo;
          console.log('✅ Información obtenida');
        } catch (error) {
          console.warn('No se pudo obtener información:', error.message);
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
      zIndex: 10002,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 700,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>🎉 Demo de Google Sheets</h2>
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
            <div style={{ marginBottom: 16 }}>Ejecutando demo...</div>
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
              <h3 style={{ margin: '0 0 12px 0' }}>📊 Resultados del Demo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.connection ? '✅' : '❌'}</span>
                  <span>Conexión</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.readTest ? '✅' : '❌'}</span>
                  <span>Lectura</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{testResults.structureTest ? '✅' : '❌'}</span>
                  <span>Estructura</span>
                </div>
              </div>
            </div>

            {/* Información de la planilla */}
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
                  <div><strong>Hojas:</strong> {testResults.details.sheetInfo.sheets.length}</div>
                  <div><strong>Última modificación:</strong> {new Date(testResults.details.sheetInfo.lastModified).toLocaleString('es-AR')}</div>
                </div>
              </div>
            )}

            {/* Datos de la planilla */}
            {testResults.details.sheetData && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>📄 Datos de la Planilla</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Filas:</strong> {testResults.details.sheetData.rows}</div>
                  <div><strong>Columnas:</strong> {testResults.details.sheetData.columns}</div>
                  {testResults.details.sheetData.sampleData.length > 0 && (
                    <div>
                      <strong>Datos de muestra:</strong>
                      <div style={{ marginTop: 8, fontSize: '12px', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                        {testResults.details.sheetData.sampleData.map((row, index) => (
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

            {/* Éxito */}
            {testResults.connection && testResults.readTest && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>🎉 ¡Todo Funciona!</h3>
                <p style={{ margin: 0, color: '#2e7d32' }}>
                  La integración con Google Sheets está funcionando correctamente. 
                  Ya puedes usar la sincronización en la aplicación principal.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            Haz clic en "Ejecutar Demo" para probar la funcionalidad completa
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={runDemo}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Ejecutando...' : '🎉 Ejecutar Demo'}
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

export default GoogleSheetsDemo; 