#!/usr/bin/env node

/**
 * Test script pentru conexiunea la platforma.scoalainformala.ro
 * Testează webservice-ul Moodle și funcționalitățile de bază
 */

import axios from 'axios';

// Configurare pentru testare
const MOODLE_API_URL = 'https://platforma.scoalainformala.ro/webservice/rest/server.php';
const MOODLE_API_TOKEN = '2d00b9356b469277f74d9631af0e4a4a';
const TEST_COURSE_ID = 1;

// Funcție pentru testarea webservice-ului cu token
async function testWebserviceWithToken() {
  console.log('🔍 Testare webservice Moodle cu token...');
  
  try {
    const response = await axios.get(MOODLE_API_URL, {
      params: {
        wstoken: MOODLE_API_TOKEN,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });
    
    console.log('✅ Webservice funcțional cu token');
    console.log('📊 Răspuns:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Eroare la webservice cu token:', error.message);
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📄 Data:', error.response.data);
    }
    return false;
  }
}

// Funcție pentru testarea informațiilor despre site cu token
async function testSiteInfoWithToken() {
  console.log('\n🔍 Testare informații site cu token...');
  
  try {
    const response = await axios.get(MOODLE_API_URL, {
      params: {
        wstoken: MOODLE_API_TOKEN,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });
    
    if (response.data) {
      console.log('✅ Informații site:');
      console.log(`   - Nume: ${response.data.sitename || 'N/A'}`);
      console.log(`   - URL: ${response.data.siteurl || 'N/A'}`);
      console.log(`   - Versiune Moodle: ${response.data.version || 'N/A'}`);
      console.log(`   - Funcții disponibile: ${response.data.functions ? response.data.functions.length : 'N/A'}`);
      console.log(`   - User ID: ${response.data.userid || 'N/A'}`);
      console.log(`   - Username: ${response.data.username || 'N/A'}`);
      console.log(`   - First name: ${response.data.firstname || 'N/A'}`);
      console.log(`   - Last name: ${response.data.lastname || 'N/A'}`);
    }
  } catch (error) {
    console.log('❌ Eroare la obținerea informațiilor site:', error.message);
  }
}

// Funcție pentru testarea funcțiilor specifice cursului cu token
async function testCourseFunctionsWithToken() {
  console.log('\n🔍 Testare funcții curs cu token...');
  
  const courseFunctions = [
    {
      name: 'core_enrol_get_enrolled_users',
      description: 'Obține lista cursanților înscriși'
    },
    {
      name: 'mod_assign_get_assignments',
      description: 'Obține lista temelor disponibile'
    },
    {
      name: 'mod_quiz_get_quizzes_by_courses',
      description: 'Obține lista quiz-urilor disponibile'
    },
    {
      name: 'core_course_get_courses',
      description: 'Obține informații despre cursuri'
    }
  ];
  
  for (const func of courseFunctions) {
    try {
      console.log(`   - Testare ${func.name} (${func.description})...`);
      
      let params = {
        wstoken: MOODLE_API_TOKEN,
        wsfunction: func.name,
        moodlewsrestformat: 'json'
      };
      
      // Adaugă parametrii specifici pentru fiecare funcție
      if (func.name === 'core_enrol_get_enrolled_users' || 
          func.name === 'mod_assign_get_assignments' ||
          func.name === 'mod_quiz_get_quizzes_by_courses') {
        params.courseid = TEST_COURSE_ID;
      }
      
      const response = await axios.get(MOODLE_API_URL, {
        params: params,
        timeout: 10000
      });
      
      if (response.data && response.data.exception) {
        console.log(`     ⚠️ Eroare API: ${response.data.message || 'Eroare necunoscută'}`);
      } else {
        console.log(`     ✅ Funcția funcționează`);
        
        // Afișează rezultatele pentru funcțiile de curs
        if (func.name === 'core_enrol_get_enrolled_users' && response.data) {
          console.log(`        📚 Cursanți găsiți: ${response.data.length || 0}`);
          if (response.data.length > 0) {
            console.log(`        👤 Primul cursant: ${response.data[0].firstname} ${response.data[0].lastname}`);
          }
        } else if (func.name === 'mod_assign_get_assignments' && response.data) {
          console.log(`        📝 Teme găsite: ${response.data.courses?.[0]?.assignments?.length || 0}`);
        } else if (func.name === 'mod_quiz_get_quizzes_by_courses' && response.data) {
          console.log(`        🧠 Quiz-uri găsite: ${response.data.quizzes?.length || 0}`);
        }
      }
    } catch (error) {
      console.log(`     ❌ Eroare la ${func.name}:`, error.message);
    }
  }
}

// Funcție pentru testarea funcțiilor de predare și feedback
async function testSubmissionFunctionsWithToken() {
  console.log('\n🔍 Testare funcții predare și feedback cu token...');
  
  const submissionFunctions = [
    {
      name: 'mod_assign_get_submissions',
      description: 'Obține predările cursanților'
    },
    {
      name: 'mod_assign_get_grades',
      description: 'Obține notele pentru teme'
    }
  ];
  
  for (const func of submissionFunctions) {
    try {
      console.log(`   - Testare ${func.name} (${func.description})...`);
      
      // Mai întâi să obținem ID-ul unei teme pentru testare
      const assignmentsResponse = await axios.get(MOODLE_API_URL, {
        params: {
          wstoken: MOODLE_API_TOKEN,
          wsfunction: 'mod_assign_get_assignments',
          courseids: [TEST_COURSE_ID],
          moodlewsrestformat: 'json'
        },
        timeout: 10000
      });
      
      if (assignmentsResponse.data && assignmentsResponse.data.courses && 
          assignmentsResponse.data.courses[0] && assignmentsResponse.data.courses[0].assignments &&
          assignmentsResponse.data.courses[0].assignments.length > 0) {
        
        const assignmentId = assignmentsResponse.data.courses[0].assignments[0].id;
        console.log(`        📝 Folosim tema cu ID: ${assignmentId}`);
        
        // Testează funcția cu ID-ul temei
        const response = await axios.get(MOODLE_API_URL, {
          params: {
            wstoken: MOODLE_API_TOKEN,
            wsfunction: func.name,
            assignmentids: [assignmentId],
            moodlewsrestformat: 'json'
          },
          timeout: 10000
        });
        
        if (response.data && response.data.exception) {
          console.log(`        ⚠️ Eroare API: ${response.data.message || 'Eroare necunoscută'}`);
        } else {
          console.log(`        ✅ Funcția funcționează`);
          if (func.name === 'mod_assign_get_submissions') {
            console.log(`        📤 Predări găsite: ${response.data.assignments?.[0]?.submissions?.length || 0}`);
          } else if (func.name === 'mod_assign_get_grades') {
            console.log(`        📊 Note găsite: ${response.data.assignments?.[0]?.grades?.length || 0}`);
          }
        }
      } else {
        console.log(`        ⚠️ Nu s-au găsit teme pentru testare`);
      }
    } catch (error) {
      console.log(`     ❌ Eroare la ${func.name}:`, error.message);
    }
  }
}

// Funcție principală
async function runTestsWithToken() {
  console.log('🚀 Începere testare Moodle MCP Server cu token real');
  console.log('📍 URL:', MOODLE_API_URL);
  console.log('🔑 Token:', MOODLE_API_TOKEN.substring(0, 8) + '...');
  console.log('📚 Curs test:', TEST_COURSE_ID);
  console.log('=' .repeat(70));
  
  // Teste cu token
  const webserviceWorking = await testWebserviceWithToken();
  
  if (webserviceWorking) {
    await testSiteInfoWithToken();
    await testCourseFunctionsWithToken();
    await testSubmissionFunctionsWithToken();
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('📋 Rezumat testare cu token:');
  
  if (webserviceWorking) {
    console.log('✅ Webservice-ul Moodle funcționează cu token-ul real');
    console.log('🎯 MCP Server-ul poate fi configurat și testat');
    console.log('\n🔧 Următorii pași:');
    console.log('   1. Actualizează .env cu token-ul real');
    console.log('   2. Rulează: npm run build');
    console.log('   3. Testează cu: npm run inspector');
    console.log('   4. Integrează cu Claude Desktop');
  } else {
    console.log('❌ Probleme cu token-ul sau webservice-ul');
    console.log('🔍 Verifică:');
    console.log('   - Validitatea token-ului');
    console.log('   - Permisiunile token-ului');
    console.log('   - Status-ul webservice-ului');
  }
}

// Rulare teste cu token
runTestsWithToken().catch(console.error);
