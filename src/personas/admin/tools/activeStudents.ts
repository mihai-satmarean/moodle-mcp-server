import axios from 'axios';

/**
 * Get ONLY active students from a specific course (filters out suspended/inactive)
 */
export async function admin_get_active_students_only(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseId, moodleUrl, token } = args;
  
  try {
    console.error(`[ADMIN] Getting ACTIVE students for course ${courseId}`);
    
    // Get all enrolled users
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = response.data || [];
    console.error(`[DEBUG] API returned ${allUsers.length} total users`);
    
    // Get enrollment info to check active status
    const enrollmentResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_users_courses',
        moodlewsrestformat: 'json',
        userid: 0 // Will be replaced per user
      }
    });
    
    const activeStudents: any[] = [];
    
    for (const user of allUsers) {
      const roles = user.roles || [];
      const isStudent = roles.some((r: any) => r.shortname === 'student');
      
      if (!isStudent) continue;
      
      // Check if user is active in THIS course
      const userCoursesResponse = await axios.get(moodleUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_enrol_get_users_courses',
          moodlewsrestformat: 'json',
          userid: user.id
        }
      });
      
      const userCourses = userCoursesResponse.data || [];
      const enrolledInThisCourse = userCourses.find((c: any) => c.id === courseId);
      
      // Skip if not enrolled or suspended
      if (!enrolledInThisCourse) {
        console.error(`[DEBUG] User ${user.id} (${user.fullname}) - NOT enrolled in course ${courseId}`);
        continue;
      }
      
      if (enrolledInThisCourse.suspended === true || enrolledInThisCourse.status === 1) {
        console.error(`[DEBUG] User ${user.id} (${user.fullname}) - SUSPENDED in course ${courseId}`);
        continue;
      }
      
      activeStudents.push({
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        lastaccess: user.lastaccess,
        lastcourseaccess: user.lastcourseaccess
      });
    }
    
    console.error(`[DEBUG] Found ${activeStudents.length} ACTIVE students`);
    
    let result = `Active Students in Course ${courseId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📊 SUMMARY:\n`;
    result += `Total users from API: ${allUsers.length}\n`;
    result += `Active students: ${activeStudents.length}\n\n`;
    
    if (activeStudents.length === 0) {
      result += `⚠️ No active students found in this course!\n`;
      result += `This might indicate:\n`;
      result += `- All students are suspended\n`;
      result += `- Course ID is incorrect\n`;
      result += `- API is returning wrong data\n`;
    } else {
      result += `👨‍🎓 ACTIVE STUDENTS:\n\n`;
      activeStudents.forEach((s, index) => {
        result += `${index + 1}. ${s.fullname}\n`;
        result += `   ID: ${s.id}\n`;
        result += `   Username: ${s.username}\n`;
        result += `   Email: ${s.email}\n`;
        result += `   Last access: ${s.lastcourseaccess ? new Date(s.lastcourseaccess * 1000).toLocaleDateString() : 'Never'}\n\n`;
      });
    }
    
    return {
      content: [{
        type: 'text',
        text: result
      }],
      activeStudents: activeStudents,
      totalFromAPI: allUsers.length,
      activeCount: activeStudents.length
    };
    
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error getting active students: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
