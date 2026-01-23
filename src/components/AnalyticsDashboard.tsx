/**
 * Analytics Dashboard - Main container for all analytics components
 * Integrates all visual analytics and advanced features
 */

"use client";

import { useState, useEffect } from "react";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import { CRSTrendChart } from "./CRSTrendChart";
import { DistributionHeatMap } from "./DistributionHeatMap";
import { CategoryPerformanceDashboard } from "./CategoryPerformanceDashboard";
import { ProbabilityCalculator } from "./ProbabilityCalculator";
import { TimelinePredictor } from "./TimelinePredictor";
import { AdvancedAnalytics } from "./AdvancedAnalytics";

interface AnalyticsDashboardProps {
  draws: ParsedExpressEntryDraw[];
  className?: string;
}

type TabId = 'overview' | 'trends' | 'distribution' | 'categories' | 'calculator' | 'timeline' | 'advanced';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  description: string;
  component: React.ComponentType<any>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  draws,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [userCRS, setUserCRS] = useState<number>();
  const [showSettings, setShowSettings] = useState(false);

  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      description: 'High-level analytics summary',
      component: () => (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <CRSTrendChart draws={draws} className="col-span-1" />
          <CategoryPerformanceDashboard draws={draws} className="col-span-1" />
        </div>
      )
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: '📈',
      description: 'CRS score trends and predictions',
      component: () => <CRSTrendChart draws={draws} showPrediction={true} height={500} />
    },
    {
      id: 'distribution',
      label: 'Distribution',
      icon: '🔥',
      description: 'Score distribution heat map',
      component: () => <DistributionHeatMap draws={draws} />
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: '📋',
      description: 'Performance by draw category',
      component: () => <CategoryPerformanceDashboard draws={draws} />
    },
    {
      id: 'calculator',
      label: 'Calculator',
      icon: '🧮',
      description: 'Personalized probability calculator',
      component: () => <ProbabilityCalculator draws={draws} />
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: '📅',
      description: 'Future draw predictions',
      component: () => <TimelinePredictor draws={draws} />
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: '⚡',
      description: 'Advanced analytics and alerts',
      component: () => <AdvancedAnalytics draws={draws} userCRS={userCRS} />
    }
  ];

  useEffect(() => {
    // Load user preferences from localStorage
    const savedCRS = localStorage.getItem('express-entry-user-crs');
    if (savedCRS) {
      setUserCRS(parseInt(savedCRS));
    }

    const savedTab = localStorage.getItem('express-entry-analytics-tab') as TabId;
    if (savedTab && tabs.some(tab => tab.id === savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    // Save current tab to localStorage
    localStorage.setItem('express-entry-analytics-tab', activeTab);
  }, [activeTab]);

  const handleCRSChange = (crs: string) => {
    const crsNumber = parseInt(crs) || undefined;
    setUserCRS(crsNumber);
    
    if (crsNumber) {
      localStorage.setItem('express-entry-user-crs', crs);
    } else {
      localStorage.removeItem('express-entry-user-crs');
    }
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => null);

  const getQuickStats = () => {
    if (!draws || draws.length === 0) return null;

    const latestDraw = draws[0];
    const avgScore = Math.round(draws.reduce((sum, draw) => sum + draw.drawCRS, 0) / draws.length);
    const lowestScore = Math.min(...draws.map(d => d.drawCRS));
    const totalInvitations = draws.reduce((sum, draw) => sum + draw.drawSize, 0);

    return { latestDraw, avgScore, lowestScore, totalInvitations };
  };

  const quickStats = getQuickStats();

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header with Quick Stats */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Express Entry Analytics</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Advanced insights and predictions for Express Entry draws</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap self-start"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{quickStats.latestDraw.drawCRS}</div>
              <div className="text-xs sm:text-sm text-gray-600">Latest CRS</div>
              <div className="text-xs text-gray-500">
                Draw #{quickStats.latestDraw.drawNumber}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{quickStats.avgScore}</div>
              <div className="text-xs sm:text-sm text-gray-600">Average CRS</div>
              <div className="text-xs text-gray-500">All time</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{quickStats.lowestScore}</div>
              <div className="text-xs sm:text-sm text-gray-600">Lowest CRS</div>
              <div className="text-xs text-gray-500">Historical minimum</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {Math.round(quickStats.totalInvitations / 1000)}k
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Total Invitations</div>
              <div className="text-xs text-gray-500">All draws</div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-3">Analytics Settings</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Your CRS Score (Optional)
                </label>
                <input
                  type="number"
                  value={userCRS || ''}
                  onChange={(e) => handleCRSChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your CRS score"
                  min="0"
                  max="1200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enables personalized alerts and probability calculations
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Data Source
                </label>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <div>Source: IRCC Official JSON</div>
                  <div>Total Draws: {draws.length}</div>
                  <div>Last Updated: {quickStats ? new Date(quickStats.latestDraw.drawDate).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Analytics tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

          <ActiveComponent />
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Understanding the Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">📈 Trend Analysis</h4>
            <p>Track CRS score patterns over time with moving averages and predictions based on historical data.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">🔥 Heat Maps</h4>
            <p>Visualize score distributions across different months to identify seasonal patterns and opportunities.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">📋 Category Analysis</h4>
            <p>Compare performance across different Express Entry programs (CEC, FSW, PNP, etc.).</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">🧮 Probability Calculator</h4>
            <p>Get personalized probability estimates and recommendations based on your CRS score.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">📅 Timeline Predictor</h4>
            <p>Forecast future draw dates and estimated CRS scores using advanced algorithms.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">⚡ Advanced Features</h4>
            <p>Real-time alerts, outlier detection, and correlation analysis for power users.</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">Important Disclaimer</h3>
        <p className="text-xs sm:text-sm text-yellow-700">
          These analytics are based on historical data and statistical models. While they provide valuable
          insights, they cannot guarantee future outcomes. Express Entry draws are subject to policy changes,
          quota adjustments, and other factors not captured in historical data. Use these tools as guidance
          only and always refer to official IRCC sources for the most current information.
        </p>
      </div>
    </div>
  );
};