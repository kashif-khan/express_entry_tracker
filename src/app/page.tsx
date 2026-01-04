"use client";

import { useDraws } from "@/hooks/useDraws";
import { DataTable } from "@/components/DataTable";
import { StatisticsGrid } from "@/components/AnimatedStats";

export default function HomePage() {
  const {
    draws,
    latestDraw,
    statistics,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useDraws();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Unable to Load Data
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
              <button
                onClick={refetch}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Updating..." : "Refresh Data"}
              </button>
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
            {/* Latest Draw Highlight */}
            {latestDraw && (
              <section className="mb-8" data-testid="latest-draw-section">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Latest Draw</h2>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      Draw #{latestDraw.drawNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-blue-100 text-sm">Date</p>
                      <p className="text-xl font-semibold">
                        {latestDraw.drawDateFull ||
                          latestDraw.drawDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Category</p>
                      <p className="text-lg">{latestDraw.drawName}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Invitations</p>
                      <p className="text-xl font-semibold">
                        {latestDraw.drawSize.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Minimum CRS</p>
                      <p className="text-xl font-semibold">
                        {latestDraw.drawCRS}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Statistics Dashboard */}
            {statistics && (
              <section className="mb-8" data-testid="stats-section">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Statistics
                </h2>
                <StatisticsGrid statistics={statistics} />
              </section>
            )}

            {/* Comprehensive Data Table */}
            {draws.length > 0 && (
              <section className="mb-8" data-testid="table-section">
                <DataTable data={draws} />
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
                <div>
                  Last data update:{" "}
                  {lastUpdated ? lastUpdated.toLocaleString() : "Never"} • Total
                  draws in database: {draws.length}
                </div>
                <div className="space-x-4">
                  <span>
                    Features: Resizable columns, sorting, filtering, pagination
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
