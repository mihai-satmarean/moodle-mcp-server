/**
 * Advanced Course Search Tools
 * Search courses by name, instructor, or other criteria
 */

import axios from 'axios';

export interface CourseSearchResult {
  id: number;
  fullname: string;
  shortname: string;
  categoryname?: string;
  visible: boolean;
  startdate?: number;
  enddate?: number;
  summary?: string;
  instructors?: Array<{
    id: number;
    fullname: string;
    email: string;
    roles: string[];
  }>;
}

/**
 * Search courses by name (partial match)
 */
export async function admin_search_courses_by_name(args: {
  searchTerm: string;
  moodleUrl: string;
  token: string;
  includeInstructors?: boolean;
}): Promise<any> {
  const { searchTerm, moodleUrl, token, includeInstructors = false } = args;
  
  try {
    // Use core_course_search_courses for text search
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_course_search_courses',
        moodlewsrestformat: 'json',
        criterianame: 'search',
        criteriavalue: searchTerm,
        page: 0,
        perpage: 50
      }
    });
    
    const courses = response.data.courses || [];
    
    // If requested, get instructors for each course
    if (includeInstructors && courses.length > 0) {
      for (const course of courses) {
        try {
          const instructors = await getCourseInstructors(course.id, moodleUrl, token);
          course.instructors = instructors;
        } catch (error) {
          console.error(`Failed to get instructors for course ${course.id}:`, error);
          course.instructors = [];
        }
      }
    }
    
    const resultText = formatCourseSearchResults(courses, searchTerm, 'name');
    
    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error searching courses by name: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Search courses by instructor name or email
 */
export async function admin_search_courses_by_instructor(args: {
  instructorQuery: string; // name or email
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { instructorQuery, moodleUrl, token } = args;
  
  try {
    // Step 1: Search for users matching the query
    const usersResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_user_get_users',
        moodlewsrestformat: 'json',
        'criteria[0][key]': 'search',
        'criteria[0][value]': instructorQuery
      }
    });
    
    const matchedUsers = usersResponse.data.users || [];
    
    if (matchedUsers.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No instructors found matching: "${instructorQuery}"\n\nTry:\n- Full name (e.g., "Ion Popescu")\n- Partial name (e.g., "Popescu")\n- Email (e.g., "ion@example.com")`
        }]
      };
    }
    
    // Step 2: For each user, find courses where they have teacher/editingteacher role
    const allCourses: Map<number, CourseSearchResult> = new Map();
    
    for (const user of matchedUsers) {
      try {
        // Get courses where this user is enrolled
        const coursesResponse = await axios.get(moodleUrl, {
          params: {
            wstoken: token,
            wsfunction: 'core_enrol_get_users_courses',
            moodlewsrestformat: 'json',
            userid: user.id
          }
        });
        
        const userCourses = coursesResponse.data || [];
        
        for (const course of userCourses) {
          // Verify user has teacher role in this course
          const hasTeacherRole = await checkIfUserIsTeacher(course.id, user.id, moodleUrl, token);
          
          if (hasTeacherRole) {
            if (!allCourses.has(course.id)) {
              allCourses.set(course.id, {
                id: course.id,
                fullname: course.fullname,
                shortname: course.shortname,
                visible: course.visible !== 0,
                startdate: course.startdate,
                enddate: course.enddate,
                summary: course.summary,
                instructors: []
              });
            }
            
            // Add instructor info
            const courseData = allCourses.get(course.id)!;
            if (!courseData.instructors!.some(i => i.id === user.id)) {
              courseData.instructors!.push({
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                roles: ['Teacher'] // Simplified - could get exact roles
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to get courses for user ${user.id}:`, error);
      }
    }
    
    const courses = Array.from(allCourses.values());
    const resultText = formatCourseSearchResults(courses, instructorQuery, 'instructor');
    
    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error searching courses by instructor: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Combined search - by name AND instructor
 */
export async function admin_search_courses_advanced(args: {
  courseName?: string;
  instructorName?: string;
  includeHidden?: boolean;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseName, instructorName, includeHidden = false, moodleUrl, token } = args;
  
  if (!courseName && !instructorName) {
    return {
      content: [{
        type: 'text',
        text: 'Please provide at least one search criterion: courseName or instructorName'
      }],
      isError: true
    };
  }
  
  try {
    let courses: CourseSearchResult[] = [];
    
    // Search by name first if provided
    if (courseName) {
      const nameSearchResponse = await axios.get(moodleUrl, {
        params: {
          wstoken: token,
          wsfunction: 'core_course_search_courses',
          moodlewsrestformat: 'json',
          criterianame: 'search',
          criteriavalue: courseName,
          page: 0,
          perpage: 100
        }
      });
      
      courses = nameSearchResponse.data.courses || [];
    }
    
    // Filter by instructor if provided
    if (instructorName && courses.length > 0) {
      // Get instructors for each course and filter
      const filteredCourses: CourseSearchResult[] = [];
      
      for (const course of courses) {
        const instructors = await getCourseInstructors(course.id, moodleUrl, token);
        const hasMatchingInstructor = instructors.some(
          i => i.fullname.toLowerCase().includes(instructorName.toLowerCase()) ||
               i.email.toLowerCase().includes(instructorName.toLowerCase())
        );
        
        if (hasMatchingInstructor) {
          filteredCourses.push({
            ...course,
            instructors
          });
        }
      }
      
      courses = filteredCourses;
    } else if (instructorName && !courseName) {
      // Only instructor search
      const instructorResult = await admin_search_courses_by_instructor({
        instructorQuery: instructorName,
        moodleUrl,
        token
      });
      return instructorResult;
    }
    
    // Filter hidden courses if needed
    if (!includeHidden) {
      courses = courses.filter(c => c.visible);
    }
    
    const resultText = formatCourseSearchResults(
      courses,
      `Name: "${courseName || 'any'}", Instructor: "${instructorName || 'any'}"`,
      'advanced'
    );
    
    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error in advanced course search: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

// ============= HELPER FUNCTIONS =============

/**
 * Get all instructors (teachers) for a course
 */
async function getCourseInstructors(
  courseId: number,
  moodleUrl: string,
  token: string
): Promise<Array<{ id: number; fullname: string; email: string; roles: string[] }>> {
  try {
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const users = response.data || [];
    
    // Filter for users with teacher/editingteacher roles
    const instructors = users
      .filter((user: any) => {
        const roles = user.roles || [];
        return roles.some((role: any) => 
          role.shortname === 'teacher' || 
          role.shortname === 'editingteacher' ||
          role.shortname === 'manager'
        );
      })
      .map((user: any) => ({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        roles: user.roles.map((r: any) => r.name || r.shortname)
      }));
    
    return instructors;
  } catch (error) {
    console.error(`Failed to get instructors for course ${courseId}:`, error);
    return [];
  }
}

/**
 * Check if user has teacher role in a course
 */
async function checkIfUserIsTeacher(
  courseId: number,
  userId: number,
  moodleUrl: string,
  token: string
): Promise<boolean> {
  try {
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId,
        'options[0][name]': 'userids',
        'options[0][value]': userId.toString()
      }
    });
    
    const users = response.data || [];
    if (users.length === 0) return false;
    
    const user = users[0];
    const roles = user.roles || [];
    
    return roles.some((role: any) =>
      role.shortname === 'teacher' ||
      role.shortname === 'editingteacher' ||
      role.shortname === 'manager'
    );
  } catch (error) {
    return false;
  }
}

/**
 * Format search results for display
 */
function formatCourseSearchResults(
  courses: CourseSearchResult[],
  query: string,
  searchType: 'name' | 'instructor' | 'advanced'
): string {
  if (courses.length === 0) {
    return `No courses found matching: "${query}"\n\nTips:\n- Try partial name match\n- Check spelling\n- Try instructor search instead`;
  }
  
  let result = `Found ${courses.length} course${courses.length > 1 ? 's' : ''} matching: "${query}"\n\n`;
  
  for (const course of courses) {
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `📚 ${course.fullname}\n`;
    result += `   ID: ${course.id} | Short: ${course.shortname}\n`;
    result += `   Status: ${course.visible ? '✅ Visible' : '🔒 Hidden'}\n`;
    
    if (course.summary) {
      const shortSummary = course.summary.replace(/<[^>]*>/g, '').substring(0, 100);
      result += `   Summary: ${shortSummary}${course.summary.length > 100 ? '...' : ''}\n`;
    }
    
    if (course.instructors && course.instructors.length > 0) {
      result += `   \n   👨‍🏫 Instructors:\n`;
      for (const instructor of course.instructors) {
        result += `      • ${instructor.fullname} (${instructor.email})\n`;
        result += `        Roles: ${instructor.roles.join(', ')}\n`;
      }
    }
    
    result += `\n`;
  }
  
  result += `\nTo get full details for a course:\n`;
  result += `get_course_contents({ courseId: COURSE_ID })`;
  
  return result;
}
