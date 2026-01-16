/**
 * Quiz Management Tools
 * Create, configure, and manage quizzes for inclusive training
 */

export interface QuizSettings {
  name: string;
  intro?: string;
  courseId: number;
  
  // Timing settings
  timeopen?: number; // Unix timestamp
  timeclose?: number; // Unix timestamp
  timelimit?: number; // Seconds
  
  // Attempt settings
  attempts: number; // 0 = unlimited
  grademethod?: number; // 1=highest, 2=average, 3=first, 4=last
  
  // Display settings
  questionsperpage?: number;
  shuffleanswers?: boolean;
  
  // Review options (when students can see answers)
  reviewattempt?: boolean;
  reviewcorrectness?: boolean;
  reviewmarks?: boolean;
  reviewspecificfeedback?: boolean;
  reviewgeneralfeedback?: boolean;
  reviewrightanswer?: boolean;
  
  // Availability
  visible?: boolean;
}

export interface Question {
  type: 'multichoice' | 'truefalse' | 'shortanswer' | 'essay';
  name: string;
  questiontext: string;
  defaultmark: number;
  
  // For multichoice
  answers?: Array<{
    text: string;
    fraction: number; // 1.0 for correct, 0 for incorrect
    feedback?: string;
  }>;
  
  // For truefalse
  correctanswer?: boolean;
  
  // Feedback
  generalfeedback?: string;
}

export interface QuizCreationResult {
  quizId: number;
  courseModuleId: number;
  name: string;
  settings: QuizSettings;
  questionsAdded: number;
  url: string;
}

/**
 * Create a new quiz with inclusive settings (unlimited attempts by default)
 */
export async function createInclusiveQuiz(
  moodleApiUrl: string,
  token: string,
  settings: QuizSettings
): Promise<QuizCreationResult> {
  // Default to inclusive settings
  const inclusiveSettings: QuizSettings = {
    ...settings,
    attempts: settings.attempts ?? 0, // 0 = unlimited
    grademethod: settings.grademethod ?? 1, // Highest grade
    reviewattempt: settings.reviewattempt ?? true,
    reviewcorrectness: settings.reviewcorrectness ?? true,
    reviewmarks: settings.reviewmarks ?? true,
    reviewspecificfeedback: settings.reviewspecificfeedback ?? true,
    reviewgeneralfeedback: settings.reviewgeneralfeedback ?? true,
    reviewrightanswer: settings.reviewrightanswer ?? true,
    visible: settings.visible ?? true,
    questionsperpage: settings.questionsperpage ?? 1,
    shuffleanswers: settings.shuffleanswers ?? true
  };
  
  // Note: Actual Moodle API call would go here
  // For now, returning mock structure showing what the implementation would look like
  
  throw new Error(
    'Quiz creation requires Moodle API endpoint: core_course_create_activities or manual DB insertion. ' +
    'Current Moodle Web Services may not expose quiz creation directly. ' +
    'Alternative: Use Moodle UI for quiz creation, then MCP for analysis and management.'
  );
}

/**
 * Add questions to an existing quiz
 * Note: This is a complex operation in Moodle requiring question bank management
 */
export async function addQuestionsToQuiz(
  moodleApiUrl: string,
  token: string,
  quizId: number,
  questions: Question[]
): Promise<{ questionsAdded: number; questionIds: number[] }> {
  // Questions must be added to question bank first, then linked to quiz
  // This is a multi-step process in Moodle
  
  throw new Error(
    'Adding questions requires: ' +
    '1. Creating questions in question bank (core_question_*) ' +
    '2. Adding questions to quiz (mod_quiz_add_random_questions or mod_quiz_add_question) ' +
    'Consider using Moodle UI for question creation, or implement full question bank integration.'
  );
}

/**
 * Configure quiz settings (can be used to update existing quiz)
 */
export async function configureQuizSettings(
  moodleApiUrl: string,
  token: string,
  quizId: number,
  settings: Partial<QuizSettings>
): Promise<{ success: boolean; message: string }> {
  // This would call mod_quiz_update_instance if available
  
  throw new Error(
    'Quiz settings update requires Moodle API endpoint that may not be available via Web Services. ' +
    'Consider using core_course_update_activities if available.'
  );
}

/**
 * PRACTICAL WORKAROUND: Generate quiz configuration that can be imported to Moodle
 */
export interface MoodleXMLQuiz {
  xml: string;
  instructions: string;
}

export function generateMoodleXMLQuiz(
  settings: QuizSettings,
  questions: Question[]
): MoodleXMLQuiz {
  // Generate Moodle XML format that can be imported
  const questionsXML = questions.map((q, index) => {
    if (q.type === 'multichoice') {
      const answersXML = q.answers?.map(a => `
    <answer fraction="${a.fraction * 100}" format="html">
      <text>${escapeXML(a.text)}</text>
      <feedback format="html">
        <text>${escapeXML(a.feedback || '')}</text>
      </feedback>
    </answer>`).join('');
      
      return `
  <question type="multichoice">
    <name>
      <text>${escapeXML(q.name)}</text>
    </name>
    <questiontext format="html">
      <text>${escapeXML(q.questiontext)}</text>
    </questiontext>
    <defaultgrade>${q.defaultmark}</defaultgrade>
    <single>true</single>
    <shuffleanswers>${settings.shuffleanswers ? 'true' : 'false'}</shuffleanswers>
    <answernumbering>abc</answernumbering>${answersXML}
    <generalfeedback format="html">
      <text>${escapeXML(q.generalfeedback || '')}</text>
    </generalfeedback>
  </question>`;
    }
    
    return '';
  }).join('');
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="category">
    <category>
      <text>$course$/${escapeXML(settings.name)}</text>
    </category>
  </question>${questionsXML}
</quiz>`;

  const instructions = `
To import this quiz to Moodle:
1. Go to your course in Moodle
2. Turn editing on
3. Add activity: Quiz
4. Configure quiz settings:
   - Name: ${settings.name}
   - Attempts allowed: ${settings.attempts === 0 ? 'Unlimited' : settings.attempts}
   - Grade method: Highest grade
   - Show answers: Yes
5. Save and display
6. Click "Edit quiz"
7. Click "⋮" menu → Import
8. Choose "Moodle XML format"
9. Upload the generated XML file
10. Complete import

The quiz will have ${questions.length} questions with inclusive settings (unlimited attempts, immediate feedback).
`;

  return { xml, instructions };
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper: Create quiz structure from themes
 */
export interface Theme {
  title: string;
  description: string;
  keywords: string[];
}

export function generateQuestionsFromTheme(
  theme: Theme,
  questionCount: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Question[] {
  // This would integrate with AI (Claude/GPT) to generate questions
  // For now, return template structure
  
  const questions: Question[] = [];
  
  for (let i = 0; i < questionCount; i++) {
    questions.push({
      type: 'multichoice',
      name: `${theme.title} - Question ${i + 1}`,
      questiontext: `[AI GENERATED] Question about ${theme.title} (${difficulty} level)`,
      defaultmark: 1.0,
      answers: [
        { text: '[AI GENERATED] Correct answer', fraction: 1.0, feedback: 'Correct!' },
        { text: '[AI GENERATED] Wrong answer 1', fraction: 0, feedback: 'Not quite. Review: ' + theme.description },
        { text: '[AI GENERATED] Wrong answer 2', fraction: 0, feedback: 'Incorrect. Key concept: ' + theme.keywords[0] },
        { text: '[AI GENERATED] Wrong answer 3', fraction: 0, feedback: 'Try again!' }
      ],
      generalfeedback: `This question tests your understanding of ${theme.title}.`
    });
  }
  
  return questions;
}

/**
 * IMMEDIATE USABLE FUNCTION: Generate quiz blueprint
 */
export interface QuizBlueprint {
  name: string;
  description: string;
  settings: QuizSettings;
  questions: Question[];
  moodleXML: string;
  importInstructions: string;
  estimatedTime: string;
}

export async function createQuizBlueprint(
  name: string,
  courseId: number,
  themes: Theme[],
  questionsPerTheme: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  allowUnlimitedAttempts: boolean = true
): Promise<QuizBlueprint> {
  const settings: QuizSettings = {
    name,
    intro: `Assessment covering: ${themes.map(t => t.title).join(', ')}`,
    courseId,
    attempts: allowUnlimitedAttempts ? 0 : 1,
    grademethod: 1, // Highest
    questionsperpage: 1,
    shuffleanswers: true,
    reviewattempt: true,
    reviewcorrectness: true,
    reviewmarks: true,
    reviewspecificfeedback: true,
    reviewgeneralfeedback: true,
    reviewrightanswer: allowUnlimitedAttempts, // Show answers if unlimited attempts
    visible: true
  };
  
  // Generate questions for each theme
  const allQuestions: Question[] = [];
  for (const theme of themes) {
    const questions = generateQuestionsFromTheme(theme, questionsPerTheme, difficulty);
    allQuestions.push(...questions);
  }
  
  // Generate Moodle XML
  const { xml, instructions } = generateMoodleXMLQuiz(settings, allQuestions);
  
  const totalQuestions = allQuestions.length;
  const estimatedMinutes = totalQuestions * 2; // 2 minutes per question
  
  return {
    name,
    description: `Quiz with ${totalQuestions} questions across ${themes.length} themes (${difficulty} level)`,
    settings,
    questions: allQuestions,
    moodleXML: xml,
    importInstructions: instructions,
    estimatedTime: `${estimatedMinutes} minutes`
  };
}
