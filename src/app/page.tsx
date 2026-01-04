"use client";

import { useDraws } from "@/hooks/useDraws";
import { DataTable } from "@/components/DataTable";
import { StatisticsGrid } from "@/components/AnimatedStats";
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Unable to Load Data
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <div className="space-y-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Retrying..." : "Try Again"}
            </button>
            <button
              onClick={handleClearCache}
              disabled={isLoading || isClearing}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Express Entry Tracker
              </h1>
              <p className="mt-1 text-gray-600">
                Track Canadian immigration Express Entry draws and statistics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleString()}
                </span>
              )}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDataActions(!showDataActions)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
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
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        data-testid="main-content"
      >
        {isLoading && draws.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Express Entry data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Timeline Filter */}
            {draws.length > 0 && (
              <section className="mb-8" data-testid="timeline-filter-section">
                <TimelineFilter
                  dateRange={timelineFilter}
                  onDateRangeChange={setTimelineFilter}
                  draws={draws}
                  totalCount={draws.length}
                  filteredCount={filteredDraws.length}
                />
              </section>
            )}

            {/* Latest Draw Highlight */}
            {filteredLatestDraw && (
              <section className="mb-8" data-testid="latest-draw-section">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Latest Draw</h2>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      Draw #{filteredLatestDraw.drawNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-blue-100 text-sm">Date</p>
                      <p className="text-xl font-semibold">
                        {filteredLatestDraw.drawDateFull ||
                          filteredLatestDraw.drawDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Category</p>
                      <p className="text-lg">{filteredLatestDraw.drawName}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Invitations</p>
                      <p className="text-xl font-semibold">
                        {filteredLatestDraw.drawSize.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Minimum CRS</p>
                      <p className="text-xl font-semibold">
                        {filteredLatestDraw.drawCRS}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Statistics Dashboard */}
            {filteredStatistics && (
              <section className="mb-8" data-testid="stats-section">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Statistics
                  {(timelineFilter.start || timelineFilter.end) && (
                    <span className="text-lg font-normal text-gray-600 ml-2">
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

            {/* Comprehensive Data Table */}
            {filteredDraws.length > 0 && (
              <section className="mb-8" data-testid="table-section">
                <DataTable data={filteredDraws} />
              </section>
            )}

            {/* Data Source Attribution */}
            <section className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Data Source
              </h3>
              <p className="text-gray-600 mb-4">
                Express Entry draw data is sourced from Immigration, Refugees
                and Citizenship Canada (IRCC). Data is updated automatically and
                cached locally for better performance.
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>
                    Last data update:{" "}
                    {lastUpdated ? lastUpdated.toLocaleString() : "Never"}
                  </span>
                  <span>•</span>
                  <span>Cache: {draws.length} draws stored</span>
                  <span>•</span>
                  <span>Showing: {filteredDraws.length} draws</span>
                  <span>•</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                <div className="space-x-4">
                  <span>
                    Features: Timeline filter, resizable columns, sorting,
                    filtering, pagination
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  © 2024 Express Entry Tracker. This application is not
                  affiliated with IRCC.
                </div>
                <div className="flex items-center space-x-4 text-sm">
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
