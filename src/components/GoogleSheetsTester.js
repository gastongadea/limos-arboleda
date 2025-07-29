import React, { useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const GoogleSheetsTester = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const runTest = async (testName, testFunction) => {
    setCurrentTest(testName);
    setLoading(true);
    
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result, timestamp: new Date().toLocaleString() }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, timestamp: new Date().toLocaleString() }
      }));
    } finally {
      setLoading(false);
      setCurrentTest('');
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    setLoading(true);
    
    const tests = [
      { name: 'Configuración', func: () => googleSheetsService.isConfigured() },
      { name: 'Conexión', func: () => googleSheetsService.testConnection() },
      { name: 'Información de Planilla', func: () => googleSheetsService.getSheetInfo() },
      { name: 'Estructura', func: () => googleSheetsService.ensureSheetStructure() },
      { name: 'Usuarios', func: () => googleSheetsService.getUsers() },
      { name: 'Datos de Planilla', func: () => googleSheetsService.getSheetData() }
    ];

    for (const test of tests) {
      await runTest(test.name, test.func);
    }
  };

  const testSaveInscripcion = async () => {
    const testInscripcion = {
      fecha: new Date().toISOString().split('T')[0],
      comida: 'Almuerzo',
      iniciales: 'TEST',
      opcion: 'S'
    };
    
    await runTest('Guardar Inscripción', () => googleSheetsService.saveInscripcion(testInscripcion));
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
      zIndex: 10005,
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
          <h2 style={{ margin: 0, color: '#1976d2' }}>🧪 Probador de Google Sheets</h2>
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

        {/* Estado de configuración */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: 16, 
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>⚙️ Estado de Configuración</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Configurado:</strong> {googleSheetsService.isConfigured() ? '✅ Sí' : '❌ No'}</div>
            <div><strong>Estado de conexión:</strong> {googleSheetsService.getConnectionStatus().status}</div>
            {googleSheetsService.getConnectionStatus().lastError && (
              <div><strong>Último error:</strong> <span style={{ color: '#d32f2f' }}>{googleSheetsService.getConnectionStatus().lastError}</span></div>
            )}
          </div>
        </div>

        {/* Botones de prueba */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={runAllTests}
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
            🚀 Ejecutar Todas las Pruebas
          </button>
          
          <button
            onClick={testSaveInscripcion}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            💾 Probar Guardado
          </button>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: 20, 
            background: '#f5f5f5', 
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ marginBottom: 8 }}>🔄 Ejecutando prueba...</div>
            {currentTest && <div style={{ fontSize: '14px', color: '#666' }}>Prueba actual: {currentTest}</div>}
          </div>
        )}

        {/* Resultados de pruebas */}
        {testResults && Object.keys(testResults).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>📊 Resultados de Pruebas</h3>
            
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} style={{ 
                background: result.success ? '#e8f5e8' : '#ffebee',
                padding: 16, 
                borderRadius: 8,
                marginBottom: 12,
                border: `1px solid ${result.success ? '#c8e6c9' : '#ffcdd2'}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: result.success ? '#2e7d32' : '#d32f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {result.success ? '✅' : '❌'} {testName}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {result.timestamp}
                  </span>
                </div>
                
                {result.success ? (
                  <div style={{ fontSize: '14px' }}>
                    <strong>Resultado:</strong> {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#d32f2f' }}>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <div style={{ 
          background: '#f3e5f5', 
          padding: 16, 
          borderRadius: 8,
          marginTop: 20,
          border: '1px solid #ce93d8'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>💡 Información</h3>
          <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
            <p><strong>Configuración:</strong> Verifica que las variables de entorno estén configuradas correctamente.</p>
            <p><strong>Conexión:</strong> Prueba la conectividad con Google Sheets API.</p>
            <p><strong>Estructura:</strong> Verifica que la planilla tenga el formato correcto.</p>
            <p><strong>Usuarios:</strong> Lista los usuarios encontrados en la planilla.</p>
            <p><strong>Guardado:</strong> Prueba guardar una inscripción de prueba.</p>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
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

export default GoogleSheetsTester; 