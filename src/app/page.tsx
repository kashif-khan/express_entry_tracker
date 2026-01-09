"use client";

import { useDraws } from "@/hooks/useDraws";
import { DataTable } from "@/components/DataTable";
import { StatisticsGrid } from "@/components/AnimatedStats";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import {
  TimelineFilter,
  type TimelineFilterState,
} from "@/components/TimelineFilter";
import { calculateDrawStatistics } from "@/lib/data-service";
import { useState, useEffect, useRef, useMemo } from "react";

export default function HomePage() {
  const {
    draws,
    latestDraw,
    statistics,
    isLoading,
    error,
    lastUpdated,
    refetch,
    clearCache,
  } = useDraws();

  const [isClearing, setIsClearing] = useState(false);
  const [showDataActions, setShowDataActions] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilterState>({
    start: null,
    end: null,
  });
  
  // Detect mobile and set timeline filter collapsed state
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // Collapsed by default on mobile (< md breakpoint)
    }
    return false; // Default to expanded on server
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDataActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle window resize to auto-collapse/expand timeline filter based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // Only auto-collapse on mobile, don't auto-expand on desktop to preserve user choice
      if (isMobile && !isTimelineCollapsed) {
        setIsTimelineCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTimelineCollapsed]);

  // Filter draws based on timeline
  const filteredDraws = useMemo(() => {
    if (!timelineFilter.start && !timelineFilter.end) {
      return draws; // No filter applied
    }

    return draws.filter((draw) => {
      if (timelineFilter.start && draw.drawDate < timelineFilter.start) {
        return false;
      }
      if (timelineFilter.end && draw.drawDate > timelineFilter.end) {
        return false;
      }
      return true;
    });
  }, [draws, timelineFilter]);

  // Recalculate statistics for filtered data
  const filteredStatistics = useMemo(() => {
    return calculateDrawStatistics(filteredDraws);
  }, [filteredDraws]);

  // Update latest draw for filtered data
  const filteredLatestDraw = useMemo(() => {
    return filteredDraws.length > 0 ? filteredDraws[0] : null;
  }, [filteredDraws]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleClearCache = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all cached data? This will remove all stored draws and fetch fresh data from IRCC.",
      )
    ) {
      setIsClearing(true);
      try {
        await clearCache();
      } finally {
        setIsClearing(false);
        setShowDataActions(false);
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-5xl md:text-6xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">
            Unable to Load Data
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">{error.message}</p>
          <div className="space-y-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
            >
              {isLoading ? "Retrying..." : "Try Again"}
            </button>
            <button
              onClick={handleClearCache}
              disabled={isLoading || isClearing}
              className="w-full bg-gray-600 text-white px-4 py-2.5 sm:py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm min-h-[44px] sm:min-h-0"
            >
              {isClearing ? "Clearing..." : "Clear Cache & Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Express Entry Tracker
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600 hidden sm:block">
                Track Canadian immigration Express Entry draws and statistics
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {lastUpdated && (
                <span className="text-xs sm:text-sm text-gray-500 hidden md:block">
                  Last updated: {lastUpdated.toLocaleString()}
                </span>
              )}
              <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                <button
                  onClick={() => setShowDataActions(!showDataActions)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  disabled={isLoading || isClearing}
                >
                  <span>
                    {isLoading
                      ? "Updating..."
                      : isClearing
                        ? "Clearing..."
                        : "Data Actions"}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showDataActions ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDataActions && (
                  <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading || isClearing}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <div>
                        <div className="font-medium">Refresh Data</div>
                        <div className="text-xs text-gray-500">
                          Fetch latest draws from IRCC
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={handleClearCache}
                      disabled={isLoading || isClearing}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <div>
                        <div className="font-medium">Clear Cache</div>
                        <div className="text-xs text-gray-500">
                          Remove all cached data & refresh
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <div className="px-4 py-2 text-xs text-gray-500">
                      <div>Cache: {draws.length} draws stored</div>
                      <div>Timeline: {filteredDraws.length} draws shown</div>
                      <div>
                        Next auto-update in ~
                        {Math.max(
                          0,
                          Math.ceil(
                            (3600000 -
                              (Date.now() - (lastUpdated?.getTime() || 0))) /
                              60000,
                          ),
                        )}{" "}
                        min
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
        data-testid="main-content"
      >
        {isLoading && draws.length === 0 ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading Express Entry data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Latest Draw Highlight - Mobile First */}
            {filteredLatestDraw && (
              <section className="mb-8 md:order-2" data-testid="latest-draw-section">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold">Latest Draw</h2>
                    <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      Draw #{filteredLatestDraw.drawNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">Date</p>
                      <p className="text-base sm:text-xl font-semibold">
                        {filteredLatestDraw.drawDateFull ||
                          filteredLatestDraw.drawDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">Category</p>
                      <p className="text-sm sm:text-lg">{filteredLatestDraw.drawName}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">Invitations</p>
                      <p className="text-base sm:text-xl font-semibold">
                        {filteredLatestDraw.drawSize.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">Minimum CRS</p>
                      <p className="text-base sm:text-xl font-semibold">
                        {filteredLatestDraw.drawCRS}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Timeline Filter - Desktop First */}
            {draws.length > 0 && (
              <section className="mb-8 md:order-1" data-testid="timeline-filter-section">
                <TimelineFilter
                  dateRange={timelineFilter}
                  onDateRangeChange={setTimelineFilter}
                  draws={draws}
                  totalCount={draws.length}
                  filteredCount={filteredDraws.length}
                  isCollapsed={isTimelineCollapsed}
                  onToggleCollapsed={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                />
              </section>
            )}

            {/* Statistics Dashboard */}
            {filteredStatistics && (
              <section className="mb-8" data-testid="stats-section">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Statistics
                  {(timelineFilter.start || timelineFilter.end) && (
                    <span className="text-sm sm:text-base md:text-lg font-normal text-gray-600 ml-2">
                      (Filtered)
                    </span>
                  )}
                </h2>
                <StatisticsGrid
                  statistics={filteredStatistics}
                  key={`${timelineFilter.start?.getTime() || "no-start"}-${timelineFilter.end?.getTime() || "no-end"}`}
                />
              </section>
            )}
            {/* Advanced Analytics Dashboard */}
            {filteredDraws.length > 0 && (
              <section className="mb-8" data-testid="analytics-section">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  📊 Advanced Analytics
                  {timelineFilter.start || timelineFilter.end ? (
                    <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      (Filtered)
                    </span>
                  ) : null}
                </h2>
                <AnalyticsDashboard draws={filteredDraws} />
              </section>
            )}
            {/* Comprehensive Data Table */}
            {filteredDraws.length > 0 && (
              <section className="mb-8" data-testid="table-section">
                <DataTable data={filteredDraws} />
              </section>
            )}

            {/* Data Source Attribution */}
            <section className="mt-8 sm:mt-12 bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Data Source
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Express Entry draw data is sourced from Immigration, Refugees
                and Citizenship Canada (IRCC). Data is updated automatically and
                cached locally for better performance.
              </p>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs sm:text-sm text-gray-500">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <span className="whitespace-nowrap">
                    Last data update:{" "}
                    {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">Cache: {draws.length} draws stored</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">Showing: {filteredDraws.length} draws</span>
                  <span className="hidden sm:inline">•</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                      lastUpdated &&
                      Date.now() - lastUpdated.getTime() < 3600000
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {lastUpdated && Date.now() - lastUpdated.getTime() < 3600000
                      ? "Data Fresh"
                      : "Update Available"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm">
                  <span className="hidden lg:inline">
                    Features: Timeline filter, resizable columns, sorting,
                    filtering, pagination
                  </span>
                  <span className="lg:hidden">
                    Full-featured data table
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-500">
                  © 2024 Express Entry Tracker. This application is not
                  affiliated with IRCC.
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <a
                    href="/terms"
                    className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                  >
                    Terms of Use
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  format: "number" | "currency" | "percentage";
  subtitle?: string;
}

function StatCard({ title, value, format, subtitle }: StatCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case "currency":
        return new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
        }).format(val);
      case "percentage":
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(value, format)}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
