import envLoader from '../config/envLoader';
import metaConfig from '../config/metaConfig';

class NeonApiService {
  constructor() {
    this.baseUrl =
      envLoader.getEnvVar('REACT_APP_API_URL') ||
      metaConfig.get('REACT_APP_API_URL') ||
      '';
  }

  isConfigured() {
    return !!(this.baseUrl && String(this.baseUrl).trim());
  }

  _url(path, params) {
    const u = new URL(path.replace(/^\//, ''), this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') u.searchParams.set(k, v);
      });
    }
    return u.toString();
  }

  async _fetch(path, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('REACT_APP_API_URL no configurada');
    }
    const url = this._url(path, options.params);
    let res;
    try {
      res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (networkErr) {
      throw new Error(
        `No se pudo conectar a la API (${url}). Revisá CORS en Vercel y que la URL sea correcta. Detalle: ${networkErr.message}`
      );
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `API ${res.status}`);
    }
    return data;
  }

  async health() {
    return this._fetch('api/health');
  }

  async getUserInscripciones(iniciales, dias) {
    if (!dias || dias.length === 0) return {};
    const from = dias[0];
    const to = dias[dias.length - 1];
    const result = await this._fetch('api/inscripciones', {
      params: { iniciales, from, to },
    });
    const data = result.data || {};
    // Asegurar todas las fechas del rango
    const out = {};
    dias.forEach((dia) => {
      out[dia] = data[dia] || { Almuerzo: '', Cena: '' };
    });
    return out;
  }

  async saveInscripcionesBatch(inscripciones) {
    if (!inscripciones || inscripciones.length === 0) {
      return { success: true, count: 0, errors: [] };
    }
    const result = await this._fetch('api/inscripciones', {
      method: 'POST',
      body: { inscripciones },
    });
    // Intentar sync en background (no bloqueante)
    this.triggerSync().catch(() => {});
    return {
      success: result.success !== false,
      count: result.count || 0,
      errors: result.errors || [],
    };
  }

  async getInscripcionesByDate(fecha) {
    const result = await this._fetch('api/inscripciones', { params: { fecha } });
    return result.rows || [];
  }

  async getInscripcionesRange(from, to) {
    const result = await this._fetch('api/inscripciones', { params: { from, to } });
    return result.rows || [];
  }

  async getMisaInscripciones(dias) {
    if (!dias || dias.length === 0) return {};
    const result = await this._fetch('api/misa', {
      params: { from: dias[0], to: dias[dias.length - 1] },
    });
    return result.data || {};
  }

  async saveMisaInscripcion(fecha, valor) {
    return this._fetch('api/misa', {
      method: 'POST',
      body: { fecha, valor },
    });
  }

  async triggerSync() {
    return this._fetch('api/sync-sheets', { method: 'POST' });
  }

  async importFromSheets() {
    return this._fetch('api/import-from-sheets', { method: 'POST' });
  }
}

const neonApiService = new NeonApiService();
export default neonApiService;
