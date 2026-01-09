/**
 * Interactive CRS Trend Chart Component
 * Displays line chart showing CRS score changes over time with anime.js animations
 */

"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";
import { calculateCRSTrends, type CRSAnalytics } from "@/lib/analytics";

interface CRSTrendChartProps {
  draws: ParsedExpressEntryDraw[];
  height?: number;
  showPrediction?: boolean;
  className?: string;
}

interface ChartDataPoint {
  x: number;
  y: number;
  date: string;
  score: number;
  drawNumber: number;
}

export const CRSTrendChart: React.FC<CRSTrendChartProps> = ({
  draws,
  height = 400,
  showPrediction = true,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [analytics, setAnalytics] = useState<CRSAnalytics | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  useEffect(() => {
    if (draws && draws.length > 0) {
      const analyticsData = calculateCRSTrends(draws);
      setAnalytics(analyticsData);
    }
  }, [draws]);

  useEffect(() => {
    if (!analytics || !svgRef.current || draws.length === 0) return;

    animateChart();
  }, [analytics]);

  const animateChart = () => {
    if (!svgRef.current || isAnimating) return;

    setIsAnimating(true);
    
    // Clear previous chart
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = svg.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Prepare data
    const sortedDraws = [...draws].sort((a, b) => 
      new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()
    );

    const dataPoints: ChartDataPoint[] = sortedDraws.map((draw, index) => ({
      x: (index / (sortedDraws.length - 1)) * width,
      y: chartHeight - ((draw.drawCRS - 300) / (600 - 300)) * chartHeight,
      date: new Date(draw.drawDate).toLocaleDateString(),
      score: draw.drawCRS,
      drawNumber: draw.drawNumber
    }));

    // Create SVG groups
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chartGroup.setAttribute("transform", `translate(${margin.left},${margin.top})`);
    svg.appendChild(chartGroup);

    // Draw axes
    drawAxes(chartGroup, width, chartHeight);

    // Draw trend line
    drawTrendLine(chartGroup, dataPoints);

    // Draw data points
    drawDataPoints(chartGroup, dataPoints);

    // Draw moving average if available
    if (analytics && analytics.trends.movingAverage.length > 0) {
      drawMovingAverage(chartGroup, analytics.trends.movingAverage, width, chartHeight);
    }

    // Draw prediction if enabled
    if (showPrediction && analytics && analytics.trends.prediction.nextDraw > 0) {
      drawPrediction(chartGroup, dataPoints, analytics.trends.prediction, width, chartHeight);
    }

    // Add percentile bands
    if (analytics && analytics.trends.percentileRanges) {
      drawPercentileBands(chartGroup, analytics.trends.percentileRanges, width, chartHeight);
    }

    setIsAnimating(false);
  };

  const drawAxes = (group: SVGGElement, width: number, chartHeight: number) => {
    // Y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", "0");
    yAxis.setAttribute("y1", "0");
    yAxis.setAttribute("x2", "0");
    yAxis.setAttribute("y2", chartHeight.toString());
    yAxis.setAttribute("stroke", "#374151");
    yAxis.setAttribute("stroke-width", "1");
    group.appendChild(yAxis);

    // X-axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", "0");
    xAxis.setAttribute("y1", chartHeight.toString());
    xAxis.setAttribute("x2", width.toString());
    xAxis.setAttribute("y2", chartHeight.toString());
    xAxis.setAttribute("stroke", "#374151");
    xAxis.setAttribute("stroke-width", "1");
    group.appendChild(xAxis);

    // Y-axis labels
    for (let score = 300; score <= 600; score += 50) {
      const y = chartHeight - ((score - 300) / (600 - 300)) * chartHeight;
      
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", "-5");
      tick.setAttribute("y1", y.toString());
      tick.setAttribute("x2", "0");
      tick.setAttribute("y2", y.toString());
      tick.setAttribute("stroke", "#6B7280");
      group.appendChild(tick);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "-10");
      label.setAttribute("y", (y + 4).toString());
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#6B7280");
      label.setAttribute("font-size", "12");
      label.textContent = score.toString();
      group.appendChild(label);
    }
  };

  const drawTrendLine = (group: SVGGElement, dataPoints: ChartDataPoint[]) => {
    if (dataPoints.length < 2) return;

    const pathData = dataPoints.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    const trendLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trendLine.setAttribute("d", pathData);
    trendLine.setAttribute("fill", "none");
    trendLine.setAttribute("stroke", "#3B82F6");
    trendLine.setAttribute("stroke-width", "2");
    trendLine.setAttribute("stroke-dasharray", "0");
    group.appendChild(trendLine);

    // Animate line drawing
    const pathLength = trendLine.getTotalLength();
    trendLine.setAttribute("stroke-dasharray", pathLength.toString());
    trendLine.setAttribute("stroke-dashoffset", pathLength.toString());

    anime({
      targets: trendLine,
      strokeDashoffset: [pathLength, 0],
      duration: 2000,
      easing: 'easeInOutQuart'
    });
  };

  const drawDataPoints = (group: SVGGElement, dataPoints: ChartDataPoint[]) => {
    dataPoints.forEach((point, index) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", point.x.toString());
      circle.setAttribute("cy", point.y.toString());
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "#3B82F6");
      circle.setAttribute("stroke", "#FFFFFF");
      circle.setAttribute("stroke-width", "2");
      circle.setAttribute("opacity", "0");
      circle.style.cursor = "pointer";
      
      // Add hover and click handlers
      circle.addEventListener("mouseenter", () => setSelectedPoint(point));
      circle.addEventListener("mouseleave", () => setSelectedPoint(null));
      
      group.appendChild(circle);

      // Animate point appearance
      anime({
        targets: circle,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 500,
        delay: index * 50,
        easing: 'easeOutElastic(1, .8)'
      });
    });
  };

  const drawMovingAverage = (group: SVGGElement, movingAverage: number[], width: number, chartHeight: number) => {
    if (movingAverage.length < 2) return;

    const avgPoints = movingAverage.map((avg, index) => ({
      x: (index / (movingAverage.length - 1)) * width,
      y: chartHeight - ((avg - 300) / (600 - 300)) * chartHeight
    }));

    const pathData = avgPoints.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    const avgLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    avgLine.setAttribute("d", pathData);
    avgLine.setAttribute("fill", "none");
    avgLine.setAttribute("stroke", "#F59E0B");
    avgLine.setAttribute("stroke-width", "2");
    avgLine.setAttribute("stroke-dasharray", "5,5");
    avgLine.setAttribute("opacity", "0.8");
    group.appendChild(avgLine);

    // Animate moving average line
    anime({
      targets: avgLine,
      opacity: [0, 0.8],
      duration: 1000,
      delay: 1000,
      easing: 'easeInOutQuart'
    });
  };

  const drawPrediction = (
    group: SVGGElement,
    dataPoints: ChartDataPoint[],
    prediction: { nextDraw: number; confidence: number },
    width: number,
    chartHeight: number
  ) => {
    if (dataPoints.length === 0) return;

    const lastPoint = dataPoints[dataPoints.length - 1];
    const predictionX = lastPoint.x + 50;
    const predictionY = chartHeight - ((prediction.nextDraw - 300) / (600 - 300)) * chartHeight;

    // Prediction point
    const predictionCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    predictionCircle.setAttribute("cx", predictionX.toString());
    predictionCircle.setAttribute("cy", predictionY.toString());
    predictionCircle.setAttribute("r", "6");
    predictionCircle.setAttribute("fill", "#EF4444");
    predictionCircle.setAttribute("stroke", "#FFFFFF");
    predictionCircle.setAttribute("stroke-width", "2");
    predictionCircle.setAttribute("opacity", "0");
    group.appendChild(predictionCircle);

    // Prediction line
    const predictionLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    predictionLine.setAttribute("x1", lastPoint.x.toString());
    predictionLine.setAttribute("y1", lastPoint.y.toString());
    predictionLine.setAttribute("x2", predictionX.toString());
    predictionLine.setAttribute("y2", predictionY.toString());
    predictionLine.setAttribute("stroke", "#EF4444");
    predictionLine.setAttribute("stroke-width", "2");
    predictionLine.setAttribute("stroke-dasharray", "3,3");
    predictionLine.setAttribute("opacity", "0");
    group.appendChild(predictionLine);

    // Animate prediction elements
    anime({
      targets: [predictionCircle, predictionLine],
      opacity: [0, 0.8],
      duration: 800,
      delay: 2000,
      easing: 'easeOutQuart'
    });

    // Add confidence indicator
    const confidenceText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    confidenceText.setAttribute("x", (predictionX + 10).toString());
    confidenceText.setAttribute("y", (predictionY - 10).toString());
    confidenceText.setAttribute("fill", "#EF4444");
    confidenceText.setAttribute("font-size", "11");
    confidenceText.setAttribute("opacity", "0");
    confidenceText.textContent = `${Math.round(prediction.confidence * 100)}% confidence`;
    group.appendChild(confidenceText);

    anime({
      targets: confidenceText,
      opacity: [0, 1],
      duration: 500,
      delay: 2500,
      easing: 'easeOutQuart'
    });
  };

  const drawPercentileBands = (
    group: SVGGElement,
    percentiles: { p25: number; p50: number; p75: number; p90: number },
    width: number,
    chartHeight: number
  ) => {
    const bands = [
      { value: percentiles.p90, color: "#FEE2E2", opacity: 0.3 },
      { value: percentiles.p75, color: "#FEF3C7", opacity: 0.4 },
      { value: percentiles.p50, color: "#D1FAE5", opacity: 0.5 },
      { value: percentiles.p25, color: "#DBEAFE", opacity: 0.4 }
    ];

    bands.forEach((band, index) => {
      const y = chartHeight - ((band.value - 300) / (600 - 300)) * chartHeight;
      
      const bandRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bandRect.setAttribute("x", "0");
      bandRect.setAttribute("y", y.toString());
      bandRect.setAttribute("width", width.toString());
      bandRect.setAttribute("height", (chartHeight - y).toString());
      bandRect.setAttribute("fill", band.color);
      bandRect.setAttribute("opacity", "0");
      group.insertBefore(bandRect, group.firstChild);

      anime({
        targets: bandRect,
        opacity: [0, band.opacity],
        duration: 1000,
        delay: 500 + index * 100,
        easing: 'easeOutQuart'
      });
    });
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">CRS Score Trends</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Actual Scores</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-yellow-500 border-dashed border-t-2"></div>
            <span>Moving Average</span>
          </div>
          {showPrediction && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-red-500 border-dashed border-t-2"></div>
              <span>Prediction</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          className="border border-gray-200 rounded"
          style={{ minWidth: "600px" }}
        />

        {selectedPoint && (
          <div
            className="absolute bg-gray-800 text-white px-3 py-2 rounded shadow-lg pointer-events-none z-10 text-sm"
            style={{
              left: selectedPoint.x + 60,
              top: selectedPoint.y + 20,
              transform: "translate(-50%, -100%)"
            }}
          >
            <div>Draw #{selectedPoint.drawNumber}</div>
            <div>Score: {selectedPoint.score}</div>
            <div>Date: {selectedPoint.date}</div>
          </div>
        )}
      </div>

      {analytics && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.trends.percentileRanges.p50}
            </div>
            <div className="text-sm text-gray-600">Median Score</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">
              {analytics.trends.lowestInLast12Months}
            </div>
            <div className="text-sm text-gray-600">12-Month Low</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(analytics.trends.volatility)}
            </div>
            <div className="text-sm text-gray-600">Volatility</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-2xl font-bold text-red-600">
              {analytics.trends.prediction.nextDraw}
            </div>
            <div className="text-sm text-gray-600">Predicted Next</div>
          </div>
        </div>
      )}
    </div>
  );
};