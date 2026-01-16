/**
 * Cohort Assessment Tools
 * Statistical analysis and visualization for cohort-level evaluation
 */

import {
  calculateCohortStatistics,
  detectDistributionMode,
  classifyStudentsByScore,
  identifyOutliers,
  generateHistogram,
  CohortStatistics,
  DistributionMode,
  StudentClassification,
  Outlier,
  HistogramBin
} from '../../../shared/utils/statistics.js';

export interface CohortAssessmentResult {
  statistics: CohortStatistics;
  distribution: DistributionMode;
  classification: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  recommendations: string[];
}

/**
 * Analyze cohort quiz performance with comprehensive statistics
 */
export async function analyzeCohortQuizPerformance(
  quizScores: Array<{ studentId: number; score: number }>
): Promise<CohortAssessmentResult> {
  const scores = quizScores.map(s => s.score);
  
  // Calculate statistics
  const statistics = calculateCohortStatistics(scores);
  
  // Detect distribution pattern
  const distribution = detectDistributionMode(scores);
  
  // Classify students
  const classifications = classifyStudentsByScore(quizScores);
  
  // Count by level
  const classification = {
    beginner: classifications.filter(c => c.level === 'beginner').length,
    intermediate: classifications.filter(c => c.level === 'intermediate').length,
    advanced: classifications.filter(c => c.level === 'advanced').length,
    expert: classifications.filter(c => c.level === 'expert').length
  };
  
  // Generate recommendations
  const recommendations = generateCohortRecommendations(
    statistics,
    distribution,
    classification,
    quizScores.length
  );
  
  return {
    statistics,
    distribution,
    classification,
    recommendations
  };
}

/**
 * Get cohort statistics
 */
export function getCohortStatistics(
  scores: number[]
): CohortStatistics {
  return calculateCohortStatistics(scores);
}

/**
 * Get cohort distribution (for Gaussian curve visualization)
 */
export function getCohortDistribution(
  scores: number[]
): DistributionMode {
  return detectDistributionMode(scores);
}

/**
 * Classify students by level
 */
export function classifyStudents(
  studentScores: Array<{ studentId: number; score: number }>
): StudentClassification[] {
  return classifyStudentsByScore(studentScores);
}

/**
 * Identify outlier students
 */
export function getCohortOutliers(
  studentScores: Array<{ studentId: number; score: number }>
): Outlier[] {
  return identifyOutliers(studentScores);
}

/**
 * Get visualization data (histogram, box plot data)
 */
export interface VisualizationData {
  histogram: HistogramBin[];
  boxPlot: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers: number[];
  };
  gaussianCurve: {
    mean: number;
    stdDev: number;
    dataPoints: Array<{ x: number; y: number }>;
  };
}

export function getCohortVisualizationData(
  scores: number[]
): VisualizationData {
  const stats = calculateCohortStatistics(scores);
  const outliers = identifyOutliers(scores.map((score, idx) => ({ studentId: idx, score })));
  
  // Generate Gaussian curve data points
  const gaussianPoints: Array<{ x: number; y: number }> = [];
  const step = (stats.max - stats.min) / 50;
  
  for (let x = stats.min; x <= stats.max; x += step) {
    // Gaussian probability density function
    const exponent = -Math.pow(x - stats.mean, 2) / (2 * Math.pow(stats.stdDev, 2));
    const y = (1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    gaussianPoints.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 1000) / 1000 });
  }
  
  return {
    histogram: generateHistogram(scores, 10),
    boxPlot: {
      min: stats.min,
      q1: stats.q1,
      median: stats.median,
      q3: stats.q3,
      max: stats.max,
      outliers: outliers.map(o => o.score)
    },
    gaussianCurve: {
      mean: stats.mean,
      stdDev: stats.stdDev,
      dataPoints: gaussianPoints
    }
  };
}

/**
 * Recommend cohort strategy based on distribution
 */
export interface CohortStrategy {
  type: 'single_track' | 'split_two_tracks' | 'split_multiple_tracks';
  reasoning: string;
  suggestedGroups?: Array<{
    name: string;
    targetLevels: string[];
    studentCount: number;
    recommendedPace: string;
  }>;
}

export function recommendCohortStrategy(
  quizScores: Array<{ studentId: number; score: number }>
): CohortStrategy {
  const scores = quizScores.map(s => s.score);
  const stats = calculateCohortStatistics(scores);
  const distribution = detectDistributionMode(scores);
  const classifications = classifyStudentsByScore(quizScores);
  
  const levelCounts = {
    beginner: classifications.filter(c => c.level === 'beginner').length,
    intermediate: classifications.filter(c => c.level === 'intermediate').length,
    advanced: classifications.filter(c => c.level === 'advanced').length,
    expert: classifications.filter(c => c.level === 'expert').length
  };
  
  // Decision logic
  if (distribution.type === 'bimodal' && distribution.confidence > 0.7) {
    // Clear bimodal distribution - recommend split
    const lowGroup = classifications.filter(c => c.score < stats.median);
    const highGroup = classifications.filter(c => c.score >= stats.median);
    
    return {
      type: 'split_two_tracks',
      reasoning: `Cohort shows clear bimodal distribution (confidence: ${(distribution.confidence * 100).toFixed(0)}%) with two distinct groups. Splitting will allow better pacing for each group.`,
      suggestedGroups: [
        {
          name: 'Track A - Foundation',
          targetLevels: ['beginner', 'intermediate-low'],
          studentCount: lowGroup.length,
          recommendedPace: 'slower with more examples and support'
        },
        {
          name: 'Track B - Advanced',
          targetLevels: ['intermediate-high', 'advanced', 'expert'],
          studentCount: highGroup.length,
          recommendedPace: 'faster with challenging materials'
        }
      ]
    };
  }
  
  if (stats.stdDev / stats.mean > 0.4 && distribution.type === 'multimodal') {
    // High variance with multiple peaks
    return {
      type: 'split_multiple_tracks',
      reasoning: `High variance (std dev: ${stats.stdDev.toFixed(1)}) and multiple skill clusters detected. Consider 3 tracks for optimal learning.`,
      suggestedGroups: [
        {
          name: 'Beginner Track',
          targetLevels: ['beginner'],
          studentCount: levelCounts.beginner,
          recommendedPace: 'foundational with extensive support'
        },
        {
          name: 'Intermediate Track',
          targetLevels: ['intermediate'],
          studentCount: levelCounts.intermediate,
          recommendedPace: 'standard curriculum'
        },
        {
          name: 'Advanced Track',
          targetLevels: ['advanced', 'expert'],
          studentCount: levelCounts.advanced + levelCounts.expert,
          recommendedPace: 'accelerated with enrichment'
        }
      ]
    };
  }
  
  // Homogeneous group
  return {
    type: 'single_track',
    reasoning: `Cohort is relatively homogeneous (std dev: ${stats.stdDev.toFixed(1)}, mean: ${stats.mean.toFixed(1)}). Single track appropriate with differentiated support for outliers.`,
    suggestedGroups: [
      {
        name: 'Unified Cohort',
        targetLevels: ['all levels'],
        studentCount: quizScores.length,
        recommendedPace: 'standard with individual adaptations'
      }
    ]
  };
}

/**
 * Generate cohort recommendations
 */
function generateCohortRecommendations(
  statistics: CohortStatistics,
  distribution: DistributionMode,
  classification: { beginner: number; intermediate: number; advanced: number; expert: number },
  totalStudents: number
): string[] {
  const recommendations: string[] = [];
  
  // Distribution-based recommendations
  if (distribution.type === 'bimodal' && distribution.confidence > 0.7) {
    recommendations.push(
      'BIMODAL DISTRIBUTION DETECTED: Consider splitting cohort into two tracks for optimal learning outcomes.'
    );
  }
  
  // Mean-based recommendations
  if (statistics.mean < 50) {
    recommendations.push(
      'LOW AVERAGE SCORE: Majority of cohort struggling. Consider reviewing prerequisites and adding foundational materials.'
    );
  } else if (statistics.mean > 80) {
    recommendations.push(
      'HIGH AVERAGE SCORE: Cohort performing well. Consider adding enrichment and advanced challenges.'
    );
  }
  
  // Standard deviation recommendations
  if (statistics.stdDev > 20) {
    recommendations.push(
      'HIGH VARIANCE: Large skill gaps in cohort. Personalized support and differentiated instruction recommended.'
    );
  }
  
  // Classification-based recommendations
  const beginnerPercentage = (classification.beginner / totalStudents) * 100;
  if (beginnerPercentage > 40) {
    recommendations.push(
      `${beginnerPercentage.toFixed(0)}% are beginners: Adjust pace and add more scaffolding to curriculum.`
    );
  }
  
  const expertPercentage = (classification.expert / totalStudents) * 100;
  if (expertPercentage > 20) {
    recommendations.push(
      `${expertPercentage.toFixed(0)}% are experts: Provide peer mentoring opportunities and advanced projects.`
    );
  }
  
  // Outlier recommendations
  if (statistics.min < statistics.q1 - 1.5 * (statistics.q3 - statistics.q1)) {
    recommendations.push(
      'LOW OUTLIERS DETECTED: Some students significantly below cohort average. Immediate intervention needed.'
    );
  }
  
  return recommendations;
}
