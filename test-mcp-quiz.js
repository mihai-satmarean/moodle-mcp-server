#!/usr/bin/env node
/**
 * Test simplu pentru get_quizzes prin MCP
 * Simulează un apel MCP folosind stdio
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const MOODLE_API_URL = process.env.MOODLE_API_URL || 'https://platforma.scoalainformala.ro/webservice/rest/server.php';
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN || '2d00b9356b469277f74d9631af0e4a4a';
const COURSE_ID = 1301;

console.log(`🧪 Testare Moodle MCP - get_quizzes pentru cursul ${COURSE_ID}\n`);

// Mesaj MCP pentru list_tools
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

// Mesaj MCP pentru call_tool
const callToolRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'get_quizzes',
    arguments: {
      courseId: COURSE_ID
    }
  }
};

// Pornește server-ul MCP
const server = spawn('node', ['build/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MOODLE_API_URL,
    MOODLE_API_TOKEN,
    MOODLE_COURSE_ID: COURSE_ID.toString(),
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Încearcă să parseze mesajele JSON complete
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Păstrează ultima linie incompletă
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.id === 2 && response.result) {
          // Răspuns de la get_quizzes
          console.log('✅ Răspuns de la get_quizzes:\n');
          if (response.result.content && response.result.content.length > 0) {
            const quizzes = JSON.parse(response.result.content[0].text);
            console.log(`📋 Găsite ${quizzes.length} quiz-uri:\n`);
            quizzes.forEach((quiz, index) => {
              console.log(`${index + 1}. ${quiz.name} (ID: ${quiz.id})`);
              if (quiz.grade) {
                console.log(`   Notă maximă: ${quiz.grade}`);
              }
              if (quiz.timeopen) {
                console.log(`   Deschis: ${new Date(quiz.timeopen * 1000).toLocaleString()}`);
              }
              if (quiz.timeclose) {
                console.log(`   Închis: ${new Date(quiz.timeclose * 1000).toLocaleString()}`);
              }
              console.log('');
            });
          }
          server.kill();
          process.exit(0);
        } else if (response.id === 1 && response.result) {
          // Răspuns de la list_tools - trimite apoi call_tool
          console.log(`📋 Tool-uri disponibile: ${response.result.tools.length}\n`);
          console.log('🔍 Apelare get_quizzes...\n');
          server.stdin.write(JSON.stringify(callToolRequest) + '\n');
        }
      } catch (e) {
        // Ignoră erorile de parsing pentru linii incomplete
      }
    }
  }
});

server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

server.on('error', (error) => {
  console.error('❌ Eroare la pornirea server-ului:', error.message);
  process.exit(1);
});

// Trimite request pentru list_tools, apoi call_tool
setTimeout(() => {
  console.log('📤 Trimite request pentru list_tools...\n');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 500);

// Timeout
setTimeout(() => {
  console.error('❌ Timeout - server-ul nu a răspuns');
  server.kill();
  process.exit(1);
}, 10000);
