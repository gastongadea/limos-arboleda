// Servidor proxy local para manejar CORS con Google Apps Script
// Versión alternativa usando https nativo de Node.js
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3001;

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Función para hacer petición HTTP/HTTPS
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

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
    
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    console.log('✅ Proxy: Respuesta recibida');
    console.log('Status:', response.status);
    console.log('Raw Data:', response.data.substring(0, 200) + '...');
    
    let responseData;
    
    // Si es un 302 (redirección), considerar éxito
    if (response.status === 302) {
      responseData = { 
        success: true, 
        message: 'Operación completada exitosamente',
        status: 'redirect',
        action: data.action
      };
    } else {
      // Intentar parsear como JSON
      try {
        responseData = JSON.parse(response.data);
      } catch (e) {
        // Si no es JSON válido, verificar si contiene indicadores de éxito
        if (response.data.includes('success') || response.data.includes('Success')) {
          responseData = { 
            success: true, 
            message: 'Operación completada exitosamente',
            raw: response.data.substring(0, 100)
          };
        } else {
          responseData = { 
            success: false, 
            error: 'Respuesta no válida',
            raw: response.data.substring(0, 100)
          };
        }
      }
    }
    
    console.log('Processed Data:', responseData);
    res.status(200).json(responseData);
    
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