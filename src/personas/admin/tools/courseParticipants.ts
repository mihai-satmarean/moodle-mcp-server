/**
 * Course Participants Tools
 * Get detailed participant information with roles
 */

import axios from 'axios';

export interface Participant {
  id: number;
  username: string;
  fullname: string;
  email: string;
  roles: Array<{
    roleid: number;
    name: string;
    shortname: string;
  }>;
  firstaccess?: number;
  lastaccess?: number;
  lastcourseaccess?: number;
}

/**
 * Get all course participants with their roles
 * Shows mentors, students, and other roles separately
 */
export async function admin_get_course_participants(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
  includeInactive?: boolean;
}): Promise<any> {
  const { courseId, moodleUrl, token, includeInactive = false } = args;
  
  try {
    console.error(`[DEBUG] Fetching participants for course ${courseId}`);
    
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = response.data || [];
    
    console.error(`[DEBUG] Received ${allUsers.length} total enrolled users`);
    
    // Categorize by role
    const mentors: Participant[] = [];
    const students: Participant[] = [];
    const others: Participant[] = [];
    
    for (const user of allUsers) {
      const roles = user.roles || [];
      const roleNames = roles.map((r: any) => r.shortname);
      
      const participant: Participant = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        roles: roles.map((r: any) => ({
          roleid: r.roleid,
          name: r.name,
          shortname: r.shortname
        })),
        firstaccess: user.firstaccess,
        lastaccess: user.lastaccess,
        lastcourseaccess: user.lastcourseaccess
      };
      
      // Categorize by primary role
      if (roleNames.includes('editingteacher') || 
          roleNames.includes('teacher') || 
          roleNames.includes('manager')) {
        mentors.push(participant);
      } else if (roleNames.includes('student')) {
        students.push(participant);
      } else {
        others.push(participant);
      }
    }
    
    // Format output
    let result = `Course Participants for ID ${courseId}\n`;
    result += `Total enrolled: ${allUsers.length}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Mentors section
    result += `👨‍🏫 MENTORS/TRAINERS (${mentors.length}):\n`;
    if (mentors.length === 0) {
      result += `   (No mentors found)\n`;
    } else {
      for (const mentor of mentors) {
        result += `\n   • ${mentor.fullname} (ID: ${mentor.id})\n`;
        result += `     Username: ${mentor.username}\n`;
        result += `     Email: ${mentor.email}\n`;
        result += `     Roles: ${mentor.roles.map(r => r.name).join(', ')}\n`;
      }
    }
    
    result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Students section
    result += `👨‍🎓 STUDENTS/CURSANȚI (${students.length}):\n`;
    if (students.length === 0) {
      result += `   (No students found)\n`;
    } else {
      for (const student of students) {
        result += `\n   • ${student.fullname} (ID: ${student.id})\n`;
        result += `     Username: ${student.username}\n`;
        result += `     Email: ${student.email}\n`;
        const lastAccess = student.lastcourseaccess 
          ? new Date(student.lastcourseaccess * 1000).toLocaleString()
          : 'Never accessed';
        result += `     Last access: ${lastAccess}\n`;
      }
    }
    
    // Others section
    if (others.length > 0) {
      result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `👤 OTHER ROLES (${others.length}):\n`;
      for (const other of others) {
        result += `\n   • ${other.fullname} (ID: ${other.id})\n`;
        result += `     Roles: ${other.roles.map(r => r.name).join(', ')}\n`;
      }
    }
    
    result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `\nSUMMARY:\n`;
    result += `• Mentors: ${mentors.length}\n`;
    result += `• Students: ${students.length}\n`;
    result += `• Others: ${others.length}\n`;
    result += `• Total: ${allUsers.length}\n`;
    
    return {
      content: [{
        type: 'text',
        text: result
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error getting course participants: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Get only mentors for a course
 */
export async function admin_get_course_mentors(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseId, moodleUrl, token } = args;
  
  try {
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = response.data || [];
    
    // Filter for teaching roles
    const mentors = allUsers.filter((user: any) => {
      const roles = user.roles || [];
      return roles.some((role: any) =>
        role.shortname === 'editingteacher' ||
        role.shortname === 'teacher' ||
        role.shortname === 'manager'
      );
    });
    
    let result = `Mentors for Course ${courseId}:\n\n`;
    
    if (mentors.length === 0) {
      result += `No mentors found for this course.\n`;
    } else {
      for (const mentor of mentors) {
        result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `👨‍🏫 ${mentor.fullname}\n`;
        result += `   ID: ${mentor.id}\n`;
        result += `   Username: ${mentor.username}\n`;
        result += `   Email: ${mentor.email}\n`;
        result += `   Roles: ${mentor.roles.map((r: any) => r.name).join(', ')}\n\n`;
      }
    }
    
    result += `Total mentors: ${mentors.length}`;
    
    return {
      content: [{
        type: 'text',
        text: result
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error getting course mentors: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Compare participants between two courses
 * Useful for finding duplicate enrollments or migrations
 */
export async function admin_compare_course_participants(args: {
  courseId1: number;
  courseId2: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseId1, courseId2, moodleUrl, token } = args;
  
  try {
    // Get participants for both courses
    const [response1, response2] = await Promise.all([
      axios.get(moodleUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_enrol_get_enrolled_users',
          moodlewsrestformat: 'json',
          courseid: courseId1
        }
      }),
      axios.get(moodleUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_enrol_get_enrolled_users',
          moodlewsrestformat: 'json',
          courseid: courseId2
        }
      })
    ]);
    
    const users1 = response1.data || [];
    const users2 = response2.data || [];
    
    const ids1 = new Set(users1.map((u: any) => u.id));
    const ids2 = new Set(users2.map((u: any) => u.id));
    
    // Find common users
    const common = users1.filter((u: any) => ids2.has(u.id));
    
    // Find unique to each course
    const onlyIn1 = users1.filter((u: any) => !ids2.has(u.id));
    const onlyIn2 = users2.filter((u: any) => !ids1.has(u.id));
    
    let result = `Comparing Participants:\n`;
    result += `Course ${courseId1}: ${users1.length} participants\n`;
    result += `Course ${courseId2}: ${users2.length} participants\n\n`;
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `👥 IN BOTH COURSES (${common.length}):\n`;
    if (common.length === 0) {
      result += `   (No common participants)\n`;
    } else {
      for (const user of common) {
        result += `   • ${user.fullname} (${user.email})\n`;
      }
    }
    
    result += `\n📘 ONLY IN COURSE ${courseId1} (${onlyIn1.length}):\n`;
    if (onlyIn1.length === 0) {
      result += `   (None)\n`;
    } else {
      for (const user of onlyIn1.slice(0, 10)) {
        result += `   • ${user.fullname}\n`;
      }
      if (onlyIn1.length > 10) {
        result += `   ... and ${onlyIn1.length - 10} more\n`;
      }
    }
    
    result += `\n📗 ONLY IN COURSE ${courseId2} (${onlyIn2.length}):\n`;
    if (onlyIn2.length === 0) {
      result += `   (None)\n`;
    } else {
      for (const user of onlyIn2.slice(0, 10)) {
        result += `   • ${user.fullname}\n`;
      }
      if (onlyIn2.length > 10) {
        result += `   ... and ${onlyIn2.length - 10} more\n`;
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: result
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error comparing course participants: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
