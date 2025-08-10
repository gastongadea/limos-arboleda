import React, { useState, useEffect, useCallback } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const SyncDebugger = ({ isOpen, onClose, syncStatus, syncErrors, useGoogleSheets, iniciales, seleccion }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDebug = useCallback(async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      const info = {
        timestamp: new Date().toLocaleString(),
        configuration: {
          useGoogleSheets,
          isConfigured: googleSheetsService.isConfigured(),
          connectionStatus: googleSheetsService.getConnectionStatus()
        },
        currentState: {
          iniciales,
          hasSelection: !!seleccion && Object.keys(seleccion).length > 0,
          selectionKeys: seleccion ? Object.keys(seleccion) : [],
          sampleSelection: seleccion ? Object.entries(seleccion).slice(0, 3) : []
        },
        syncStatus,
        syncErrors,
        recommendations: []
      };

      // Verificar configuración
      if (!useGoogleSheets) {
        info.recommendations.push('La sincronización con Google Sheets está desactivada');
      }

      if (!googleSheetsService.isConfigured()) {
        info.recommendations.push('Google Sheets no está configurado correctamente');
      }

      if (!iniciales) {
        info.recommendations.push('No hay usuario seleccionado');
      }

      if (!seleccion || Object.keys(seleccion).length === 0) {
        info.recommendations.push('No hay datos seleccionados para guardar');
      }

      // Verificar si hay datos para guardar
      if (seleccion && iniciales) {
        const datosParaGuardar = [];
        Object.entries(seleccion).forEach(([dia, comidas]) => {
          Object.entries(comidas).forEach(([comida, opcion]) => {
            if (opcion && opcion.trim() !== '') {
              datosParaGuardar.push({
                fecha: dia,
                comida,
                iniciales,
                opcion
              });
            }
          });
        });
        info.datosParaGuardar = datosParaGuardar;
        info.totalDatos = datosParaGuardar.length;
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Error en debug:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  }, [useGoogleSheets, iniciales, seleccion, syncStatus, syncErrors]);

  useEffect(() => {
    if (isOpen) {
      runDebug();
    }
  }, [isOpen, syncStatus, syncErrors, useGoogleSheets, iniciales, seleccion, runDebug]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10004,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 900,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>🐛 Debug de Sincronización</h2>
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
            <div style={{ marginBottom: 16 }}>Analizando sincronización...</div>
          </div>
        ) : debugInfo ? (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Timestamp */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 8,
              fontSize: '14px',
              color: '#666'
            }}>
              Última actualización: {debugInfo.timestamp}
            </div>

            {/* Error */}
            {debugInfo.error && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcdd2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>❌ Error</h3>
                <div style={{ color: '#d32f2f' }}>{debugInfo.error}</div>
              </div>
            )}

            {/* Configuración */}
            {debugInfo.configuration && (
              <div style={{ 
                background: '#e3f2fd', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>⚙️ Configuración</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Sincronización activada:</strong> {debugInfo.configuration.useGoogleSheets ? '✅ Sí' : '❌ No'}</div>
                  <div><strong>Google Sheets configurado:</strong> {debugInfo.configuration.isConfigured ? '✅ Sí' : '❌ No'}</div>
                  <div><strong>Estado de conexión:</strong> {debugInfo.configuration.connectionStatus.connected ? '✅ Conectado' : '❌ Desconectado'}</div>
                  {debugInfo.configuration.connectionStatus.lastError && (
                    <div><strong>Último error:</strong> <span style={{ color: '#d32f2f' }}>{debugInfo.configuration.connectionStatus.lastError}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Estado actual */}
            {debugInfo.currentState && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>📊 Estado Actual</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Usuario:</strong> {debugInfo.currentState.iniciales || 'No seleccionado'}</div>
                  <div><strong>Tiene selección:</strong> {debugInfo.currentState.hasSelection ? '✅ Sí' : '❌ No'}</div>
                  <div><strong>Días con datos:</strong> {debugInfo.currentState.selectionKeys.length}</div>
                  {debugInfo.currentState.sampleSelection.length > 0 && (
                    <div>
                      <strong>Muestra de datos:</strong>
                      <div style={{ marginTop: 8, fontSize: '12px', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                        {debugInfo.currentState.sampleSelection.map(([dia, comidas], index) => (
                          <div key={index} style={{ marginBottom: 4 }}>
                            {dia}: {Object.entries(comidas).filter(([_, opcion]) => opcion).map(([comida, opcion]) => `${comida}: ${opcion}`).join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Datos para guardar */}
            {debugInfo.datosParaGuardar && (
              <div style={{ 
                background: '#fff3e0', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcc02'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>💾 Datos para Guardar ({debugInfo.totalDatos})</h3>
                {debugInfo.totalDatos > 0 ? (
                  <div style={{ 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    background: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4,
                    fontSize: '12px'
                  }}>
                    {debugInfo.datosParaGuardar.map((dato, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        {dato.fecha} - {dato.comida} - {dato.iniciales}: {dato.opcion}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>No hay datos para guardar</div>
                )}
              </div>
            )}

            {/* Estado de sincronización */}
            <div style={{ 
              background: '#f3e5f5', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #ce93d8'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>🔄 Estado de Sincronización</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>Estado:</strong> {debugInfo.syncStatus || 'Sin estado'}</div>
                <div><strong>Errores:</strong> {debugInfo.syncErrors.length}</div>
                {debugInfo.syncErrors.length > 0 && (
                  <div style={{ 
                    maxHeight: 150, 
                    overflow: 'auto', 
                    background: '#f5f5f5', 
                    padding: 8, 
                    borderRadius: 4,
                    fontSize: '12px'
                  }}>
                    {debugInfo.syncErrors.map((error, index) => (
                      <div key={index} style={{ marginBottom: 2, color: '#d32f2f' }}>
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recomendaciones */}
            {debugInfo.recommendations.length > 0 && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcdd2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>💡 Recomendaciones</h3>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {debugInfo.recommendations.map((rec, index) => (
                    <li key={index} style={{ marginBottom: 4, color: '#d32f2f' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            No se pudo obtener información de debug
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={runDebug}
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
            {loading ? 'Analizando...' : '🔄 Actualizar Debug'}
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

export default SyncDebugger; 