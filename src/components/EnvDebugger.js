import React, { useState } from 'react';
import envLoader from '../config/envLoader';

const EnvDebugger = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);

  const checkConfig = () => {
    const status = envLoader.getConfigStatus();
    setConfigStatus(status);
    setShowDebug(true);
  };

  if (!showDebug) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 9999 
      }}>
        <button
          onClick={checkConfig}
          style={{
            padding: '8px 12px',
            background: '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔧 Debug ENV
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
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
          <h2 style={{ margin: 0, color: '#ff5722' }}>🔧 Debug de Variables de Entorno</h2>
          <button
            onClick={() => setShowDebug(false)}
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

        {configStatus && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Estado General */}
            <div style={{ 
              background: configStatus.configured ? '#e8f5e8' : '#ffebee', 
              padding: 16, 
              borderRadius: 8,
              border: `1px solid ${configStatus.configured ? '#c8e6c9' : '#ffcdd2'}`
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: configStatus.configured ? '#2e7d32' : '#d32f2f' }}>
                {configStatus.configured ? '✅ Configuración Completa' : '❌ Configuración Incompleta'}
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>API Key:</strong> {configStatus.apiKey ? '✅ Configurada' : '❌ Faltante'}</div>
                <div><strong>Sheet ID:</strong> {configStatus.sheetId ? '✅ Configurado' : '❌ Faltante'}</div>
                <div><strong>Apps Script URL:</strong> {configStatus.allVars.REACT_APP_GOOGLE_APPS_SCRIPT_URL ? '✅ Configurada' : '❌ Faltante'}</div>
                <div><strong>Entorno:</strong> {configStatus.nodeEnv}</div>
              </div>
            </div>

            {/* Variables Detalladas */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #ddd'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>📋 Variables Detalladas</h3>
              <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
                <div><strong>REACT_APP_GOOGLE_API_KEY:</strong> {configStatus.apiKeyPreview || 'No configurada'}</div>
                <div><strong>REACT_APP_GOOGLE_SHEET_ID:</strong> {configStatus.sheetIdPreview || 'No configurado'}</div>
                <div><strong>REACT_APP_GOOGLE_APPS_SCRIPT_URL:</strong> {configStatus.allVars.REACT_APP_GOOGLE_APPS_SCRIPT_URL ? 'Configurada' : 'No configurada'}</div>
                <div><strong>REACT_APP_APP_NAME:</strong> {configStatus.allVars.REACT_APP_APP_NAME || 'No configurado'}</div>
                <div><strong>REACT_APP_VERSION:</strong> {configStatus.allVars.REACT_APP_VERSION || 'No configurado'}</div>
              </div>
            </div>

            {/* Valores Completos (Solo en desarrollo) */}
            {configStatus.nodeEnv === 'development' && (
              <div style={{ 
                background: '#fff3e0', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcc02'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>🔍 Valores Completos (Solo Dev)</h3>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: 200
                }}>
                  {JSON.stringify(configStatus.allVars, null, 2)}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            <div style={{ 
              background: '#e3f2fd', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #bbdefb'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>💡 Recomendaciones</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {!configStatus.apiKey && <li>Crear archivo .env.local con REACT_APP_GOOGLE_API_KEY</li>}
                {!configStatus.sheetId && <li>Crear archivo .env.local con REACT_APP_GOOGLE_SHEET_ID</li>}
                {!configStatus.allVars.REACT_APP_GOOGLE_APPS_SCRIPT_URL && <li>Crear archivo .env.local con REACT_APP_GOOGLE_APPS_SCRIPT_URL</li>}
                {configStatus.configured && <li>✅ Todas las variables están configuradas correctamente</li>}
                <li>Reiniciar la aplicación después de cambiar variables de entorno</li>
                <li>Verificar que el archivo .env.local esté en la raíz del proyecto</li>
              </ul>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={checkConfig}
            style={{
              padding: '12px 24px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Actualizar Debug
          </button>
          <button
            onClick={() => setShowDebug(false)}
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

export default EnvDebugger; 