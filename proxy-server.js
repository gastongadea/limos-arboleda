// Servidor proxy local para manejar CORS con Google Apps Script
const express = require('express');
const cors = require('cors');

// Usar fetch nativo si está disponible, sino usar node-fetch
let fetch;
try {
  // Intentar usar fetch nativo (Node.js 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback a node-fetch
    fetch = require('node-fetch');
  }
} catch (error) {
  console.log('⚠️  node-fetch no disponible, intentando usar fetch nativo...');
  fetch = globalThis.fetch;
}

const app = express();
const PORT = 3001;

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Proxy para Google Apps Script
app.post('/proxy/google-apps-script', async (req, res) => {
  try {
    const { url, data } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL requerida' });
    }
    
    console.log('🌐 Proxy: Enviando petición a Google Apps Script');
    console.log('URL:', url);
    console.log('Data:', data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }
    
    console.log('✅ Proxy: Respuesta recibida');
    console.log('Status:', response.status);
    console.log('Data:', responseData);
    
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('❌ Proxy: Error:', error);
    res.status(500).json({ 
      error: 'Error en proxy', 
      details: error.message 
    });
  }
});

// Endpoint de prueba
app.get('/proxy/test', (req, res) => {
  res.json({ 
    message: 'Proxy funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy iniciado en http://localhost:${PORT}`);
  console.log(`📡 Proxy disponible en http://localhost:${PORT}/proxy/google-apps-script`);
  console.log(`🧪 Test disponible en http://localhost:${PORT}/proxy/test`);
}); 