/**
 * Category Performance Dashboard Component
 * Comparison across different draw categories with analytics and visualizations
 */

"use client";

import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import { calculateCRSTrends, type CRSAnalytics } from "@/lib/analytics";

interface CategoryPerformanceDashboardProps {
  draws: ParsedExpressEntryDraw[];
  className?: string;
}

interface CategoryStats {
  name: string;
  shortName: string;
  color: string;
  totalDraws: number;
  averageCRS: number;
  lowestCRS: number;
  highestCRS: number;
  averageSize: number;
  totalInvitations: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendValue: number;
  frequency: number; // draws per month
  lastDraw: Date;
  analytics: CRSAnalytics;
}

export const CategoryPerformanceDashboard: React.FC<CategoryPerformanceDashboardProps> = ({
  draws,
  className = ""
}) => {
  const chartsRef = useRef<HTMLDivElement>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStats | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [sortBy, setSortBy] = useState<'frequency' | 'average' | 'total'>('frequency');
  const [isAnimating, setIsAnimating] = useState(false);

  const categoryMappings = [
    {
      keywords: ["canadian experience", "cec"],
      name: "Canadian Experience Class",
      shortName: "CEC",
      color: "#3B82F6"
    },
    {
      keywords: ["federal skilled worker", "fsw"],
      name: "Federal Skilled Worker",
      shortName: "FSW", 
      color: "#10B981"
    },
    {
      keywords: ["provincial nominee", "pnp"],
      name: "Provincial Nominee Program",
      shortName: "PNP",
      color: "#F59E0B"
    },
    {
      keywords: ["federal skilled trades", "fst"],
      name: "Federal Skilled Trades",
      shortName: "FST",
      color: "#8B5CF6"
    },
    {
      keywords: ["general", "all", "no program"],
      name: "General Draw",
      shortName: "General",
      color: "#6B7280"
    }
  ];

  useEffect(() => {
    if (draws && draws.length > 0) {
      analyzeCategoryPerformance();
    }
  }, [draws]);

  useEffect(() => {
    if (categoryStats.length > 0 && !isAnimating) {
      animateCharts();
    }
  }, [categoryStats, viewMode]);

  const analyzeCategoryPerformance = () => {
    const categoryGroups = new Map<string, ParsedExpressEntryDraw[]>();
    
    // Group draws by category
    draws.forEach(draw => {
      const drawName = (draw.drawName || "").toLowerCase();
      
      let categoryKey = "general";
      for (const mapping of categoryMappings) {
        if (mapping.keywords.some(keyword => drawName.includes(keyword))) {
          categoryKey = mapping.shortName.toLowerCase();
          break;
        }
      }
      
      if (!categoryGroups.has(categoryKey)) {
        categoryGroups.set(categoryKey, []);
      }
      categoryGroups.get(categoryKey)!.push(draw);
    });

    // Calculate statistics for each category
    const stats: CategoryStats[] = [];
    
    categoryGroups.forEach((categoryDraws, categoryKey) => {
      const mapping = categoryMappings.find(m => m.shortName.toLowerCase() === categoryKey);
      if (!mapping || categoryDraws.length === 0) return;

      const scores = categoryDraws.map(d => d.drawCRS).filter(Boolean);
      const sizes = categoryDraws.map(d => d.drawSize).filter(Boolean);
      
      // Calculate basic stats
      const averageCRS = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const lowestCRS = Math.min(...scores);
      const highestCRS = Math.max(...scores);
      const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      const totalInvitations = sizes.reduce((sum, size) => sum + size, 0);

      // Calculate trend
      const recentDraws = categoryDraws.slice(-6);
      const olderDraws = categoryDraws.slice(-12, -6);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let trendValue = 0;
      
      if (recentDraws.length >= 3 && olderDraws.length >= 3) {
        const recentAvg = recentDraws.reduce((sum, d) => sum + d.drawCRS, 0) / recentDraws.length;
        const olderAvg = olderDraws.reduce((sum, d) => sum + d.drawCRS, 0) / olderDraws.length;
        
        trendValue = recentAvg - olderAvg;
        if (trendValue > 5) trend = 'increasing';
        else if (trendValue < -5) trend = 'decreasing';
      }

      // Calculate frequency (draws per month)
      const sortedDraws = categoryDraws.sort((a, b) => 
        new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
      );
      const firstDraw = new Date(sortedDraws[0].drawDate);
      const lastDraw = new Date(sortedDraws[sortedDraws.length - 1].drawDate);
      const monthsDiff = (lastDraw.getTime() - firstDraw.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const frequency = categoryDraws.length / Math.max(monthsDiff, 1);

      // Calculate analytics
      const analytics = calculateCRSTrends(categoryDraws);

      stats.push({
        name: mapping.name,
        shortName: mapping.shortName,
        color: mapping.color,
        totalDraws: categoryDraws.length,
        averageCRS: Math.round(averageCRS),
        lowestCRS,
        highestCRS,
        averageSize: Math.round(averageSize),
        totalInvitations,
        trend,
        trendValue: Math.round(trendValue),
        frequency: Math.round(frequency * 10) / 10,
        lastDraw,
        analytics
      });
    });

    // Sort categories
    const sortedStats = [...stats].sort((a, b) => {
      switch (sortBy) {
        case 'frequency': return b.frequency - a.frequency;
        case 'average': return a.averageCRS - b.averageCRS;
        case 'total': return b.totalDraws - a.totalDraws;
        default: return b.frequency - a.frequency;
      }
    });

    setCategoryStats(sortedStats);
  };

  const animateCharts = () => {
    if (!chartsRef.current || isAnimating) return;

    setIsAnimating(true);
    
    const cards = chartsRef.current.querySelectorAll('[data-category-card]');
    const bars = chartsRef.current.querySelectorAll('[data-progress-bar]');
    
    // Animate cards
    anime({
      targets: cards,
      translateY: [50, 0],
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 600,
      delay: (el, i) => i * 100,
      easing: 'easeOutElastic(1, .8)'
    });

    // Animate progress bars
    anime({
      targets: bars,
      width: (el: Element) => el.getAttribute('data-width') + '%',
      duration: 1200,
      delay: 800,
      easing: 'easeOutQuart',
      complete: () => setIsAnimating(false)
    });
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    switch (trend) {
      case 'increasing': return "↗️";
      case 'decreasing': return "↘️";
      default: return "→";
    }
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    switch (trend) {
      case 'increasing': return "text-red-600";
      case 'decreasing': return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const formatLastDraw = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    return `${diffMonths} months ago`;
  };

  const getMaxValue = (field: keyof CategoryStats): number => {
    switch (field) {
      case 'averageCRS': return Math.max(...categoryStats.map(s => s.averageCRS));
      case 'frequency': return Math.max(...categoryStats.map(s => s.frequency));
      case 'totalDraws': return Math.max(...categoryStats.map(s => s.totalDraws));
      case 'averageSize': return Math.max(...categoryStats.map(s => s.averageSize));
      default: return 1;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Category Performance Dashboard</h3>
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="frequency">Sort by Frequency</option>
            <option value="average">Sort by Avg CRS</option>
            <option value="total">Sort by Total Draws</option>
          </select>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 text-sm ${viewMode === 'overview' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm ${viewMode === 'detailed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div ref={chartsRef} className="space-y-4">
        {categoryStats.map((category, index) => (
          <div
            key={category.shortName}
            data-category-card
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => setSelectedCategory(category)}
            style={{ opacity: 0, transform: 'translateY(50px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                ></div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {viewMode === 'overview' ? category.shortName : category.name}
                </h4>
                <span className={`text-sm ${getTrendColor(category.trend)}`}>
                  {getTrendIcon(category.trend)} {Math.abs(category.trendValue)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last: {formatLastDraw(category.lastDraw)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: category.color }}>
                  {category.averageCRS}
                </div>
                <div className="text-sm text-gray-600">Avg CRS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {category.totalDraws}
                </div>
                <div className="text-sm text-gray-600">Total Draws</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {category.frequency}
                </div>
                <div className="text-sm text-gray-600">Per Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {(category.totalInvitations / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-gray-600">Invitations</div>
              </div>
            </div>

            {/* Progress bars for comparison */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Average CRS Score</span>
                  <span>{category.averageCRS}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    data-progress-bar
                    data-width={(category.averageCRS / getMaxValue('averageCRS')) * 100}
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: category.color,
                      width: '0%'
                    }}
                  ></div>
                </div>
              </div>

              {viewMode === 'detailed' && (
                <>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Draw Frequency</span>
                      <span>{category.frequency}/month</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        data-progress-bar
                        data-width={(category.frequency / getMaxValue('frequency')) * 100}
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Average Size</span>
                      <span>{category.averageSize.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        data-progress-bar
                        data-width={(category.averageSize / getMaxValue('averageSize')) * 100}
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Range indicator */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Range: {category.lowestCRS} - {category.highestCRS}</span>
              <span className={getTrendColor(category.trend)}>
                {category.trend === 'stable' ? 'Stable trend' : 
                 category.trend === 'increasing' ? 'Rising scores' : 'Falling scores'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedCategory.name} - Detailed Analytics
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-3 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedCategory.analytics.trends.percentileRanges.p50}
              </div>
              <div className="text-sm text-gray-600">Median Score</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedCategory.analytics.trends.lowestInLast12Months}
              </div>
              <div className="text-sm text-gray-600">12-Month Low</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(selectedCategory.analytics.trends.volatility)}
              </div>
              <div className="text-sm text-gray-600">Score Volatility</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedCategory.analytics.trends.prediction.nextDraw}
              </div>
              <div className="text-sm text-gray-600">Predicted Next</div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Analysis:</strong> {selectedCategory.name} has conducted {selectedCategory.totalDraws} draws 
              with an average frequency of {selectedCategory.frequency} draws per month. The category shows a {selectedCategory.trend} trend 
              with scores {selectedCategory.trend === 'increasing' ? 'rising' : selectedCategory.trend === 'decreasing' ? 'falling' : 'remaining stable'} 
              by approximately {Math.abs(selectedCategory.trendValue)} points over recent draws.
            </p>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-2xl font-bold text-blue-600">
            {categoryStats.length}
          </div>
          <div className="text-sm text-gray-600">Active Categories</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(categoryStats.reduce((sum, cat) => sum + cat.averageCRS, 0) / categoryStats.length)}
          </div>
          <div className="text-sm text-gray-600">Overall Avg CRS</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded">
          <div className="text-2xl font-bold text-yellow-600">
            {categoryStats.reduce((sum, cat) => sum + cat.totalDraws, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Draws</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(categoryStats.reduce((sum, cat) => sum + cat.totalInvitations, 0) / 1000)}k
          </div>
          <div className="text-sm text-gray-600">Total Invitations</div>
        </div>
      </div>
    </div>
  );
};