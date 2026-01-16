/**
 * Statistical utilities for cohort analysis
 */

export interface CohortStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number; // 25th percentile
  q2: number; // 50th percentile (median)
  q3: number; // 75th percentile
  count: number;
}

export interface DistributionMode {
  type: 'normal' | 'bimodal' | 'multimodal' | 'uniform';
  peaks: number[]; // Values where peaks occur
  confidence: number; // 0-1, how confident we are in the detection
}

/**
 * Calculate mean (average) of values
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate median (middle value)
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate percentile (0-100)
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  }
  
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate comprehensive cohort statistics
 */
export function calculateCohortStatistics(values: number[]): CohortStatistics {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      count: 0
    };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  
  return {
    mean: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStdDev(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: calculatePercentile(values, 25),
    q2: calculatePercentile(values, 50),
    q3: calculatePercentile(values, 75),
    count: values.length
  };
}

/**
 * Detect distribution modes (normal, bimodal, multimodal)
 * Uses simple peak detection in histogram
 */
export function detectDistributionMode(values: number[], binCount: number = 10): DistributionMode {
  if (values.length < 10) {
    return {
      type: 'normal',
      peaks: [calculateMean(values)],
      confidence: 0.3
    };
  }
  
  const stats = calculateCohortStatistics(values);
  const binSize = (stats.max - stats.min) / binCount;
  
  // Create histogram
  const histogram: number[] = new Array(binCount).fill(0);
  values.forEach(val => {
    const binIndex = Math.min(
      Math.floor((val - stats.min) / binSize),
      binCount - 1
    );
    histogram[binIndex]++;
  });
  
  // Find peaks (local maxima)
  const peaks: number[] = [];
  for (let i = 1; i < histogram.length - 1; i++) {
    if (histogram[i] > histogram[i - 1] && histogram[i] > histogram[i + 1]) {
      // This is a peak
      const peakValue = stats.min + (i + 0.5) * binSize;
      peaks.push(peakValue);
    }
  }
  
  // Classify distribution
  let type: 'normal' | 'bimodal' | 'multimodal' | 'uniform';
  let confidence: number;
  
  if (peaks.length === 0 || peaks.length === 1) {
    type = 'normal';
    confidence = 0.7;
  } else if (peaks.length === 2) {
    // Check if peaks are well-separated
    const peakDistance = Math.abs(peaks[1] - peaks[0]);
    const separation = peakDistance / stats.stdDev;
    
    if (separation > 1.5) {
      type = 'bimodal';
      confidence = Math.min(0.9, 0.5 + separation / 4);
    } else {
      type = 'normal';
      confidence = 0.6;
    }
  } else {
    type = 'multimodal';
    confidence = 0.7;
  }
  
  // Check for uniform distribution
  const histogramStdDev = calculateStdDev(histogram);
  const histogramMean = calculateMean(histogram);
  if (histogramMean > 0 && histogramStdDev / histogramMean < 0.3) {
    type = 'uniform';
    confidence = 0.8;
  }
  
  return {
    type,
    peaks: peaks.length > 0 ? peaks : [stats.mean],
    confidence
  };
}

/**
 * Classify students into skill levels based on scores
 */
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface StudentClassification {
  studentId: number;
  score: number;
  level: SkillLevel;
  percentile: number;
}

export function classifyStudentsByScore(
  studentScores: Array<{ studentId: number; score: number }>
): StudentClassification[] {
  const scores = studentScores.map(s => s.score);
  const sorted = [...scores].sort((a, b) => a - b);
  
  return studentScores.map(({ studentId, score }) => {
    // Calculate percentile rank
    const rank = sorted.filter(s => s <= score).length;
    const percentile = (rank / sorted.length) * 100;
    
    // Classify by score range
    let level: SkillLevel;
    if (score <= 40) {
      level = SkillLevel.BEGINNER;
    } else if (score <= 70) {
      level = SkillLevel.INTERMEDIATE;
    } else if (score <= 85) {
      level = SkillLevel.ADVANCED;
    } else {
      level = SkillLevel.EXPERT;
    }
    
    return {
      studentId,
      score,
      level,
      percentile: Math.round(percentile)
    };
  });
}

/**
 * Identify outliers using IQR method
 */
export interface Outlier {
  studentId: number;
  score: number;
  type: 'low' | 'high';
  deviationFromMedian: number;
}

export function identifyOutliers(
  studentScores: Array<{ studentId: number; score: number }>
): Outlier[] {
  const scores = studentScores.map(s => s.score);
  const stats = calculateCohortStatistics(scores);
  
  const iqr = stats.q3 - stats.q1;
  const lowerBound = stats.q1 - 1.5 * iqr;
  const upperBound = stats.q3 + 1.5 * iqr;
  
  const outliers: Outlier[] = [];
  
  studentScores.forEach(({ studentId, score }) => {
    if (score < lowerBound) {
      outliers.push({
        studentId,
        score,
        type: 'low',
        deviationFromMedian: stats.median - score
      });
    } else if (score > upperBound) {
      outliers.push({
        studentId,
        score,
        type: 'high',
        deviationFromMedian: score - stats.median
      });
    }
  });
  
  return outliers;
}

/**
 * Generate histogram data for visualization
 */
export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export function generateHistogram(values: number[], binCount: number = 10): HistogramBin[] {
  if (values.length === 0) return [];
  
  const stats = calculateCohortStatistics(values);
  const binSize = (stats.max - stats.min) / binCount;
  
  const bins: HistogramBin[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const min = stats.min + i * binSize;
    const max = min + binSize;
    const count = values.filter(v => v >= min && (i === binCount - 1 ? v <= max : v < max)).length;
    
    bins.push({
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      count,
      percentage: Math.round((count / values.length) * 1000) / 10
    });
  }
  
  return bins;
}
