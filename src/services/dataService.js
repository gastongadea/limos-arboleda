import googleSheetsService from './googleSheetsService';
import neonApiService from './neonApiService';

/**
 * Fachada de datos: Neon (rápido) si REACT_APP_API_URL está configurada;
 * si no, Google Sheets como hasta ahora.
 */
class DataService {
  usesNeon() {
    return neonApiService.isConfigured();
  }

  isConfigured() {
    if (this.usesNeon()) {
      return { read: true, write: true, backend: 'neon' };
    }
    return { ...googleSheetsService.isConfigured(), backend: 'sheets' };
  }

  async getUserInscripciones(iniciales, dias) {
    if (this.usesNeon()) {
      try {
        const data = await neonApiService.getUserInscripciones(iniciales, dias);
        const hasAny = Object.values(data || {}).some(
          (d) => (d && (d.Almuerzo || d.Cena))
        );
        if (hasAny || !googleSheetsService.isConfigured().read) {
          return data;
        }
        console.warn('Neon sin datos para el usuario; leyendo desde Sheets (fallback)');
      } catch (e) {
        console.warn('Neon falló al leer; fallback Sheets:', e);
      }
    }
    return googleSheetsService.getUserInscripciones(iniciales, dias);
  }

  async saveInscripcionesBatch(inscripciones) {
    if (this.usesNeon()) {
      return neonApiService.saveInscripcionesBatch(inscripciones);
    }
    return googleSheetsService.saveInscripcionesBatch(inscripciones);
  }

  async getMisaInscripciones(dias) {
    if (this.usesNeon()) {
      try {
        const data = await neonApiService.getMisaInscripciones(dias);
        const hasAny = Object.values(data || {}).some((v) => v);
        if (hasAny || !googleSheetsService.isConfigured().read) {
          return data;
        }
        console.warn('Neon sin Misa; leyendo desde Sheets (fallback)');
      } catch (e) {
        console.warn('Neon misa falló, fallback Sheets:', e);
      }
    }
    if (googleSheetsService.isConfigured().read) {
      return googleSheetsService.getMisaInscripciones(dias);
    }
    return {};
  }

  async saveMisaInscripcion(dia, valor) {
    if (this.usesNeon()) {
      await neonApiService.saveMisaInscripcion(dia, valor);
      return true;
    }
    return googleSheetsService.saveMisaInscripcion(dia, valor);
  }

  // Delegados a Sheets (estructura / usuarios / cumpleaños / Hoy crudo)
  getUsers() {
    return googleSheetsService.getUsers();
  }

  getSheetData(forceRefresh) {
    return googleSheetsService.getSheetData(forceRefresh);
  }

  getProximosCumpleanos(days) {
    return googleSheetsService.getProximosCumpleanos(days);
  }

  findUserColumn(sheetData, iniciales) {
    return googleSheetsService.findUserColumn(sheetData, iniciales);
  }

  parseDate(val) {
    return googleSheetsService.parseDate(val);
  }

  async getHoyFromNeonOrSheets(hoyISO) {
    if (this.usesNeon()) {
      return neonApiService.getInscripcionesByDate(hoyISO);
    }
    return null;
  }
}

const dataService = new DataService();
export default dataService;
