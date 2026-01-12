#!/usr/bin/env node
/**
 * Script de testare pentru get_quizzes prin MCP
 * Simulează un apel MCP pentru a testa tool-ul get_quizzes
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

const MOODLE_API_URL = process.env.MOODLE_API_URL || 'https://platforma.scoalainformala.ro/webservice/rest/server.php';
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN || '2d00b9356b469277f74d9631af0e4a4a';
const COURSE_ID = process.argv[2] || '1301';

console.log(`🧪 Testare Moodle MCP - get_quizzes pentru cursul ${COURSE_ID}\n`);

// Pornește server-ul MCP
const serverProcess = spawn('node', ['build/index.js'], {
  env: {
    ...process.env,
    MOODLE_API_URL,
    MOODLE_API_TOKEN,
    MOODLE_COURSE_ID: COURSE_ID,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Creează client MCP
const transport = new StdioClientTransport({
  command: 'node',
  args: ['build/index.js'],
  env: {
    MOODLE_API_URL,
    MOODLE_API_TOKEN,
    MOODLE_COURSE_ID: COURSE_ID,
  },
});

const client = new Client(
  {
    name: 'test-client',
    version: '1.0.0',
  },
  {
    capabilities: {},
  }
);

async function testGetQuizzes() {
  try {
    await client.connect(transport);
    console.log('✅ Conectat la Moodle MCP server\n');

    // Listă tool-urile disponibile
    const tools = await client.listTools();
    console.log(`📋 Tool-uri disponibile: ${tools.tools.length}\n`);

    // Apelează get_quizzes
    console.log(`🔍 Apelare get_quizzes pentru cursul ${COURSE_ID}...\n`);
    const result = await client.callTool({
      name: 'get_quizzes',
      arguments: {
        courseId: parseInt(COURSE_ID),
      },
    });

    if (result.content && result.content.length > 0) {
      const quizzes = JSON.parse(result.content[0].text);
      console.log(`✅ Găsite ${quizzes.length} quiz-uri:\n`);
      quizzes.forEach((quiz, index) => {
        console.log(`${index + 1}. ${quiz.name} (ID: ${quiz.id})`);
        if (quiz.intro) {
          console.log(`   Descriere: ${quiz.intro.substring(0, 100)}...`);
        }
        if (quiz.grade) {
          console.log(`   Notă maximă: ${quiz.grade}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️ Nu s-au găsit quiz-uri');
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Eroare:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testGetQuizzes();
