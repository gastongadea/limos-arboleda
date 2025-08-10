// Utilidades para manejo de fechas
const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Configuración (no utilizada actualmente)
// const CONFIG = {
//   ZONA_HORARIA: 'America/Argentina/Buenos_Aires',
//   FORMATO_FECHA: 'DD/MM/YYYY',
//   FORMATO_ISO: 'YYYY-MM-DD'
// };

/**
 * Formatear fecha ISO a formato legible
 * @param {string} fechaISO - Fecha en formato ISO (YYYY-MM-DD)
 * @param {string} formato - Formato de salida ('completo', 'corto', 'mes')
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fechaISO, formato = 'completo') {
  try {
    if (!fechaISO || typeof fechaISO !== 'string') {
      throw new Error('Fecha inválida');
    }

    // Crear la fecha en zona horaria local para evitar problemas de UTC
    const [year, month, day] = fechaISO.split('-').map(Number);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error('Formato de fecha inválido');
    }
    
    const d = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    
    // Verificar que la fecha sea válida
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      throw new Error('Fecha inválida');
    }
    
    const diaSemana = diasSemana[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mes = meses[d.getMonth()];
    
    switch (formato) {
      case 'corto':
        return `${dd}/${mm}/${yyyy}`;
      case 'mes':
        return `${dd} ${mes}`;
      case 'semana':
        return `${diaSemana} ${dd}/${mm}`;
      case 'completo':
      default:
        return `${diaSemana} ${dd}/${mm}/${yyyy}`;
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return fechaISO || 'Fecha inválida';
  }
}

/**
 * Obtener días siguientes desde hoy
 * @param {number} cantidad - Cantidad de días a generar
 * @param {string} fechaInicio - Fecha de inicio (opcional, por defecto hoy)
 * @returns {string[]} Array de fechas ISO
 */
export function getDiasSiguientes(cantidad, fechaInicio = null) {
  try {
    const dias = [];
    const hoy = fechaInicio ? new Date(fechaInicio) : new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < cantidad; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const fechaISO = d.toISOString().split('T')[0];
      dias.push(fechaISO);
    }
    return dias;
  } catch (error) {
    console.error('Error generando días siguientes:', error);
    return [];
  }
}

/**
 * Verificar si una fecha es fin de semana
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {boolean} True si es fin de semana
 */
export function esFinDeSemana(fechaISO) {
  try {
    if (!fechaISO) return false;
    
    // Crear la fecha en zona horaria local para evitar problemas de UTC
    const [year, month, day] = fechaISO.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.getDay() === 0 || d.getDay() === 6; // Domingo (0) o Sábado (6)
  } catch (error) {
    console.error('Error verificando fin de semana:', error);
    return false;
  }
}

/**
 * Obtener fecha de hoy en formato ISO
 * @returns {string} Fecha de hoy en formato YYYY-MM-DD
 */
export function getHoyISO() {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch (error) {
    console.error('Error obteniendo fecha de hoy:', error);
    return '';
  }
}

/**
 * Verificar si una fecha es del pasado
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {boolean} True si es fecha pasada
 */
export function esFechaPasada(fechaISO) {
  try {
    if (!fechaISO) return false;
    
    const hoy = getHoyISO();
    return fechaISO < hoy;
  } catch (error) {
    console.error('Error verificando fecha pasada:', error);
    return false;
  }
}

/**
 * Verificar si una fecha es hoy
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {boolean} True si es hoy
 */
export function esHoy(fechaISO) {
  try {
    if (!fechaISO) return false;
    
    const hoy = getHoyISO();
    return fechaISO === hoy;
  } catch (error) {
    console.error('Error verificando si es hoy:', error);
    return false;
  }
}

/**
 * Obtener el día de la semana de una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Nombre del día de la semana
 */
export function getDiaSemana(fechaISO) {
  try {
    if (!fechaISO) return '';
    
    const [year, month, day] = fechaISO.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return diasSemana[d.getDay()];
  } catch (error) {
    console.error('Error obteniendo día de la semana:', error);
    return '';
  }
}

/**
 * Obtener el mes de una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Nombre del mes
 */
export function getMes(fechaISO) {
  try {
    if (!fechaISO) return '';
    
    const [year, month, day] = fechaISO.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return meses[d.getMonth()];
  } catch (error) {
    console.error('Error obteniendo mes:', error);
    return '';
  }
}

/**
 * Calcular diferencia en días entre dos fechas
 * @param {string} fecha1 - Primera fecha en formato ISO
 * @param {string} fecha2 - Segunda fecha en formato ISO
 * @returns {number} Diferencia en días
 */
export function diferenciaDias(fecha1, fecha2) {
  try {
    if (!fecha1 || !fecha2) return 0;
    
    const d1 = new Date(fecha1);
    const d2 = new Date(fecha2);
    
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculando diferencia de días:', error);
    return 0;
  }
}

/**
 * Agregar días a una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @param {number} dias - Días a agregar (puede ser negativo)
 * @returns {string} Nueva fecha en formato ISO
 */
export function agregarDias(fechaISO, dias) {
  try {
    if (!fechaISO) return '';
    
    const d = new Date(fechaISO);
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error agregando días:', error);
    return fechaISO;
  }
}

/**
 * Obtener el primer día del mes de una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Primer día del mes en formato ISO
 */
export function getPrimerDiaMes(fechaISO) {
  try {
    if (!fechaISO) return '';
    
    const [year, month] = fechaISO.split('-').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-01`;
  } catch (error) {
    console.error('Error obteniendo primer día del mes:', error);
    return '';
  }
}

/**
 * Obtener el último día del mes de una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Último día del mes en formato ISO
 */
export function getUltimoDiaMes(fechaISO) {
  try {
    if (!fechaISO) return '';
    
    const [year, month] = fechaISO.split('-').map(Number);
    const d = new Date(year, month, 0); // El día 0 del mes siguiente es el último del mes actual
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error obteniendo último día del mes:', error);
    return '';
  }
}

/**
 * Verificar si una fecha está en el rango especificado
 * @param {string} fechaISO - Fecha a verificar
 * @param {string} fechaInicio - Fecha de inicio del rango
 * @param {string} fechaFin - Fecha de fin del rango
 * @param {boolean} incluirLimites - Si incluir las fechas límite
 * @returns {boolean} True si está en el rango
 */
export function estaEnRango(fechaISO, fechaInicio, fechaFin, incluirLimites = true) {
  try {
    if (!fechaISO || !fechaInicio || !fechaFin) return false;
    
    if (incluirLimites) {
      return fechaISO >= fechaInicio && fechaISO <= fechaFin;
    } else {
      return fechaISO > fechaInicio && fechaISO < fechaFin;
    }
  } catch (error) {
    console.error('Error verificando rango de fechas:', error);
    return false;
  }
}

/**
 * Obtener el número de semana del año
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {number} Número de semana
 */
export function getNumeroSemana(fechaISO) {
  try {
    if (!fechaISO) return 0;
    
    const d = new Date(fechaISO);
    d.setHours(0, 0, 0, 0);
    
    // El primer día del año
    const primerDia = new Date(d.getFullYear(), 0, 1);
    
    // Diferencia en días
    const diffTime = d - primerDia;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Número de semana
    const semana = Math.ceil((diffDays + primerDia.getDay() + 1) / 7);
    
    return semana;
  } catch (error) {
    console.error('Error obteniendo número de semana:', error);
    return 0;
  }
}

/**
 * Validar formato de fecha ISO
 * @param {string} fechaISO - Fecha a validar
 * @returns {boolean} True si es válida
 */
export function validarFechaISO(fechaISO) {
  try {
    if (!fechaISO || typeof fechaISO !== 'string') return false;
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fechaISO)) return false;
    
    const [year, month, day] = fechaISO.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    return d.getFullYear() === year && 
           d.getMonth() === month - 1 && 
           d.getDate() === day;
  } catch (error) {
    console.error('Error validando fecha ISO:', error);
    return false;
  }
}

/**
 * Convertir fecha de formato DD/MM/YYYY a ISO
 * @param {string} fechaDDMMYYYY - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato ISO
 */
export function convertirAISO(fechaDDMMYYYY) {
  try {
    if (!fechaDDMMYYYY || typeof fechaDDMMYYYY !== 'string') return '';
    
    const partes = fechaDDMMYYYY.split('/');
    if (partes.length !== 3) return '';
    
    const [day, month, year] = partes.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error convirtiendo fecha a ISO:', error);
    return '';
  }
}

/**
 * Obtener fechas de un rango
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string} fechaFin - Fecha de fin
 * @returns {string[]} Array de fechas en el rango
 */
export function getFechasEnRango(fechaInicio, fechaFin) {
  try {
    if (!fechaInicio || !fechaFin) return [];
    
    const fechas = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(d.toISOString().split('T')[0]);
    }
    
    return fechas;
  } catch (error) {
    console.error('Error obteniendo fechas en rango:', error);
    return [];
  }
}

/**
 * Obtener información detallada de una fecha
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {object} Información detallada de la fecha
 */
export function getInfoFecha(fechaISO) {
  try {
    if (!fechaISO || !validarFechaISO(fechaISO)) {
      return {
        fecha: fechaISO,
        valida: false,
        error: 'Fecha inválida'
      };
    }
    
    const [year, month, day] = fechaISO.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    return {
      fecha: fechaISO,
      valida: true,
      diaSemana: diasSemana[d.getDay()],
      mes: meses[d.getMonth()],
      dia: day,
      mesNumero: month,
      año: year,
      esFinDeSemana: esFinDeSemana(fechaISO),
      esHoy: esHoy(fechaISO),
      esPasada: esFechaPasada(fechaISO),
      numeroSemana: getNumeroSemana(fechaISO),
      formateada: formatearFecha(fechaISO)
    };
  } catch (error) {
    console.error('Error obteniendo información de fecha:', error);
    return {
      fecha: fechaISO,
      valida: false,
      error: error.message
    };
  }
} 