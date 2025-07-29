import React, { useState, useEffect } from 'react';
import localStorageService from '../services/localStorageService';
import { formatearFecha, getDiasSiguientes, esFinDeSemana } from '../utils/dateUtils';

const StatsComponent = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7dias');
  const [selectedUser, setSelectedUser] = useState('todos');

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, selectedPeriod, selectedUser]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const allStats = localStorageService.getStats();
      const storageInfo = localStorageService.getStorageInfo();
      
      // Filtrar por período
      const periodStats = filterStatsByPeriod(allStats, selectedPeriod);
      
      // Filtrar por usuario
      const userStats = filterStatsByUser(periodStats, selectedUser);
      
      setStats({
        ...userStats,
        storageInfo,
        period: selectedPeriod,
        user: selectedUser
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStatsByPeriod = (allStats, period) => {
    const inscripciones = localStorageService.getInscripciones();
    let diasFiltro;
    
    switch (period) {
      case '7dias':
        diasFiltro = getDiasSiguientes(7);
        break;
      case '30dias':
        diasFiltro = getDiasSiguientes(30);
        break;
      case 'mes':
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        diasFiltro = getDiasSiguientes(
          ultimoDiaMes.getDate(),
          primerDiaMes.toISOString().split('T')[0]
        );
        break;
      default:
        diasFiltro = getDiasSiguientes(7);
    }
    
    const inscripcionesFiltradas = inscripciones.filter(item => 
      diasFiltro.includes(item.fecha)
    );
    
    return calculateStatsFromInscripciones(inscripcionesFiltradas);
  };

  const filterStatsByUser = (periodStats, user) => {
    if (user === 'todos') return periodStats;
    
    const inscripciones = localStorageService.getInscripciones();
    const inscripcionesUsuario = inscripciones.filter(item => 
      item.iniciales === user
    );
    
    return calculateStatsFromInscripciones(inscripcionesUsuario);
  };

  const calculateStatsFromInscripciones = (inscripciones) => {
    const stats = {
      total: inscripciones.length,
      byComida: {},
      byIniciales: {},
      byFecha: {},
      byTipoUsuario: {},
      byOpcion: {}
    };

    inscripciones.forEach(item => {
      // Por comida
      stats.byComida[item.comida] = (stats.byComida[item.comida] || 0) + 1;
      
      // Por iniciales
      stats.byIniciales[item.iniciales] = (stats.byIniciales[item.iniciales] || 0) + 1;
      
      // Por fecha
      stats.byFecha[item.fecha] = (stats.byFecha[item.fecha] || 0) + 1;
      
      // Por tipo de usuario
      const tipoUsuario = item.tipoUsuario || 'Desconocido';
      stats.byTipoUsuario[tipoUsuario] = (stats.byTipoUsuario[tipoUsuario] || 0) + 1;
      
      // Por opción
      stats.byOpcion[item.opcion] = (stats.byOpcion[item.opcion] || 0) + 1;
    });

    return stats;
  };

  const getTopUsers = () => {
    if (!stats?.byIniciales) return [];
    return Object.entries(stats.byIniciales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getTopOptions = () => {
    if (!stats?.byOpcion) return [];
    return Object.entries(stats.byOpcion)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentActivity = () => {
    if (!stats?.byFecha) return [];
    return Object.entries(stats.byFecha)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);
  };

  const formatStorageSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 style={{ margin: 0, color: '#1976d2' }}>📊 Estadísticas del Sistema</h2>
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

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Período:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="7dias">Últimos 7 días</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="mes">Este mes</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Usuario:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="todos">Todos los usuarios</option>
              {stats?.byIniciales && Object.keys(stats.byIniciales).map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div>Cargando estadísticas...</div>
          </div>
        ) : stats ? (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Resumen General */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 20, 
              borderRadius: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 16
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.total}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Total Inscripciones</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50' }}>
                  {stats.byComida.Almuerzo || 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Almuerzos</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
                  {stats.byComida.Cena || 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Cenas</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#9c27b0' }}>
                  {Object.keys(stats.byIniciales || {}).length}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Usuarios Activos</div>
              </div>
            </div>

            {/* Información del Sistema */}
            {stats.storageInfo && (
              <div style={{ 
                background: '#e3f2fd', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>💾 Información del Sistema</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <strong>Versión:</strong> {stats.storageInfo.version}
                  </div>
                  <div>
                    <strong>Tamaño:</strong> {formatStorageSize(stats.storageInfo.storageSize)}
                  </div>
                  <div>
                    <strong>Última actualización:</strong> {formatDate(stats.storageInfo.lastUpdate)}
                  </div>
                  <div>
                    <strong>Backup disponible:</strong> {stats.storageInfo.hasBackup ? '✅ Sí' : '❌ No'}
                  </div>
                </div>
              </div>
            )}

            {/* Top Usuarios */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>👥 Top Usuarios</h3>
              <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                {getTopUsers().map(([user, count], index) => (
                  <div key={user} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < getTopUsers().length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        background: '#1976d2', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: 24, 
                        height: 24, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{user}</span>
                    </div>
                    <span style={{ color: '#666' }}>{count} inscripciones</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Opciones */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>🍽️ Opciones Más Usadas</h3>
              <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                {getTopOptions().map(([option, count], index) => (
                  <div key={option} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < getTopOptions().length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        background: '#4caf50', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: 24, 
                        height: 24, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{option}</span>
                    </div>
                    <span style={{ color: '#666' }}>{count} veces</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actividad Reciente */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>📅 Actividad Reciente</h3>
              <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                {getRecentActivity().map(([fecha, count]) => (
                  <div key={fecha} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatearFecha(fecha, 'corto')}
                      {esFinDeSemana(fecha) && <span style={{ color: '#ff9800', marginLeft: 8 }}>🏖️</span>}
                    </span>
                    <span style={{ color: '#666' }}>{count} inscripciones</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Tipo de Usuario */}
            {stats.byTipoUsuario && Object.keys(stats.byTipoUsuario).length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>👤 Distribución por Tipo</h3>
                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                  {Object.entries(stats.byTipoUsuario).map(([tipo, count]) => (
                    <div key={tipo} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{tipo}</span>
                      <span style={{ color: '#666' }}>{count} inscripciones</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            No hay datos disponibles para mostrar
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={onClose}
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
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsComponent; 