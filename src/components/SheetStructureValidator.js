import React, { useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const SheetStructureValidator = ({ isOpen, onClose }) => {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetData, setSheetData] = useState(null);

  const validateStructure = async () => {
    setLoading(true);
    setValidationResults(null);
    
    try {
      // Obtener datos de la planilla
      const data = await googleSheetsService.getSheetData(true);
      setSheetData(data);
      
      const results = {
        timestamp: new Date().toLocaleString(),
        totalRows: data.length,
        totalColumns: data[0] ? data[0].length : 0,
        structure: {
          hasHeader: data.length > 0,
          headerColumns: data[0] || [],
                  expectedStructure: {
          columnA: 'Reservada (puede tener contenido)',
          columnB: 'Fecha',
          columnC: 'Comida',
          columnDPlus: 'Usuarios'
        }
        },
        analysis: {
          columnA: data[0] ? data[0][0] : null,
          columnB: data[0] ? data[0][1] : null,
          columnC: data[0] ? data[0][2] : null,
          users: data[0] ? data[0].slice(3) : []
        },
        issues: [],
        recommendations: []
      };

      // Validar estructura
      if (!data || data.length === 0) {
        results.issues.push('La planilla está vacía');
        results.recommendations.push('Agregar datos a la planilla');
      } else {
        // Verificar header
        if (data[0]) {
          const header = data[0];
          
          // Verificar columna A (reservada - puede tener contenido)
          if (header[0] !== undefined) {
            results.analysis.columnA = header[0];
            // La columna A está reservada pero puede tener contenido
            // No es un error, solo informativo
          }
          
          // Verificar columna B (fecha)
          if (!header[1] || header[1].toString().trim() === '') {
            results.issues.push('Columna B (fecha) está vacía');
            results.recommendations.push('Agregar "Fecha" en la columna B del header');
          } else if (header[1].toString().toLowerCase() !== 'fecha') {
            results.issues.push(`Columna B no contiene "Fecha": "${header[1]}"`);
            results.recommendations.push('Cambiar el header de la columna B a "Fecha"');
          }
          
          // Verificar columna C (comida)
          if (!header[2] || header[2].toString().trim() === '') {
            results.issues.push('Columna C (comida) está vacía');
            results.recommendations.push('Agregar "Comida" en la columna C del header');
          } else if (header[2].toString().toLowerCase() !== 'comida') {
            results.issues.push(`Columna C no contiene "Comida": "${header[2]}"`);
            results.recommendations.push('Cambiar el header de la columna C a "Comida"');
          }
          
          // Verificar usuarios
          const users = header.slice(3);
          if (users.length === 0) {
            results.issues.push('No hay usuarios definidos (columnas D+)');
            results.recommendations.push('Agregar iniciales de usuarios en las columnas D en adelante');
          } else {
            const emptyUsers = users.filter(user => !user || user.toString().trim() === '');
            if (emptyUsers.length > 0) {
              results.issues.push(`${emptyUsers.length} columnas de usuario están vacías`);
              results.recommendations.push('Completar todas las columnas de usuario con iniciales');
            }
          }
        }
        
        // Verificar datos
        if (data.length > 1) {
          const dataRows = data.slice(1);
          let validRows = 0;
          let invalidRows = 0;
          
          dataRows.forEach((row, index) => {
            if (row && row.length >= 3) {
              const fecha = row[1]; // Columna B
              const tipo = row[2];  // Columna C
              
              if (fecha && tipo && ['A', 'C'].includes(tipo.toString().toUpperCase())) {
                validRows++;
              } else {
                invalidRows++;
                results.issues.push(`Fila ${index + 2}: Fecha o tipo inválido (fecha: "${fecha}", tipo: "${tipo}")`);
              }
            } else {
              invalidRows++;
              results.issues.push(`Fila ${index + 2}: Insuficientes columnas (${row ? row.length : 0})`);
            }
          });
          
          results.analysis.validRows = validRows;
          results.analysis.invalidRows = invalidRows;
          
          if (validRows === 0) {
            results.recommendations.push('Agregar filas de datos con fechas y tipos de comida (A/C)');
          }
        }
      }

      // Verificar configuración
      if (!googleSheetsService.isConfigured()) {
        results.issues.push('Google Sheets no está configurado');
        results.recommendations.push('Configurar REACT_APP_GOOGLE_API_KEY y REACT_APP_GOOGLE_SHEET_ID');
      }

      setValidationResults(results);
    } catch (error) {
      setValidationResults({
        timestamp: new Date().toLocaleString(),
        error: error.message,
        issues: ['Error al obtener datos de la planilla'],
        recommendations: ['Verificar configuración de Google Sheets', 'Verificar permisos de la planilla']
      });
    } finally {
      setLoading(false);
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
      zIndex: 10006,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 1000,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1976d2' }}>🔍 Validador de Estructura de Planilla</h2>
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

        {/* Información de estructura esperada */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: 16, 
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>📋 Estructura Esperada</h3>
          <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
            <p><strong>Columna A:</strong> Reservada (vacía)</p>
            <p><strong>Columna B:</strong> Fecha (header: "Fecha")</p>
            <p><strong>Columna C:</strong> Comida (header: "Comida", valores: A/C)</p>
            <p><strong>Columnas D+:</strong> Usuarios (headers: iniciales de usuarios)</p>
            <p><strong>Datos:</strong> Cada fila representa una fecha y tipo de comida específicos</p>
          </div>
        </div>

        {/* Botón de validación */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={validateStructure}
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
            {loading ? '🔍 Validando...' : '🔍 Validar Estructura'}
          </button>
        </div>

        {/* Resultados de validación */}
        {validationResults && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>📊 Resultados de Validación</h3>
            
            {/* Información general */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 16
            }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>Timestamp:</strong> {validationResults.timestamp}</div>
                {validationResults.totalRows !== undefined && (
                  <div><strong>Total de filas:</strong> {validationResults.totalRows}</div>
                )}
                {validationResults.totalColumns !== undefined && (
                  <div><strong>Total de columnas:</strong> {validationResults.totalColumns}</div>
                )}
                {validationResults.analysis && validationResults.analysis.validRows !== undefined && (
                  <div><strong>Filas válidas:</strong> {validationResults.analysis.validRows}</div>
                )}
                {validationResults.analysis && validationResults.analysis.invalidRows !== undefined && (
                  <div><strong>Filas inválidas:</strong> {validationResults.analysis.invalidRows}</div>
                )}
              </div>
            </div>

            {/* Análisis de estructura */}
            {validationResults.analysis && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #c8e6c9'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>🔍 Análisis de Estructura</h4>
                <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
                  <div><strong>Columna A:</strong> {validationResults.analysis.columnA || '(vacía)'}</div>
                  <div><strong>Columna B:</strong> {validationResults.analysis.columnB || '(vacía)'}</div>
                  <div><strong>Columna C:</strong> {validationResults.analysis.columnC || '(vacía)'}</div>
                  <div><strong>Usuarios encontrados:</strong> {validationResults.analysis.users.filter(u => u && u.toString().trim() !== '').join(', ') || 'Ninguno'}</div>
                </div>
              </div>
            )}

            {/* Problemas encontrados */}
            {validationResults.issues && validationResults.issues.length > 0 && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #ffcdd2'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>❌ Problemas Encontrados</h4>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResults.issues.map((issue, index) => (
                    <li key={index} style={{ marginBottom: 4, color: '#d32f2f' }}>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {validationResults.recommendations && validationResults.recommendations.length > 0 && (
              <div style={{ 
                background: '#fff3e0', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #ffcc02'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>💡 Recomendaciones</h4>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationResults.recommendations.map((rec, index) => (
                    <li key={index} style={{ marginBottom: 4, color: '#f57c00' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error */}
            {validationResults.error && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #ffcdd2'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>❌ Error</h4>
                <div style={{ color: '#d32f2f' }}>{validationResults.error}</div>
              </div>
            )}

            {/* Vista previa de datos */}
            {sheetData && sheetData.length > 0 && (
              <div style={{ 
                background: '#f3e5f5', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #ce93d8'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>👀 Vista Previa de Datos</h4>
                <div style={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {sheetData.slice(0, 10).map((row, index) => (
                    <div key={index} style={{ marginBottom: 2 }}>
                      Fila {index + 1}: {row ? row.map(cell => cell || '').join(' | ') : '(vacía)'}
                    </div>
                  ))}
                  {sheetData.length > 10 && (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      ... y {sheetData.length - 10} filas más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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

export default SheetStructureValidator; 