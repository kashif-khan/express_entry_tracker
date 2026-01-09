/**
 * Analytics utilities for Express Entry draw data analysis
 * Implements statistical calculations and predictive modeling
 */

import type { ParsedExpressEntryDraw } from "@/types/express-entry";

export interface CRSAnalytics {
  trends: {
    movingAverage: number[];
    percentileRanges: { p25: number; p50: number; p75: number; p90: number };
    volatility: number;
    lowestInLast12Months: number;
    prediction: { nextDraw: number; confidence: number };
  };
  byCategory: {
    [category: string]: {
      averageScore: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      frequency: number;
    };
  };
}

export interface DrawTimingAnalytics {
  frequency: {
    averageDaysBetweenDraws: number;
    shortestGap: number;
    longestGap: number;
    predictedNextDate: Date;
  };
  patterns: {
    dayOfWeekDistribution: { [day: string]: number };
    seasonalTrends: { [month: string]: number };
    categoryRotation: string[];
  };
}

export interface ProbabilityResult {
  currentProbability: number;
  estimatedWaitTime: string;
  recommendedActions: string[];
  historicalSuccess: number;
}

export interface DistributionAnalytics {
  scoreDistribution: {
    ranges: { min: number; max: number; count: number; percentage: number }[];
    concentrationIndex: number;
    diversityScore: number;
  };
  invitationEfficiency: {
    totalInvitations: number;
    averagePerDraw: number;
    growthRate: number;
    categoryBreakdown: { [category: string]: number };
  };
}

export interface OutlierData {
  drawNumber: number;
  type: 'score' | 'size' | 'timing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number;
  expectedValue: number;
  deviation: number;
}

/**
 * Calculate CRS score trends and analytics
 */
export const calculateCRSTrends = (draws: ParsedExpressEntryDraw[]): CRSAnalytics => {
  if (!draws || draws.length === 0) {
    return {
      trends: {
        movingAverage: [],
        percentileRanges: { p25: 0, p50: 0, p75: 0, p90: 0 },
        volatility: 0,
        lowestInLast12Months: 0,
        prediction: { nextDraw: 0, confidence: 0 }
      },
      byCategory: {}
    };
  }

  const sortedDraws = [...draws].sort((a, b) => 
    new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  // Calculate moving averages (30-day window)
  const movingAverage = calculateMovingAverage(sortedDraws.map(d => d.drawCRS), 5);

  // Calculate percentiles
  const scores = sortedDraws.map(d => d.drawCRS).filter(Boolean).sort((a, b) => a - b);
  const percentileRanges = {
    p25: calculatePercentile(scores, 25),
    p50: calculatePercentile(scores, 50),
    p75: calculatePercentile(scores, 75),
    p90: calculatePercentile(scores, 90)
  };

  // Calculate volatility (standard deviation)
  const volatility = calculateStandardDeviation(scores);

  // Find lowest in last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const recentDraws = sortedDraws.filter(d => new Date(d.drawDate) >= twelveMonthsAgo);
  const lowestInLast12Months = Math.min(...recentDraws.map(d => d.drawCRS).filter(Boolean));

  // Predict next draw score using linear regression
  const prediction = predictNextCRSScore(sortedDraws);

  // Analyze by category
  const byCategory = analyzeByCategory(sortedDraws);

  return {
    trends: {
      movingAverage,
      percentileRanges,
      volatility,
      lowestInLast12Months,
      prediction
    },
    byCategory
  };
};

/**
 * Calculate draw timing analytics
 */
export const calculateDrawTimingAnalytics = (draws: ParsedExpressEntryDraw[]): DrawTimingAnalytics => {
  if (!draws || draws.length < 2) {
    return {
      frequency: {
        averageDaysBetweenDraws: 0,
        shortestGap: 0,
        longestGap: 0,
        predictedNextDate: new Date()
      },
      patterns: {
        dayOfWeekDistribution: {},
        seasonalTrends: {},
        categoryRotation: []
      }
    };
  }

  const sortedDraws = [...draws].sort((a, b) => 
    new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  // Calculate gaps between draws
  const gaps: number[] = [];
  for (let i = 1; i < sortedDraws.length; i++) {
    const gap = Math.abs(
      new Date(sortedDraws[i].drawDate).getTime() - 
      new Date(sortedDraws[i-1].drawDate).getTime()
    ) / (1000 * 60 * 60 * 24); // Convert to days
    gaps.push(gap);
  }

  const averageDaysBetweenDraws = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const shortestGap = Math.min(...gaps);
  const longestGap = Math.max(...gaps);

  // Predict next draw date
  const lastDrawDate = new Date(sortedDraws[sortedDraws.length - 1].drawDate);
  const predictedNextDate = new Date(lastDrawDate.getTime() + (averageDaysBetweenDraws * 24 * 60 * 60 * 1000));

  // Analyze patterns
  const dayOfWeekDistribution = analyzeDayOfWeekDistribution(sortedDraws);
  const seasonalTrends = analyzeSeasonalTrends(sortedDraws);
  const categoryRotation = analyzeCategoryRotation(sortedDraws);

  return {
    frequency: {
      averageDaysBetweenDraws,
      shortestGap,
      longestGap,
      predictedNextDate
    },
    patterns: {
      dayOfWeekDistribution,
      seasonalTrends,
      categoryRotation
    }
  };
};

/**
 * Calculate user's probability of receiving invitation
 */
export const calculateUserProbability = (userCRS: number, category: string | undefined, draws: ParsedExpressEntryDraw[]): ProbabilityResult => {
  if (!draws || draws.length === 0) {
    return {
      currentProbability: 0,
      estimatedWaitTime: "Insufficient data",
      recommendedActions: [],
      historicalSuccess: 0
    };
  }

  const relevantDraws = category 
    ? draws.filter(d => d.drawName.toLowerCase().includes(category.toLowerCase()))
    : draws;

  if (relevantDraws.length === 0) {
    return {
      currentProbability: 0,
      estimatedWaitTime: "No relevant draws found",
      recommendedActions: ["Consider other categories"],
      historicalSuccess: 0
    };
  }

  // Calculate probability based on historical success
  const successfulDraws = relevantDraws.filter(d => d.drawCRS <= userCRS);
  const historicalSuccess = (successfulDraws.length / relevantDraws.length) * 100;

  // Calculate current probability using recent trends
  const recentDraws = relevantDraws.slice(-10); // Last 10 draws
  const recentSuccess = recentDraws.filter(d => d.drawCRS <= userCRS);
  const currentProbability = (recentSuccess.length / recentDraws.length) * 100;

  // Estimate wait time
  const estimatedWaitTime = estimateWaitTime(userCRS, relevantDraws);

  // Generate recommendations
  const recommendedActions = generateRecommendations(userCRS, relevantDraws);

  return {
    currentProbability,
    estimatedWaitTime,
    recommendedActions,
    historicalSuccess
  };
};

/**
 * Detect outliers in draw data
 */
export const detectOutliers = (draws: ParsedExpressEntryDraw[]): OutlierData[] => {
  if (!draws || draws.length < 5) return [];

  const outliers: OutlierData[] = [];
  const scores = draws.map(d => d.drawCRS).filter(Boolean);
  const sizes = draws.map(d => d.drawSize).filter(Boolean);

  // Detect CRS score outliers using IQR method
  const scoreOutliers = detectIQROutliers(scores, draws, 'score');
  outliers.push(...scoreOutliers);

  // Detect draw size outliers
  const sizeOutliers = detectIQROutliers(sizes, draws, 'size');
  outliers.push(...sizeOutliers);

  // Detect timing outliers
  const timingOutliers = detectTimingOutliers(draws);
  outliers.push(...timingOutliers);

  return outliers;
};

/**
 * Perform seasonal pattern detection
 */
export const detectSeasonalPatterns = (draws: ParsedExpressEntryDraw[]): { 
  patterns: { month: string; pattern: string; confidence: number }[];
  insights: string[];
} => {
  if (!draws || draws.length < 12) {
    return { patterns: [], insights: ["Insufficient data for seasonal analysis"] };
  }

  const monthlyData = groupDrawsByMonth(draws);
  const patterns: { month: string; pattern: string; confidence: number }[] = [];
  const insights: string[] = [];

  // Analyze each month for patterns
  Object.entries(monthlyData).forEach(([month, monthDraws]) => {
    if (monthDraws.length >= 2) {
      const avgScore = monthDraws.reduce((sum, d) => sum + d.drawCRS, 0) / monthDraws.length;
      const avgSize = monthDraws.reduce((sum, d) => sum + d.drawSize, 0) / monthDraws.length;
      
      let pattern = "Normal activity";
      let confidence = 0.5;
      
      // Detect patterns based on historical averages
      const allDrawsAvg = draws.reduce((sum, d) => sum + d.drawCRS, 0) / draws.length;
      if (avgScore > allDrawsAvg * 1.1) {
        pattern = "Higher CRS scores typically seen";
        confidence = 0.8;
      } else if (avgScore < allDrawsAvg * 0.9) {
        pattern = "Lower CRS scores typically seen";
        confidence = 0.8;
      }

      patterns.push({ month, pattern, confidence });
    }
  });

  // Generate insights
  const highActivityMonths = patterns.filter(p => p.pattern.includes("Higher")).map(p => p.month);
  const lowActivityMonths = patterns.filter(p => p.pattern.includes("Lower")).map(p => p.month);

  if (highActivityMonths.length > 0) {
    insights.push(`Competitive periods: ${highActivityMonths.join(", ")}`);
  }
  if (lowActivityMonths.length > 0) {
    insights.push(`Favorable periods: ${lowActivityMonths.join(", ")}`);
  }

  return { patterns, insights };
};

/**
 * Monte Carlo simulation for probability modeling
 */
export const runMonteCarloSimulation = (
  userCRS: number,
  draws: ParsedExpressEntryDraw[],
  iterations: number = 1000
): {
  probabilityDistribution: { probability: number; frequency: number }[];
  averageProbability: number;
  confidenceInterval: { lower: number; upper: number };
} => {
  if (!draws || draws.length === 0) {
    return {
      probabilityDistribution: [],
      averageProbability: 0,
      confidenceInterval: { lower: 0, upper: 0 }
    };
  }

  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Simulate draw parameters with some randomness
    const simulatedDraws = simulateDrawScenarios(draws, 10);
    const successRate = simulatedDraws.filter(score => score <= userCRS).length / simulatedDraws.length;
    results.push(successRate * 100);
  }

  // Calculate distribution
  const probabilityDistribution = calculateDistribution(results, 10);
  const averageProbability = results.reduce((sum, r) => sum + r, 0) / results.length;
  
  // Calculate 95% confidence interval
  const sortedResults = results.sort((a, b) => a - b);
  const lowerIndex = Math.floor(iterations * 0.025);
  const upperIndex = Math.floor(iterations * 0.975);
  
  return {
    probabilityDistribution,
    averageProbability,
    confidenceInterval: {
      lower: sortedResults[lowerIndex],
      upper: sortedResults[upperIndex]
    }
  };
};

// Helper functions
const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result: number[] = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
};

const calculatePercentile = (sortedArray: number[], percentile: number): number => {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
};

const calculateStandardDeviation = (data: number[]): number => {
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

const predictNextCRSScore = (draws: ParsedExpressEntryDraw[]): { nextDraw: number; confidence: number } => {
  if (draws.length < 5) return { nextDraw: 0, confidence: 0 };
  
  const recentDraws = draws.slice(-10);
  const scores = recentDraws.map(d => d.drawCRS);
  const trend = (scores[scores.length - 1] - scores[0]) / scores.length;
  const lastScore = scores[scores.length - 1];
  
  return {
    nextDraw: Math.round(lastScore + trend),
    confidence: Math.max(0.1, 1 - Math.abs(trend) / 50) // Lower confidence for volatile trends
  };
};

const analyzeByCategory = (draws: ParsedExpressEntryDraw[]): CRSAnalytics['byCategory'] => {
  const categories: { [key: string]: ParsedExpressEntryDraw[] } = {};
  
  draws.forEach(draw => {
    const category = draw.drawName || 'General';
    if (!categories[category]) categories[category] = [];
    categories[category].push(draw);
  });

  const result: CRSAnalytics['byCategory'] = {};
  
  Object.entries(categories).forEach(([category, categoryDraws]) => {
    if (categoryDraws.length > 0) {
      const scores = categoryDraws.map(d => d.drawCRS).filter(Boolean);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (scores.length >= 3) {
        const recent = scores.slice(-3);
        const older = scores.slice(-6, -3);
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
          const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;
          if (recentAvg > olderAvg + 5) trend = 'increasing';
          else if (recentAvg < olderAvg - 5) trend = 'decreasing';
        }
      }
      
      result[category] = {
        averageScore,
        trend,
        frequency: categoryDraws.length
      };
    }
  });

  return result;
};

const analyzeDayOfWeekDistribution = (draws: ParsedExpressEntryDraw[]): { [day: string]: number } => {
  const distribution: { [day: string]: number } = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  days.forEach(day => distribution[day] = 0);
  
  draws.forEach(draw => {
    const dayOfWeek = days[new Date(draw.drawDate).getDay()];
    distribution[dayOfWeek]++;
  });

  return distribution;
};

const analyzeSeasonalTrends = (draws: ParsedExpressEntryDraw[]): { [month: string]: number } => {
  const trends: { [month: string]: number } = {};
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  months.forEach(month => trends[month] = 0);
  
  draws.forEach(draw => {
    const month = months[new Date(draw.drawDate).getMonth()];
    trends[month]++;
  });

  return trends;
};

const analyzeCategoryRotation = (draws: ParsedExpressEntryDraw[]): string[] => {
  const sortedDraws = [...draws].sort((a, b) => 
    new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );
  
  return sortedDraws.slice(-10).map(d => d.drawName || 'General');
};

const estimateWaitTime = (userCRS: number, draws: ParsedExpressEntryDraw[]): string => {
  const recentDraws = draws.slice(-20);
  const applicableDraws = recentDraws.filter(d => d.drawCRS <= userCRS);
  
  if (applicableDraws.length === 0) {
    return "Improve CRS score needed";
  }
  
  const avgTimeBetweenDraws = 14; // Approximate days
  const probability = applicableDraws.length / recentDraws.length;
  
  if (probability > 0.8) return "1-2 draws";
  if (probability > 0.5) return "2-4 draws";
  if (probability > 0.3) return "4-8 draws";
  return "8+ draws";
};

const generateRecommendations = (userCRS: number, draws: ParsedExpressEntryDraw[]): string[] => {
  const recommendations: string[] = [];
  const recentAvg = draws.slice(-10).reduce((sum, d) => sum + d.drawCRS, 0) / 10;
  
  if (userCRS < recentAvg - 20) {
    recommendations.push("Consider improving language test scores");
    recommendations.push("Explore Provincial Nominee Programs");
    recommendations.push("Gain additional work experience");
  } else if (userCRS < recentAvg - 5) {
    recommendations.push("Small improvements could significantly help");
    recommendations.push("Consider retaking language tests");
  } else {
    recommendations.push("Your score is competitive!");
    recommendations.push("Monitor draws regularly");
  }
  
  return recommendations;
};

const detectIQROutliers = (data: number[], draws: ParsedExpressEntryDraw[], type: 'score' | 'size'): OutlierData[] => {
  const sortedData = [...data].sort((a, b) => a - b);
  const q1 = calculatePercentile(sortedData, 25);
  const q3 = calculatePercentile(sortedData, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: OutlierData[] = [];
  
  draws.forEach(draw => {
    const value = type === 'score' ? draw.drawCRS : draw.drawSize;
    if (value < lowerBound || value > upperBound) {
      const expectedValue = type === 'score' ? q1 + (q3 - q1) / 2 : q1 + (q3 - q1) / 2;
      const deviation = Math.abs(value - expectedValue) / expectedValue * 100;
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (deviation > 30) severity = 'high';
      else if (deviation > 15) severity = 'medium';
      
      outliers.push({
        drawNumber: draw.drawNumber,
        type,
        severity,
        description: `${type === 'score' ? 'CRS score' : 'Draw size'} significantly ${value > expectedValue ? 'higher' : 'lower'} than typical`,
        value,
        expectedValue,
        deviation
      });
    }
  });

  return outliers;
};

const detectTimingOutliers = (draws: ParsedExpressEntryDraw[]): OutlierData[] => {
  if (draws.length < 3) return [];
  
  const sortedDraws = [...draws].sort((a, b) => 
    new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
  );

  const gaps: { draw: ParsedExpressEntryDraw; gap: number }[] = [];
  for (let i = 1; i < sortedDraws.length; i++) {
    const gap = (new Date(sortedDraws[i].drawDate).getTime() - new Date(sortedDraws[i-1].drawDate).getTime()) / (1000 * 60 * 60 * 24);
    gaps.push({ draw: sortedDraws[i], gap });
  }

  const gapValues = gaps.map(g => g.gap);
  const avgGap = gapValues.reduce((sum, g) => sum + g, 0) / gapValues.length;
  const stdDev = calculateStandardDeviation(gapValues);

  return gaps
    .filter(({ gap }) => Math.abs(gap - avgGap) > 2 * stdDev)
    .map(({ draw, gap }) => ({
      drawNumber: draw.drawNumber,
      type: 'timing' as const,
      severity: (Math.abs(gap - avgGap) > 3 * stdDev ? 'high' : 'medium') as const,
      description: `Unusual gap of ${Math.round(gap)} days between draws`,
      value: gap,
      expectedValue: avgGap,
      deviation: Math.abs(gap - avgGap) / avgGap * 100
    }));
};

const groupDrawsByMonth = (draws: ParsedExpressEntryDraw[]): { [month: string]: ParsedExpressEntryDraw[] } => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const grouped: { [month: string]: ParsedExpressEntryDraw[] } = {};
  months.forEach(month => grouped[month] = []);
  
  draws.forEach(draw => {
    const month = months[new Date(draw.drawDate).getMonth()];
    grouped[month].push(draw);
  });

  return grouped;
};

const simulateDrawScenarios = (historicalDraws: ParsedExpressEntryDraw[], scenarios: number): number[] => {
  const scores = historicalDraws.map(d => d.drawCRS).filter(Boolean);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const stdDev = calculateStandardDeviation(scores);
  
  const simulatedScores: number[] = [];
  
  for (let i = 0; i < scenarios; i++) {
    // Add random variation based on historical volatility
    const variation = (Math.random() - 0.5) * stdDev * 0.5;
    simulatedScores.push(Math.round(mean + variation));
  }
  
  return simulatedScores;
};

const calculateDistribution = (data: number[], bins: number): { probability: number; frequency: number }[] => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / bins;
  
  const distribution: { probability: number; frequency: number }[] = [];
  
  for (let i = 0; i < bins; i++) {
    const binMin = min + i * binSize;
    const binMax = binMin + binSize;
    const frequency = data.filter(d => d >= binMin && d < binMax).length;
    
    distribution.push({
      probability: binMin + binSize / 2,
      frequency
    });
  }
  
  return distribution;
};