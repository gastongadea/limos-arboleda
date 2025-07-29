// Servicio para manejar datos localmente usando localStorage
class LocalStorageService {
  constructor() {
    this.storageKey = 'limos_arboleda_data';
    this.backupKey = 'limos_arboleda_backup';
    this.version = '1.1.0';
    this.initializeData();
  }

  // Inicializar datos si no existen
  initializeData() {
    try {
      if (!localStorage.getItem(this.storageKey)) {
        const initialData = {
          inscripciones: [],
          lastUpdate: new Date().toISOString(),
          version: this.version,
          metadata: {
            totalInscripciones: 0,
            lastBackup: null,
            created: new Date().toISOString()
          }
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
      } else {
        // Verificar y actualizar versión si es necesario
        this.migrateDataIfNeeded();
      }
    } catch (error) {
      console.error('Error initializing localStorage:', error);
      throw new Error('No se pudo inicializar el almacenamiento local');
    }
  }

  // Migrar datos si la versión cambió
  migrateDataIfNeeded() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const currentVersion = data.version || '1.0.0';
      
      if (currentVersion !== this.version) {
        console.log(`Migrando datos de versión ${currentVersion} a ${this.version}`);
        
        // Agregar metadata si no existe
        if (!data.metadata) {
          data.metadata = {
            totalInscripciones: data.inscripciones?.length || 0,
            lastBackup: null,
            created: data.lastUpdate || new Date().toISOString()
          };
        }
        
        data.version = this.version;
        data.lastUpdate = new Date().toISOString();
        
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        console.log('Migración completada');
      }
    } catch (error) {
      console.error('Error durante migración:', error);
    }
  }

  // Obtener todas las inscripciones
  getInscripciones() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      return data.inscripciones || [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Guardar una inscripción
  saveInscripcion(inscripcion) {
    try {
      // Validar inscripción
      if (!this.validateInscripcion(inscripcion)) {
        console.error('Inscripción inválida:', inscripcion);
        return false;
      }

      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const inscripciones = data.inscripciones || [];
      
      // Buscar si ya existe una inscripción para la misma fecha, comida e iniciales
      const existingIndex = inscripciones.findIndex(item => 
        item.fecha === inscripcion.fecha && 
        item.comida === inscripcion.comida && 
        item.iniciales === inscripcion.iniciales
      );

      if (existingIndex >= 0) {
        // Actualizar inscripción existente
        inscripciones[existingIndex] = {
          ...inscripciones[existingIndex],
          ...inscripcion,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Agregar nueva inscripción
        inscripciones.push({
          ...inscripcion,
          id: this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      data.inscripciones = inscripciones;
      data.lastUpdate = new Date().toISOString();
      data.metadata.totalInscripciones = inscripciones.length;
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      // Crear backup automático cada 10 inscripciones
      if (inscripciones.length % 10 === 0) {
        this.createAutoBackup();
      }
      
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Validar inscripción
  validateInscripcion(inscripcion) {
    const required = ['fecha', 'comida', 'iniciales', 'opcion'];
    const validComidas = ['Almuerzo', 'Cena'];
    
    // Verificar campos requeridos
    for (const field of required) {
      if (!inscripcion[field]) {
        console.error(`Campo requerido faltante: ${field}`);
        return false;
      }
    }
    
    // Verificar comida válida
    if (!validComidas.includes(inscripcion.comida)) {
      console.error(`Comida inválida: ${inscripcion.comida}`);
      return false;
    }
    
    // Verificar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(inscripcion.fecha)) {
      console.error(`Formato de fecha inválido: ${inscripcion.fecha}`);
      return false;
    }
    
    return true;
  }

  // Generar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtener inscripciones por fecha
  getInscripcionesByDate(fecha) {
    try {
      const inscripciones = this.getInscripciones();
      const filtradas = inscripciones.filter(item => item.fecha === fecha);
      return filtradas;
    } catch (error) {
      console.error('Error getting inscriptions by date:', error);
      return [];
    }
  }

  // Obtener inscripciones por iniciales
  getInscripcionesByIniciales(iniciales) {
    try {
      const inscripciones = this.getInscripciones();
      return inscripciones.filter(item => item.iniciales === iniciales);
    } catch (error) {
      console.error('Error getting inscriptions by initials:', error);
      return [];
    }
  }

  // Obtener inscripciones por rango de fechas
  getInscripcionesByDateRange(fechaInicio, fechaFin) {
    try {
      const inscripciones = this.getInscripciones();
      return inscripciones.filter(item => 
        item.fecha >= fechaInicio && item.fecha <= fechaFin
      );
    } catch (error) {
      console.error('Error getting inscriptions by date range:', error);
      return [];
    }
  }

  // Eliminar una inscripción
  deleteInscripcion(id) {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const inscripciones = data.inscripciones || [];
      
      const filteredInscripciones = inscripciones.filter(item => item.id !== id);
      
      if (filteredInscripciones.length === inscripciones.length) {
        console.warn('No se encontró inscripción con ID:', id);
        return false;
      }
      
      data.inscripciones = filteredInscripciones;
      data.lastUpdate = new Date().toISOString();
      data.metadata.totalInscripciones = filteredInscripciones.length;
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      return false;
    }
  }

  // Limpiar todos los datos
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      this.initializeData();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Crear backup automático
  createAutoBackup() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const backupData = {
        ...data,
        backupType: 'auto',
        backupDate: new Date().toISOString()
      };
      
      localStorage.setItem(this.backupKey, JSON.stringify(backupData));
      
      // Actualizar metadata
      data.metadata.lastBackup = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      console.log('Backup automático creado');
      return true;
    } catch (error) {
      console.error('Error creating auto backup:', error);
      return false;
    }
  }

  // Exportar datos
  exportData() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        exportVersion: this.version
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `limos_arboleda_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Actualizar metadata
      data.metadata.lastBackup = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  }

  // Importar datos
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Validar estructura de datos
      if (!this.validateImportData(data)) {
        console.error('Datos de importación inválidos');
        return false;
      }
      
      // Crear backup antes de importar
      this.createAutoBackup();
      
      // Importar datos
      const importData = {
        inscripciones: data.inscripciones || [],
        lastUpdate: new Date().toISOString(),
        version: this.version,
        metadata: {
          totalInscripciones: data.inscripciones?.length || 0,
          lastBackup: new Date().toISOString(),
          created: data.metadata?.created || new Date().toISOString(),
          importedFrom: data.exportDate || 'unknown'
        }
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(importData));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Validar datos de importación
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    if (!Array.isArray(data.inscripciones)) {
      return false;
    }
    
    // Validar cada inscripción
    for (const inscripcion of data.inscripciones) {
      if (!this.validateInscripcion(inscripcion)) {
        return false;
      }
    }
    
    return true;
  }

  // Restaurar desde backup
  restoreFromBackup() {
    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        console.warn('No hay backup disponible');
        return false;
      }
      
      const data = JSON.parse(backupData);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      console.log('Datos restaurados desde backup');
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  // Obtener estadísticas
  getStats() {
    try {
      const inscripciones = this.getInscripciones();
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      
      const stats = {
        total: inscripciones.length,
        byComida: {},
        byIniciales: {},
        byFecha: {},
        byTipoUsuario: {},
        metadata: data.metadata || {},
        version: data.version || 'unknown'
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
      });

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total: 0,
        byComida: {},
        byIniciales: {},
        byFecha: {},
        byTipoUsuario: {},
        metadata: {},
        version: 'unknown'
      };
    }
  }

  // Obtener información del almacenamiento
  getStorageInfo() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      const stats = this.getStats();
      
      return {
        version: data.version || 'unknown',
        lastUpdate: data.lastUpdate,
        totalInscripciones: stats.total,
        metadata: data.metadata || {},
        storageSize: JSON.stringify(data).length,
        hasBackup: !!localStorage.getItem(this.backupKey)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        version: 'unknown',
        lastUpdate: null,
        totalInscripciones: 0,
        metadata: {},
        storageSize: 0,
        hasBackup: false
      };
    }
  }

  // Limpiar datos antiguos (más de 90 días)
  cleanupOldData() {
    try {
      const inscripciones = this.getInscripciones();
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);
      const fechaLimite = noventaDiasAtras.toISOString().split('T')[0];
      
      const inscripcionesActualizadas = inscripciones.filter(item => 
        item.fecha >= fechaLimite
      );
      
      if (inscripcionesActualizadas.length < inscripciones.length) {
        const data = JSON.parse(localStorage.getItem(this.storageKey));
        data.inscripciones = inscripcionesActualizadas;
        data.lastUpdate = new Date().toISOString();
        data.metadata.totalInscripciones = inscripcionesActualizadas.length;
        
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        
        console.log(`Limpieza completada: ${inscripciones.length - inscripcionesActualizadas.length} registros eliminados`);
        return inscripciones.length - inscripcionesActualizadas.length;
      }
      
      return 0;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return 0;
    }
  }
}

export default new LocalStorageService(); 