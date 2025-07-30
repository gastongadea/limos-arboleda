import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import localStorageService from './services/localStorageService';
import googleSheetsService from './services/googleSheetsService';
import { formatearFecha, esFinDeSemana } from './utils/dateUtils';
import StatsComponent from './components/StatsComponent';
import GoogleSheetsTest from './components/GoogleSheetsTest';
import GoogleSheetsAPITest from './components/GoogleSheetsAPITest';
import GoogleSheetsDemo from './components/GoogleSheetsDemo';
import SheetDiagnostic from './components/SheetDiagnostic';
import SheetStructureValidator from './components/SheetStructureValidator';
import SyncDebugger from './components/SyncDebugger';


Modal.setAppElement('#root');

const inicialesLista = [
  'MEP', 'PGG', 'LMC', 'PAB', 'FIG', 'FAM', 'IJC', 'ELF', 'MS', 'JOA', 'GG', 'AS', 'JBA', 'IC', 'TA', 'JPS', 'FEC', 'Huesped1', 'Huesped2', 'Plan', 'Invitados'
];

const opcionesAlmuerzo = [
  { valor: 'S', label: 'Si' },
  { valor: 'R', label: 'Reg' },
  { valor: 'N', label: 'No' },
  { valor: '12', label: '12' },
  { valor: 'V', label: 'Vian' },
  { valor: 'San', label: 'San' },
  { valor: 'T', label: 'T' },
  { valor: 'RT', label: 'Reg T' },
];

const opcionesCena = [
  { valor: 'S', label: 'Si' },
  { valor: 'R', label: 'Reg' },
  { valor: 'N', label: 'No' },
  { valor: 'V', label: 'Vian' },
  { valor: 'T', label: 'Tarde' },
  { valor: 'RT', label: 'Reg T' },
  { valor: 'VRM', label: 'Vian R Mañana' },
];

// Constantes de configuración
const CONFIG = {
  CLAVE_ADMIN: 'admin123',
  DIAS_VISTA: 30,
  DIAS_RESUMEN: 7,
  MAX_INTENTOS_SYNC: 3,
  TIMEOUT_SYNC: 10000, // 10 segundos
};

// Utilidades
function deducirTipoUsuario(inicial) {
  if (!inicial) return 'Desconocido';
  if (inicial.toLowerCase().startsWith('huesped')) return 'Huésped';
  if (inicial.toLowerCase().startsWith('invitad')) return 'Invitado';
  return 'Residente';
}

function validarIniciales(iniciales, usuariosLista = inicialesLista) {
  return usuariosLista.includes(iniciales);
}

function validarOpcion(opcion, comida) {
  const opcionesValidas = comida === 'Almuerzo' ? opcionesAlmuerzo : opcionesCena;
  return opcionesValidas.some(op => op.valor === opcion) || opcion === '';
}

function App() {
  // Estados principales
  const [iniciales, setIniciales] = useState('');
  const [dias, setDias] = useState([]);
  const [seleccion, setSeleccion] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('info'); // 'info', 'success', 'error', 'warning'
  
  // Estados de configuración
  const [showConfig, setShowConfig] = useState(false);
  const [adminStep, setAdminStep] = useState('clave');
  const [adminClave, setAdminClave] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Estados de funcionalidad
  const [showComensales, setShowComensales] = useState(false);
  const [resumenComensales, setResumenComensales] = useState([]);
  const [diasResumen, setDiasResumen] = useState([]);
  const [tieneCambios, setTieneCambios] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [useGoogleSheets, setUseGoogleSheets] = useState(true); // Siempre activo
  
  // Estados de carga y sincronización
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncErrors, setSyncErrors] = useState([]);
  
  // Estados de UI
  const [autoSave, setAutoSave] = useState(true); // Siempre activo
  const [showStats, setShowStats] = useState(false);
  const [showGoogleSheetsTest, setShowGoogleSheetsTest] = useState(false);
  const [showGoogleSheetsAPITest, setShowGoogleSheetsAPITest] = useState(false);
  const [showGoogleSheetsDemo, setShowGoogleSheetsDemo] = useState(false);
  const [showSheetDiagnostic, setShowSheetDiagnostic] = useState(false);
  const [showSheetStructureValidator, setShowSheetStructureValidator] = useState(false);
  const [showSyncDebugger, setShowSyncDebugger] = useState(false);
  const [usuariosSinComidasHoy, setUsuariosSinComidasHoy] = useState([]);
  
  // Estado para usuarios dinámicos desde Google Sheets
  const [usuariosDinamicos, setUsuariosDinamicos] = useState([]);

  // Generar días (próximos 30 días desde hoy)
  useEffect(() => {
    const dias = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < CONFIG.DIAS_VISTA; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dias.push(`${yyyy}-${mm}-${dd}`);
    }
    
    setDias(dias);
  }, []);

  // Cargar usuarios dinámicamente desde Google Sheets
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        if (useGoogleSheets && googleSheetsService.isConfigured()) {
          const usuarios = await googleSheetsService.getUsers();
          if (usuarios.length > 0) {
            setUsuariosDinamicos(usuarios);
          } else {
            // Fallback a lista estática si no se obtienen usuarios
            setUsuariosDinamicos(inicialesLista);
          }
        } else {
          // Usar lista estática si Google Sheets no está configurado
          setUsuariosDinamicos(inicialesLista);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        // Fallback a lista estática en caso de error
        setUsuariosDinamicos(inicialesLista);
      }
    };

    cargarUsuarios();
  }, [useGoogleSheets]);

  // Auto-save cuando hay cambios
  useEffect(() => {
    if (autoSave && tieneCambios && iniciales) {
      const timeoutId = setTimeout(() => {
        handleSubmit();
      }, 2000); // Auto-save después de 2 segundos sin cambios
      
      return () => clearTimeout(timeoutId);
    }
  }, [seleccion, autoSave, tieneCambios, iniciales]);

  // Cargar selección al cambiar iniciales
  useEffect(() => {
    if (!iniciales || dias.length === 0) {
      setSeleccion({});
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      setSyncErrors([]);
      
      try {
        let nuevaSel = {};
        
        if (useGoogleSheets && googleSheetsService.isConfigured()) {
          // Cargar desde Google Sheets con timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout al cargar datos')), CONFIG.TIMEOUT_SYNC)
          );
          
          const dataPromise = googleSheetsService.getUserInscripciones(iniciales, dias);
          
          nuevaSel = await Promise.race([dataPromise, timeoutPromise]);
          setSyncStatus('Datos cargados desde Google Sheets');
        } else {
          // Cargar desde localStorage
          dias.forEach(dia => {
            const inscripcionesDia = localStorageService.getInscripcionesByDate(dia);
            const inscripcionUsuario = inscripcionesDia.find(item => item.iniciales === iniciales);
            
            if (inscripcionUsuario) {
              nuevaSel[dia] = {
                Almuerzo: inscripcionUsuario.opcion || '',
                Cena: inscripcionUsuario.opcion || ''
              };
            } else {
              nuevaSel[dia] = { Almuerzo: '', Cena: '' };
            }
          });
          setSyncStatus('Datos cargados desde localStorage');
        }
        
        setSeleccion(nuevaSel);
        setTieneCambios(false);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSyncStatus('Error al cargar datos');
        setSyncErrors(prev => [...prev, error.message]);
        
        // Fallback a localStorage si Google Sheets falla
        if (useGoogleSheets) {
          setUseGoogleSheets(false);
          setMensaje('Error de sincronización. Cambiando a modo local.');
          setMensajeTipo('warning');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [iniciales, dias, useGoogleSheets]);

  // Función para mostrar mensajes
  const mostrarMensaje = useCallback((texto, tipo = 'info', duracion = 5000) => {
    setMensaje(texto);
    setMensajeTipo(tipo);
    
    if (duracion > 0) {
      setTimeout(() => {
        setMensaje('');
        setMensajeTipo('info');
      }, duracion);
    }
  }, []);

  const calcularResumenComensales = useCallback(async () => {
    try {
      const resumen = {};
      const diasResumenArr = dias.slice(0, CONFIG.DIAS_RESUMEN);

      // Inicializar estructura del resumen
      diasResumenArr.forEach(fechaISO => {
        if (!resumen[fechaISO]) {
          resumen[fechaISO] = { Almuerzo: {}, Cena: {}, total: { Almuerzo: 0, Cena: 0 } };
        }
      });

      // 1. Obtener datos de localStorage
      const inscripciones = localStorageService.getInscripciones();
      
      inscripciones.forEach(inscripcion => {
        const fechaISO = inscripcion.fecha;
        const comida = inscripcion.comida;
        const opcion = inscripcion.opcion;
        
        if (diasResumenArr.includes(fechaISO) && opcion && opcion !== 'No') {
          resumen[fechaISO].total[comida] += 1;
          resumen[fechaISO][comida][opcion] = (resumen[fechaISO][comida][opcion] || 0) + 1;
        }
      });

      // 2. Si Google Sheets está configurado, también obtener datos de ahí
      if (useGoogleSheets && googleSheetsService.isConfigured()) {
        try {
          const sheetData = await googleSheetsService.getSheetData();
          
          // Procesar cada fila de Google Sheets
          for (let row = 1; row < sheetData.length; row++) {
            const rowData = sheetData[row];
            if (!rowData || rowData.length < 3) continue;
            
            const fechaCell = rowData[1]; // Columna B: Fecha
            const tipoCell = rowData[2]; // Columna C: Tipo (A/C)
            
            if (!fechaCell || !tipoCell) continue;
            
            // Convertir fecha de Google Sheets a formato ISO
            const fechaFormatted = fechaCell.toString().trim();
            const tipo = tipoCell.toString().trim().toUpperCase();
            
            // Convertir fecha DD/MM/YY a YYYY-MM-DD
            const [day, month, year] = fechaFormatted.split('/').map(Number);
            const fechaISO = `20${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Solo procesar si está en el rango de días del resumen
            if (diasResumenArr.includes(fechaISO)) {
              const comida = tipo === 'A' ? 'Almuerzo' : 'Cena';
              
              // Procesar cada columna de usuario
              for (let col = 3; col < rowData.length; col++) {
                const valor = rowData[col];
                const headerRow = sheetData[0];
                
                if (valor && headerRow && headerRow[col]) {
                  const opcion = valor.toString().trim();
                  
                  // Solo contar si no es vacío y no es "No"
                  if (opcion !== '' && opcion !== 'No') {
                    // Verificar si este usuario ya fue contado en localStorage para evitar duplicados
                    const usuario = headerRow[col].toString().trim();
                    const yaContadoEnLocal = inscripciones.some(ins => 
                      ins.fecha === fechaISO && 
                      ins.comida === comida && 
                      ins.iniciales === usuario
                    );
                    
                    if (!yaContadoEnLocal) {
                      resumen[fechaISO].total[comida] += 1;
                      resumen[fechaISO][comida][opcion] = (resumen[fechaISO][comida][opcion] || 0) + 1;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al obtener datos de Google Sheets para resumen:', error);
        }
      }

      setDiasResumen(diasResumenArr);
      setResumenComensales(resumen);
    } catch (error) {
      console.error('Error al calcular resumen:', error);
      mostrarMensaje('Error al calcular el resumen de comensales', 'error');
    }
  }, [dias, mostrarMensaje, useGoogleSheets]);

  // Función para detectar usuarios sin comidas hoy
  const detectarUsuariosSinComidasHoy = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Obtener datos de localStorage
      const inscripciones = localStorageService.getInscripciones();
      const inscripcionesHoy = inscripciones.filter(item => item.fecha === hoy);
      
      // Obtener todos los usuarios que han cargado comidas hoy (desde localStorage)
      const usuariosConComidas = new Set();
      inscripcionesHoy.forEach(inscripcion => {
        // Un usuario "ha cargado comidas" si tiene AL MENOS UNA inscripción válida
        if (inscripcion.opcion && inscripcion.opcion !== 'No') {
          usuariosConComidas.add(inscripcion.iniciales);
        }
      });
      
      // Si Google Sheets está configurado, también obtener datos de ahí
      if (useGoogleSheets && googleSheetsService.isConfigured()) {
        try {
          // Obtener datos de Google Sheets para hoy
          const sheetData = await googleSheetsService.getSheetData();
          const hoyFormatted = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(-2)}`;
          
          // Buscar filas de hoy en Google Sheets
          for (let row = 1; row < sheetData.length; row++) {
            const rowData = sheetData[row];
            if (!rowData || rowData.length < 3) continue;
            
            const fechaCell = rowData[1]; // Columna B: Fecha
            if (fechaCell && fechaCell.toString().trim() === hoyFormatted) {
              // Esta fila es de hoy, revisar todas las columnas de usuarios
              for (let col = 3; col < rowData.length; col++) {
                const valor = rowData[col];
                if (valor && valor.toString().trim() !== '' && valor.toString().trim() !== 'No') {
                  // Obtener el nombre del usuario de la columna correspondiente
                  const headerRow = sheetData[0];
                  if (headerRow && headerRow[col]) {
                    const usuario = headerRow[col].toString().trim();
                    usuariosConComidas.add(usuario);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al obtener datos de Google Sheets para detectar usuarios sin comidas:', error);
        }
      }
      
      // Usar la lista dinámica de usuarios, con fallback a la estática
      const listaUsuarios = usuariosDinamicos.length > 0 ? usuariosDinamicos : inicialesLista;
      
      // Filtrar usuarios que NO han cargado comidas hoy
      const usuariosSinComidas = listaUsuarios.filter(ini => {
        const tieneComidas = usuariosConComidas.has(ini);
        const esEspecial = ini.toLowerCase().includes('huesped') || 
                          ini.toLowerCase().includes('invitad') ||
                          ini.toLowerCase().includes('plan') ||
                          ini.trim() === '';
        
        return !tieneComidas && !esEspecial;
      });
      
      setUsuariosSinComidasHoy(usuariosSinComidas);
    } catch (error) {
      console.error('Error al detectar usuarios sin comidas:', error);
    }
  }, [usuariosDinamicos, useGoogleSheets]);

  // Detectar usuarios sin comidas al cargar la aplicación
  useEffect(() => {
    if (dias.length > 0) {
      detectarUsuariosSinComidasHoy();
    }
  }, [dias, detectarUsuariosSinComidasHoy]);

  const handleChange = useCallback((dia, comida, valor) => {
    if (!validarOpcion(valor, comida)) {
      mostrarMensaje(`Opción inválida para ${comida}`, 'error');
      return;
    }
    
    // Si se presiona el botón ya seleccionado, borrar la selección
    if (seleccion[dia]?.[comida] === valor) {
      setSeleccion((prev) => ({
        ...prev,
        [dia]: {
          ...prev[dia],
          [comida]: '',
        },
      }));
    } else {
      // Si se presiona un botón diferente, cambiar la selección
      setSeleccion((prev) => ({
        ...prev,
        [dia]: {
          ...prev[dia],
          [comida]: valor,
        },
      }));
    }
    setTieneCambios(true);
  }, [mostrarMensaje, seleccion]);

  const handleInputChange = useCallback((dia, comida, valor) => {
    // Validar que sea un número para Plan e Invitados
    if ((iniciales === 'Plan' || iniciales === 'Invitados') && valor !== '') {
      const num = parseInt(valor, 10);
      if (isNaN(num) || num < 0) {
        mostrarMensaje('Por favor ingresa un número válido', 'error');
        return;
      }
    }
    
    setSeleccion((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [comida]: valor,
      },
    }));
    setTieneCambios(true);
  }, [iniciales, mostrarMensaje]);



  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (!iniciales || !validarIniciales(iniciales)) {
      mostrarMensaje('Por favor selecciona un usuario válido', 'error');
      return;
    }
    
    setMensaje('');
    setIsLoading(true);
    setSyncErrors([]);

    const tipoUsuario = deducirTipoUsuario(iniciales);
    let guardados = 0;
    let errores = [];

    try {
      for (const dia of dias) {
        for (const comida of ['Almuerzo', 'Cena']) {
          const opcion = seleccion[dia]?.[comida] || '';
          if (opcion) {
            const inscripcion = {
              fecha: dia,
              comida,
              iniciales,
              tipoUsuario,
              opcion,
            };
            
            // Guardar en localStorage
            console.log('💾 Guardando inscripción:', inscripcion);
            if (localStorageService.saveInscripcion(inscripcion)) {
              guardados++;
              console.log('✅ Inscripción guardada localmente:', inscripcion);
            } else {
              errores.push(`Error al guardar ${dia} ${comida} localmente`);
              console.log('❌ Error al guardar localmente:', inscripcion);
            }
            
            // Guardar en Google Sheets si está configurado
            if (useGoogleSheets && googleSheetsService.isConfigured()) {
              try {
                console.log(`💾 Guardando en Google Sheets: ${dia} ${comida} - ${iniciales} = ${opcion}`);
                await googleSheetsService.saveInscripcion(inscripcion);
                console.log(`✅ Guardado exitosamente en Google Sheets: ${dia} ${comida}`);
              } catch (error) {
                console.error(`❌ Error guardando en Google Sheets: ${dia} ${comida}`, error);
                errores.push(`Error en ${dia} ${comida}: ${error.message}`);
              }
            }
          }
        }
      }

      if (guardados > 0) {
        const mensaje = useGoogleSheets && googleSheetsService.isConfigured() 
          ? `¡Inscripción guardada! ${guardados} registros guardados localmente y en Google Sheets.`
          : `¡Inscripción guardada! ${guardados} registros guardados localmente.`;
        
        mostrarMensaje(mensaje, 'success');
        setSyncStatus(errores.length > 0 ? 'Guardado con algunos errores' : 'Sincronizado correctamente');
        setTieneCambios(false);
        
        // Actualizar detección de usuarios sin comidas DESPUÉS de guardar
        setTimeout(() => {
          detectarUsuariosSinComidasHoy();
        }, 100);
        
        // Actualizar resumen de comensales si está visible
        if (showComensales) {
          setTimeout(() => {
            calcularResumenComensales();
          }, 200);
        }
      } else {
        mostrarMensaje('No hay cambios para guardar.', 'info');
      }
      
      if (errores.length > 0) {
        setSyncErrors(errores);
      }
      
    } catch (error) {
      console.error('Error al guardar:', error);
      mostrarMensaje('Error al guardar los datos.', 'error');
      setSyncStatus('Error de sincronización');
    } finally {
      setIsLoading(false);
    }
  }, [iniciales, dias, seleccion, useGoogleSheets, mostrarMensaje]);

  const handleCambioIniciales = useCallback((ini) => {
    // Si se presiona el botón ya seleccionado, deseleccionar
    if (iniciales === ini) {
      setSeleccion({});
      setIniciales('');
      setMensaje('');
      setShowComensales(false);
      setSyncErrors([]);
      return;
    }
    
    // Si hay cambios pendientes, preguntar antes de cambiar
    if (tieneCambios) {
      if (window.confirm('¿Querés guardar los cambios antes de cambiar de usuario?')) {
        handleSubmit();
      }
    }
    setSeleccion({});
    setIniciales(ini);
    setMensaje('');
    setShowComensales(false);
    setSyncErrors([]);
  }, [tieneCambios, handleSubmit, iniciales]);

  const handleOpenConfig = useCallback(() => {
    setShowConfig(true);
    setAdminStep('clave');
    setAdminClave('');
    setAdminError('');
  }, []);

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false);
    setAdminStep('clave');
    setAdminClave('');
    setAdminError('');
  }, []);

  const handleAdminSubmit = useCallback((e) => {
    e.preventDefault();
    if (adminClave === CONFIG.CLAVE_ADMIN) {
      setAdminStep('panel');
      setAdminError('');
    } else {
      setAdminError('Clave incorrecta');
    }
  }, [adminClave]);

  const handleMostrarComensales = useCallback(async () => {
    setShowComensales(v => !v);
    if (!showComensales) {
      await calcularResumenComensales();
    }
  }, [showComensales, calcularResumenComensales]);

  const handleExportData = useCallback(() => {
    try {
      if (localStorageService.exportData()) {
        mostrarMensaje('Datos exportados correctamente.', 'success');
      } else {
        mostrarMensaje('Error al exportar datos.', 'error');
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      mostrarMensaje('Error al exportar datos.', 'error');
    }
  }, [mostrarMensaje]);

  const handleImportData = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (localStorageService.importData(e.target.result)) {
            mostrarMensaje('Datos importados correctamente.', 'success');
            window.location.reload();
          } else {
            mostrarMensaje('Error al importar datos.', 'error');
          }
        } catch (error) {
          console.error('Error en importación:', error);
          mostrarMensaje('Error al importar datos.', 'error');
        }
      };
      reader.readAsText(file);
    }
  }, [mostrarMensaje]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('¿Estás seguro de que querés borrar todos los datos? Esta acción no se puede deshacer.')) {
      try {
        if (localStorageService.clearAll()) {
          mostrarMensaje('Todos los datos han sido borrados.', 'success');
          setSeleccion({});
          window.location.reload();
        } else {
          mostrarMensaje('Error al borrar datos.', 'error');
        }
      } catch (error) {
        console.error('Error al borrar datos:', error);
        mostrarMensaje('Error al borrar datos.', 'error');
      }
    }
  }, [mostrarMensaje]);

  const renderBotones = useCallback((opciones, dia, comida) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0' }}>
      {opciones.map(op => {
        const isSelected = seleccion[dia]?.[comida] === op.valor;
        return (
          <button
            key={op.valor}
            type="button"
            style={{
              padding: '6px 10px',
              background: isSelected ? '#1976d2' : '#f5f5f5',
              color: isSelected ? 'white' : '#333',
              border: `1px solid ${isSelected ? '#1976d2' : '#ddd'}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: isSelected ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 2px 4px rgba(25, 118, 210, 0.2)' : 'none',
            }}
            onClick={() => handleChange(dia, comida, op.valor)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.target.style.background = '#e3f2fd';
                e.target.style.borderColor = '#1976d2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.target.style.background = '#f5f5f5';
                e.target.style.borderColor = '#ddd';
              }
            }}
            title={isSelected ? 'Presiona para borrar' : `Seleccionar ${op.label}`}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  ), [seleccion, handleChange]);

  const esPlanOInvitados = iniciales === 'Plan' || iniciales === 'Invitados';

  // Componente de notificación
  const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    
    const colors = {
      info: '#2196f3',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800'
    };
    
    return (
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: colors[type] || colors.info,
        color: 'white',
        padding: '12px 20px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        maxWidth: 400,
        animation: 'slideIn 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{message}</span>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginLeft: 10,
              fontSize: 18
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20, position: 'relative' }}>
      {/* Notificación */}
      <Notification 
        message={mensaje} 
        type={mensajeTipo} 
        onClose={() => setMensaje('')} 
      />

      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
        <a
          href="https://docs.google.com/spreadsheets/d/1WrFLSer4NyYDjmuPqvyhagsWfoAr1NkgY7HQyHjF7a8/edit?gid=215982293"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            padding: '8px 16px', 
            background: '#4caf50', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4, 
            cursor: 'pointer', 
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          📊 Planilla
        </a>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <button
          style={{ padding: '8px 16px', background: '#ff5722', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          onClick={async () => {
            try {
              console.log('🔍 Iniciando diagnóstico de sincronización...');
              
              // Verificar configuración
              const config = googleSheetsService.isConfigured();
              console.log('📋 Configuración:', config);
              
              // Test de conexión a Google Sheets API
              console.log('🌐 Probando conexión a Google Sheets API...');
              try {
                const connectionTest = await googleSheetsService.testConnection();
                console.log('✅ Test de conexión a Google Sheets:', connectionTest);
              } catch (error) {
                console.error('❌ Error en conexión a Google Sheets:', error);
              }
              
              // Test de Google Apps Script
              console.log('📝 Probando Google Apps Script...');
              try {
                const scriptTest = await googleSheetsService.testGoogleAppsScript();
                console.log('✅ Test de Google Apps Script:', scriptTest);
                
                if (!scriptTest.working) {
                  console.warn('⚠️ Google Apps Script no está funcionando');
                  console.warn('💡 Esto significa que solo se puede leer de Google Sheets, no escribir');
                }
              } catch (error) {
                console.error('❌ Error en Google Apps Script:', error);
              }
              
              // Mostrar resumen
              const configStatus = googleSheetsService.getConnectionStatus();
              console.log('📊 Estado general:', configStatus);
              
              mostrarMensaje('Diagnóstico completado. Revisa la consola para detalles.', 'success');
            } catch (error) {
              console.error('❌ Error en diagnóstico:', error);
              mostrarMensaje(`Error en diagnóstico: ${error.message}`, 'error');
            }
          }}
        >
          🔍 Diagnóstico
        </button>
        <button
          style={{ padding: '8px 16px', background: '#888', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          onClick={handleOpenConfig}
        >
          Configuración
        </button>
      </div>

      <h2 style={{ marginTop: '60px' }}>Comidas de Arboleda</h2>

      <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: 16, borderBottom: '2px solid #eee', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 12 }}>
          {(usuariosDinamicos.length > 0 ? usuariosDinamicos : inicialesLista).map(ini => {
            const sinComidasHoy = usuariosSinComidasHoy.includes(ini);
            const esSeleccionado = ini === iniciales;
            
            return (
              <button
                key={ini}
                type="button"
                style={{
                  padding: '8px 12px',
                  background: esSeleccionado ? '#1976d2' : (sinComidasHoy ? '#ffebee' : '#eee'),
                  color: esSeleccionado ? 'white' : (sinComidasHoy ? '#d32f2f' : 'black'),
                  border: `1px solid ${sinComidasHoy ? '#f44336' : '#ccc'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: esSeleccionado ? 'bold' : (sinComidasHoy ? 'bold' : 'normal'),
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onClick={() => handleCambioIniciales(ini)}
                title={sinComidasHoy ? 'No ha cargado comidas hoy' : ''}
              >
                {ini}
                {sinComidasHoy && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#f44336',
                    color: 'white',
                    borderRadius: '50%',
                    width: '8px',
                    height: '8px',
                    fontSize: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botones ocultos - Comentados temporalmente
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 16 }}>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={!iniciales || isLoading} 
            style={{ 
              padding: '10px 20px', 
              fontSize: 16, 
              fontWeight: 'bold', 
              background: isLoading ? '#ccc' : '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4, 
              cursor: (iniciales && !isLoading) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Guardando...' : 'Guardar inscripción'}
          </button>
          <button 
            type="button" 
            onClick={handleMostrarComensales} 
            style={{ 
              padding: '10px 20px', 
              fontWeight: 'bold', 
              background: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {showComensales ? 'Ocultar comensales' : 'Comensales'}
          </button>
        </div>
        */}
        
        {/* Estado de sincronización (solo mostrar si hay problemas) */}
        {!googleSheetsService.isConfigured() && (
          <div style={{ 
            fontSize: '12px', 
            color: '#f44336',
            marginBottom: '8px',
            background: '#ffebee',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ffcdd2'
          }}>
            ⚠️ Google Sheets no configurado. Los datos se guardan localmente.
          </div>
        )}
        
        {/* Opción para deshabilitar Google Sheets temporalmente */}
        {googleSheetsService.isConfigured() && (
          <div style={{ 
            fontSize: '12px', 
            color: '#1976d2',
            marginBottom: '8px',
            background: '#e3f2fd',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #bbdefb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🔄 Google Sheets habilitado</span>
            <button
              onClick={() => {
                setUseGoogleSheets(false);
                mostrarMensaje('Google Sheets deshabilitado temporalmente. Los datos se guardarán solo localmente.', 'warning');
              }}
              style={{
                padding: '4px 8px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Deshabilitar
            </button>
          </div>
        )}
        
        {/* Estado de conexión (solo mostrar si hay problemas) */}
        {googleSheetsService.isConfigured() && googleSheetsService.getConnectionStatus().status !== 'connected' && (
          <div style={{ 
            fontSize: '12px', 
            color: '#f44336',
            marginBottom: '8px',
            background: '#ffebee',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ffcdd2'
          }}>
            ❌ Error de conexión con Google Sheets
          </div>
        )}
        
        {/* Mostrar cuando Google Sheets está deshabilitado */}
        {!useGoogleSheets && googleSheetsService.isConfigured() && (
          <div style={{ 
            fontSize: '12px', 
            color: '#ff9800',
            marginBottom: '8px',
            background: '#fff3e0',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ffcc02',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ Google Sheets deshabilitado temporalmente</span>
            <button
              onClick={() => {
                setUseGoogleSheets(true);
                mostrarMensaje('Google Sheets habilitado nuevamente.', 'success');
              }}
              style={{
                padding: '4px 8px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Habilitar
            </button>
          </div>
        )}
        
        {/* Información sobre el proxy server */}
        {googleSheetsService.isConfigured() && (
          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            marginBottom: '8px',
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>💡 Solución para errores de CORS:</strong>
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
              1. Abre una terminal en la carpeta del proyecto<br/>
              2. Ejecuta: <code>node proxy-server.js</code><br/>
              3. Mantén la terminal abierta mientras usas la app
            </div>
          </div>
        )}
        
        {/* Estado de sincronización */}
        {syncStatus && (
          <div style={{ 
            fontSize: '12px', 
            color: syncStatus.includes('Error') ? '#d32f2f' : '#1976d2',
            marginBottom: '8px'
          }}>
            {syncStatus}
          </div>
        )}
        
        {/* Errores de sincronización */}
        {syncErrors.length > 0 && (
          <div style={{ 
            fontSize: '12px', 
            color: '#d32f2f',
            marginBottom: '8px',
            background: '#ffebee',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Errores de sincronización:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              {syncErrors.slice(0, 3).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {syncErrors.length > 3 && (
                <li>... y {syncErrors.length - 3} errores más</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {iniciales && dias.length > 0 && !showComensales && (
        <form onSubmit={e => e.preventDefault()}>
          {dias.map((dia, idx, arr) => {
            const esFinDeSemanaDia = esFinDeSemana(dia);
            let mostrarLineaMes = false;
            if (idx < arr.length - 1) {
              const d = new Date(dia);
              const dSig = new Date(arr[idx + 1]);
              if (d.getMonth() !== dSig.getMonth()) {
                mostrarLineaMes = true;
              }
            }
            return (
              <React.Fragment key={dia}>
                <div style={{ marginBottom: 20, background: esFinDeSemanaDia ? '#f0f0f0' : undefined, borderRadius: 8, padding: esFinDeSemanaDia ? '8px 0' : 0 }}>
                  <strong style={{ display: 'block', background: esFinDeSemanaDia ? '#e0e0e0' : undefined, borderRadius: 6, padding: '4px 8px', marginBottom: 4 }}>
                    {formatearFecha(dia)}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0', background: esFinDeSemanaDia ? '#f0f0f0' : undefined }}>
                    <label style={{ minWidth: 80, marginRight: 8 }}>Almuerzo: </label>
                    {esPlanOInvitados ? (
                      <input
                        type="number"
                        min={0}
                        value={seleccion[dia]?.Almuerzo || ''}
                        onChange={e => handleInputChange(dia, 'Almuerzo', e.target.value)}
                        style={{ width: 80, padding: 4 }}
                      />
                    ) : (
                      renderBotones(opcionesAlmuerzo, dia, 'Almuerzo')
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0', background: esFinDeSemanaDia ? '#f0f0f0' : undefined }}>
                    <label style={{ minWidth: 80, marginRight: 8 }}>Cena: </label>
                    {esPlanOInvitados ? (
                      <input
                        type="number"
                        min={0}
                        value={seleccion[dia]?.Cena || ''}
                        onChange={e => handleInputChange(dia, 'Cena', e.target.value)}
                        style={{ width: 80, padding: 4 }}
                      />
                    ) : (
                      renderBotones(opcionesCena, dia, 'Cena')
                    )}
                  </div>
                </div>
                {mostrarLineaMes && <hr style={{ border: 0, borderTop: '2px solid #bbb', margin: '18px 0' }} />}
              </React.Fragment>
            );
          })}
        </form>
      )}

      {showComensales && (
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <h3>Comensales próximos 7 días</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Día</th>
                  <th>Comida (Total)</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {diasResumen.map(dia => (
                  ['Almuerzo', 'Cena'].map(comida => {
                    const desglose = resumenComensales[dia]?.[comida] || {};
                    const total = resumenComensales[dia]?.total?.[comida] || 0;
                    return (
                      <tr key={dia + comida}>
                        <td>{formatearFecha(dia)}</td>
                        <td style={{ fontWeight: 'bold' }}>{comida}: <span style={{ color: '#1976d2' }}>{total}</span></td>
                        <td>
                          {Object.entries(desglose)
                            .sort((a, b) => b[1] - a[1])
                            .map(([op, cant]) => (
                              <span key={op} style={{ marginRight: 12 }}>{op}: <b>{cant}</b></span>
                            ))}
                        </td>
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      <Modal
        isOpen={showConfig}
        onRequestClose={handleCloseConfig}
        style={{
          content: {
            maxWidth: 400,
            margin: 'auto',
            padding: 24,
            borderRadius: 8,
            zIndex: 9999,
          },
          overlay: {
            zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.4)'
          }
        }}
        contentLabel="Configuración"
      >
        {adminStep === 'clave' ? (
          <form onSubmit={handleAdminSubmit}>
            <h3>Clave de administrador</h3>
            <input
              type="password"
              value={adminClave}
              onChange={e => setAdminClave(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 12 }}
              autoFocus
            />
            {adminError && <div style={{ color: 'red', marginBottom: 8 }}>{adminError}</div>}
            <button type="submit" style={{ padding: '8px 16px', fontWeight: 'bold', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Ingresar</button>
            <button type="button" onClick={handleCloseConfig} style={{ marginLeft: 8, padding: '8px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
          </form>
        ) : (
          <div>
            <h3>Panel de configuración</h3>
            <p style={{ marginBottom: 16 }}>Acceso concedido. Herramientas de administración:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                style={{ padding: '8px 16px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowDataManager(true); setShowConfig(false); }}
              >
                📊 Gestión de Datos
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowStats(true); setShowConfig(false); }}
              >
                📊 Estadísticas
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowGoogleSheetsTest(true); setShowConfig(false); }}
              >
                🔧 Google Sheets
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowGoogleSheetsAPITest(true); setShowConfig(false); }}
              >
                🔍 Test API
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowGoogleSheetsDemo(true); setShowConfig(false); }}
              >
                🎉 Demo
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowSheetDiagnostic(true); setShowConfig(false); }}
              >
                🔍 Diagnóstico
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowSheetStructureValidator(true); setShowConfig(false); }}
              >
                🔍 Validador de Estructura
              </button>
              
              <button
                style={{ padding: '8px 16px', background: '#ff5722', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => { setShowSyncDebugger(true); setShowConfig(false); }}
              >
                🐛 Debug Sync
              </button>
            </div>
            
            <button type="button" onClick={handleCloseConfig} style={{ marginTop: 16, padding: '8px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Cerrar</button>
          </div>
        )}
      </Modal>

      {/* Modal de Gestión de Datos */}
      <Modal
        isOpen={showDataManager}
        onRequestClose={() => setShowDataManager(false)}
        style={{
          content: {
            maxWidth: 500,
            margin: 'auto',
            padding: 24,
            borderRadius: 8,
            zIndex: 9999,
          },
          overlay: {
            zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.4)'
          }
        }}
        contentLabel="Gestión de Datos"
      >
        <h3>Gestión de Datos</h3>
        <p style={{ marginBottom: 16 }}>
          Los datos se guardan localmente en tu navegador. Puedes exportarlos para hacer respaldo o importarlos en otro dispositivo.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            onClick={handleExportData}
            style={{ padding: '12px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          >
            📤 Exportar Datos
          </button>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>📥 Importar Datos:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
          
          <button 
            onClick={handleClearAllData}
            style={{ padding: '12px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          >
            🗑️ Borrar Todos los Datos
          </button>
        </div>
        
        <button 
          type="button" 
          onClick={() => setShowDataManager(false)} 
          style={{ marginTop: 16, padding: '8px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
        >
          Cerrar
        </button>
      </Modal>

      {/* Componente de Estadísticas */}
      <StatsComponent 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
      />

      {/* Componente de Diagnóstico de Google Sheets */}
      <GoogleSheetsTest 
        isOpen={showGoogleSheetsTest} 
        onClose={() => setShowGoogleSheetsTest(false)} 
      />

      {/* Componente de Test de API de Google Sheets */}
      <GoogleSheetsAPITest 
        isOpen={showGoogleSheetsAPITest} 
        onClose={() => setShowGoogleSheetsAPITest(false)} 
      />

      {/* Componente de Demo de Google Sheets */}
      <GoogleSheetsDemo 
        isOpen={showGoogleSheetsDemo} 
        onClose={() => setShowGoogleSheetsDemo(false)} 
      />

      {/* Componente de Diagnóstico de Planilla */}
      <SheetDiagnostic 
        isOpen={showSheetDiagnostic} 
        onClose={() => setShowSheetDiagnostic(false)} 
      />

      {/* Componente de Debug de Sincronización */}
      <SyncDebugger 
        isOpen={showSyncDebugger} 
        onClose={() => setShowSyncDebugger(false)}
        syncStatus={syncStatus}
        syncErrors={syncErrors}
        useGoogleSheets={useGoogleSheets}
        iniciales={iniciales}
        seleccion={seleccion}
      />

      {/* Componente de Validador de Estructura de Planilla */}
      <SheetStructureValidator 
        isOpen={showSheetStructureValidator} 
        onClose={() => setShowSheetStructureValidator(false)} 
      />


    </div>
  );
}

export default App;
