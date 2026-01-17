#!/usr/bin/env node

/**
 * Direct API verification for Course 1301
 * Checks how many students are actually enrolled
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;
const COURSE_ID = 1301;

if (!MOODLE_API_URL || !MOODLE_API_TOKEN) {
  console.error('ERROR: MOODLE_API_URL or MOODLE_API_TOKEN not set in environment');
  process.exit(1);
}

async function verifyCourse() {
  console.log('\n=== COURSE 1301 VERIFICATION ===\n');
  console.log(`API URL: ${MOODLE_API_URL}`);
  console.log(`Course ID: ${COURSE_ID}\n`);

  try {
    // Method 1: core_enrol_get_enrolled_users (what MCP uses)
    console.log('METHOD 1: core_enrol_get_enrolled_users');
    console.log('-------------------------------------------');
    const response1 = await axios.get(MOODLE_API_URL, {
      params: {
        wsfunction: 'core_enrol_get_enrolled_users',
        courseid: COURSE_ID,
        moodlewsrestformat: 'json',
        wstoken: MOODLE_API_TOKEN,
      },
    });

    console.log(`Total users returned: ${response1.data.length}`);
    
    if (response1.data.length > 0) {
      console.log('\nUsers breakdown by role:');
      const roleCount = {};
      response1.data.forEach(user => {
        if (user.roles && user.roles.length > 0) {
          user.roles.forEach(role => {
            roleCount[role.shortname] = (roleCount[role.shortname] || 0) + 1;
          });
        } else {
          roleCount['no_role'] = (roleCount['no_role'] || 0) + 1;
        }
      });
      
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
      });

      console.log('\nFirst 5 users:');
      response1.data.slice(0, 5).forEach(user => {
        const roles = user.roles ? user.roles.map(r => r.shortname).join(', ') : 'no roles';
        console.log(`  ID: ${user.id}, Name: ${user.fullname}, Roles: ${roles}`);
      });
    }

    // Method 2: Check course details
    console.log('\n\nMETHOD 2: core_course_get_courses_by_field');
    console.log('-------------------------------------------');
    const response2 = await axios.get(MOODLE_API_URL, {
      params: {
        wsfunction: 'core_course_get_courses_by_field',
        field: 'id',
        value: COURSE_ID,
        moodlewsrestformat: 'json',
        wstoken: MOODLE_API_TOKEN,
      },
    });

    if (response2.data.courses && response2.data.courses.length > 0) {
      const course = response2.data.courses[0];
      console.log(`Course ID: ${course.id}`);
      console.log(`Course Name: ${course.fullname}`);
      console.log(`Course Short Name: ${course.shortname}`);
      console.log(`Visible: ${course.visible}`);
      console.log(`Start Date: ${new Date(course.startdate * 1000).toISOString()}`);
      if (course.enrolledusercount !== undefined) {
        console.log(`Enrolled Users (from course): ${course.enrolledusercount}`);
      }
    } else {
      console.log('Course not found or no access');
    }

    // Method 3: Check if default course is being used
    console.log('\n\nMETHOD 3: Verify MOODLE_COURSE_ID environment');
    console.log('-------------------------------------------');
    console.log(`MOODLE_COURSE_ID env var: ${process.env.MOODLE_COURSE_ID}`);
    
    if (process.env.MOODLE_COURSE_ID && process.env.MOODLE_COURSE_ID !== String(COURSE_ID)) {
      console.log('\nWARNING: MOODLE_COURSE_ID in .env is different from requested course!');
      console.log(`Default course: ${process.env.MOODLE_COURSE_ID}`);
      console.log(`Requested course: ${COURSE_ID}`);
      console.log('This might explain why MCP returns wrong students.');
    }

    // Method 4: Get students with specific role filter
    console.log('\n\nMETHOD 4: Filter users by student role');
    console.log('-------------------------------------------');
    const students = response1.data.filter(user => 
      user.roles && user.roles.some(role => role.shortname === 'student')
    );
    
    console.log(`Total students (filtered): ${students.length}`);
    if (students.length > 0) {
      console.log('\nAll students:');
      students.forEach(student => {
        console.log(`  ID: ${student.id}`);
        console.log(`  Name: ${student.fullname}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Username: ${student.username}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('\nERROR:', error.response?.data || error.message);
    if (error.response?.data?.errorcode) {
      console.error('Error Code:', error.response.data.errorcode);
      console.error('Error Message:', error.response.data.message);
    }
  }

  console.log('\n=== END VERIFICATION ===\n');
}

verifyCourse();
