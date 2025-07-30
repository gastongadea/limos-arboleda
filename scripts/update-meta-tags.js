#!/usr/bin/env node

// Script para actualizar meta tags en index.html con credenciales reales
// Uso: node scripts/update-meta-tags.js

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../public/index.html');
const envPath = path.join(__dirname, '../.env');

function updateMetaTags() {
  try {
    console.log('🔧 Iniciando actualización de meta tags...');
    
    // Verificar que el archivo .env existe
    if (!fs.existsSync(envPath)) {
      console.error('❌ Archivo .env no encontrado en:', envPath);
      process.exit(1);
    }
    
    console.log('✅ Archivo .env encontrado');
    
    // Leer el archivo .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    // Parsear variables de entorno
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          const value = line.substring(equalIndex + 1).trim();
          envVars[key] = value;
        }
      }
    });
    
    console.log('📋 Variables encontradas:', Object.keys(envVars));
    
    // Obtener credenciales
    const apiKey = envVars.REACT_APP_GOOGLE_API_KEY;
    const sheetId = envVars.REACT_APP_GOOGLE_SHEET_ID;
    const appsScriptUrl = envVars.REACT_APP_GOOGLE_APPS_SCRIPT_URL;
    
    console.log('🔑 API Key:', apiKey ? '✅ Configurada' : '❌ No configurada');
    console.log('📊 Sheet ID:', sheetId ? '✅ Configurada' : '❌ No configurada');
    console.log('🔗 Apps Script URL:', appsScriptUrl ? '✅ Configurada' : '❌ No configurada');
    
    // Leer el archivo index.html
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Actualizar meta tags
    if (apiKey) {
      html = html.replace(
        /<meta name="google-api-key" content="[^"]*" \/>/,
        `<meta name="google-api-key" content="${apiKey}" />`
      );
    }
    
    if (sheetId) {
      html = html.replace(
        /<meta name="google-sheet-id" content="[^"]*" \/>/,
        `<meta name="google-sheet-id" content="${sheetId}" />`
      );
    }
    
    if (appsScriptUrl) {
      html = html.replace(
        /<meta name="google-apps-script-url" content="[^"]*" \/>/,
        `<meta name="google-apps-script-url" content="${appsScriptUrl}" />`
      );
    }
    
    // Escribir el archivo actualizado
    fs.writeFileSync(indexPath, html, 'utf8');
    
    console.log('✅ Meta tags actualizados correctamente');
    console.log('📁 Archivo actualizado:', indexPath);
    
  } catch (error) {
    console.error('❌ Error actualizando meta tags:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateMetaTags();
}

module.exports = updateMetaTags; 