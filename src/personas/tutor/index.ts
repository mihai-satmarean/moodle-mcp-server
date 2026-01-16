/**
 * Tutor Persona - Main exports
 * Inclusive training methodology and cohort-level assessment
 */

export {
  analyzeCohortQuizPerformance,
  getCohortStatistics,
  getCohortDistribution,
  classifyStudents,
  getCohortOutliers,
  getCohortVisualizationData,
  recommendCohortStrategy,
  type CohortAssessmentResult,
  type VisualizationData,
  type CohortStrategy
} from './tools/cohortAssessment.js';

export { SkillLevel, type StudentClassification } from '../../shared/utils/statistics.js';

export { 
  TUTOR_PERSONA,
  generateTutorIntroduction,
  getTutorShortIntro
} from './persona-config.js';

export {
  tutor_create_quiz_blueprint,
  tutor_create_adaptive_quiz,
  tutor_list_quizzes_with_stats,
  tutor_extract_themes_from_content,
  tutor_get_quiz_creation_guide
} from './tools/quizCreation.js';

export {
  createQuizBlueprint,
  generateQuestionsFromTheme,
  type QuizSettings,
  type Question,
  type Theme,
  type QuizBlueprint
} from './tools/quizManagement.js';
