import axios from 'axios';
import { createUIResource } from '@mcp-ui/server';

/**
 * Generate interactive chart for student quiz results
 */
export async function tutor_get_student_quiz_chart(args: {
  studentId: number;
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { studentId, courseId, moodleUrl, token } = args;
  
  try {
    // Get all quizzes in course
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
    
    // Get attempts for each quiz
    const quizData = [];
    
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
          
          const maxScore = bestAttempt.maxgrade || quiz.grade || 100;
          const percentage = maxScore > 0 ? (bestAttempt.sumgrades / maxScore) * 100 : 0;
          
          quizData.push({
            name: quiz.name,
            score: bestAttempt.sumgrades,
            maxScore: maxScore,
            percentage: percentage,
            attempts: attempts.length
          });
        } else {
          quizData.push({
            name: quiz.name,
            score: 0,
            maxScore: quiz.grade || 100,
            percentage: 0,
            attempts: 0
          });
        }
      } catch (error) {
        console.error(`Failed to get attempts for quiz ${quiz.id}:`, error);
      }
    }
    
    // Generate interactive HTML with Chart.js
    const htmlContent = generateQuizChartHTML(quizData, studentId, courseId);
    
    // Create UI resource
    const uiResource = createUIResource({
      uri: `ui://moodle/quiz-chart/${studentId}/${courseId}`,
      content: {
        type: 'rawHtml',
        htmlString: htmlContent
      },
      encoding: 'text'
    });
    
    return {
      content: [
        {
          type: 'resource',
          resource: uiResource
        },
        {
          type: 'text',
          text: `Interactive quiz chart generated for student ${studentId} in course ${courseId}`
        }
      ]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error generating quiz chart: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Generate interactive leaderboard chart for a quiz
 */
export async function tutor_get_quiz_leaderboard_chart(args: {
  quizId: number;
  courseId: number;
  moodleUrl: string;
  token: string;
  topN?: number;
}): Promise<any> {
  const { quizId, courseId, moodleUrl, token, topN = 10 } = args;
  
  try {
    // Get course participants
    const participantsResponse = await axios.get(moodleUrl, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_enrolled_users',
        moodlewsrestformat: 'json',
        courseid: courseId
      }
    });
    
    const participants = participantsResponse.data || [];
    const students = participants.filter((p: any) => 
      p.roles?.some((r: any) => r.shortname === 'student')
    );
    
    // Get quiz attempts for each student
    const leaderboardData = [];
    
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
          
          const maxScore = bestAttempt.maxgrade || 100;
          const percentage = maxScore > 0 ? (bestAttempt.sumgrades / maxScore) * 100 : 0;
          
          leaderboardData.push({
            name: `${student.firstname} ${student.lastname}`,
            score: bestAttempt.sumgrades,
            percentage: percentage,
            attempts: attempts.length
          });
        }
      } catch (error) {
        // Skip students without attempts
      }
    }
    
    // Sort by percentage descending and take top N
    leaderboardData.sort((a, b) => b.percentage - a.percentage);
    const topStudents = leaderboardData.slice(0, topN);
    
    // Generate interactive HTML
    const htmlContent = generateLeaderboardChartHTML(topStudents, quizId);
    
    // Create UI resource
    const uiResource = createUIResource({
      uri: `ui://moodle/quiz-leaderboard/${quizId}`,
      content: {
        type: 'rawHtml',
        htmlString: htmlContent
      },
      encoding: 'text'
    });
    
    return {
      content: [
        {
          type: 'resource',
          resource: uiResource
        },
        {
          type: 'text',
          text: `Interactive leaderboard chart generated for quiz ${quizId} (top ${topN} students)`
        }
      ]
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      content: [{
        type: 'text',
        text: `Error generating leaderboard chart: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Generate HTML for quiz results chart
 */
function generateQuizChartHTML(quizData: any[], studentId: number, courseId: number): string {
  const labels = quizData.map(q => q.name);
  const scores = quizData.map(q => q.percentage.toFixed(1));
  const attempts = quizData.map(q => q.attempts);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz Results Chart</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 30px;
      max-width: 900px;
      width: 100%;
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .chart-wrapper {
      position: relative;
      height: 400px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Quiz Performance Overview</h1>
    <p class="subtitle">Student ID: ${studentId} | Course ID: ${courseId}</p>
    
    <div class="chart-wrapper">
      <canvas id="quizChart"></canvas>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${quizData.length}</div>
        <div class="stat-label">Total Quizzes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${quizData.filter(q => q.attempts > 0).length}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(quizData.filter(q => q.attempts > 0).reduce((sum, q) => sum + q.percentage, 0) / quizData.filter(q => q.attempts > 0).length || 0).toFixed(1)}%</div>
        <div class="stat-label">Average Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${quizData.reduce((sum, q) => sum + q.attempts, 0)}</div>
        <div class="stat-label">Total Attempts</div>
      </div>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('quizChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [
          {
            label: 'Score (%)',
            data: ${JSON.stringify(scores)},
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2,
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Attempts',
            data: ${JSON.stringify(attempts)},
            backgroundColor: 'rgba(118, 75, 162, 0.8)',
            borderColor: 'rgba(118, 75, 162, 1)',
            borderWidth: 2,
            borderRadius: 8,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Score (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Attempts',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

/**
 * Generate HTML for leaderboard chart
 */
function generateLeaderboardChartHTML(leaderboardData: any[], quizId: number): string {
  const names = leaderboardData.map(s => s.name);
  const scores = leaderboardData.map(s => s.percentage.toFixed(1));
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz Leaderboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 30px;
      max-width: 800px;
      width: 100%;
    }
    h1 {
      color: #f5576c;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .chart-wrapper {
      position: relative;
      height: 500px;
    }
    .podium {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 30px;
    }
    .podium-place {
      text-align: center;
      padding: 15px;
      border-radius: 12px;
      min-width: 100px;
    }
    .podium-place.first {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      order: 2;
    }
    .podium-place.second {
      background: linear-gradient(135deg, #C0C0C0, #808080);
      order: 1;
    }
    .podium-place.third {
      background: linear-gradient(135deg, #CD7F32, #8B4513);
      order: 3;
    }
    .place-number {
      font-size: 24px;
      font-weight: bold;
      color: white;
      margin-bottom: 5px;
    }
    .place-name {
      font-size: 14px;
      color: white;
      font-weight: 500;
    }
    .place-score {
      font-size: 18px;
      color: white;
      font-weight: bold;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Quiz Leaderboard</h1>
    <p class="subtitle">Quiz ID: ${quizId} | Top ${leaderboardData.length} Students</p>
    
    <div class="chart-wrapper">
      <canvas id="leaderboardChart"></canvas>
    </div>
    
    ${leaderboardData.length >= 3 ? `
    <div class="podium">
      <div class="podium-place second">
        <div class="place-number">2nd</div>
        <div class="place-name">${leaderboardData[1].name}</div>
        <div class="place-score">${leaderboardData[1].percentage.toFixed(1)}%</div>
      </div>
      <div class="podium-place first">
        <div class="place-number">1st</div>
        <div class="place-name">${leaderboardData[0].name}</div>
        <div class="place-score">${leaderboardData[0].percentage.toFixed(1)}%</div>
      </div>
      <div class="podium-place third">
        <div class="place-number">3rd</div>
        <div class="place-name">${leaderboardData[2].name}</div>
        <div class="place-score">${leaderboardData[2].percentage.toFixed(1)}%</div>
      </div>
    </div>
    ` : ''}
  </div>

  <script>
    const ctx = document.getElementById('leaderboardChart').getContext('2d');
    
    // Generate colors based on ranking
    const colors = ${JSON.stringify(scores)}.map((score, index) => {
      const percentage = parseFloat(score);
      if (index === 0) return 'rgba(255, 215, 0, 0.8)'; // Gold
      if (index === 1) return 'rgba(192, 192, 192, 0.8)'; // Silver
      if (index === 2) return 'rgba(205, 127, 50, 0.8)'; // Bronze
      return percentage >= 80 ? 'rgba(76, 175, 80, 0.8)' : 
             percentage >= 60 ? 'rgba(255, 193, 7, 0.8)' : 
             'rgba(244, 67, 54, 0.8)';
    });
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(names)},
        datasets: [{
          label: 'Score (%)',
          data: ${JSON.stringify(scores)},
          backgroundColor: colors,
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                return 'Score: ' + context.parsed.x + '%';
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Score (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: '500'
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}
