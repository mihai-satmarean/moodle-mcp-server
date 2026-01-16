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
