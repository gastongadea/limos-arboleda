// Script para crear la estructura inicial de Google Sheets
// Este es un ejemplo de cómo estructurar tu planilla

const createSheetStructure = () => {
  // Configuración
  const usuarios = ['MEP', 'PGG', 'LMC', 'JRG', 'MAG']; // Agrega tus usuarios aquí
  const fechasInicio = '2024-12-01'; // Fecha de inicio
  const diasGenerar = 30; // Número de días a generar
  
  // Generar fechas
  const fechas = [];
  const fechaInicio = new Date(fechasInicio);
  
  for (let i = 0; i < diasGenerar; i++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fechaInicio.getDate() + i);
    fechas.push(fecha.toISOString().split('T')[0]);
  }
  
  // Crear estructura de datos
  const estructura = [];
  
  // Header (primera fila)
  const header = ['Fecha', 'Comida', ...usuarios];
  estructura.push(header);
  
  // Filas de datos
  fechas.forEach(fecha => {
    // Fila para Almuerzo
    const filaAlmuerzo = [
      fecha.split('-')[2] + '/' + fecha.split('-')[1], // DD/MM
      'A', // Almuerzo
      ...usuarios.map(() => '') // Celdas vacías para cada usuario
    ];
    estructura.push(filaAlmuerzo);
    
    // Fila para Cena
    const filaCena = [
      fecha.split('-')[2] + '/' + fecha.split('-')[1], // DD/MM
      'C', // Cena
      ...usuarios.map(() => '') // Celdas vacías para cada usuario
    ];
    estructura.push(filaCena);
  });
  
  return estructura;
};

// Ejemplo de uso
const estructuraEjemplo = createSheetStructure();

console.log('=== ESTRUCTURA DE GOOGLE SHEETS ===');
console.log('Copia y pega esto en tu planilla de Google Sheets:');
console.log('');

// Mostrar estructura en formato tabular
console.log('| Fecha | Comida | ' + estructuraEjemplo[0].slice(2).join(' | ') + ' |');
console.log('|-------|--------|' + estructuraEjemplo[0].slice(2).map(() => '-----').join('|') + '|');

for (let i = 1; i < Math.min(10, estructuraEjemplo.length); i++) {
  const fila = estructuraEjemplo[i];
  console.log('| ' + fila.join(' | ') + ' |');
}

if (estructuraEjemplo.length > 10) {
  console.log('| ... | ... |' + estructuraEjemplo[0].slice(2).map(() => '...').join('|') + '|');
  console.log(`(Total: ${estructuraEjemplo.length} filas)`);
}

console.log('');
console.log('=== INSTRUCCIONES ===');
console.log('1. Crea una nueva planilla de Google Sheets');
console.log('2. Copia la estructura de arriba');
console.log('3. Pega en la celda A1 de tu planilla');
console.log('4. Ajusta los usuarios según tus necesidades');
console.log('5. Configura las fechas según tu período');
console.log('');
console.log('=== FORMATO DE DATOS ===');
console.log('- Fecha: DD/MM (ej: 01/12)');
console.log('- Comida: A = Almuerzo, C = Cena');
console.log('- Usuarios: Iniciales de cada persona');
console.log('- Celdas vacías: Se llenarán automáticamente');

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createSheetStructure };
} 