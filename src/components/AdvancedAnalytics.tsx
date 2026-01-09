/**
 * Advanced Analytics Features
 * Real-time alerts, notifications, and advanced statistical analysis
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import {
  detectOutliers,
  detectSeasonalPatterns,
  runMonteCarloSimulation,
  type OutlierData
} from "@/lib/analytics";

interface AdvancedAnalyticsProps {
  draws: ParsedExpressEntryDraw[];
  userCRS?: number;
  className?: string;
}

interface Alert {
  id: string;
  type: 'favorable' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
}

interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  description: string;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  draws,
  userCRS,
  className = ""
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [outliers, setOutliers] = useState<OutlierData[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(20); // CRS points threshold
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const performAdvancedAnalysis = useCallback(() => {
    // Detect outliers
    const detectedOutliers = detectOutliers(draws);
    setOutliers(detectedOutliers);

    // Detect seasonal patterns
    const patterns = detectSeasonalPatterns(draws);
    setSeasonalPatterns(patterns);

    // Calculate correlations
    const correlationResults = calculateCorrelations(draws);
    setCorrelations(correlationResults);

    // Generate alerts
    const generatedAlerts = generateRealTimeAlerts(draws, detectedOutliers, patterns);
    setAlerts(generatedAlerts);
  }, [draws, userCRS, alertThreshold]);

  useEffect(() => {
    if (draws && draws.length > 0) {
      performAdvancedAnalysis();
    }
  }, [draws, performAdvancedAnalysis]);

  const calculateCorrelations = (draws: ParsedExpressEntryDraw[]): CorrelationData[] => {
    const correlations: CorrelationData[] = [];

    // Extract data for correlation analysis
    const scores = draws.map(d => d.drawCRS).filter(Boolean);
    const sizes = draws.map(d => d.drawSize).filter(Boolean);
    const dates = draws.map(d => new Date(d.drawDate).getTime());

    // Calculate correlation between CRS scores and draw sizes
    const sizeScoreCorr = calculatePearsonCorrelation(scores, sizes.slice(0, scores.length));
    if (sizeScoreCorr !== null) {
      correlations.push({
        metric1: "CRS Score",
        metric2: "Draw Size",
        correlation: sizeScoreCorr,
        significance: Math.abs(sizeScoreCorr) > 0.5 ? 0.95 : 0.7,
        description: sizeScoreCorr > 0.3 
          ? "Higher CRS scores tend to correlate with larger draws"
          : sizeScoreCorr < -0.3
          ? "Higher CRS scores tend to correlate with smaller draws"
          : "No strong correlation between CRS scores and draw sizes"
      });
    }

    // Calculate temporal trends (time vs scores)
    const timeScoreCorr = calculatePearsonCorrelation(
      dates.slice(0, scores.length),
      scores
    );
    if (timeScoreCorr !== null) {
      correlations.push({
        metric1: "Time",
        metric2: "CRS Score",
        correlation: timeScoreCorr,
        significance: Math.abs(timeScoreCorr) > 0.4 ? 0.9 : 0.6,
        description: timeScoreCorr > 0.3
          ? "CRS scores are generally increasing over time"
          : timeScoreCorr < -0.3
          ? "CRS scores are generally decreasing over time"
          : "No clear temporal trend in CRS scores"
      });
    }

    // Month vs CRS correlation (seasonal effect)
    const monthlyScores = draws.reduce((acc, draw) => {
      const month = new Date(draw.drawDate).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(draw.drawCRS);
      return acc;
    }, {} as { [month: number]: number[] });

    const monthAvgs = Object.keys(monthlyScores).map(month => {
      const scores = monthlyScores[parseInt(month)];
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    if (monthAvgs.length >= 6) {
      const monthNumbers = Object.keys(monthlyScores).map(m => parseInt(m));
      const seasonalCorr = calculatePearsonCorrelation(monthNumbers, monthAvgs);
      
      if (seasonalCorr !== null) {
        correlations.push({
          metric1: "Season (Month)",
          metric2: "CRS Score",
          correlation: seasonalCorr,
          significance: Math.abs(seasonalCorr) > 0.5 ? 0.85 : 0.6,
          description: Math.abs(seasonalCorr) > 0.3
            ? `Clear seasonal pattern detected in CRS scores`
            : "No significant seasonal correlation in CRS scores"
        });
      }
    }

    return correlations;
  };

  const calculatePearsonCorrelation = (x: number[], y: number[]): number | null => {
    if (x.length !== y.length || x.length < 3) return null;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const generateRealTimeAlerts = (
    draws: ParsedExpressEntryDraw[],
    outliers: OutlierData[],
    patterns: any
  ): Alert[] => {
    const alerts: Alert[] = [];
    const now = new Date();

    // Check recent draws for favorable conditions
    const recentDraws = draws.slice(-5);
    if (userCRS) {
      const favorableDraws = recentDraws.filter(d => d.drawCRS <= userCRS + alertThreshold);
      
      if (favorableDraws.length >= 2) {
        alerts.push({
          id: `favorable-${Date.now()}`,
          type: 'favorable',
          title: 'Favorable Conditions Detected',
          message: `${favorableDraws.length} recent draws within ${alertThreshold} points of your CRS score (${userCRS})`,
          timestamp: now,
          severity: 'high',
          actionable: true
        });
      }
    }

    // Outlier alerts
    const recentOutliers = outliers.filter(o => o.severity === 'high').slice(0, 3);
    recentOutliers.forEach((outlier, index) => {
      alerts.push({
        id: `outlier-${outlier.drawNumber}-${index}`,
        type: 'warning',
        title: 'Unusual Draw Activity',
        message: `Draw #${outlier.drawNumber}: ${outlier.description}`,
        timestamp: now,
        severity: 'medium',
        actionable: false
      });
    });

    // Seasonal pattern alerts
    if (patterns?.insights?.length > 0) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const monthlyInsight = patterns.insights.find((insight: string) => 
        insight.toLowerCase().includes(currentMonth.toLowerCase())
      );
      
      if (monthlyInsight) {
        alerts.push({
          id: `seasonal-${currentMonth}`,
          type: 'info',
          title: 'Seasonal Pattern Alert',
          message: monthlyInsight,
          timestamp: now,
          severity: 'low',
          actionable: true
        });
      }
    }

    // Trend alerts
    const last10Draws = draws.slice(-10);
    if (last10Draws.length >= 10) {
      const recentScores = last10Draws.map(d => d.drawCRS);
      const trend = (recentScores[recentScores.length - 1] - recentScores[0]) / recentScores.length;
      
      if (Math.abs(trend) > 3) {
        alerts.push({
          id: `trend-${Date.now()}`,
          type: trend < 0 ? 'favorable' : 'warning',
          title: 'Score Trend Alert',
          message: `CRS scores are ${trend < 0 ? 'decreasing' : 'increasing'} by ~${Math.abs(trend).toFixed(1)} points per draw`,
          timestamp: now,
          severity: Math.abs(trend) > 5 ? 'high' : 'medium',
          actionable: true
        });
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getAlertIcon = (type: Alert['type']): string => {
    switch (type) {
      case 'favorable': return "🟢";
      case 'warning': return "🟡";
      case 'info': return "🔵";
      default: return "ℹ️";
    }
  };

  const getAlertColor = (type: Alert['type']): string => {
    switch (type) {
      case 'favorable': return "bg-green-50 border-green-200 text-green-800";
      case 'warning': return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case 'info': return "bg-blue-50 border-blue-200 text-blue-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getSeverityBadge = (severity: Alert['severity']): string => {
    switch (severity) {
      case 'high': return "bg-red-100 text-red-800";
      case 'medium': return "bg-yellow-100 text-yellow-800";
      case 'low': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCorrelationStrength = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return "Strong";
    if (abs > 0.4) return "Moderate";
    if (abs > 0.2) return "Weak";
    return "Very Weak";
  };

  const getCorrelationColor = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return "text-red-600";
    if (abs > 0.4) return "text-orange-600";
    if (abs > 0.2) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Alerts */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Real-time Alerts</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Enable Alerts</span>
            </label>
            {userCRS && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Threshold:</span>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 20)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">pts</span>
              </div>
            )}
          </div>
        </div>

        {alertsEnabled && (
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getAlertColor(alert.type)}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm opacity-80">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs opacity-60">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No alerts at this time</p>
                <p className="text-sm">System is monitoring for favorable conditions</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Correlation Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Correlation Analysis</h3>
        <div className="space-y-4">
          {correlations.map((corr, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  {corr.metric1} vs {corr.metric2}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${getCorrelationColor(corr.correlation)}`}>
                    {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({getCorrelationStrength(corr.correlation)})
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{corr.description}</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      Math.abs(corr.correlation) > 0.5 ? 'bg-red-500' :
                      Math.abs(corr.correlation) > 0.3 ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outlier Detection */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Outlier Detection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outliers.slice(0, 6).map((outlier) => (
            <div key={`${outlier.drawNumber}-${outlier.type}`} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">Draw #{outlier.drawNumber}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  outlier.severity === 'high' ? 'bg-red-100 text-red-800' :
                  outlier.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {outlier.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{outlier.description}</p>
              <div className="text-xs text-gray-500">
                <div>Value: {outlier.value}</div>
                <div>Expected: ~{outlier.expectedValue.toFixed(0)}</div>
                <div>Deviation: {outlier.deviation.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Alert Details */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Alert Details</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className={`p-4 rounded-lg mb-4 ${getAlertColor(selectedAlert.type)}`}>
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getAlertIcon(selectedAlert.type)}</span>
                <div>
                  <h4 className="font-medium">{selectedAlert.title}</h4>
                  <p className="text-sm opacity-80 mt-1">{selectedAlert.message}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <span className={`px-2 py-1 rounded-full ${getSeverityBadge(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timestamp:</span>
                <span className="text-gray-800">
                  {selectedAlert.timestamp.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actionable:</span>
                <span className="text-gray-800">
                  {selectedAlert.actionable ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {selectedAlert.actionable && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Suggested Action:</strong> Monitor upcoming draws closely and 
                  {selectedAlert.type === 'favorable' 
                    ? " consider submitting your profile if you haven't already."
                    : " adjust your strategy based on the trend."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};