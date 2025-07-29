import React, { useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';

const SheetDiagnostic = ({ isOpen, onClose }) => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnostic(null);

    try {
      const results = {
        sheetData: null,
        availableDates: [],
        missingDates: [],
        users: [],
        structure: null,
        errors: []
      };

      // Obtener datos de la planilla
      console.log('=== Diagnóstico de Planilla ===');
      
      try {
        results.sheetData = await googleSheetsService.getSheetData(true);
        console.log('Datos obtenidos:', results.sheetData);
      } catch (error) {
        results.errors.push(`Error al obtener datos: ${error.message}`);
        setDiagnostic(results);
        setLoading(false);
        return;
      }

      // Analizar estructura
      if (results.sheetData && results.sheetData.length > 0) {
        results.structure = {
          rows: results.sheetData.length,
          columns: results.sheetData[0].length,
          headers: results.sheetData[0]
        };

        // Extraer usuarios (columnas después de Fecha y Comida)
        results.users = results.sheetData[0].slice(2);

        // Extraer fechas disponibles
        const fechasUnicas = new Set();
        for (let i = 1; i < results.sheetData.length; i++) {
          const row = results.sheetData[i];
          if (row && row[0]) {
            fechasUnicas.add(row[0].toString().trim());
          }
        }
        results.availableDates = Array.from(fechasUnicas).sort();

        // Verificar fechas faltantes para los próximos 30 días
        const hoy = new Date();
        const fechasEsperadas = [];
        for (let i = 0; i < 30; i++) {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() + i);
          const fechaFormatted = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          fechasEsperadas.push(fechaFormatted);
        }

        results.missingDates = fechasEsperadas.filter(fecha => !results.availableDates.includes(fecha));
      }

      setDiagnostic(results);
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setDiagnostic({
        errors: [`Error general: ${error.message}`]
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
      zIndex: 10003,
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
          <h2 style={{ margin: 0, color: '#1976d2' }}>🔍 Diagnóstico de Planilla</h2>
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
            <div style={{ marginBottom: 16 }}>Analizando planilla...</div>
          </div>
        ) : diagnostic ? (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Errores */}
            {diagnostic.errors.length > 0 && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcdd2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>⚠️ Errores</h3>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {diagnostic.errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: 4, color: '#d32f2f' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estructura */}
            {diagnostic.structure && (
              <div style={{ 
                background: '#e3f2fd', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>📊 Estructura</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Filas:</strong> {diagnostic.structure.rows}</div>
                  <div><strong>Columnas:</strong> {diagnostic.structure.columns}</div>
                  <div><strong>Headers:</strong> {diagnostic.structure.headers.join(' | ')}</div>
                </div>
              </div>
            )}

            {/* Usuarios */}
            {diagnostic.users && diagnostic.users.length > 0 && (
              <div style={{ 
                background: '#e8f5e8', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>👥 Usuarios ({diagnostic.users.length})</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {diagnostic.users.map((user, index) => (
                    <span key={index} style={{
                      background: '#4caf50',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '12px'
                    }}>
                      {user}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas disponibles */}
            {diagnostic.availableDates && diagnostic.availableDates.length > 0 && (
              <div style={{ 
                background: '#fff3e0', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcc02'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#f57c00' }}>📅 Fechas Disponibles ({diagnostic.availableDates.length})</h3>
                <div style={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: '12px'
                }}>
                  {diagnostic.availableDates.map((fecha, index) => (
                    <div key={index} style={{ marginBottom: 2 }}>
                      {fecha}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas faltantes */}
            {diagnostic.missingDates && diagnostic.missingDates.length > 0 && (
              <div style={{ 
                background: '#ffebee', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffcdd2'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>❌ Fechas Faltantes ({diagnostic.missingDates.length})</h3>
                <div style={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: '12px'
                }}>
                  {diagnostic.missingDates.slice(0, 20).map((fecha, index) => (
                    <div key={index} style={{ marginBottom: 2 }}>
                      {fecha}
                    </div>
                  ))}
                  {diagnostic.missingDates.length > 20 && (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      ... y {diagnostic.missingDates.length - 20} fechas más
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, fontSize: '14px', color: '#d32f2f' }}>
                  💡 Las fechas faltantes se crearán automáticamente cuando registres comidas
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            <div style={{ 
              background: '#f3e5f5', 
              padding: 16, 
              borderRadius: 8,
              border: '1px solid #ce93d8'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#7b1fa2' }}>💡 Recomendaciones</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Las fechas faltantes se crearán automáticamente al registrar comidas</li>
                <li>Verifica que los usuarios en la planilla coincidan con las iniciales que usas</li>
                <li>La estructura debe ser: Fecha | Comida | Usuario1 | Usuario2 | ...</li>
                <li>Las fechas deben estar en formato DD/MM</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            Haz clic en "Ejecutar Diagnóstico" para analizar la planilla
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={runDiagnostic}
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
            {loading ? 'Analizando...' : '🔍 Ejecutar Diagnóstico'}
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

export default SheetDiagnostic; 