/**
 * Quiz Leaderboard and Class Results
 * View all students' quiz results in one table
 */

import axios from 'axios';

export interface StudentQuizResult {
  studentId: number;
  studentName: string;
  studentEmail: string;
  attempts: number;
  bestScore: number | null;
  maxScore: number;
  percentage: number | null;
  lastAttempt: number | null;
  status: 'completed' | 'not_attempted';
}

/**
 * Get quiz results for ALL students in a course (leaderboard)
 */
export async function tutor_get_quiz_leaderboard(args: {
  quizId: number;
  courseId: number;
  moodleUrl: string;
  token: string;
  sortBy?: 'score' | 'name' | 'attempts';
}): Promise<any> {
  const { quizId, courseId, moodleUrl, token, sortBy = 'score' } = args;
  
  try {
    // Step 1: Get quiz info
    const quizResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'mod_quiz_get_quizzes_by_courses',
        moodlewsrestformat: 'json',
        courseids: [courseId]
      }
    });
    
    const quizzes = quizResponse.data.quizzes || [];
    const quiz = quizzes.find((q: any) => q.id === quizId);
    
    if (!quiz) {
      return {
        content: [{
          type: 'text',
          text: `Quiz ${quizId} not found in course ${courseId}`
        }],
        isError: true
      };
    }
    
    // Step 2: Get all students in course
    const studentsResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = studentsResponse.data || [];
    
    // Filter only students (not teachers)
    const students = allUsers.filter((user: any) => {
      const roles = user.roles || [];
      return roles.some((role: any) => role.shortname === 'student');
    });
    
    // Step 3: Get quiz results for each student
    const results: StudentQuizResult[] = [];
    
    for (const student of students) {
      try {
        const attemptsResponse = await axios.get(moodleUrl, {
          params: {
            wstoken: token,
            wsfunction: 'mod_quiz_get_user_attempts',
            moodlewsrestformat: 'json',
            quizid: quizId,
            userid: student.id,
            status: 'finished'
          }
        });
        
        const attempts = attemptsResponse.data.attempts || [];
        
        if (attempts.length > 0) {
          const bestAttempt = attempts.reduce((best: any, current: any) => 
            current.sumgrades > best.sumgrades ? current : best
          );
          
          results.push({
            studentId: student.id,
            studentName: student.fullname,
            studentEmail: student.email,
            attempts: attempts.length,
            bestScore: bestAttempt.sumgrades,
            maxScore: bestAttempt.maxgrade,
            percentage: (bestAttempt.sumgrades / bestAttempt.maxgrade) * 100,
            lastAttempt: bestAttempt.timefinish,
            status: 'completed'
          });
        } else {
          results.push({
            studentId: student.id,
            studentName: student.fullname,
            studentEmail: student.email,
            attempts: 0,
            bestScore: null,
            maxScore: quiz.grade || 100,
            percentage: null,
            lastAttempt: null,
            status: 'not_attempted'
          });
        }
      } catch (error) {
        console.error(`Failed to get results for student ${student.id}:`, error);
      }
    }
    
    // Sort results
    if (sortBy === 'score') {
      results.sort((a, b) => (b.percentage || -1) - (a.percentage || -1));
    } else if (sortBy === 'name') {
      results.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (sortBy === 'attempts') {
      results.sort((a, b) => b.attempts - a.attempts);
    }
    
    // Calculate statistics
    const completed = results.filter(r => r.status === 'completed');
    const notAttempted = results.filter(r => r.status === 'not_attempted');
    
    const avgScore = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.percentage || 0), 0) / completed.length
      : 0;
    
    const maxPercentage = completed.length > 0
      ? Math.max(...completed.map(r => r.percentage || 0))
      : 0;
    
    const minPercentage = completed.length > 0
      ? Math.min(...completed.map(r => r.percentage || 0))
      : 0;
    
    // Format output
    let result = `📊 Quiz Leaderboard: ${quiz.name}\n`;
    result += `Quiz ID: ${quizId} | Course ID: ${courseId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📈 STATISTICS:\n`;
    result += `Total students: ${results.length}\n`;
    result += `Completed: ${completed.length} (${((completed.length / results.length) * 100).toFixed(1)}%)\n`;
    result += `Not attempted: ${notAttempted.length}\n`;
    
    if (completed.length > 0) {
      result += `\nSCORES:\n`;
      result += `Average: ${avgScore.toFixed(1)}%\n`;
      result += `Highest: ${maxPercentage.toFixed(1)}%\n`;
      result += `Lowest: ${minPercentage.toFixed(1)}%\n`;
      result += `Pass rate (≥50%): ${completed.filter(r => (r.percentage || 0) >= 50).length}/${completed.length}\n`;
    }
    
    result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Results table
    if (completed.length > 0) {
      result += `✅ COMPLETED (sorted by score):\n\n`;
      
      let rank = 1;
      for (const r of completed) {
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
        const gradeIcon = (r.percentage || 0) >= 90 ? '🟢' :
                         (r.percentage || 0) >= 70 ? '🟡' :
                         (r.percentage || 0) >= 50 ? '🟠' : '🔴';
        
        result += `${medal} ${gradeIcon} ${r.studentName}\n`;
        result += `      Score: ${r.bestScore?.toFixed(1)}/${r.maxScore} (${r.percentage?.toFixed(1)}%)\n`;
        result += `      Attempts: ${r.attempts}`;
        
        if (r.lastAttempt) {
          result += ` | Last: ${new Date(r.lastAttempt * 1000).toLocaleDateString()}`;
        }
        
        result += `\n      Email: ${r.studentEmail}\n`;
        result += `      ID: ${r.studentId}\n\n`;
        
        rank++;
      }
    }
    
    if (notAttempted.length > 0) {
      result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `⏳ NOT ATTEMPTED (${notAttempted.length} students):\n\n`;
      
      for (const r of notAttempted) {
        result += `   ❌ ${r.studentName} (${r.studentEmail})\n`;
        result += `      ID: ${r.studentId}\n`;
      }
    }
    
    result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `\n💡 TIP: For individual student details, use:\n`;
    result += `tutor_get_student_quiz_attempts({ studentId: X, quizId: ${quizId} })`;
    
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
        text: `Error getting quiz leaderboard: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Get quiz completion summary for a course (which quizzes students have completed)
 */
export async function tutor_get_course_quiz_completion(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseId, moodleUrl, token } = args;
  
  try {
    // Step 1: Get all quizzes
    const quizzesResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'mod_quiz_get_quizzes_by_courses',
        moodlewsrestformat: 'json',
        courseids: [courseId]
      }
    });
    
    const quizzes = quizzesResponse.data.quizzes || [];
    
    if (quizzes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No quizzes found in course ${courseId}`
        }]
      };
    }
    
    // Step 2: Get all students
    const studentsResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const allUsers = studentsResponse.data || [];
    const students = allUsers.filter((user: any) => {
      const roles = user.roles || [];
      return roles.some((role: any) => role.shortname === 'student');
    });
    
    // Step 3: Build completion matrix
    const completionMatrix: any = {};
    
    for (const student of students) {
      completionMatrix[student.id] = {
        name: student.fullname,
        email: student.email,
        quizzes: {}
      };
      
      for (const quiz of quizzes) {
        try {
          const response = await axios.get(moodleUrl, {
            params: {
              wstoken: token,
              wsfunction: 'mod_quiz_get_user_attempts',
              moodlewsrestformat: 'json',
              quizid: quiz.id,
              userid: student.id,
              status: 'finished'
            }
          });
          
          const attempts = response.data.attempts || [];
          
          if (attempts.length > 0) {
            const bestAttempt = attempts.reduce((best: any, current: any) => 
              current.sumgrades > best.sumgrades ? current : best
            );
            
            completionMatrix[student.id].quizzes[quiz.id] = {
              completed: true,
              score: bestAttempt.sumgrades,
              maxScore: bestAttempt.maxgrade,
              percentage: (bestAttempt.sumgrades / bestAttempt.maxgrade) * 100,
              attempts: attempts.length
            };
          } else {
            completionMatrix[student.id].quizzes[quiz.id] = {
              completed: false,
              score: null,
              maxScore: quiz.grade || 100,
              percentage: null,
              attempts: 0
            };
          }
        } catch (error) {
          console.error(`Failed for student ${student.id}, quiz ${quiz.id}:`, error);
        }
      }
    }
    
    // Format output
    let result = `📋 Quiz Completion Matrix - Course ${courseId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📊 OVERVIEW:\n`;
    result += `Total students: ${students.length}\n`;
    result += `Total quizzes: ${quizzes.length}\n\n`;
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Per quiz statistics
    result += `📝 PER QUIZ:\n\n`;
    
    for (const quiz of quizzes) {
      const completedCount = students.filter((s: any) => 
        completionMatrix[s.id].quizzes[quiz.id].completed
      ).length;
      
      const completionRate = (completedCount / students.length) * 100;
      
      result += `${quiz.name} (ID: ${quiz.id})\n`;
      result += `   Completion: ${completedCount}/${students.length} (${completionRate.toFixed(1)}%)\n`;
      
      if (completedCount > 0) {
        const scores = students
          .filter((s: any) => completionMatrix[s.id].quizzes[quiz.id].completed)
          .map((s: any) => completionMatrix[s.id].quizzes[quiz.id].percentage);
        
        const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        result += `   Average score: ${avgScore.toFixed(1)}%\n`;
      }
      
      result += `\n`;
    }
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Per student summary
    result += `👨‍🎓 PER STUDENT:\n\n`;
    
    for (const student of students) {
      const studentData = completionMatrix[student.id];
      const completedQuizzes = Object.values(studentData.quizzes).filter((q: any) => q.completed).length;
      const totalQuizzes = quizzes.length;
      
      result += `${studentData.name}\n`;
      result += `   Progress: ${completedQuizzes}/${totalQuizzes} quizzes completed\n`;
      
      if (completedQuizzes > 0) {
        const avgScore = (Object.values(studentData.quizzes) as any[])
          .filter((q: any) => q.completed)
          .reduce((sum: number, q: any) => sum + q.percentage, 0) / completedQuizzes;
        
        result += `   Average: ${avgScore.toFixed(1)}%\n`;
      }
      
      // Show which quizzes are missing
      const missing = quizzes
        .filter((q: any) => !studentData.quizzes[q.id].completed)
        .map((q: any) => q.name);
      
      if (missing.length > 0) {
        result += `   Missing: ${missing.join(', ')}\n`;
      }
      
      result += `\n`;
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
        text: `Error getting quiz completion matrix: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
