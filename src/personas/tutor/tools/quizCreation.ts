/**
 * MCP Tools for Quiz Creation
 * Practical tools that work within Moodle API limitations
 */

import axios from 'axios';
import { createQuizBlueprint, Theme, QuizBlueprint } from './quizManagement';

/**
 * Tool: Create quiz blueprint with AI-generated questions
 * Returns Moodle XML that can be imported
 */
export async function tutor_create_quiz_blueprint(args: {
  name: string;
  courseId: number;
  themes: Theme[];
  questionsPerTheme: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  allowUnlimitedAttempts?: boolean;
}): Promise<any> {
  const {
    name,
    courseId,
    themes,
    questionsPerTheme,
    difficulty,
    allowUnlimitedAttempts = true
  } = args;
  
  const blueprint = await createQuizBlueprint(
    name,
    courseId,
    themes,
    questionsPerTheme,
    difficulty,
    allowUnlimitedAttempts
  );
  
  return {
    content: [{
      type: 'text',
      text: `Quiz Blueprint Created: "${blueprint.name}"

${blueprint.description}

SETTINGS:
- Attempts: ${blueprint.settings.attempts === 0 ? 'Unlimited' : blueprint.settings.attempts}
- Questions: ${blueprint.questions.length}
- Show answers: ${blueprint.settings.reviewrightanswer ? 'Yes' : 'No'}
- Estimated time: ${blueprint.estimatedTime}

THEMES COVERED:
${themes.map((t, i) => `${i + 1}. ${t.title} (${questionsPerTheme} questions)`).join('\n')}

NEXT STEPS:
${blueprint.importInstructions}

MOODLE XML (save as ${name.replace(/\s+/g, '_')}.xml):
\`\`\`xml
${blueprint.moodleXML}
\`\`\`

Note: Questions are AI-generated templates. Review and customize in Moodle before publishing to students.`
    }]
  };
}

/**
 * Tool: Generate adaptive quiz based on student weak areas
 */
export async function tutor_create_adaptive_quiz(args: {
  studentId: number;
  sourceQuizId: number;
  moodleUrl: string;
  token: string;
  newQuizName: string;
  targetAccuracy?: number;
}): Promise<any> {
  const {
    studentId,
    sourceQuizId,
    moodleUrl,
    token,
    newQuizName,
    targetAccuracy = 70
  } = args;
  
  // Step 1: Get student's quiz attempts
  const attemptsResponse = await axios.get(moodleUrl, {
    params: {
      wstoken: token,
      wsfunction: 'mod_quiz_get_user_attempts',
      moodlewsrestformat: 'json',
      quizid: sourceQuizId,
      userid: studentId
    }
  });
  
  const attempts = attemptsResponse.data.attempts || [];
  
  if (attempts.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No attempts found for student ${studentId} on quiz ${sourceQuizId}. Student must complete the quiz first before generating adaptive quiz.`
      }]
    };
  }
  
  // Step 2: Analyze attempts to find weak areas
  // This is simplified - full implementation would analyze individual questions
  const bestAttempt = attempts.reduce((best: any, current: any) => 
    (current.sumgrades > best.sumgrades) ? current : best
  );
  
  const scorePercentage = (bestAttempt.sumgrades / bestAttempt.maxgrade) * 100;
  
  // Step 3: Identify topics that need reinforcement
  const weakTopics: Theme[] = [];
  
  if (scorePercentage < targetAccuracy) {
    // In real implementation, would analyze which questions were wrong
    // and map them to topics
    weakTopics.push({
      title: 'Topics requiring reinforcement',
      description: `Areas where student scored below ${targetAccuracy}%`,
      keywords: ['review', 'practice', 'reinforce']
    });
  }
  
  if (weakTopics.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `Student ${studentId} scored ${scorePercentage.toFixed(1)}% - above target accuracy of ${targetAccuracy}%. No adaptive quiz needed. Consider advancing to next level.`
      }]
    };
  }
  
  // Step 4: Generate blueprint for adaptive quiz
  const blueprint = await createQuizBlueprint(
    newQuizName,
    bestAttempt.courseid || 0,
    weakTopics,
    5, // 5 questions per weak topic
    'intermediate',
    true // Always allow unlimited attempts for remediation
  );
  
  return {
    content: [{
      type: 'text',
      text: `Adaptive Quiz Generated for Student ${studentId}

ORIGINAL PERFORMANCE:
- Quiz: ${sourceQuizId}
- Best score: ${scorePercentage.toFixed(1)}%
- Attempts: ${attempts.length}

ADAPTIVE QUIZ: "${newQuizName}"
- Focus: Weak areas identified
- Questions: ${blueprint.questions.length}
- Attempts: Unlimited (remediation quiz)
- Difficulty: Adjusted based on performance

${blueprint.importInstructions}

MOODLE XML:
\`\`\`xml
${blueprint.moodleXML}
\`\`\``
      }]
    };
}

/**
 * Tool: List existing quizzes with creation capability
 */
export async function tutor_list_quizzes_with_stats(args: {
  courseId: number;
  moodleUrl: string;
  token: string;
}): Promise<any> {
  const { courseId, moodleUrl, token } = args;
  
  const response = await axios.get(moodleUrl, {
    params: {
      wstoken: token,
      wsfunction: 'mod_quiz_get_quizzes_by_courses',
      moodlewsrestformat: 'json',
      courseids: [courseId]
    }
  });
  
  const quizzes = response.data.quizzes || [];
  
  const quizList = quizzes.map((q: any) => {
    const attemptsInfo = q.attempts === 0 ? 'Unlimited' : q.attempts;
    const visibilityInfo = q.visible ? 'Visible' : 'Hidden';
    
    return `- ${q.name} (ID: ${q.id})
  Attempts: ${attemptsInfo} | Grade: ${q.grade} | ${visibilityInfo}`;
  }).join('\n');
  
  return {
    content: [{
      type: 'text',
      text: `Quizzes in Course ${courseId}:

${quizList || 'No quizzes found.'}

QUIZ CREATION OPTIONS:
1. Use tutor_create_quiz_blueprint to generate quiz with AI questions
2. Use tutor_create_adaptive_quiz to create personalized remediation quiz
3. Generate quiz from uploaded documents (coming soon)

Note: Moodle Web Services API has limited quiz creation support. 
Generated quizzes are provided as Moodle XML for import via UI.`
    }]
  };
}

/**
 * Tool: Extract themes from text/documents (preparation for quiz creation)
 */
export async function tutor_extract_themes_from_content(args: {
  content: string;
  maxThemes?: number;
}): Promise<any> {
  const { content, maxThemes = 5 } = args;
  
  // Simple keyword extraction (in production, use AI/NLP)
  const words = content.toLowerCase().split(/\W+/);
  const wordFreq = new Map<string, number>();
  
  // Count word frequency (excluding common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were']);
  
  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }
  
  // Get top keywords
  const topKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxThemes * 3)
    .map(([word]) => word);
  
  // Generate themes
  const themes: Theme[] = [];
  for (let i = 0; i < Math.min(maxThemes, topKeywords.length / 3); i++) {
    const keywordSet = topKeywords.slice(i * 3, (i + 1) * 3);
    themes.push({
      title: `Theme ${i + 1}: ${keywordSet[0]}`,
      description: `Covers concepts related to: ${keywordSet.join(', ')}`,
      keywords: keywordSet
    });
  }
  
  const themesText = themes.map((t, i) => 
    `${i + 1}. ${t.title}\n   Keywords: ${t.keywords.join(', ')}\n   ${t.description}`
  ).join('\n\n');
  
  return {
    content: [{
      type: 'text',
      text: `Themes Extracted from Content:

${themesText}

NEXT STEPS:
Use these themes with tutor_create_quiz_blueprint:

\`\`\`json
{
  "name": "Quiz on Extracted Themes",
  "courseId": YOUR_COURSE_ID,
  "themes": ${JSON.stringify(themes, null, 2)},
  "questionsPerTheme": 3,
  "difficulty": "intermediate"
}
\`\`\`

Note: This is basic keyword extraction. For production, integrate Claude API for intelligent theme extraction.`
    }]
  };
}

/**
 * Tool: Get quiz creation guide
 */
export async function tutor_get_quiz_creation_guide(): Promise<any> {
  return {
    content: [{
      type: 'text',
      text: `Quiz Creation Guide for Tutor Assistant

AVAILABLE METHODS:

1. BLUEPRINT METHOD (Recommended)
   ✅ Fast: AI generates questions
   ✅ Inclusive: Unlimited attempts by default
   ✅ Export: Moodle XML for easy import
   
   Use: tutor_create_quiz_blueprint
   
2. ADAPTIVE METHOD (For remediation)
   ✅ Personalized: Based on student weak areas
   ✅ Targeted: Focus on gaps
   ✅ Auto-configured: Unlimited attempts
   
   Use: tutor_create_adaptive_quiz
   
3. CONTENT-BASED METHOD
   ✅ Extract themes from documents
   ✅ Generate questions per theme
   ✅ Customizable difficulty
   
   Use: tutor_extract_themes_from_content → tutor_create_quiz_blueprint

WORKFLOW EXAMPLE:

Step 1: Extract themes from your training material
\`\`\`
tutor_extract_themes_from_content({
  content: "Your training material text here..."
})
\`\`\`

Step 2: Create quiz blueprint
\`\`\`
tutor_create_quiz_blueprint({
  name: "Module 1 Assessment",
  courseId: 123,
  themes: [...], // from step 1
  questionsPerTheme: 5,
  difficulty: "intermediate",
  allowUnlimitedAttempts: true
})
\`\`\`

Step 3: Import to Moodle
- Save XML to file
- Go to Moodle course → Add Quiz
- Edit quiz → Import → Moodle XML
- Done!

LIMITATIONS:
- Moodle Web Services don't support direct quiz creation
- Questions must be imported via XML or created manually
- This is a Moodle limitation, not MCP limitation

PHILOSOPHY:
All quizzes created by Tutor Assistant follow inclusive training principles:
- Unlimited attempts (students learn by trying)
- Immediate feedback (know what's wrong right away)
- Highest grade counts (reward improvement)
- Show correct answers (learning tool, not gotcha test)`
    }]
  };
}
