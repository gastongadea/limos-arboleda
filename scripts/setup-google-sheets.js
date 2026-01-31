// Script para configurar automáticamente Google Sheets
// Este script te ayuda a crear la estructura correcta en tu planilla

const setupGoogleSheets = {
  // Configuración de usuarios (ajusta según tus necesidades)
  usuarios: [
    'MEP', 'MMR', 'LMC', 'PAB', 'FIG', 'FAM', 'IJC', 'ELF', 'FA', 'JOA', 
    'GG', 'AS', 'JBA', 'IC', 'TA', 'JPS', 'FEC', 'Huesped1', 'Huesped2', 
    'Plan', 'Invitados'
  ],

  // Generar fechas para los próximos 30 días
  generarFechas(dias = 30) {
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(fecha.toISOString().split('T')[0]);
    }
    
    return fechas;
  },

  // Crear estructura de datos para Google Sheets
  crearEstructura(dias = 30) {
    const fechas = this.generarFechas(dias);
    const estructura = [];
    
    // Header (primera fila)
    const header = ['Fecha', 'Comida', ...this.usuarios];
    estructura.push(header);
    
    // Filas de datos
    fechas.forEach(fecha => {
      // Convertir fecha ISO a formato DD/MM
      const fechaObj = new Date(fecha);
      const fechaFormateada = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}`;
      
      // Fila para Almuerzo (A)
      const filaAlmuerzo = [
        fechaFormateada, // DD/MM
        'A', // Almuerzo
        ...this.usuarios.map(() => '') // Celdas vacías para cada usuario
      ];
      estructura.push(filaAlmuerzo);
      
      // Fila para Cena (C)
      const filaCena = [
        fechaFormateada, // DD/MM
        'C', // Cena
        ...this.usuarios.map(() => '') // Celdas vacías para cada usuario
      ];
      estructura.push(filaCena);
    });
    
    return estructura;
  },

  // Generar instrucciones para copiar y pegar
  generarInstrucciones() {
    const estructura = this.crearEstructura();
    
    console.log('=== INSTRUCCIONES PARA GOOGLE SHEETS ===');
    console.log('');
    console.log('1. Abre tu planilla de Google Sheets');
    console.log('2. Selecciona la celda A1');
    console.log('3. Copia y pega la siguiente estructura:');
    console.log('');
    
    // Mostrar estructura en formato tabular
    estructura.forEach((fila, index) => {
      if (index === 0) {
        console.log('HEADER (Fila 1):');
      } else if (index === 1) {
        console.log('');
        console.log('DATOS (Filas 2 en adelante):');
      }
      
      const filaStr = fila.map(celda => celda || '').join('\t');
      console.log(filaStr);
    });
    
    console.log('');
    console.log('=== FORMATO ESPERADO ===');
    console.log('Columna A: Fechas (DD/MM)');
    console.log('Columna B: Tipo de comida (A = Almuerzo, C = Cena)');
    console.log('Columnas C+ : Usuarios con sus iniciales');
    console.log('');
    console.log('=== EJEMPLO ===');
    console.log('01/12\tA\t\t\t\t...');
    console.log('01/12\tC\t\t\t\t...');
    console.log('02/12\tA\t\t\t\t...');
    console.log('02/12\tC\t\t\t\t...');
    console.log('');
    console.log('=== OPCIONES DE COMIDA ===');
    console.log('Almuerzo: S, R, N, 12, 12:30, V, San, T, RT');
    console.log('Cena: S, R, N, V, T, RT, VRM');
    console.log('');
    console.log('=== USUARIOS CONFIGURADOS ===');
    this.usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario}`);
    });
  },

  // Validar estructura existente
  validarEstructura(datos) {
    const errores = [];
    const warnings = [];
    
    if (!datos || datos.length < 2) {
      errores.push('La planilla debe tener al menos 2 filas (header + datos)');
      return { errores, warnings, valida: false };
    }
    
    const header = datos[0];
    
    // Verificar header
    if (header[0] !== 'Fecha') {
      errores.push('La primera columna debe ser "Fecha"');
    }
    
    if (header[1] !== 'Comida') {
      errores.push('La segunda columna debe ser "Comida"');
    }
    
    // Verificar usuarios
    const usuariosEnPlanilla = header.slice(2);
    const usuariosFaltantes = this.usuarios.filter(u => !usuariosEnPlanilla.includes(u));
    const usuariosExtra = usuariosEnPlanilla.filter(u => !this.usuarios.includes(u));
    
    if (usuariosFaltantes.length > 0) {
      warnings.push(`Usuarios faltantes: ${usuariosFaltantes.join(', ')}`);
    }
    
    if (usuariosExtra.length > 0) {
      warnings.push(`Usuarios extra: ${usuariosExtra.join(', ')}`);
    }
    
    // Verificar datos
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      if (fila.length < 2) {
        errores.push(`Fila ${i + 1}: Insuficientes columnas`);
        continue;
      }
      
      const fecha = fila[0];
      const tipo = fila[1];
      
      if (!fecha) {
        errores.push(`Fila ${i + 1}: Fecha vacía`);
      }
      
      if (!tipo || !['A', 'C'].includes(tipo)) {
        errores.push(`Fila ${i + 1}: Tipo de comida inválido (debe ser A o C)`);
      }
    }
    
    return {
      errores,
      warnings,
      valida: errores.length === 0,
      usuariosEnPlanilla,
      totalFilas: datos.length
    };
  },

  // Generar reporte de configuración
  generarReporte() {
    console.log('=== REPORTE DE CONFIGURACIÓN ===');
    console.log('');
    console.log(`Usuarios configurados: ${this.usuarios.length}`);
    console.log(`Días generados: 30`);
    console.log(`Total de filas esperadas: ${30 * 2 + 1} (30 días × 2 comidas + header)`);
    console.log('');
    console.log('Usuarios:');
    this.usuarios.forEach((usuario, index) => {
      console.log(`  ${index + 1}. ${usuario}`);
    });
    console.log('');
    console.log('=== PRÓXIMOS PASOS ===');
    console.log('1. Ejecuta generarInstrucciones() para obtener la estructura');
    console.log('2. Copia la estructura en tu planilla de Google Sheets');
    console.log('3. Configura las variables de entorno en tu aplicación');
    console.log('4. Activa la sincronización en la app');
  }
};

// Ejecutar automáticamente
console.log('🍽️ Configurador de Google Sheets - Limos Arboleda');
console.log('================================================');
console.log('');

// Mostrar reporte
setupGoogleSheets.generarReporte();

// Mostrar instrucciones
setupGoogleSheets.generarInstrucciones();

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  window.setupGoogleSheets = setupGoogleSheets;
  console.log('');
  console.log('💡 Usa setupGoogleSheets.generarInstrucciones() para ver las instrucciones');
  console.log('💡 Usa setupGoogleSheets.validarEstructura(datos) para validar tu planilla');
}

export default setupGoogleSheets; 