import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import Modal from 'react-modal';
import localStorageService from './services/localStorageService';
import googleSheetsService from './services/googleSheetsService';
import { formatearFecha, esFinDeSemana, agregarDias, diferenciaDias } from './utils/dateUtils';
import StatsComponent from './components/StatsComponent';
import GoogleSheetsTest from './components/GoogleSheetsTest';
import GoogleSheetsAPITest from './components/GoogleSheetsAPITest';
import GoogleSheetsDemo from './components/GoogleSheetsDemo';
import SheetDiagnostic from './components/SheetDiagnostic';
import SheetStructureValidator from './components/SheetStructureValidator';
import SyncDebugger from './components/SyncDebugger';
import PWAInstallPrompt from './components/PWAInstallPrompt';


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
  { valor: 'T', label: 'T' },
  { valor: 'RT', label: 'Reg T' },
  { valor: 'VRM', label: 'Vian R Mañ' },
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
  const [datosOriginales, setDatosOriginales] = useState({}); // Nuevo estado para datos originales
  
  // Log de inicialización
  console.log('🔄 App - datosOriginales inicializado:', {});
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
  const [mostrandoAnotadosHoy, setMostrandoAnotadosHoy] = useState(false);
  
  // Estados de carga y sincronización
  // const [isLoading, setIsLoading] = useState(false); // Variable no utilizada
  const [syncStatus, setSyncStatus] = useState('');
  const [syncErrors, setSyncErrors] = useState([]);
  const [actualizandoComidas, setActualizandoComidas] = useState(false);
  
  // Estados de UI
  const [autoSave] = useState(true); // setAutoSave no se usa // Siempre activo
  const [showStats, setShowStats] = useState(false);
  const [showGoogleSheetsTest, setShowGoogleSheetsTest] = useState(false);
  const [showHoy, setShowHoy] = useState(false);
  const [datosHoy, setDatosHoy] = useState({ almuerzo: [], cena: [] });
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
        if (googleSheetsService.isConfigured()) {
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
  }, []);



  // Cargar selección al cambiar iniciales
  useEffect(() => {
    if (!iniciales || dias.length === 0) {
      setSeleccion({});
      return;
    }

    const loadUserData = async () => {
      // setIsLoading(true); // Variable no utilizada
      setSyncErrors([]);
      
      try {
        let nuevaSel = {};
        
        if (googleSheetsService.isConfigured()) {
          // Cargar desde Google Sheets con timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout al cargar datos')), CONFIG.TIMEOUT_SYNC)
          );
          
          const dataPromise = googleSheetsService.getUserInscripciones(iniciales, dias);
          
          nuevaSel = await Promise.race([dataPromise, timeoutPromise]);
          setSyncStatus('');
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
          setSyncStatus('');
        }
        
        console.log('🔄 loadUserData - Datos cargados:', nuevaSel);
        setSeleccion(nuevaSel);
        setDatosOriginales(nuevaSel); // Guardar datos originales por separado
        console.log('🔄 loadUserData - datosOriginales establecidos:', nuevaSel);
        setTieneCambios(false);
        setActualizandoComidas(false);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSyncStatus('Error al cargar datos');
        setSyncErrors(prev => [...prev, error.message]);
        
        // Limpiar el mensaje de error después de 3 segundos
        setTimeout(() => {
          setSyncStatus('');
        }, 3000);
        
        // Fallback a localStorage si Google Sheets falla
        setMensaje('Error de sincronización. Usando modo local.');
        setMensajeTipo('warning');
      } finally {
        // setIsLoading(false); // Variable no utilizada
      }
    };

    loadUserData();
  }, [iniciales, dias]);

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
      if (googleSheetsService.isConfigured()) {
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
  }, [dias, mostrarMensaje]);

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
      if (googleSheetsService.isConfigured()) {
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
  }, [usuariosDinamicos]);

  // Detectar usuarios sin comidas al cargar la aplicación
  useEffect(() => {
    if (dias.length > 0) {
      detectarUsuariosSinComidasHoy();
    }
  }, [dias, detectarUsuariosSinComidasHoy]);

  // Función auxiliar para obtener la particularidad en formato correcto
  const obtenerParticularidad = useCallback((opcion) => {
    if (!opcion) return '';
    const mapeo = {
      'V': ' (V)',
      '12': ' (12)',
      'T': ' (T)',
      'RT': ' (RT)',
      'VRM': ' (VRM)',
      'R': ' (R)'
    };
    return mapeo[opcion] || '';
  }, []);

  // Función auxiliar para contar solo las opciones válidas (excluyendo No y VRM)
  const contarOpcionesValidas = useCallback((inscripciones) => {
    return inscripciones.filter(inscripcion => {
      const opcion = inscripcion.opcion;
      // Contar V, 12, T, RT, S (Sandwich), R (Vianda) - excluir N (No) y VRM
      return ['V', '12', 'T', 'RT', 'S', 'R'].includes(opcion);
    }).length;
  }, []);

  // Función para obtener los datos de hoy
  const obtenerDatosHoy = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const almuerzo = [];
      const cena = [];

      console.log('Obteniendo datos de Google Sheets para hoy...');
      
      // Obtener datos de Google Sheets (todos los usuarios)
      const sheetData = await googleSheetsService.getSheetData(true); // forceRefresh = true para datos frescos
      console.log('Datos de Google Sheets:', sheetData);

      if (!sheetData || sheetData.length === 0) {
        throw new Error('No se pudieron obtener datos de Google Sheets');
      }

      // La primera fila son los headers
      const headers = sheetData[0];
      console.log('Headers de la hoja:', headers);

      // Encontrar las columnas importantes
      const fechaColIndex = headers.findIndex(header => header === 'Fecha');
      const comidaColIndex = headers.findIndex(header => header === 'Comida');
      
      if (fechaColIndex === -1 || comidaColIndex === -1) {
        throw new Error('No se encontraron las columnas Fecha o Comida en la hoja');
      }

      // Filtrar solo las filas de hoy
      const filasHoy = sheetData.slice(1).filter(row => {
        const fechaFila = row[fechaColIndex];
        if (!fechaFila) return false;
        
        // DEBUG: Mostrar las primeras fechas para entender el formato
        if (sheetData.indexOf(row) <= 5) {
          console.log(`Fila ${sheetData.indexOf(row)} - Fecha: "${fechaFila}" (tipo: ${typeof fechaFila})`);
        }
        
        // Convertir fecha de la hoja a formato YYYY-MM-DD
        let fechaFormateada;
        try {
          if (fechaFila.includes('/')) {
            // Formato DD/M/YY o DD/MM/YYYY
            const partes = fechaFila.split('/');
            if (partes.length === 3) {
              const dia = partes[0];
              const mes = partes[1];
              let anio = partes[2];
              
              // Si el año tiene solo 2 dígitos, asumir siglo 21
              if (anio.length === 2) {
                anio = '20' + anio;
              }
              
              fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            } else {
              console.warn('Formato de fecha inesperado:', fechaFila);
              return false;
            }
          } else if (fechaFila.includes('-')) {
            // Formato YYYY-MM-DD
            fechaFormateada = fechaFila;
          } else {
            // Intentar parsear como Date
            const fecha = new Date(fechaFila);
            fechaFormateada = fecha.toISOString().split('T')[0];
          }
          
          // DEBUG: Mostrar la conversión
          if (sheetData.indexOf(row) <= 5) {
            console.log(`  -> Convertida a: "${fechaFormateada}"`);
            console.log(`  -> Comparando con hoy: "${hoy}"`);
            console.log(`  -> ¿Son iguales? ${fechaFormateada === hoy}`);
          }
        } catch (error) {
          console.warn('Error al parsear fecha:', fechaFila, error);
          return false;
        }
        
        return fechaFormateada === hoy;
      });

      console.log('Filas de hoy encontradas:', filasHoy);

      // DEBUG: Inspeccionar las filas de hoy
      filasHoy.forEach((row, index) => {
        console.log(`Fila de hoy ${index + 1}:`, {
          fecha: row[fechaColIndex],
          comida: row[comidaColIndex],
          valores: row.slice(3), // Columnas después de Código, Fecha, Comida
          headers: headers.slice(3)
        });
      });

      // Procesar cada fila para extraer inscripciones
      filasHoy.forEach(row => {
        const comida = row[comidaColIndex];
        if (!comida) return;

        // DEBUG: Mostrar qué valores hay en las columnas de usuarios
        console.log(`Procesando fila con comida: "${comida}"`);
        console.log('Valores en columnas de usuarios:', row.slice(3).map((valor, index) => ({
          iniciales: headers[3 + index],
          valor: valor
        })));

        // Buscar en todas las columnas (después de las columnas de fecha y comida)
        for (let colIndex = Math.max(fechaColIndex, comidaColIndex) + 1; colIndex < row.length; colIndex++) {
          const valor = row[colIndex];
          const iniciales = headers[colIndex];
          
          if (valor && iniciales && valor !== '') {
            // Determinar la opción basándose en el valor
            let opcion = '';
            if (valor === 'V' || valor === 'v') opcion = 'V';
            else if (valor === '12') opcion = '12';
            else if (valor === 'T' || valor === 't') opcion = 'T';
            else if (valor === 'RT' || valor === 'rt') opcion = 'RT';
            else if (valor === 'VRM' || valor === 'vrm') opcion = 'VRM';
            else if (valor === 'S' || valor === 's' || valor === 'N' || valor === 'n' || valor === 'R' || valor === 'r') {
              opcion = valor.toUpperCase();
            }

            const inscripcion = {
              iniciales: iniciales,
              opcion: opcion,
              comida: comida
            };

            // Comparar con abreviaciones y nombres completos
            if (comida === 'Almuerzo' || comida === 'A' || comida === 'a') {
              almuerzo.push(inscripcion);
            } else if (comida === 'Cena' || comida === 'C' || comida === 'c') {
              cena.push(inscripcion);
            }
          }
        }
      });

      console.log('Inscripciones de almuerzo encontradas:', almuerzo);
      console.log('Inscripciones de cena encontradas:', cena);

      // Función para ordenar según las reglas especificadas
      const ordenarInscripciones = (inscripciones) => {
        const orden = { 'V': 1, '12': 2, 'S': 3, 'R': 3, 'N': 3, 'T': 4, 'RT': 4, 'VRM': 4 };
        return inscripciones.sort((a, b) => {
          const ordenA = orden[a.opcion] || 5;
          const ordenB = orden[b.opcion] || 5;
          if (ordenA !== ordenB) return ordenA - ordenB;
          return a.iniciales.localeCompare(b.iniciales);
        });
      };

      // Ordenar y formatear almuerzo (excluir los que tienen opción "N")
      const almuerzoOrdenado = ordenarInscripciones(almuerzo);
      const almuerzoFormateado = almuerzoOrdenado
        .filter(inscripcion => inscripcion.opcion !== 'N')
        .map(inscripcion => {
          const particularidad = obtenerParticularidad(inscripcion.opcion);
          return `${inscripcion.iniciales}${particularidad}`;
        });

      // Ordenar y formatear cena (excluir los que tienen opción "N")
      const cenaOrdenada = ordenarInscripciones(cena);
      const cenaFormateada = cenaOrdenada
        .filter(inscripcion => inscripcion.opcion !== 'N')
        .map(inscripcion => {
          const particularidad = obtenerParticularidad(inscripcion.opcion);
          return `${inscripcion.iniciales}${particularidad}`;
        });

      console.log('Almuerzo formateado:', almuerzoFormateado);
      console.log('Cena formateada:', cenaFormateada);

      setDatosHoy({ 
        almuerzo: almuerzoFormateado, 
        cena: cenaFormateada,
        almuerzoInscripciones: almuerzoOrdenado,
        cenaInscripciones: cenaOrdenada
      });
      setMostrandoAnotadosHoy(true);
      setShowHoy(false);
    } catch (error) {
      console.error('Error al obtener datos de hoy:', error);
      mostrarMensaje('Error al obtener datos de hoy: ' + error.message, 'error');
    }
  }, [mostrarMensaje, obtenerParticularidad]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    console.log('🚀 handleSubmit iniciado');
    
    if (!iniciales || !validarIniciales(iniciales)) {
      console.log('❌ Validación fallida - iniciales:', iniciales);
      mostrarMensaje('Por favor selecciona un usuario válido', 'error');
      return;
    }
    
    console.log('✅ Validación exitosa, procediendo con guardado...');
    console.log('📊 Datos originales:', datosOriginales);
    console.log('📊 Estado actual seleccion:', seleccion);
    console.log('🔍 DEBUG - Comparación detallada:');
    Object.keys(seleccion).forEach(dia => {
      console.log(`  ${dia}:`, {
        original: datosOriginales[dia],
        actual: seleccion[dia],
        almuerzoCambio: datosOriginales[dia]?.Almuerzo !== seleccion[dia]?.Almuerzo,
        cenaCambio: datosOriginales[dia]?.Cena !== seleccion[dia]?.Cena
      });
    });
    setMensaje('');
    // setIsLoading(true); // Variable no utilizada
    setSyncErrors([]);
    
    // Activar estado de actualización
    setActualizandoComidas(true);
    setSyncStatus('Actualizando cambios...');

    const tipoUsuario = deducirTipoUsuario(iniciales);
    let guardados = 0;
    // let registrosGuardados = 0; // Variable no utilizada
    let errores = [];

    try {
      console.log('🔄 Obteniendo datos existentes de Google Sheets...');
      // Obtener datos existentes de Google Sheets para comparar
      let datosExistentes = {};
      const config = googleSheetsService.isConfigured();
      console.log(`🔍 DEBUG - Google Sheets configurado para lectura:`, config);
      if (config.read) {
        try {
          datosExistentes = await googleSheetsService.getUserInscripciones(iniciales, dias);
          console.log('✅ Datos existentes obtenidos:', datosExistentes);
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener datos existentes de Google Sheets:', error);
        }
      } else {
        console.log('ℹ️ Google Sheets no está configurado, solo guardando localmente');
      }
      
      console.log('🔄 Procesando días y comidas...');
      for (const dia of dias) {
        for (const comida of ['Almuerzo', 'Cena']) {
          const opcion = seleccion[dia]?.[comida] || '';
          console.log(`📝 Procesando ${dia} ${comida}: "${opcion}"`);
          
          // Procesar tanto comidas marcadas como desmarcadas
          const inscripcion = {
            fecha: dia,
            comida,
            iniciales,
            tipoUsuario,
            opcion,
          };
          
          // Verificar si el valor ha cambiado comparando con datos originales
          const valorOriginal = datosOriginales[dia]?.[comida] || '';
          const haCambiado = valorOriginal !== opcion;
          console.log(`🔄 ${dia} ${comida} - Cambió: ${haCambiado} (era: "${valorOriginal}", ahora: "${opcion}")`);
          console.log(`🔍 DEBUG - datosOriginales[${dia}]:`, datosOriginales[dia]);
          console.log(`🔍 DEBUG - seleccion[${dia}]:`, seleccion[dia]);
          
          // Solo guardar en localStorage si hay un valor o si había un valor antes
          if (opcion || valorOriginal) {
            console.log('💾 Guardando inscripción:', inscripcion);
            if (localStorageService.saveInscripcion(inscripcion)) {
              guardados++;
              console.log('✅ Inscripción guardada localmente:', inscripcion);
            } else {
              errores.push(`Error al guardar ${dia} ${comida} localmente`);
              console.log('❌ Error al guardar localmente:', inscripcion);
            }
            
            // Verificar configuración de Google Sheets
            const config = googleSheetsService.isConfigured();
            console.log(`🔍 DEBUG - Google Sheets configurado:`, config);
            
            // Guardar en Google Sheets solo si ha cambiado
            if (config.write && haCambiado) {
              try {
                console.log(`🔄 Sincronizando cambio en Google Sheets: ${dia} ${comida} - ${iniciales} = ${opcion} (era: "${valorOriginal}")`);
                await googleSheetsService.saveInscripcion(inscripcion);
                console.log(`✅ Sincronizado exitosamente en Google Sheets: ${dia} ${comida}`);
                
                // Actualizar datos originales SOLO para esta comida específica después de sincronizar exitosamente
                setDatosOriginales(prev => ({
                  ...prev,
                  [dia]: {
                    ...prev[dia],
                    [comida]: opcion
                  }
                }));
                
                // registrosGuardados++; // Variable no utilizada
              } catch (error) {
                console.error(`❌ Error sincronizando en Google Sheets: ${dia} ${comida}`, error);
                errores.push(`Error en ${dia} ${comida}: ${error.message}`);
              }
            } else if (googleSheetsService.isConfigured() && !haCambiado) {
              console.log(`✅ ${dia} ${comida} ya está sincronizado con Google Sheets (valor: "${opcion}")`);
            }
          } else {
            console.log(`⏭️ ${dia} ${comida} - Sin valor, saltando...`);
          }
        }
      }

      console.log(`🎯 Procesamiento completado. Guardados: ${guardados}, Errores: ${errores.length}`);
      
      if (guardados > 0) {
        // Mostrar mensaje de éxito brevemente
        setSyncStatus(errores.length > 0 ? 'Guardado con algunos errores' : 'Sincronizado correctamente');
        setTieneCambios(false);
        
        // NO actualizar datos originales aquí - deben mantenerse para futuras comparaciones
        // setDatosOriginales(seleccion);
        
        // Limpiar el mensaje de sincronización después de 2 segundos
        setTimeout(() => {
          setSyncStatus('');
        }, 2000);
        
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
        // Si no hay cambios, limpiar inmediatamente el estado de actualización
        setSyncStatus('');
      }
      
      if (errores.length > 0) {
        setSyncErrors(errores);
      }
      
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      mostrarMensaje('Error al guardar los datos.', 'error');
      setSyncStatus('Error de sincronización');
      
      // Limpiar el mensaje de error después de 3 segundos
      setTimeout(() => {
        setSyncStatus('');
      }, 3000);
    } finally {
      console.log('🏁 handleSubmit finalizado - estableciendo actualizandoComidas en false');
      // setIsLoading(false); // Variable no utilizada
      setActualizandoComidas(false);
      console.log('✅ actualizandoComidas establecido en false');
      
      // Si no hay mensaje de error o éxito, limpiar el estado de sincronización
      if (!syncStatus || syncStatus === 'Actualizando cambios...') {
        setSyncStatus('');
      }
    }
  }, [iniciales, dias, seleccion, datosOriginales, mostrarMensaje, detectarUsuariosSinComidasHoy, calcularResumenComensales, showComensales, syncStatus]);

  // Auto-save cuando hay cambios
  useEffect(() => {
    if (autoSave && tieneCambios && iniciales) {
      const timeoutId = setTimeout(() => {
        console.log('🔄 Auto-save ejecutándose después de 2 segundos...');
        handleSubmit();
      }, 2000); // Auto-save después de 2 segundos sin cambios
      
      return () => clearTimeout(timeoutId);
    }
  }, [seleccion, autoSave, tieneCambios, iniciales, handleSubmit]);

  const handleChange = useCallback((dia, comida, valor) => {
    if (!iniciales) {
      mostrarMensaje('Selecciona un usuario primero', 'error');
      return;
    }

    if (!validarOpcion(valor, comida)) {
      mostrarMensaje('Opción no válida para esta comida', 'error');
      return;
    }

    console.log(`🔄 handleChange: ${dia} ${comida} - Valor anterior: "${seleccion[dia]?.[comida] || ''}", Nuevo valor: "${valor}"`);

    // Si se presiona el mismo botón, desmarcar
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
    setActualizandoComidas(false); // Cambiar a false para permitir guardar
    
    console.log('✅ handleChange completado - tieneCambios establecido en true, actualizandoComidas en false');
    
    // NO llamar automáticamente a handleSubmit - dejar que el usuario guarde manualmente
    // console.log('🔄 Cambio detectado, guardando automáticamente...');
    // setTimeout(() => {
    //   handleSubmit();
    // }, 100); // Pequeño delay para asegurar que el estado se actualice
  }, [mostrarMensaje, seleccion, iniciales]);

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





  const handleCambioIniciales = useCallback((ini) => {
    // Si se presiona el botón ya seleccionado, deseleccionar
    if (iniciales === ini) {
      setSeleccion({});
      setIniciales('');
      setMensaje('');
      setShowComensales(false);
      setSyncErrors([]);
      setActualizandoComidas(false);
      return;
    }
    
    // Si hay cambios pendientes, preguntar antes de cambiar
    if (tieneCambios) {
      if (window.confirm('¿Querés guardar los cambios antes de cambiar de usuario?')) {
        // Usar una función local para evitar dependencias circulares
        const guardarCambios = async () => {
          if (!iniciales || !validarIniciales(iniciales)) {
            mostrarMensaje('Por favor selecciona un usuario válido', 'error');
            return;
          }
          
          setMensaje('');
          setSyncErrors([]);
          
          const tipoUsuario = deducirTipoUsuario(iniciales);
          let guardados = 0;
          let errores = [];
          
          try {
            // Obtener datos existentes de Google Sheets para comparar
            let datosExistentes = {};
            if (googleSheetsService.isConfigured()) {
              try {
                datosExistentes = await googleSheetsService.getUserInscripciones(iniciales, dias);
              } catch (error) {
                console.warn('No se pudieron obtener datos existentes de Google Sheets:', error);
              }
            }
            
            for (const dia of dias) {
              for (const comida of ['Almuerzo', 'Cena']) {
                const opcion = seleccion[dia]?.[comida] || '';
                // Procesar tanto comidas marcadas como desmarcadas
                const inscripcion = {
                  fecha: dia,
                  comida,
                  iniciales,
                  tipoUsuario,
                  opcion,
                };
                
                // Verificar si el valor ha cambiado
                const valorExistente = datosExistentes[dia]?.[comida] || '';
                const haCambiado = valorExistente !== opcion;
                
                // Solo guardar en localStorage si hay un valor o si había un valor antes
                if (opcion || valorExistente) {
                  console.log('💾 Guardando inscripción:', inscripcion);
                  if (localStorageService.saveInscripcion(inscripcion)) {
                    guardados++;
                    console.log('✅ Inscripción guardada localmente:', inscripcion);
                  } else {
                    errores.push(`Error al guardar ${dia} ${comida} localmente`);
                    console.log('❌ Error al guardar localmente:', inscripcion);
                  }
                  
                  // Guardar en Google Sheets solo si ha cambiado
                  if (googleSheetsService.isConfigured() && haCambiado) {
                    try {
                      console.log(`🔄 Sincronizando cambio en Google Sheets: ${dia} ${comida} - ${iniciales} = ${opcion} (era: "${valorExistente}")`);
                      await googleSheetsService.saveInscripcion(inscripcion);
                      console.log(`✅ Sincronizado exitosamente en Google Sheets: ${dia} ${comida}`);
                    } catch (error) {
                      console.error(`❌ Error sincronizando en Google Sheets: ${dia} ${comida}`, error);
                      errores.push(`Error en ${dia} ${comida}: ${error.message}`);
                    }
                  } else if (googleSheetsService.isConfigured() && !haCambiado) {
                    console.log(`✅ ${dia} ${comida} ya está sincronizado con Google Sheets (valor: "${opcion}")`);
                  }
                }
              }
            }
            
            if (guardados > 0) {
              setSyncStatus(errores.length > 0 ? 'Guardado con algunos errores' : 'Sincronizado correctamente');
              setTieneCambios(false);
              
              // Limpiar el mensaje de sincronización después de 3 segundos
              setTimeout(() => {
                setSyncStatus('');
              }, 3000);
              
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
            console.error('Error al guardar cambios:', error);
            mostrarMensaje('Error al guardar cambios: ' + error.message, 'error');
            setSyncErrors([`Error general: ${error.message}`]);
          } finally {
            setActualizandoComidas(false);
          }
        };
        
        guardarCambios();
      }
    }
    setSeleccion({});
    setIniciales(ini);
    setMensaje('');
    setShowComensales(false);
    setSyncErrors([]);
    setActualizandoComidas(false);
  }, [tieneCambios, iniciales, dias, seleccion, mostrarMensaje, detectarUsuariosSinComidasHoy, calcularResumenComensales, showComensales]);

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

  // Copiar selección de los primeros 7 días a los siguientes 7 días
  const handleRepetirSemana = useCallback(async () => {
    console.log('=== handleRepetirSemana START ===');
    console.log('Function called at:', new Date().toISOString());
    console.log('Current iniciales:', iniciales);
    console.log('Current dias:', dias);
    console.log('Current seleccion:', seleccion);
    
    // Declarar tipoUsuario al inicio para evitar errores de inicialización
    const tipoUsuario = deducirTipoUsuario(iniciales);
    console.log('Deduced tipoUsuario:', tipoUsuario);
    
    try {
      if (!iniciales || !validarIniciales(iniciales)) {
        console.log('Validation failed - iniciales:', iniciales, 'valid:', validarIniciales(iniciales));
        mostrarMensaje('Selecciona un usuario válido primero', 'error');
        return;
      }

      console.log('Setting actualizandoComidas to true');
      setActualizandoComidas(true);

      // 1) Obtener inscripciones del usuario desde almacenamiento (pueden incluir días pasados)
      console.log('Getting inscriptions for user:', iniciales);
      const inscripcionesUsuario = localStorageService.getInscripcionesByIniciales(iniciales) || [];
      console.log('Found inscriptions:', inscripcionesUsuario.length);
      if (inscripcionesUsuario.length === 0) {
        console.log('No inscriptions found, showing warning');
        mostrarMensaje('No hay inscripciones previas para copiar', 'warning');
        return;
      }

      // 2) Armar mapa fecha -> { Almuerzo, Cena } desde LocalStorage
      const porFecha = {};
      for (const item of inscripcionesUsuario) {
        const fechaISO = item.fecha;
        if (!porFecha[fechaISO]) porFecha[fechaISO] = { Almuerzo: '', Cena: '' };
        if (item.comida === 'Almuerzo') porFecha[fechaISO].Almuerzo = item.opcion ?? '';
        if (item.comida === 'Cena') porFecha[fechaISO].Cena = item.opcion ?? '';
      }

      // 2.b) Si Google Sheets está configurado para lectura, fusionar con histórico de Sheets (incluye días pasados no visibles)
      try {
        const cfg = googleSheetsService.isConfigured();
        if (cfg && cfg.read) {
          const sheetData = await googleSheetsService.getSheetData();
          const userCol = googleSheetsService.findUserColumn(sheetData, iniciales);
          if (userCol) {
            for (let row = 1; row < sheetData.length; row++) {
              const rowData = sheetData[row];
              if (!rowData || rowData.length < 3) continue;
              const fechaISO = googleSheetsService.parseDate(rowData[1]);
              const tipo = rowData[2] ? rowData[2].toString().trim().toUpperCase() : '';
              if (!fechaISO || (tipo !== 'A' && tipo !== 'C')) continue;
              const valor = rowData[userCol.col] ? rowData[userCol.col].toString().trim() : '';
              if (!porFecha[fechaISO]) porFecha[fechaISO] = { Almuerzo: '', Cena: '' };
              if (valor !== '') {
                if (tipo === 'A') porFecha[fechaISO].Almuerzo = porFecha[fechaISO].Almuerzo || valor;
                if (tipo === 'C') porFecha[fechaISO].Cena = porFecha[fechaISO].Cena || valor;
              }
            }
          }
        }
      } catch (e) {
        console.warn('No se pudieron leer inscripciones históricas de Google Sheets:', e);
      }

      // 3) Fechas con alguna selección hecha
      console.log('Processing dates with selections');
      const fechasOrdenadas = Object.keys(porFecha).sort(); // ISO ordena cronológicamente
      const fechasConSeleccion = fechasOrdenadas.filter(f => {
        const v = porFecha[f];
        return (v.Almuerzo ?? '') !== '' || (v.Cena ?? '') !== '';
      });
      console.log('Dates with selections:', fechasConSeleccion.length, 'of', fechasOrdenadas.length);
      console.log('All dates with selections:', fechasConSeleccion);

      if (fechasConSeleccion.length < 7) {
        console.log('Not enough days with selections, showing warning');
        mostrarMensaje('Necesitas al menos 7 días con selección para repetir', 'warning');
        return;
      }

      // 4) Últimos 7 con selección como origen
      const origenDias = fechasConSeleccion.slice(-7);
      const ultimaFechaOrigen = origenDias[origenDias.length - 1];
      console.log('=== ORIGIN DATES ANALYSIS ===');
      console.log('Last 7 dates with selections (origenDias):', origenDias);
      console.log('Last date with selection (ultimaFechaOrigen):', ultimaFechaOrigen);
      console.log('First date in origin (origenDias[0]):', origenDias[0]);
      console.log('Origin date range:', `${origenDias[0]} to ${ultimaFechaOrigen}`);

      // 5) Encontrar los próximos 7 días consecutivos que estén vacíos
      let destinos = [];
      let fechaActual = agregarDias(ultimaFechaOrigen, 1); // Empezar desde el día siguiente
      console.log('=== DESTINATION DATES ANALYSIS ===');
      console.log('Starting search from date (ultimaFechaOrigen + 1):', fechaActual);
      
      // Cambio: En lugar de buscar días vacíos, tomar los próximos 7 días consecutivos
      for (let i = 0; i < 7; i++) {
        destinos.push(fechaActual);
        console.log(`Added ${fechaActual} to destinations (day ${i + 1} after last selection)`);
        fechaActual = agregarDias(fechaActual, 1);
      }
      
      console.log('Final destination dates:', destinos);
      console.log('Destination date range:', `${destinos[0]} to ${destinos[destinos.length - 1]}`);
      
      // Calculate the expected gap
      const expectedGap = diferenciaDias(origenDias[0], destinos[0]);
      console.log('Expected gap between origin and destination:', expectedGap, 'days');
      console.log('This represents approximately', Math.round(expectedGap / 7), 'weeks');

      // 6) Aplicar copia: persistir en storage y reflejar en UI para días visibles
      console.log('Starting copy process...');
      console.log('Origin dates:', origenDias);
      console.log('Destination dates:', destinos);
      
      // Mostrar advertencia si se van a sobrescribir selecciones existentes
      const diasConSeleccionesExistentes = destinos.filter(fecha => {
        const diaExistente = localStorageService.getInscripcionesByDate(fecha);
        return diaExistente && diaExistente.some(insc => 
          insc.iniciales === iniciales && 
          ((insc.comida === 'Almuerzo' && insc.opcion) || (insc.comida === 'Cena' && insc.opcion))
        );
      });
      
      if (diasConSeleccionesExistentes.length > 0) {
        console.log('Warning: Will overwrite existing selections on dates:', diasConSeleccionesExistentes);
        mostrarMensaje(`Advertencia: Se sobrescribirán selecciones existentes en ${diasConSeleccionesExistentes.length} días`, 'warning');
      }
      
      flushSync(() => {
        setSeleccion((prev) => {
          const nueva = { ...prev };
          for (let i = 0; i < destinos.length; i++) {
            const srcFecha = origenDias[i];
            const dstFecha = destinos[i];
            const { Almuerzo, Cena } = porFecha[srcFecha] || { Almuerzo: '', Cena: '' };

            console.log(`Copying from ${srcFecha} to ${dstFecha}: Almuerzo="${Almuerzo}", Cena="${Cena}"`);

            if (dias.includes(dstFecha)) {
              nueva[dstFecha] = { Almuerzo: Almuerzo ?? '', Cena: Cena ?? '' };
              console.log(`Updated UI for ${dstFecha}`);
            }

            if ((Almuerzo ?? '') !== '') {
              console.log(`Saving Almuerzo for ${dstFecha}: ${Almuerzo}`);
              localStorageService.saveInscripcion({
                fecha: dstFecha,
                comida: 'Almuerzo',
                iniciales,
                tipoUsuario,
                opcion: Almuerzo,
              });
            }
            if ((Cena ?? '') !== '') {
              console.log(`Saving Cena for ${dstFecha}: ${Cena}`);
              localStorageService.saveInscripcion({
                fecha: dstFecha,
                comida: 'Cena',
                iniciales,
                tipoUsuario,
                opcion: Cena,
              });
            }
          }
          return nueva;
        });
        setTieneCambios(true);
      });

      console.log('Successfully processed, saving to localStorage and calling handleSubmit');
      mostrarMensaje(`Copiados 7 días a los siguientes 7 días consecutivos (${destinos[0]} a ${destinos[destinos.length - 1]}). Guardando...`, 'info');
      
      // Guardar directamente en localStorage para asegurar que se persistan todas las fechas
      // (handleSubmit solo procesa las fechas visibles en el array 'dias')
      let guardados = 0;
      
      for (let i = 0; i < destinos.length; i++) {
        const srcFecha = origenDias[i];
        const dstFecha = destinos[i];
        const { Almuerzo, Cena } = porFecha[srcFecha] || { Almuerzo: '', Cena: '' };

        if ((Almuerzo ?? '') !== '') {
          console.log(`Saving Almuerzo for ${dstFecha}: ${Almuerzo}`);
          if (localStorageService.saveInscripcion({
            fecha: dstFecha,
            comida: 'Almuerzo',
            iniciales,
            tipoUsuario,
            opcion: Almuerzo,
          })) {
            guardados++;
          }
        }
        if ((Cena ?? '') !== '') {
          console.log(`Saving Cena for ${dstFecha}: ${Cena}`);
          if (localStorageService.saveInscripcion({
            fecha: dstFecha,
            comida: 'Cena',
            iniciales,
            tipoUsuario,
            opcion: Cena,
          })) {
            guardados++;
          }
        }
      }
      
      console.log(`Successfully saved ${guardados} inscriptions to localStorage`);
      
      // Ahora llamar a handleSubmit para sincronizar con Google Sheets (solo para fechas visibles)
      handleSubmit();
    } catch (error) {
      console.error('Error repitiendo semana:', error);
      mostrarMensaje('Error al repetir la semana', 'error');
    } finally {
      console.log('Setting actualizandoComidas to false');
      setActualizandoComidas(false);
    }
  }, [iniciales, dias, mostrarMensaje, handleSubmit, seleccion]);

  const renderBotones = useCallback((opciones, dia, comida) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
      {opciones.map(op => {
        const isSelected = seleccion[dia]?.[comida] === op.valor;
        return (
          <button
            key={op.valor}
            type="button"
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 'normal',
              borderRadius: '8px',
              border: isSelected ? '2px solid #1976d2' : '2px solid #e8d5c4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: isSelected 
                ? 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)'
                : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              color: isSelected ? 'white' : '#2c1810',
              boxShadow: isSelected ? '0 4px 16px rgba(25, 118, 210, 0.2)' : 'none',
              transform: isSelected ? 'translateY(-1px)' : 'none',
            }}
            onClick={() => handleChange(dia, comida, op.valor)}
            title={isSelected ? 'Presiona para borrar' : `Seleccionar ${op.label}`}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.target.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                e.target.style.borderColor = '#1976d2';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.target.style.background = 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)';
                e.target.style.borderColor = '#e8d5c4';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
              }
            }}
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
    // Auto-cerrar después de 1 segundo
    useEffect(() => {
      if (message) {
        const timer = setTimeout(() => {
          onClose();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [message, onClose]);
    
    if (!message) return null;
    
    return (
      <div className={`notification ${type}`} style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        maxWidth: 400,
        animation: 'slideIn 0.3s ease',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Partículas de fondo */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header con ícono de plato */}
      <header className="app-header">
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '0 40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 className="app-title" style={{ fontSize: '2rem' }}>
            <span className="plate-icon">🍽️</span>
            Comidas de Arboleda
          </h1>
        </div>
      </header>

      {/* Notificación */}
      <Notification 
        message={mensaje} 
        type={mensajeTipo} 
        onClose={() => setMensaje('')} 
      />

      <div className="app-container" style={{ 
        marginTop: '5px',
        margin: '0px auto 0 auto',
        maxWidth: '900px',
        position: 'relative',
        padding: '0 25px'
      }}>
        {/* Header con título y botones alineados */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2px',
          padding: '0 10px',
          position: 'sticky',
          top: '0',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 12px 12px'
        }}>
          <a
            href="https://docs.google.com/spreadsheets/d/1WrFLSer4NyYDjmuPqvyhagsWfoAr1NkgY7HQyHjF7a8/edit?gid=215982293"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ 
              textDecoration: 'none',
              padding: '10px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title="Planilla"
          >
            📊
          </a>

          {!iniciales ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%'
            }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '16px' }}>
                👥 Selecciona tus iniciales
              </h3>
              
              {/* Botón Hoy - solo visible cuando se muestran todas las iniciales y no se está mostrando la vista Hoy */}
              {!mostrandoAnotadosHoy && (
                <button
                  type="button"
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #ff6b35',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.2)',
                    transform: 'translateY(-1px)',
                    fontWeight: 'bold',
                  }}
                  onClick={obtenerDatosHoy}
                  title="Ver anotados para hoy"
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #e55a2b 0%, #ff6b35 100%)';
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(255, 107, 53, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 107, 53, 0.2)';
                  }}
                >
                  Hoy
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              minHeight: '24px', // Mantener altura similar al mensaje
              width: '100%'
            }}>
              {/* Botón de las iniciales seleccionadas */}
              <button
                type="button"
                style={{
                  position: 'relative',
                  fontSize: '13px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #1976d2',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(25, 118, 210, 0.2)',
                  transform: 'translateY(-1px)',
                  fontWeight: 'bold',
                }}
                onClick={() => handleCambioIniciales(iniciales)}
                title="Cambiar iniciales"
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)';
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
                }}
              >
                {iniciales}
              </button>



              {/* Mensajes de estado en el centro */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                margin: '0 16px'
              }}>
                {actualizandoComidas && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    border: '2px solid #1976d2',
                    borderRadius: '8px',
                    color: '#1976d2',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    🔄 Actualizando comidas...
                  </div>
                )}
                
                {syncStatus && syncStatus.includes('Sincronizado') && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    border: '2px solid #4caf50',
                    borderRadius: '8px',
                    color: '#2e7d32',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    ✅ Sincronización completada
                  </div>
                )}
              </div>
              
              {/* Botón Repetir 7 días */}
              <button
                type="button"
                onClick={() => {
                  console.log('=== Repetir 7 días button clicked ===');
                  console.log('Click event timestamp:', new Date().toISOString());
                  console.log('About to call handleRepetirSemana...');
                  handleRepetirSemana();
                  console.log('handleRepetirSemana called successfully');
                }}
                title="Copiar los últimos 7 días con selección a los próximos 7"
                style={{
                  display: 'none', // Botón oculto temporalmente
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e8d5c4',
                  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  color: '#2c1810',
                  fontWeight: 'normal',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                  e.target.style.borderColor = '#1976d2';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span style={{ lineHeight: 1.1, textAlign: 'center' }}>Repetir</span>
                <span style={{ fontSize: 12, opacity: 0.95 }}>7 días</span>
              </button>
            </div>
          )}

          <button
            onClick={handleOpenConfig}
            style={{
              padding: '10px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: 'var(--primary-color)'
            }}
            title="Configuración"
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.color = '#e55a2b';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.color = 'var(--primary-color)';
            }}
          >
            ⚙️
          </button>
        </div>

      <div className="card" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        paddingBottom: 8, 
        marginBottom: 8,
        marginTop: '8px',
        background: 'var(--card-background)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginBottom: 12
        }}>
          {(usuariosDinamicos.length > 0 ? usuariosDinamicos : inicialesLista).map(ini => {
            const sinComidasHoy = usuariosSinComidasHoy.includes(ini);
            const esSeleccionado = ini === iniciales;
            const mostrarBoton = !iniciales && !mostrandoAnotadosHoy; // Solo mostrar si no hay selección de iniciales y no se está mostrando la vista Hoy
            
            if (!mostrarBoton) return null;
            
            return (
              <button
                key={ini}
                type="button"
                style={{
                  position: 'relative',
                  fontSize: '13px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: esSeleccionado ? '2px solid #1976d2' : '2px solid #e8d5c4',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: esSeleccionado 
                    ? 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)'
                    : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  color: esSeleccionado ? 'white' : '#2c1810',
                  boxShadow: esSeleccionado ? '0 4px 16px rgba(25, 118, 210, 0.2)' : 'none',
                  transform: esSeleccionado ? 'translateY(-1px)' : 'none',
                  fontWeight: esSeleccionado ? 'bold' : 'normal',
                }}
                onClick={() => handleCambioIniciales(ini)}
                title={sinComidasHoy ? 'No ha cargado comidas hoy' : ''}
                onMouseEnter={(e) => {
                  if (!esSeleccionado) {
                    e.target.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                    e.target.style.borderColor = '#1976d2';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
                  } else {
                    e.target.style.background = 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)';
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!esSeleccionado) {
                    e.target.style.background = 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)';
                    e.target.style.borderColor = '#e8d5c4';
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = 'none';
                  } else {
                    e.target.style.background = 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.2)';
                  }
                }}
              >
                {ini}
                {sinComidasHoy && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#f44336',
                    color: 'white',
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Vista de Anotados para Hoy */}
        {mostrandoAnotadosHoy && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: 'var(--card-background)',
            border: '2px solid var(--primary-color)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: 'var(--primary-color)', 
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                📅 Anotados para hoy
              </h3>
              
              <button
                type="button"
                onClick={() => setMostrandoAnotadosHoy(false)}
                style={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #666',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(135deg, #666 0%, #999 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
                title="Volver a selección de iniciales"
              >
                ← Volver
              </button>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px'
            }}>
              {/* Almuerzo */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                border: '2px solid #4caf50',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.2)'
              }}>
                <h4 style={{ 
                  color: '#2e7d32', 
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                                     🍽️ Almuerzo <span style={{ 
                     fontSize: '14px', 
                     color: '#1b5e20', 
                     fontWeight: 'normal',
                     opacity: '0.8'
                   }}>({datosHoy.almuerzoInscripciones ? contarOpcionesValidas(datosHoy.almuerzoInscripciones) : datosHoy.almuerzo.length})</span>
                </h4>
                {datosHoy.almuerzo.length > 0 ? (
                  <div style={{
                    fontSize: '15px',
                    color: '#2e7d32',
                    fontWeight: '500',
                    lineHeight: '1.6'
                  }}>
                    {datosHoy.almuerzo.join(', ')}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '15px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    No hay anotados para almuerzo
                  </div>
                )}
              </div>
              
              {/* Cena */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                border: '2px solid #ff9800',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(255, 152, 0, 0.2)'
              }}>
                <h4 style={{ 
                  color: '#e65100', 
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                                     🌙 Cena <span style={{ 
                     fontSize: '14px', 
                     color: '#bf360c', 
                     fontWeight: 'normal',
                     opacity: '0.8'
                   }}>({datosHoy.cenaInscripciones ? contarOpcionesValidas(datosHoy.cenaInscripciones) : datosHoy.cena.length})</span>
                </h4>
                {datosHoy.cena.length > 0 ? (
                  <div style={{
                    fontSize: '15px',
                    color: '#e65100',
                    fontWeight: '500',
                    lineHeight: '1.6'
                  }}>
                    {datosHoy.cena.join(', ')}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '15px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    No hay anotados para cena
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción - OCULTOS */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 16 }}>
          <button 
            type="button" 
            onClick={() => {
              console.log('🖱️ Botón Guardar cambios clickeado');
              console.log('🔍 Estado actual - tieneCambios:', tieneCambios, 'actualizandoComidas:', actualizandoComidas);
              handleSubmit();
            }} 
            disabled={!iniciales || actualizandoComidas} 
            style={{ 
              padding: '10px 20px', 
              fontSize: 16, 
              fontWeight: 'bold', 
              background: actualizandoComidas ? '#ccc' : (tieneCambios ? '#f57c00' : '#1976d2'), 
              color: 'white', 
              border: 'none', 
              borderRadius: 4, 
              cursor: (iniciales && !actualizandoComidas) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            {actualizandoComidas ? 'Guardando...' : (tieneCambios ? '💾 Guardar cambios' : 'Guardar cambios')}
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
          {tieneCambios && (
            <span style={{ 
              color: '#f57c00', 
              fontSize: '14px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚠️ Cambios pendientes
            </span>
          )}
        </div> */}
        
        {/* Estado de sincronización (solo mostrar si hay problemas) */}
        {!googleSheetsService.isConfigured() && (
          <div className="notification warning" style={{ 
            position: 'static',
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            ⚠️ Google Sheets no configurado. Los datos se guardan localmente.
          </div>
        )}
        
        {/* Estado de sincronización */}
        {(syncStatus || actualizandoComidas) && (
          <div style={{ 
            fontSize: '14px', 
            color: syncStatus.includes('Error') ? 'var(--error-color)' : 
                   actualizandoComidas ? 'var(--accent-color)' : 'var(--primary-color)',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            {actualizandoComidas ? 'Actualizando cambios...' : syncStatus}
          </div>
        )}
        
        {/* Errores de sincronización */}
        {syncErrors.length > 0 && (
          <div className="notification error" style={{ 
            position: 'static',
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            <strong>Errores de sincronización:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
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
                <hr style={{ 
                  border: 0, 
                  borderTop: '2px solid #ccc', 
                  margin: '6px 0', 
                  borderRadius: '1px',
                  opacity: 1
                }} />
                <div className="card" style={{ 
                  marginBottom: 8, 
                  padding: '8px',
                  background: esFinDeSemanaDia ? 'rgba(255, 107, 53, 0.05)' : undefined,
                  border: esFinDeSemanaDia ? '2px solid var(--accent-color)' : undefined
                }}>
                  <div className="card-header">
                    <strong style={{ 
                      display: 'block', 
                      color: esFinDeSemanaDia ? 'var(--primary-color)' : 'var(--text-primary)',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {formatearFecha(dia)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                    <label style={{ minWidth: 80, marginRight: 6, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      🍽️ Alm
                    </label>
                    {esPlanOInvitados ? (
                      <input
                        type="number"
                        min={0}
                        value={seleccion[dia]?.Almuerzo || ''}
                        onChange={e => handleInputChange(dia, 'Almuerzo', e.target.value)}
                        className="form-input"
                        style={{ width: 100, padding: 8 }}
                      />
                    ) : (
                      renderBotones(opcionesAlmuerzo, dia, 'Almuerzo')
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                    <label style={{ minWidth: 80, marginRight: 6, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      🌙 Cena
                    </label>
                    {esPlanOInvitados ? (
                      <input
                        type="number"
                        min={0}
                        value={seleccion[dia]?.Cena || ''}
                        onChange={e => handleInputChange(dia, 'Cena', e.target.value)}
                        className="form-input"
                        style={{ width: 100, padding: 8 }}
                      />
                    ) : (
                      renderBotones(opcionesCena, dia, 'Cena')
                    )}
                  </div>
                </div>
                {mostrarLineaMes && <hr style={{ border: 0, borderTop: '3px solid var(--accent-color)', margin: '24px 0', borderRadius: '2px' }} />}
              </React.Fragment>
            );
          })}
        </form>
      )}

      {showComensales && (
        <div className="card" style={{ marginTop: 32, marginBottom: 32 }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
              📊 Comensales próximos 7 días
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
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
                        <td style={{ fontWeight: 'bold' }}>
                          {comida}: <span style={{ color: 'var(--primary-color)' }}>{total}</span>
                        </td>
                        <td>
                          {Object.entries(desglose)
                            .sort((a, b) => b[1] - a[1])
                            .map(([op, cant]) => (
                              <span key={op} style={{ marginRight: 12 }}>
                                <span className="badge badge-primary">{op}</span>: <b>{cant}</b>
                              </span>
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
            maxWidth: 500,
            margin: 'auto',
            padding: 24,
            borderRadius: 'var(--border-radius)',
            zIndex: 9999,
            background: 'white',
            border: '3px solid var(--primary-color)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            position: 'relative',
          },
          overlay: {
            zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)'
          }
        }}
        contentLabel="Configuración"
      >
        {adminStep === 'clave' ? (
          <form onSubmit={handleAdminSubmit}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
              🔐 Clave de administrador
            </h3>
            <div className="form-group">
              <input
                type="password"
                value={adminClave}
                onChange={e => setAdminClave(e.target.value)}
                className="form-input"
                placeholder="Ingresa la clave de administrador"
                autoFocus
              />
            </div>
            {adminError && <div className="notification error" style={{ position: 'static', marginBottom: '12px' }}>{adminError}</div>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">Ingresar</button>
              <button type="button" onClick={handleCloseConfig} className="btn btn-outline">Cancelar</button>
            </div>
          </form>
        ) : (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
              ⚙️ Panel de configuración
            </h3>
            <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
              Acceso concedido. Herramientas de administración:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-warning"
                onClick={() => { setShowDataManager(true); setShowConfig(false); }}
              >
                📊 Gestión de Datos
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => { setShowStats(true); setShowConfig(false); }}
              >
                📊 Estadísticas
              </button>
              
              <button
                className="btn btn-primary"
                onClick={() => { setShowGoogleSheetsTest(true); setShowConfig(false); }}
              >
                🔧 Google Sheets
              </button>
              
              <button
                className="btn btn-warning"
                onClick={() => { setShowGoogleSheetsAPITest(true); setShowConfig(false); }}
              >
                🔍 Test API
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => { setShowGoogleSheetsDemo(true); setShowConfig(false); }}
              >
                🎉 Demo
              </button>
              
              <button
                className="btn btn-primary"
                onClick={() => { setShowSheetStructureValidator(true); setShowConfig(false); }}
              >
                🔍 Validador de Estructura
              </button>
              
              <button
                className="btn btn-error"
                onClick={() => { setShowSyncDebugger(true); setShowConfig(false); }}
              >
                🐛 Debug Sync
              </button>
            </div>
            
            <button type="button" onClick={handleCloseConfig} className="btn btn-outline" style={{ marginTop: 20 }}>
              Cerrar
            </button>
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
            borderRadius: 'var(--border-radius)',
            zIndex: 9999,
            background: 'white',
            border: '3px solid var(--primary-color)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            position: 'relative',
          },
          overlay: {
            zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)'
          }
        }}
        contentLabel="Gestión de Datos"
      >
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>
          📊 Gestión de Datos
        </h3>
        <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
          Los datos se guardan localmente en tu navegador. Puedes exportarlos para hacer respaldo o importarlos en otro dispositivo.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button 
            onClick={handleExportData}
            className="btn btn-secondary"
          >
            📤 Exportar Datos
          </button>
          
          <div className="form-group">
            <label className="form-label">📥 Importar Datos:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="form-input"
              style={{ padding: '8px' }}
            />
          </div>
          
          <button 
            onClick={handleClearAllData}
            className="btn btn-error"
          >
            🗑️ Borrar Todos los Datos
          </button>
        </div>
        
        <button 
          type="button" 
          onClick={() => setShowDataManager(false)} 
          className="btn btn-outline"
          style={{ marginTop: 20 }}
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
        useGoogleSheets={googleSheetsService.isConfigured()}
        iniciales={iniciales}
        seleccion={seleccion}
      />

      {/* Componente de Validador de Estructura de Planilla */}
      <SheetStructureValidator 
        isOpen={showSheetStructureValidator} 
        onClose={() => setShowSheetStructureValidator(false)} 
      />

      {/* Modal para mostrar datos de hoy */}
      <Modal
        isOpen={showHoy}
        onRequestClose={() => setShowHoy(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            maxWidth: '90vw',
            background: 'var(--card-background)',
            border: '2px solid var(--primary-color)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
          },
        }}
        contentLabel="Anotados para hoy"
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ 
            color: 'var(--primary-color)', 
            marginBottom: '24px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            📅 Anotados para hoy
          </h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Almuerzo */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: '2px solid #4caf50',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.2)'
            }}>
              <h3 style={{ 
                color: '#2e7d32', 
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                🍽️ Almuerzo
              </h3>
              {datosHoy.almuerzo.length > 0 ? (
                <div style={{
                  fontSize: '16px',
                  color: '#2e7d32',
                  fontWeight: '500',
                  lineHeight: '1.6'
                }}>
                  {datosHoy.almuerzo.join(', ')}
                </div>
              ) : (
                <div style={{
                  fontSize: '16px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No hay anotados para almuerzo
                </div>
              )}
            </div>
            
            {/* Cena */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              border: '2px solid #ff9800',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(255, 152, 0, 0.2)'
            }}>
              <h3 style={{ 
                color: '#e65100', 
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                🌙 Cena
              </h3>
              {datosHoy.cena.length > 0 ? (
                <div style={{
                  fontSize: '16px',
                  color: '#e65100',
                  fontWeight: '500',
                  lineHeight: '1.6'
                }}>
                  {datosHoy.cena.join(', ')}
                </div>
              ) : (
                <div style={{
                  fontSize: '16px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No hay anotados para cena
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={() => setShowHoy(false)} 
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
            }}
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Componente PWA para instalación */}
      <PWAInstallPrompt />

      </div>
    </>
  );
}

export default App;
