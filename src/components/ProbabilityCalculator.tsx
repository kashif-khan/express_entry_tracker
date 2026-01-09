/**
 * Probability Calculator Widget
 * User input widget for personalized analytics and probability calculations
 */

"use client";

import { useState, useEffect } from "react";
import anime from "animejs";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import { 
  calculateUserProbability, 
  runMonteCarloSimulation,
  type ProbabilityResult
} from "@/lib/analytics";

interface ProbabilityCalculatorProps {
  draws: ParsedExpressEntryDraw[];
  className?: string;
}

interface UserInput {
  crsScore: number;
  category: string;
  targetDate?: Date;
}

export const ProbabilityCalculator: React.FC<ProbabilityCalculatorProps> = ({
  draws,
  className = ""
}) => {
  const [userInput, setUserInput] = useState<UserInput>({
    crsScore: 450,
    category: "all"
  });
  const [probabilityResult, setProbabilityResult] = useState<ProbabilityResult | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    { value: "all", label: "All Programs" },
    { value: "canadian experience class", label: "Canadian Experience Class" },
    { value: "federal skilled worker", label: "Federal Skilled Worker" },
    { value: "provincial nominee", label: "Provincial Nominee Program" },
    { value: "federal skilled trades", label: "Federal Skilled Trades" }
  ];

  useEffect(() => {
    if (draws && draws.length > 0) {
      calculateProbabilities();
    }
  }, [userInput, draws]);

  const calculateProbabilities = async () => {
    if (!draws || draws.length === 0) return;

    setIsCalculating(true);

    // Basic probability calculation
    const category = userInput.category === "all" ? undefined : userInput.category;
    const basicResult = calculateUserProbability(userInput.crsScore, category, draws);
    setProbabilityResult(basicResult);

    // Monte Carlo simulation for advanced analysis
    if (showAdvanced) {
      const monteResult = runMonteCarloSimulation(userInput.crsScore, draws, 1000);
      setMonteCarloResult(monteResult);
    }

    setIsCalculating(false);
  };

  const handleInputChange = (field: keyof UserInput, value: any) => {
    setUserInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const animateResult = (element: HTMLElement) => {
    anime({
      targets: element,
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutElastic(1, .8)'
    });
  };

  const getProbabilityColor = (probability: number): string => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    if (probability >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getProbabilityBackground = (probability: number): string => {
    if (probability >= 80) return "bg-green-50";
    if (probability >= 60) return "bg-yellow-50";
    if (probability >= 40) return "bg-orange-50";
    return "bg-red-50";
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Probability Calculator</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showAdvanced ? "Simple View" : "Advanced Analysis"}
        </button>
      </div>

      {/* User Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your CRS Score
          </label>
          <input
            type="number"
            min="0"
            max="1200"
            value={userInput.crsScore}
            onChange={(e) => handleInputChange("crsScore", parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your CRS score"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a score between 0-1200
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program Category
          </label>
          <select
            value={userInput.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Application Date (Optional)
            </label>
            <input
              type="date"
              onChange={(e) => handleInputChange("targetDate", new Date(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Monte Carlo Simulation</h4>
              <p className="text-xs text-gray-500">
                Advanced probability modeling with 1000 scenarios
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isCalculating && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Calculating probabilities...</p>
        </div>
      )}

      {/* Results */}
      {probabilityResult && !isCalculating && (
        <div className="space-y-6">
          {/* Primary Result Card */}
          <div 
            className={`p-6 rounded-lg border-l-4 ${
              probabilityResult.currentProbability >= 60 ? "border-green-500" : "border-red-500"
            } ${getProbabilityBackground(probabilityResult.currentProbability)}`}
            ref={(el) => el && animateResult(el)}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Your Invitation Probability
              </h4>
              <div className={`text-3xl font-bold ${getProbabilityColor(probabilityResult.currentProbability)}`}>
                {Math.round(probabilityResult.currentProbability)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Estimated Wait Time:</span>
                <div className="font-semibold text-gray-800">{probabilityResult.estimatedWaitTime}</div>
              </div>
              <div>
                <span className="text-gray-600">Historical Success Rate:</span>
                <div className="font-semibold text-gray-800">
                  {Math.round(probabilityResult.historicalSuccess)}%
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Recommendations
            </h4>
            <ul className="space-y-2">
              {probabilityResult.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monte Carlo Results */}
          {showAdvanced && monteCarloResult && (
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Advanced Simulation Results
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(monteCarloResult.averageProbability)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Probability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(monteCarloResult.confidenceInterval.lower)}-{Math.round(monteCarloResult.confidenceInterval.upper)}%
                  </div>
                  <div className="text-sm text-gray-600">95% Confidence Range</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1000</div>
                  <div className="text-sm text-gray-600">Simulated Scenarios</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  Based on 1000 simulated scenarios, your probability of receiving an invitation 
                  ranges from {Math.round(monteCarloResult.confidenceInterval.lower)}% to{" "}
                  {Math.round(monteCarloResult.confidenceInterval.upper)}% with 95% confidence.
                </p>
              </div>
            </div>
          )}

          {/* Probability Distribution Visualization */}
          {showAdvanced && monteCarloResult?.probabilityDistribution && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Probability Distribution
              </h4>
              
              <div className="h-32 flex items-end justify-center space-x-1">
                {monteCarloResult.probabilityDistribution.map((point: any, index: number) => (
                  <div
                    key={index}
                    className="bg-purple-400 hover:bg-purple-600 transition-colors duration-200"
                    style={{
                      width: "8px",
                      height: `${(point.frequency / Math.max(...monteCarloResult.probabilityDistribution.map((p: any) => p.frequency))) * 100}%`,
                      minHeight: "2px"
                    }}
                    title={`Probability: ${Math.round(point.probability)}%, Frequency: ${point.frequency}`}
                  ></div>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 mt-2 text-center">
                Distribution of probability outcomes across 1000 simulations
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">How it works</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Probability is based on historical draw data and recent trends</li>
          <li>• Calculations consider your selected program category</li>
          <li>• Advanced mode includes Monte Carlo simulation for confidence intervals</li>
          <li>• Results are estimates based on past performance; actual results may vary</li>
        </ul>
      </div>
    </div>
  );
};