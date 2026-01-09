/**
 * Timeline Predictor Component
 * Visual timeline of predicted future draws with seasonal patterns and outlier detection
 */

"use client";

import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import { 
  calculateDrawTimingAnalytics,
  detectSeasonalPatterns,
  detectOutliers,
  type DrawTimingAnalytics,
  type OutlierData
} from "@/lib/analytics";

interface TimelinePredictorProps {
  draws: ParsedExpressEntryDraw[];
  className?: string;
}

interface PredictedDraw {
  date: Date;
  estimatedCRS: number;
  confidence: number;
  category: string;
  reasoning: string[];
}

export const TimelinePredictor: React.FC<TimelinePredictorProps> = ({
  draws,
  className = ""
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timingAnalytics, setTimingAnalytics] = useState<DrawTimingAnalytics | null>(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any>(null);
  const [outliers, setOutliers] = useState<OutlierData[]>([]);
  const [predictions, setPredictions] = useState<PredictedDraw[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictedDraw | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year'>('6months');

  useEffect(() => {
    if (draws && draws.length > 0) {
      analyzeAndPredict();
    }
  }, [draws]);

  useEffect(() => {
    if (predictions.length > 0) {
      animateTimeline();
    }
  }, [predictions, viewMode]);

  const analyzeAndPredict = () => {
    // Calculate timing analytics
    const timing = calculateDrawTimingAnalytics(draws);
    setTimingAnalytics(timing);

    // Detect seasonal patterns
    const patterns = detectSeasonalPatterns(draws);
    setSeasonalPatterns(patterns);

    // Detect outliers
    const drawOutliers = detectOutliers(draws);
    setOutliers(drawOutliers);

    // Generate predictions
    const predicted = generatePredictions(timing, patterns);
    setPredictions(predicted);
  };

  const generatePredictions = (
    timing: DrawTimingAnalytics,
    patterns: any
  ): PredictedDraw[] => {
    const predictions: PredictedDraw[] = [];
    const today = new Date();
    const monthsToPredict = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    
    let currentDate = new Date(timing.frequency.predictedNextDate);
    const avgGap = timing.frequency.averageDaysBetweenDraws;

    for (let i = 0; i < monthsToPredict * 2; i++) {
      if (currentDate > new Date(today.getTime() + (monthsToPredict * 30 * 24 * 60 * 60 * 1000))) {
        break;
      }

      const month = currentDate.toLocaleString('default', { month: 'long' });
      const dayOfWeek = currentDate.toLocaleString('default', { weekday: 'long' });

      // Get seasonal insights for this month
      const monthPattern = patterns.patterns.find((p: any) => p.month === month);
      
      // Calculate estimated CRS based on recent trends and patterns
      const recentScores = draws.slice(-10).map(d => d.drawCRS);
      const avgRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      let estimatedCRS = avgRecentScore;

      // Adjust for seasonal patterns
      if (monthPattern?.pattern.includes("Higher")) {
        estimatedCRS += 10;
      } else if (monthPattern?.pattern.includes("Lower")) {
        estimatedCRS -= 10;
      }

      // Determine category rotation
      const categoryIndex = i % timing.patterns.categoryRotation.length;
      const category = timing.patterns.categoryRotation[categoryIndex] || "General";

      // Calculate confidence based on data consistency
      let confidence = 0.7;
      if (monthPattern && monthPattern.confidence > 0.6) {
        confidence += 0.2;
      }
      if (timing.patterns.dayOfWeekDistribution[dayOfWeek] > 2) {
        confidence += 0.1;
      }

      // Generate reasoning
      const reasoning: string[] = [];
      reasoning.push(`Based on ${avgGap.toFixed(1)}-day average gap between draws`);
      if (monthPattern) {
        reasoning.push(`${month} typically shows: ${monthPattern.pattern}`);
      }
      if (timing.patterns.dayOfWeekDistribution[dayOfWeek] > 0) {
        reasoning.push(`${dayOfWeek} draws occurred ${timing.patterns.dayOfWeekDistribution[dayOfWeek]} times historically`);
      }

      predictions.push({
        date: new Date(currentDate),
        estimatedCRS: Math.round(estimatedCRS),
        confidence: Math.min(confidence, 1),
        category,
        reasoning
      });

      // Calculate next draw date with some randomness
      const variation = (Math.random() - 0.5) * 3; // ±1.5 day variation
      currentDate = new Date(currentDate.getTime() + ((avgGap + variation) * 24 * 60 * 60 * 1000));
    }

    return predictions;
  };

  const animateTimeline = () => {
    if (!timelineRef.current) return;

    const items = timelineRef.current.querySelectorAll('[data-prediction-item]');
    
    anime({
      targets: items,
      translateY: [50, 0],
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 600,
      delay: (el, i) => i * 100,
      easing: 'easeOutElastic(1, .8)'
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBackground = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-50 border-green-200";
    if (confidence >= 0.6) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isWithinRange = (prediction: PredictedDraw): boolean => {
    const today = new Date();
    const maxDate = new Date();
    const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    maxDate.setMonth(maxDate.getMonth() + months);
    
    return prediction.date >= today && prediction.date <= maxDate;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Timeline Predictor</h3>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="3months">Next 3 Months</option>
            <option value="6months">Next 6 Months</option>
            <option value="1year">Next Year</option>
          </select>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm ${viewMode === 'timeline' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-sm ${viewMode === 'calendar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {timingAnalytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-600">
              {timingAnalytics.frequency.averageDaysBetweenDraws.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg Days Between</div>
          </div>
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-green-600">
              {timingAnalytics.frequency.shortestGap}
            </div>
            <div className="text-sm text-gray-600">Shortest Gap</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {timingAnalytics.frequency.longestGap}
            </div>
            <div className="text-sm text-gray-600">Longest Gap</div>
          </div>
          <div className="bg-purple-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDate(timingAnalytics.frequency.predictedNextDate).split(',')[0]}
            </div>
            <div className="text-sm text-gray-600">Next Predicted</div>
          </div>
        </div>
      )}

      {/* Predictions Display */}
      {viewMode === 'timeline' ? (
        <div ref={timelineRef} className="space-y-4">
          {predictions.filter(isWithinRange).map((prediction, index) => (
            <div
              key={index}
              data-prediction-item
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                getConfidenceBackground(prediction.confidence)
              }`}
              onClick={() => setSelectedPrediction(prediction)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-gray-800">
                    {formatDate(prediction.date)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {prediction.category}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-800">
                    CRS: {prediction.estimatedCRS}
                  </span>
                  <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                    {Math.round(prediction.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {prediction.reasoning[0]}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Calendar view (simplified)
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Calendar implementation would go here */}
          <div className="col-span-7 text-gray-500 py-8">
            Calendar view implementation coming soon...
          </div>
        </div>
      )}

      {/* Selected Prediction Details */}
      {selectedPrediction && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Prediction Details - {formatDate(selectedPrediction.date)}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-gray-600">Estimated CRS:</span>
              <div className="text-2xl font-bold text-blue-600">
                {selectedPrediction.estimatedCRS}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Confidence Level:</span>
              <div className={`text-2xl font-bold ${getConfidenceColor(selectedPrediction.confidence)}`}>
                {Math.round(selectedPrediction.confidence * 100)}%
              </div>
            </div>
            <div>
              <span className="text-gray-600">Program:</span>
              <div className="text-lg font-semibold text-gray-800">
                {selectedPrediction.category}
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-2">Analysis Factors:</h5>
            <ul className="space-y-1">
              {selectedPrediction.reasoning.map((reason, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Seasonal Insights */}
      {seasonalPatterns && seasonalPatterns.insights.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Seasonal Insights</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {seasonalPatterns.insights.map((insight: string, index: number) => (
              <div key={index}>• {insight}</div>
            ))}
          </div>
        </div>
      )}

      {/* Outlier Alerts */}
      {outliers.length > 0 && (
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Recent Unusual Activity
          </h4>
          <div className="text-sm text-gray-600">
            {outliers.slice(0, 3).map((outlier, index) => (
              <div key={index} className="mb-1">
                Draw #{outlier.drawNumber}: {outlier.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          <strong>Disclaimer:</strong> These predictions are based on historical patterns and 
          statistical analysis. Actual draw dates and CRS scores may vary due to policy changes, 
          seasonal factors, and other variables not captured in historical data. Use these 
          predictions as guidance only.
        </p>
      </div>
    </div>
  );
};