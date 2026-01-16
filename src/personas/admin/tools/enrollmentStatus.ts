import axios from 'axios';

/**
 * Get detailed enrollment status for a course including active/suspended users
 */
export async function admin_get_enrollment_status(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
  includeInactive?: boolean;
}): Promise<any> {
  const { courseId, moodleUrl, token, includeInactive = false } = args;
  
  try {
    console.error(`[ADMIN] Getting enrollment status for course ${courseId} (includeInactive: ${includeInactive})`);
    
    // Get all enrolled users with full details
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = response.data || [];
    
    console.error(`[DEBUG] Received ${allUsers.length} total users from API`);
    
    // Get enrollment methods to check active/suspended status
    const enrollmentResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_course_enrolment_methods',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const enrollmentMethods = enrollmentResponse.data || [];
    console.error(`[DEBUG] Enrollment methods: ${enrollmentMethods.length}`);
    
    // Categorize users
    const students: any[] = [];
    const teachers: any[] = [];
    const suspended: any[] = [];
    const others: any[] = [];
    
    for (const user of allUsers) {
      const roles = user.roles || [];
      const roleNames = roles.map((r: any) => r.shortname);
      
      // Check if suspended (suspended users have enrolledcourses with status 1)
      const isSuspended = user.suspended === true || user.enrolledcourses?.some((c: any) => 
        c.id === courseId && c.status === 1
      );
      
      const userData = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        roles: roles.map((r: any) => r.name).join(', '),
        roleShortnames: roleNames,
        firstaccess: user.firstaccess,
        lastaccess: user.lastaccess,
        lastcourseaccess: user.lastcourseaccess,
        suspended: isSuspended
      };
      
      if (isSuspended && !includeInactive) {
        suspended.push(userData);
        continue;
      }
      
      // Categorize by primary role
      if (roleNames.includes('student')) {
        students.push(userData);
      } else if (roleNames.includes('teacher') || roleNames.includes('editingteacher') || roleNames.includes('manager')) {
        teachers.push(userData);
      } else {
        others.push(userData);
      }
    }
    
    let result = `Enrollment Status for Course ${courseId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📊 SUMMARY:\n`;
    result += `Total enrolled: ${allUsers.length}\n`;
    result += `Active students: ${students.length}\n`;
    result += `Teachers/Mentors: ${teachers.length}\n`;
    result += `Suspended: ${suspended.length}\n`;
    result += `Others: ${others.length}\n\n`;
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Teachers
    if (teachers.length > 0) {
      result += `👨‍🏫 TEACHERS/MENTORS (${teachers.length}):\n\n`;
      teachers.forEach(t => {
        result += `${t.fullname}\n`;
        result += `  ID: ${t.id}\n`;
        result += `  Username: ${t.username}\n`;
        result += `  Email: ${t.email}\n`;
        result += `  Roles: ${t.roles}\n`;
        result += `  Last access: ${t.lastcourseaccess ? new Date(t.lastcourseaccess * 1000).toLocaleDateString() : 'Never'}\n\n`;
      });
    }
    
    // Students
    if (students.length > 0) {
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `👨‍🎓 ACTIVE STUDENTS (${students.length}):\n\n`;
      students.forEach(s => {
        result += `${s.fullname}\n`;
        result += `  ID: ${s.id}\n`;
        result += `  Username: ${s.username}\n`;
        result += `  Email: ${s.email}\n`;
        result += `  Last access: ${s.lastcourseaccess ? new Date(s.lastcourseaccess * 1000).toLocaleDateString() : 'Never'}\n\n`;
      });
    }
    
    // Suspended
    if (suspended.length > 0) {
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `⏸️ SUSPENDED/INACTIVE USERS (${suspended.length}):\n\n`;
      suspended.forEach(s => {
        result += `${s.fullname} (ID: ${s.id}) - ${s.email}\n`;
      });
      result += `\n`;
    }
    
    // Debug: Show raw API response sample
    if (allUsers.length > 0) {
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `🔍 DEBUG INFO:\n`;
      result += `First user sample from API:\n`;
      result += `ID: ${allUsers[0].id}\n`;
      result += `Username: ${allUsers[0].username}\n`;
      result += `Roles: ${JSON.stringify(allUsers[0].roles?.map((r: any) => r.shortname))}\n`;
      result += `Suspended field: ${allUsers[0].suspended}\n`;
      result += `\nAPI returned these user IDs: ${allUsers.map((u: any) => u.id).join(', ')}\n`;
    }
    
    return {
      content: [{
        type: 'text',
        text: result
      }],
      summary: {
        totalEnrolled: allUsers.length,
        activeStudents: students.length,
        teachers: teachers.length,
        suspended: suspended.length,
        students: students.map(s => ({ id: s.id, fullname: s.fullname, email: s.email })),
        teachersList: teachers.map(t => ({ id: t.id, fullname: t.fullname, email: t.email }))
      }
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error getting enrollment status: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
