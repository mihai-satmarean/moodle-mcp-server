import axios from 'axios';

/**
 * Discover available Moodle Web Services functions
 */
export async function discoverMoodleQuizFunctions(args: {
  moodleUrl: string;
  token: string;
}): Promise<any> {
  try {
    const response = await axios.get(args.moodleUrl, {
      params: {
        wstoken: args.token,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      }
    });
    
    const functions = response.data.functions || [];
    
    // Filter for quiz and question related functions
    const quizFunctions = functions.filter((f: any) => 
      f.name.includes('quiz') || f.name.includes('question') || f.name.includes('course_create')
    );
    
    let result = 'Available Moodle Functions for Quiz/Question Management:\n';
    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    const categories = {
      quiz: quizFunctions.filter((f: any) => f.name.includes('mod_quiz')),
      question: quizFunctions.filter((f: any) => f.name.includes('question')),
      course: quizFunctions.filter((f: any) => f.name.includes('course'))
    };
    
    for (const [category, funcs] of Object.entries(categories)) {
      if (funcs.length > 0) {
        result += `\n${category.toUpperCase()} Functions (${funcs.length}):\n`;
        funcs.forEach((f: any) => {
          result += `  - ${f.name}\n`;
        });
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: result
      }],
      functions: quizFunctions
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error discovering functions: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Create quiz using available Moodle API
 * This will attempt to use the best available method
 */
export async function createQuizDirect(args: {
  moodleUrl: string;
  token: string;
  courseId: number;
  name: string;
  intro: string;
  attempts?: number;
  grademethod?: number;
}): Promise<any> {
  const {
    moodleUrl,
    token,
    courseId,
    name,
    intro,
    attempts = 0, // 0 = unlimited
    grademethod = 1 // 1 = highest grade
  } = args;
  
  try {
    // Method 1: Try core_course_create_activities if available
    try {
      const response = await axios.post(moodleUrl, null, {
        params: {
          wstoken: token,
          wsfunction: 'core_course_create_activities',
          moodlewsrestformat: 'json',
          activities: JSON.stringify([{
            modulename: 'quiz',
            sectionid: 0, // Will need to get section ID
            name: name,
            intro: intro,
            introformat: 1,
            visible: 1
          }])
        }
      });
      
      if (response.data && !response.data.exception) {
        return {
          content: [{
            type: 'text',
            text: `Quiz created successfully: ${name}`
          }],
          quizId: response.data[0]?.instance
        };
      }
    } catch (e) {
      console.error('Method 1 failed:', e);
    }
    
    // Method 2: Try local_wsmanagequizzes_create_quiz if plugin exists
    try {
      const response = await axios.get(moodleUrl, {
        params: {
          wstoken: token,
          wsfunction: 'local_wsmanagequizzes_create_quiz',
          moodlewsrestformat: 'json',
          courseid: courseId,
          name: name,
          intro: intro,
          attempts: attempts,
          grademethod: grademethod
        }
      });
      
      if (response.data && !response.data.exception) {
        return {
          content: [{
            type: 'text',
            text: `Quiz created successfully: ${name}\nQuiz ID: ${response.data.id}`
          }],
          quizId: response.data.id
        };
      }
    } catch (e) {
      console.error('Method 2 failed:', e);
    }
    
    // If all methods fail
    return {
      content: [{
        type: 'text',
        text: `Cannot create quiz directly. Available options:\n\n` +
          `1. Use tutor_create_quiz_blueprint to generate XML for import\n` +
          `2. Install a Moodle plugin that exposes quiz creation APIs\n` +
          `3. Create quiz manually in Moodle UI\n\n` +
          `Run discover_moodle_quiz_functions to see available API functions.`
      }],
      isError: true
    };
    
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error creating quiz: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Add question to quiz (if API supports it)
 */
export async function addQuestionToQuiz(args: {
  moodleUrl: string;
  token: string;
  quizId: number;
  questionId: number;
}): Promise<any> {
  try {
    // Try mod_quiz_add_question if available
    const response = await axios.get(args.moodleUrl, {
      params: {
        wstoken: args.token,
        wsfunction: 'mod_quiz_add_question',
        moodlewsrestformat: 'json',
        quizid: args.quizId,
        questionid: args.questionId
      }
    });
    
    if (response.data && !response.data.exception) {
      return {
        content: [{
          type: 'text',
          text: `Question ${args.questionId} added to quiz ${args.quizId}`
        }]
      };
    }
    
    throw new Error(response.data.message || 'Failed to add question');
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error adding question: ${error instanceof Error ? error.message : String(error)}\n\n` +
          `This function may not be available. Use XML import instead.`
      }],
      isError: true
    };
  }
}
