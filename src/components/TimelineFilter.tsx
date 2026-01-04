/**
 * Timeline Filter Component
 * Provides date range filtering for Express Entry draws data
 */

import React from "react";
import type { ParsedExpressEntryDraw } from "@/types/express-entry";

export interface TimelineFilterState {
  start: Date | null;
  end: Date | null;
}

interface TimelineFilterProps {
  dateRange: TimelineFilterState;
  onDateRangeChange: (range: TimelineFilterState) => void;
  draws: ParsedExpressEntryDraw[];
  totalCount: number;
  filteredCount: number;
}

interface PresetRange {
  label: string;
  getValue: () => TimelineFilterState;
  isActive: (current: TimelineFilterState) => boolean;
}

export function TimelineFilter({
  dateRange,
  onDateRangeChange,
  draws,
  totalCount,
  filteredCount,
}: TimelineFilterProps) {
  // Calculate date boundaries from available data
  const getDataDateRange = () => {
    if (draws.length === 0) {
      return { earliest: new Date(), latest: new Date() };
    }

    const dates = draws.map((draw) => draw.drawDate);
    return {
      earliest: new Date(Math.min(...dates.map((d) => d.getTime()))),
      latest: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  };

  const { earliest, latest } = getDataDateRange();

  // Helper functions for date calculations
  const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
  const getEndOfYear = (date: Date) =>
    new Date(date.getFullYear(), 11, 31, 23, 59, 59);
  const subtractMonths = (date: Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() - months);
    return result;
  };
  const subtractYears = (date: Date, years: number) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() - years);
    return result;
  };

  // Check if two date ranges are equal
  const dateRangesEqual = (a: TimelineFilterState, b: TimelineFilterState) => {
    return (
      (a.start?.getTime() || null) === (b.start?.getTime() || null) &&
      (a.end?.getTime() || null) === (b.end?.getTime() || null)
    );
  };

  // Define preset ranges
  const presets: PresetRange[] = [
    {
      label: "All Time",
      getValue: () => ({ start: null, end: null }),
      isActive: (current) =>
        dateRangesEqual(current, { start: null, end: null }),
    },
    {
      label: "Last 3 Months",
      getValue: () => ({
        start: subtractMonths(new Date(), 3),
        end: new Date(),
      }),
      isActive: (current) => {
        const preset = {
          start: subtractMonths(new Date(), 3),
          end: new Date(),
        };
        return dateRangesEqual(current, preset);
      },
    },
    {
      label: "Last 6 Months",
      getValue: () => ({
        start: subtractMonths(new Date(), 6),
        end: new Date(),
      }),
      isActive: (current) => {
        const preset = {
          start: subtractMonths(new Date(), 6),
          end: new Date(),
        };
        return dateRangesEqual(current, preset);
      },
    },
    {
      label: "This Year",
      getValue: () => ({
        start: getStartOfYear(new Date()),
        end: getEndOfYear(new Date()),
      }),
      isActive: (current) => {
        const preset = {
          start: getStartOfYear(new Date()),
          end: getEndOfYear(new Date()),
        };
        return dateRangesEqual(current, preset);
      },
    },
    {
      label: "Last Year",
      getValue: () => {
        const lastYear = subtractYears(new Date(), 1);
        return { start: getStartOfYear(lastYear), end: getEndOfYear(lastYear) };
      },
      isActive: (current) => {
        const lastYear = subtractYears(new Date(), 1);
        const preset = {
          start: getStartOfYear(lastYear),
          end: getEndOfYear(lastYear),
        };
        return dateRangesEqual(current, preset);
      },
    },
  ];

  // Generate yearly presets based on available data
  const getYearlyPresets = (): PresetRange[] => {
    const currentYear = new Date().getFullYear();
    const earliestYear = earliest.getFullYear();
    const yearPresets: PresetRange[] = [];

    for (let year = currentYear; year >= earliestYear && year >= 2015; year--) {
      if (year === currentYear) continue; // Skip current year as it's already in "This Year"

      yearPresets.push({
        label: year.toString(),
        getValue: () => ({
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31, 23, 59, 59),
        }),
        isActive: (current) => {
          const preset = {
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31, 23, 59, 59),
          };
          return dateRangesEqual(current, preset);
        },
      });
    }

    return yearPresets;
  };

  const yearlyPresets = getYearlyPresets();

  // Format date for input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Parse date from input
  const parseDateFromInput = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr + "T00:00:00");
  };

  // Handle preset click
  const handlePresetClick = (preset: PresetRange) => {
    onDateRangeChange(preset.getValue());
  };

  // Handle manual date input
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseDateFromInput(e.target.value);
    onDateRangeChange({ ...dateRange, start: newStart });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseDateFromInput(e.target.value);
    onDateRangeChange({ ...dateRange, end: newEnd });
  };

  return (
    <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Timeline Filter</h2>
        <div className="text-sm text-gray-500">
          Showing {filteredCount.toLocaleString()} of{" "}
          {totalCount.toLocaleString()} draws
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                preset.isActive(dateRange)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {yearlyPresets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {yearlyPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  preset.isActive(dateRange)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Date Range */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={formatDateForInput(dateRange.start)}
            onChange={handleStartDateChange}
            min={formatDateForInput(earliest)}
            max={formatDateForInput(latest)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={formatDateForInput(dateRange.end)}
            onChange={handleEndDateChange}
            min={formatDateForInput(dateRange.start || earliest)}
            max={formatDateForInput(latest)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => onDateRangeChange({ start: null, end: null })}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear Filter
        </button>
      </div>

      {/* Active Filter Display */}
      {(dateRange.start || dateRange.end) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center text-sm text-blue-800">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Filtered from{" "}
              {dateRange.start
                ? dateRange.start.toLocaleDateString()
                : "earliest"}{" "}
              to {dateRange.end ? dateRange.end.toLocaleDateString() : "latest"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
