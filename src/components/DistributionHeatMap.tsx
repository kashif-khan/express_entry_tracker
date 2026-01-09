/**
 * Distribution Heat Map Component
 * Visual representation of CRS score distributions with animated heat map
 */

"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";

interface DistributionHeatMapProps {
  draws: ParsedExpressEntryDraw[];
  className?: string;
}

interface HeatMapCell {
  scoreRange: string;
  month: string;
  value: number;
  count: number;
  percentage: number;
}

export const DistributionHeatMap: React.FC<DistributionHeatMapProps> = ({
  draws,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const scoreRanges = [
    { label: "300-349", min: 300, max: 349 },
    { label: "350-399", min: 350, max: 399 },
    { label: "400-449", min: 400, max: 449 },
    { label: "450-499", min: 450, max: 499 },
    { label: "500-549", min: 500, max: 549 },
    { label: "550-600", min: 550, max: 600 }
  ];

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    if (draws && draws.length > 0) {
      generateHeatMapData();
    }
  }, [draws]);

  useEffect(() => {
    if (heatMapData.length > 0 && !isAnimating) {
      animateHeatMap();
    }
  }, [heatMapData]);

  const generateHeatMapData = () => {
    const data: HeatMapCell[] = [];
    const drawsByMonthScore = new Map<string, number>();
    const drawsByMonth = new Map<string, number>();

    // Group draws by month and score range
    draws.forEach(draw => {
      const drawDate = new Date(draw.drawDate);
      const month = months[drawDate.getMonth()];
      const score = draw.drawCRS;

      // Track total draws per month
      drawsByMonth.set(month, (drawsByMonth.get(month) || 0) + 1);

      // Track draws by score range for each month
      scoreRanges.forEach(range => {
        if (score >= range.min && score <= range.max) {
          const key = `${month}-${range.label}`;
          drawsByMonthScore.set(key, (drawsByMonthScore.get(key) || 0) + 1);
        }
      });
    });

    // Generate heat map cells
    months.forEach(month => {
      scoreRanges.forEach(range => {
        const key = `${month}-${range.label}`;
        const count = drawsByMonthScore.get(key) || 0;
        const monthTotal = drawsByMonth.get(month) || 0;
        const percentage = monthTotal > 0 ? (count / monthTotal) * 100 : 0;
        
        data.push({
          scoreRange: range.label,
          month,
          value: Math.min(percentage / 20, 1), // Normalize for color intensity (0-1)
          count: count,
          percentage: Math.round(percentage * 10) / 10
        });
      });
    });

    setHeatMapData(data);
  };

  const animateHeatMap = () => {
    if (!containerRef.current || isAnimating) return;

    setIsAnimating(true);

    const cells = containerRef.current.querySelectorAll('[data-heat-cell]');
    
    // Animate cells in waves
    cells.forEach((cell, index) => {
      const row = Math.floor(index / months.length);
      const col = index % months.length;
      
      anime({
        targets: cell,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        delay: (row * 50) + (col * 30),
        easing: 'easeOutElastic(1, .6)',
        complete: () => {
          if (index === cells.length - 1) {
            setIsAnimating(false);
          }
        }
      });
    });
  };

  const getColorIntensity = (value: number): string => {
    if (value === 0) return "bg-gray-100";
    
    const intensityLevels = [
      "bg-blue-100",
      "bg-blue-200", 
      "bg-blue-300",
      "bg-blue-400",
      "bg-blue-500",
      "bg-blue-600"
    ];
    
    const level = Math.min(Math.floor(value * intensityLevels.length), intensityLevels.length - 1);
    return intensityLevels[level];
  };

  const handleCellClick = (cell: HeatMapCell) => {
    setSelectedCell(cell);
    
    // Animate selection
    const cellElement = containerRef.current?.querySelector(
      `[data-month="${cell.month}"][data-range="${cell.scoreRange}"]`
    );
    
    if (cellElement) {
      anime({
        targets: cellElement,
        scale: [1, 1.1, 1],
        duration: 300,
        easing: 'easeOutQuart'
      });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Score Distribution Heat Map</h3>
        <div className="text-sm text-gray-600">
          Darker colors indicate higher frequency
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with months - Fixed alignment */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "120px repeat(12, 48px)" }}>
            <div className="text-sm font-medium text-gray-600 text-right pr-2 flex items-center">
              Score Range
            </div>
            {months.map(month => (
              <div key={month} className="text-sm font-medium text-gray-600 text-center">
                {month}
              </div>
            ))}
          </div>

          {/* Heat map grid - Fixed alignment */}
          <div ref={containerRef} className="space-y-1">
            {scoreRanges.map(range => (
              <div key={range.label} className="grid gap-1" style={{ gridTemplateColumns: "120px repeat(12, 48px)" }}>
                <div className="text-sm font-medium text-gray-600 text-right pr-2 flex items-center justify-end h-12">
                  {range.label}
                </div>
                {months.map(month => {
                  const cellData = heatMapData.find(
                    cell => cell.month === month && cell.scoreRange === range.label
                  );
                  
                  return (
                    <div
                      key={`${month}-${range.label}`}
                      data-heat-cell
                      data-month={month}
                      data-range={range.label}
                      className={`
                        h-12 rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md
                        flex items-center justify-center text-xs font-medium
                        ${cellData ? getColorIntensity(cellData.value) : "bg-gray-100"}
                        ${cellData && cellData.value > 0.3 ? "text-white" : "text-gray-700"}
                      `}
                      onClick={() => cellData && handleCellClick(cellData)}
                      title={cellData ? 
                        `${month} ${range.label}: ${cellData.count} draws (${cellData.percentage}%)` 
                        : `${month} ${range.label}: No draws`
                      }
                      style={{ opacity: 0, transform: "scale(0)" }}
                    >
                      {cellData && cellData.count > 0 ? cellData.count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Monthly totals for verification */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Draw Totals:</h4>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2 text-xs">
              {months.map(month => {
                const monthTotal = heatMapData
                  .filter(cell => cell.month === month)
                  .reduce((sum, cell) => sum + cell.count, 0);
                return (
                  <div key={month} className="text-center">
                    <div className="font-medium text-gray-600">{month}</div>
                    <div className="font-bold text-blue-600">{monthTotal}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-600">Frequency:</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Low</span>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
              </div>
              <span className="text-xs text-gray-500">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected cell details */}
      {selectedCell && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-medium text-gray-800 mb-2">
            {selectedCell.month} - {selectedCell.scoreRange}
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Draws:</span>
              <div className="font-semibold text-gray-800">{selectedCell.count}</div>
            </div>
            <div>
              <span className="text-gray-600">Percentage:</span>
              <div className="font-semibold text-gray-800">{selectedCell.percentage}%</div>
            </div>
            <div>
              <span className="text-gray-600">Intensity:</span>
              <div className="font-semibold text-gray-800">
                {Math.round(selectedCell.value * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-blue-600">
            {heatMapData.length > 0 ? Math.max(...heatMapData.map(cell => cell.count)) : 0}
          </div>
          <div className="text-sm text-gray-600">Peak Month Activity</div>
        </div>
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-green-600">
            {heatMapData.length > 0 ? (
              scoreRanges.find(range => {
                const maxCount = Math.max(...heatMapData
                  .filter(cell => cell.scoreRange === range.label)
                  .map(cell => cell.count));
                return heatMapData.some(cell => 
                  cell.scoreRange === range.label && cell.count === maxCount
                );
              })?.label || "N/A"
            ) : "N/A"}
          </div>
          <div className="text-sm text-gray-600">Most Active Range</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {heatMapData.filter(cell => cell.count > 0).length}
          </div>
          <div className="text-sm text-gray-600">Active Cells</div>
        </div>
        <div className="bg-purple-50 p-3 rounded text-center">
          <div className="text-2xl font-bold text-purple-600">
            {heatMapData.length > 0 ? (
              Math.round(
                heatMapData.reduce((sum, cell) => sum + cell.percentage, 0) / 
                heatMapData.filter(cell => cell.count > 0).length * 10
              ) / 10 || 0
            ) : 0}%
          </div>
          <div className="text-sm text-gray-600">Average Distribution</div>
        </div>
      </div>
    </div>
  );
};