// Proxy server para Vercel/Netlify
// Maneja las peticiones a Google Sheets API

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, data } = req.body;

    // Variables de entorno (configurar en Vercel/Netlify)
    const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
    const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;
    const APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL;

    if (!API_KEY || !SHEET_ID) {
      return res.status(400).json({ 
        error: 'Configuración incompleta. Verifica las variables de entorno.' 
      });
    }

    let response;

    switch (action) {
      case 'read':
        // Leer datos de Google Sheets
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:Z?key=${API_KEY}`;
        response = await fetch(sheetsUrl);
        break;

      case 'write':
        // Escribir datos usando Google Apps Script
        if (!APPS_SCRIPT_URL) {
          return res.status(400).json({ 
            error: 'URL de Google Apps Script no configurada' 
          });
        }
        response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    const responseData = await response.json();
    res.status(response.status).json(responseData);

  } catch (error) {
    console.error('Error en proxy:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
} 