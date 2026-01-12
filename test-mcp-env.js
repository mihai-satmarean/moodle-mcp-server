ram in a#!/usr/bin/env node

/**
 * Test script pentru verificarea environment variables MCP Server
 * Verifică că serverul poate citi configurația din .env
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Testează dacă serverul MCP poate porni cu environment variables
async function testMCPServerStart() {
  console.log('🚀 Testare pornire MCP Server cu environment variables...');
  console.log('📍 CWD:', process.cwd());
  console.log('📁 Build path:', join(__dirname, 'build', 'index.js'));
  console.log('=' .repeat(60));
  
  // Verifică dacă fișierul build există
  const fs = await import('fs');
  const buildPath = join(__dirname, 'build', 'index.js');
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ Fișierul build/index.js nu există!');
    console.log('🔧 Rulează: npm run build');
    return;
  }
  
  console.log('✅ Fișierul build/index.js există');
  
  // Testează pornirea serverului MCP
  console.log('\n🔍 Pornire MCP Server...');
  
  const mcpProcess = spawn('node', [buildPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MOODLE_API_URL: 'https://platforma.scoalainformala.ro/webservice/rest/server.php',
      MOODLE_API_TOKEN: '2d00b9356b469277f74d9631af0e4a4a',
      MOODLE_COURSE_ID: '1'
    }
  });
  
  let output = '';
  let errorOutput = '';
  
  mcpProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  mcpProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  mcpProcess.on('close', (code) => {
    console.log(`\n📊 MCP Server s-a închis cu codul: ${code}`);
    
    if (output) {
      console.log('📤 Output:', output);
    }
    
    if (errorOutput) {
      console.log('📤 Error Output:', errorOutput);
      
      // Verifică dacă serverul a pornit cu succes
      if (errorOutput.includes('Moodle MCP server running on STDIO transport')) {
        console.log('✅ MCP Server a pornit cu succes!');
      } else if (errorOutput.includes('MOODLE_API_URL environment variable is required')) {
        console.log('❌ Eroare: MOODLE_API_URL lipsește');
      } else if (errorOutput.includes('MOODLE_API_TOKEN environment variable is required')) {
        console.log('❌ Eroare: MOODLE_API_TOKEN lipsește');
      } else if (errorOutput.includes('MOODLE_COURSE_ID environment variable is required')) {
        console.log('❌ Eroare: MOODLE_COURSE_ID lipsește');
      } else {
        console.log('⚠️ Eroare necunoscută la pornirea serverului');
      }
    }
  });
  
  // Oprește serverul după 5 secunde
  setTimeout(() => {
    console.log('\n⏰ Oprire server după 5 secunde...');
    mcpProcess.kill('SIGTERM');
  }, 5000);
  
  // Verifică dacă serverul pornește în 10 secunde
  setTimeout(() => {
    if (mcpProcess.killed === false) {
      console.log('\n⏰ Timeout - serverul nu a pornit în 10 secunde');
      mcpProcess.kill('SIGKILL');
    }
  }, 10000);
}

// Testează citirea environment variables
async function testEnvironmentVariables() {
  console.log('\n🔍 Testare environment variables...');
  
  const requiredVars = [
    'MOODLE_API_URL',
    'MOODLE_API_TOKEN', 
    'MOODLE_COURSE_ID'
  ];
  
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('TOKEN') ? value.substring(0, 8) + '...' : value}`);
    } else {
      console.log(`❌ ${varName}: Lipsește`);
      allVarsPresent = false;
    }
  }
  
  if (allVarsPresent) {
    console.log('\n✅ Toate environment variables sunt prezente');
  } else {
    console.log('\n❌ Unele environment variables lipsesc');
    console.log('🔧 Verifică fișierul .env');
  }
  
  return allVarsPresent;
}

// Funcție principală
async function runTests() {
  console.log('🧪 Testare Moodle MCP Server Environment Variables');
  console.log('=' .repeat(60));
  
  // Testează environment variables
  const envOk = await testEnvironmentVariables();
  
  if (envOk) {
    // Testează pornirea serverului
    await testMCPServerStart();
  } else {
    console.log('\n❌ Nu se poate testa serverul - environment variables lipsesc');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Rezumat testare:');
  
  if (envOk) {
    console.log('✅ Environment variables configurate corect');
    console.log('🎯 MCP Server gata pentru testare');
    console.log('\n🔧 Următorii pași:');
    console.log('   1. Testează cu MCP Inspector: npm run inspector');
    console.log('   2. Integrează cu Claude Desktop');
    console.log('   3. Testează tools-urile MCP');
  } else {
    console.log('❌ Probleme cu environment variables');
    console.log('🔧 Verifică fișierul .env');
  }
}

// Rulare teste
runTests().catch(console.error);
