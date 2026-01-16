/**
 * Quiz Results and Attempts Tools
 * View student quiz attempts, grades, and detailed results
 */

import axios from 'axios';

export interface QuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  sumgrades: number;
  maxgrade: number;
  timestart: number;
  timefinish: number;
  timemodified: number;
  state: string;
  percentageGrade: number;
}

/**
 * Get all quiz attempts for a specific student
 */
export async function tutor_get_student_quiz_attempts(args: {
  studentId: number;
  quizId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { studentId, quizId, moodleUrl, token } = args;
  
  try {
    console.error(`[DEBUG] Getting quiz attempts for student ${studentId} at quiz ${quizId}`);
    
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'mod_quiz_get_user_attempts',
        moodlewsrestformat: 'json',
        quizid: quizId,
        userid: studentId,
        status: 'all' // all, finished, unfinished
      }
    });
    
    const attempts = response.data.attempts || [];
    
    if (attempts.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `Student ${studentId} has NOT attempted quiz ${quizId} yet.\n\nPossible reasons:\n- Student hasn't started the quiz\n- Quiz not available to student\n- Wrong student ID or quiz ID`
        }]
      };
    }
    
    // Calculate percentage for each attempt
    const attemptsWithPercentage = attempts.map((att: any) => ({
      ...att,
      percentageGrade: att.maxgrade > 0 ? (att.sumgrades / att.maxgrade) * 100 : 0
    }));
    
    // Sort by attempt number
    attemptsWithPercentage.sort((a: any, b: any) => a.attempt - b.attempt);
    
    // Find best attempt
    const bestAttempt = attemptsWithPercentage.reduce((best: any, current: any) => 
      current.sumgrades > best.sumgrades ? current : best
    );
    
    let result = `Quiz Attempts for Student ${studentId} at Quiz ${quizId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📊 SUMMARY:\n`;
    result += `Total attempts: ${attempts.length}\n`;
    result += `Best score: ${bestAttempt.sumgrades.toFixed(2)}/${bestAttempt.maxgrade} (${bestAttempt.percentageGrade.toFixed(1)}%)\n`;
    result += `Status: ${bestAttempt.state}\n\n`;
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    result += `📝 ALL ATTEMPTS:\n\n`;
    
    for (const attempt of attemptsWithPercentage) {
      const isBest = attempt.id === bestAttempt.id;
      result += `${isBest ? '⭐ ' : ''}Attempt #${attempt.attempt}${isBest ? ' (BEST)' : ''}\n`;
      result += `   Score: ${attempt.sumgrades.toFixed(2)}/${attempt.maxgrade} (${attempt.percentageGrade.toFixed(1)}%)\n`;
      result += `   State: ${attempt.state}\n`;
      
      if (attempt.timestart) {
        result += `   Started: ${new Date(attempt.timestart * 1000).toLocaleString()}\n`;
      }
      if (attempt.timefinish) {
        result += `   Finished: ${new Date(attempt.timefinish * 1000).toLocaleString()}\n`;
        const duration = attempt.timefinish - attempt.timestart;
        result += `   Duration: ${Math.floor(duration / 60)} minutes\n`;
      }
      result += `   Attempt ID: ${attempt.id}\n\n`;
    }
    
    // Improvement analysis
    if (attempts.length > 1) {
      const firstScore = attemptsWithPercentage[0].percentageGrade;
      const lastScore = attemptsWithPercentage[attemptsWithPercentage.length - 1].percentageGrade;
      const improvement = lastScore - firstScore;
      
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `📈 PROGRESS:\n`;
      result += `First attempt: ${firstScore.toFixed(1)}%\n`;
      result += `Last attempt: ${lastScore.toFixed(1)}%\n`;
      result += `Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`;
      
      if (improvement > 0) {
        result += ` ✅ (Improving!)\n`;
      } else if (improvement < 0) {
        result += ` ⚠️ (Declining)\n`;
      } else {
        result += ` ➡️ (Same level)\n`;
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
        text: `Error getting quiz attempts: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Get all quiz results for a student across all quizzes in a course
 */
export async function tutor_get_student_all_quiz_results(args: {
  studentId: number;
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { studentId, courseId, moodleUrl, token } = args;
  
  try {
    // Step 1: Get all quizzes in course
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
    
    // Step 2: Get attempts for each quiz
    const quizResults = [];
    
    for (const quiz of quizzes) {
      try {
        const attemptsResponse = await axios.get(moodleUrl, {
          params: {
            wstoken: token,
            wsfunction: 'mod_quiz_get_user_attempts',
            moodlewsrestformat: 'json',
            quizid: quiz.id,
            userid: studentId,
            status: 'finished'
          }
        });
        
        const attempts = attemptsResponse.data.attempts || [];
        
        if (attempts.length > 0) {
          const bestAttempt = attempts.reduce((best: any, current: any) => 
            current.sumgrades > best.sumgrades ? current : best
          );
          
          // Try multiple sources for maxScore
          const maxScore = bestAttempt.maxgrade 
            || quiz.grade 
            || quiz.sumgrades 
            || quiz.maxgrade
            || 100; // Final fallback
          
          console.error(`[DEBUG] Quiz ${quiz.name} (${quiz.id}):`, {
            'attempt.maxgrade': bestAttempt.maxgrade,
            'quiz.grade': quiz.grade,
            'quiz.sumgrades': quiz.sumgrades,
            'quiz.maxgrade': quiz.maxgrade,
            'final maxScore': maxScore
          });
          
          quizResults.push({
            quizId: quiz.id,
            quizName: quiz.name,
            attempts: attempts.length,
            bestScore: bestAttempt.sumgrades,
            maxScore: maxScore,
            percentage: maxScore > 0 
              ? (bestAttempt.sumgrades / maxScore) * 100 
              : 0,
            lastAttempt: bestAttempt.timefinish
          });
        } else {
          quizResults.push({
            quizId: quiz.id,
            quizName: quiz.name,
            attempts: 0,
            bestScore: null,
            maxScore: quiz.grade || 0,
            percentage: null,
            lastAttempt: null
          });
        }
      } catch (error) {
        console.error(`Failed to get attempts for quiz ${quiz.id}:`, error);
      }
    }
    
    // Format output
    let result = `Quiz Results for Student ${studentId} in Course ${courseId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const attempted = quizResults.filter(q => q.attempts > 0);
    const notAttempted = quizResults.filter(q => q.attempts === 0);
    
    // Calculate totals
    const totalScoreObtained = attempted.reduce((sum, q) => sum + (q.bestScore || 0), 0);
    const totalScorePossible = attempted.reduce((sum, q) => sum + (q.maxScore || 0), 0);
    const overallPercentage = totalScorePossible > 0 
      ? (totalScoreObtained / totalScorePossible) * 100 
      : 0;
    
    result += `📊 SUMMARY:\n`;
    result += `Total quizzes: ${quizzes.length}\n`;
    result += `Attempted: ${attempted.length}\n`;
    result += `Not attempted: ${notAttempted.length}\n`;
    
    if (attempted.length > 0) {
      const avgPercentage = attempted.reduce((sum, q) => sum + (q.percentage || 0), 0) / attempted.length;
      result += `Average score: ${avgPercentage.toFixed(1)}%\n`;
      result += `\n📈 TOTAL SCORE:\n`;
      result += `   ${totalScoreObtained.toFixed(2)} / ${totalScorePossible.toFixed(2)} points (${overallPercentage.toFixed(1)}%)\n`;
    }
    
    result += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Completed quizzes
    if (attempted.length > 0) {
      result += `✅ COMPLETED QUIZZES:\n\n`;
      
      // Sort by percentage descending
      attempted.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
      
      for (const quiz of attempted) {
        const grade = quiz.percentage || 0;
        const status = grade >= 70 ? '🟢' : grade >= 50 ? '🟡' : '🔴';
        
        result += `${status} ${quiz.quizName}\n`;
        result += `   Score: ${quiz.bestScore?.toFixed(2)}/${quiz.maxScore} (${grade.toFixed(1)}%)\n`;
        result += `   Attempts: ${quiz.attempts}\n`;
        if (quiz.lastAttempt) {
          result += `   Last attempt: ${new Date(quiz.lastAttempt * 1000).toLocaleDateString()}\n`;
        }
        result += `\n`;
      }
    }
    
    // Not attempted quizzes
    if (notAttempted.length > 0) {
      result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      result += `⏳ NOT ATTEMPTED YET:\n\n`;
      
      for (const quiz of notAttempted) {
        result += `   ❌ ${quiz.quizName} (ID: ${quiz.quizId})\n`;
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
        text: `Error getting all quiz results: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Get quiz best grade for a student (simpler version)
 */
export async function tutor_get_student_quiz_grade(args: {
  studentId: number;
  quizId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { studentId, quizId, moodleUrl, token } = args;
  
  try {
    const response = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'mod_quiz_get_user_best_grade',
        moodlewsrestformat: 'json',
        quizid: quizId,
        userid: studentId
      }
    });
    
    const hasGrade = response.data.hasgrade;
    const grade = response.data.grade;
    
    if (!hasGrade) {
      return {
        content: [{
          type: 'text',
          text: `Student ${studentId} has not completed quiz ${quizId} yet.\n\nTo see all attempts (including unfinished), use:\ntutor_get_student_quiz_attempts`
        }]
      };
    }
    
    // Get quiz details for max grade
    const quizResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'mod_quiz_get_quizzes_by_courses',
        moodlewsrestformat: 'json'
      }
    });
    
    const quizzes = quizResponse.data.quizzes || [];
    const quiz = quizzes.find((q: any) => q.id === quizId);
    const maxGrade = quiz?.grade || 100;
    const percentage = (grade / maxGrade) * 100;
    
    let result = `Quiz Grade for Student ${studentId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `Quiz ID: ${quizId}\n`;
    if (quiz) {
      result += `Quiz Name: ${quiz.name}\n`;
    }
    result += `\n📊 BEST GRADE:\n`;
    result += `   ${grade}/${maxGrade} (${percentage.toFixed(1)}%)\n\n`;
    
    if (percentage >= 90) {
      result += `   Status: Excellent! ⭐\n`;
    } else if (percentage >= 70) {
      result += `   Status: Good ✅\n`;
    } else if (percentage >= 50) {
      result += `   Status: Pass ⚠️\n`;
    } else {
      result += `   Status: Needs improvement ❌\n`;
    }
    
    result += `\nFor detailed attempts history, use:\ntutor_get_student_quiz_attempts({ studentId: ${studentId}, quizId: ${quizId} })`;
    
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
        text: `Error getting quiz grade: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Compare quiz performance across multiple students
 */
export async function tutor_compare_students_quiz_performance(args: {
  studentIds: number[];
  quizId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { studentIds, quizId, moodleUrl, token } = args;
  
  try {
    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const response = await axios.get(moodleUrl, {
          params: {
            wstoken: token,
            wsfunction: 'mod_quiz_get_user_attempts',
            moodlewsrestformat: 'json',
            quizid: quizId,
            userid: studentId,
            status: 'finished'
          }
        });
        
        const attempts = response.data.attempts || [];
        
        if (attempts.length > 0) {
          const bestAttempt = attempts.reduce((best: any, current: any) => 
            current.sumgrades > best.sumgrades ? current : best
          );
          
          results.push({
            studentId,
            attempts: attempts.length,
            bestScore: bestAttempt.sumgrades,
            maxScore: bestAttempt.maxgrade,
            percentage: (bestAttempt.sumgrades / bestAttempt.maxgrade) * 100
          });
        } else {
          results.push({
            studentId,
            attempts: 0,
            bestScore: null,
            maxScore: null,
            percentage: null
          });
        }
      } catch (error) {
        console.error(`Failed for student ${studentId}:`, error);
      }
    }
    
    // Sort by percentage descending
    results.sort((a, b) => (b.percentage || -1) - (a.percentage || -1));
    
    let result = `Quiz Performance Comparison - Quiz ${quizId}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const attempted = results.filter(r => r.attempts > 0);
    
    if (attempted.length > 0) {
      const avgPercentage = attempted.reduce((sum, r) => sum + (r.percentage || 0), 0) / attempted.length;
      const maxPercentage = Math.max(...attempted.map(r => r.percentage || 0));
      const minPercentage = Math.min(...attempted.map(r => r.percentage || 0));
      
      result += `📊 STATISTICS:\n`;
      result += `Students compared: ${studentIds.length}\n`;
      result += `Completed: ${attempted.length}\n`;
      result += `Average: ${avgPercentage.toFixed(1)}%\n`;
      result += `Best: ${maxPercentage.toFixed(1)}%\n`;
      result += `Worst: ${minPercentage.toFixed(1)}%\n\n`;
    }
    
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    result += `📝 RESULTS:\n\n`;
    
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rank = i + 1;
      
      if (r.attempts > 0) {
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
        result += `${medal} #${rank} Student ${r.studentId}\n`;
        result += `      Score: ${r.bestScore?.toFixed(2)}/${r.maxScore} (${r.percentage?.toFixed(1)}%)\n`;
        result += `      Attempts: ${r.attempts}\n\n`;
      } else {
        result += `   ❌ Student ${r.studentId} - Not attempted\n\n`;
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
        text: `Error comparing quiz performance: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
