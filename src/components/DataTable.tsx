/**
 * Advanced data table component with resizable columns, sorting, filters, and pagination
 * Implements accessibility features and keyboard navigation
 */

"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useId,
} from "react";
import type {
  ParsedExpressEntryDraw,
  SortConfig,
  FilterConfig,
  PaginationConfig,
} from "@/types/express-entry";
import { CONFIG, getFeatureFlag } from "@/lib/config";

interface Column {
  key: keyof ParsedExpressEntryDraw;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "checkbox" | "date" | "number";
  width?: number;
  minWidth?: number;
  format?: (value: any) => string;
}

interface DataTableProps {
  data: ParsedExpressEntryDraw[];
  className?: string;
}

const DEFAULT_COLUMNS: Column[] = [
  {
    key: "drawNumber",
    label: "Draw #",
    sortable: true,
    filterable: true,
    filterType: "checkbox", // Keep as checkbox for multi-select but with numeric sorting
    width: 100,
    minWidth: 80,
    format: (value) => `#${value}`,
  },
  {
    key: "drawDate",
    label: "Date",
    sortable: true,
    filterable: true,
    filterType: "checkbox", // Keep as checkbox for multi-select but with date sorting
    width: 120,
    minWidth: 100,
    format: (value) => value?.toLocaleDateString?.() || value,
  },
  {
    key: "drawName",
    label: "Category",
    sortable: true,
    filterable: true,
    filterType: "checkbox", // Categorical data works well with checkbox
    width: 200,
    minWidth: 150,
  },
  {
    key: "drawSize",
    label: "Invitations",
    sortable: true,
    filterable: true,
    filterType: "checkbox", // Keep as checkbox for multi-select but with numeric sorting
    width: 120,
    minWidth: 100,
    format: (value) => value?.toLocaleString?.() || value,
  },
  {
    key: "drawCRS",
    label: "Min CRS",
    sortable: true,
    filterable: true,
    filterType: "checkbox", // Keep as checkbox for multi-select but with numeric sorting
    width: 100,
    minWidth: 80,
  },
  {
    key: "drawCutOff",
    label: "Cut-off Date",
    sortable: true,
    filterable: true,
    filterType: "checkbox",
    width: 180,
    minWidth: 150,
    format: (value) => {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value || "");
    },
  },
];

export function DataTable({ data, className = "" }: DataTableProps) {
  const tableId = useId();
  const captionId = useId();
  const filterRegionId = useId();
  const paginationId = useId();

  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    CONFIG.TABLE.DEFAULT_SORT,
  );
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: CONFIG.TABLE.DEFAULT_PAGE_SIZE,
    total: data.length,
  });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [announcement, setAnnouncement] = useState<string>("");
  const [focusedCell, setFocusedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    isDragging: boolean;
    columnIndex: number;
    startX: number;
    startWidth: number;
  }>({ isDragging: false, columnIndex: -1, startX: 0, startWidth: 0 });

  // Feature flags
  const canResize = getFeatureFlag("FEATURE_TABLE_RESIZE") === "on";
  const canDrag = getFeatureFlag("FEATURE_TABLE_DRAG") === "on";

  // Screen reader announcement helper
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 1000);
  }, []);

  // Keyboard navigation helpers
  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Only handle keyboard navigation for table cells and interactive elements
      if (!target.closest("table")) return;

      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON";

      switch (e.key) {
        case "Home":
          if (e.ctrlKey && !isInput) {
            e.preventDefault();
            // Focus first interactive element in table
            const firstButton = tableRef.current?.querySelector(
              "button, input, select",
            ) as HTMLElement;
            firstButton?.focus();
            announce("Moved to start of table");
          }
          break;

        case "End":
          if (e.ctrlKey && !isInput) {
            e.preventDefault();
            // Focus last interactive element in table
            const buttons = tableRef.current?.querySelectorAll(
              "button, input, select",
            );
            const lastButton = buttons?.[buttons.length - 1] as HTMLElement;
            lastButton?.focus();
            announce("Moved to end of table");
          }
          break;

        case "Escape":
          // Clear selections or close any open states
          if (selectedRows.size > 0) {
            setSelectedRows(new Set());
            announce("Cleared all selections");
          }
          break;

        case " ":
          // Handle space for row selection if focused on a row
          if (
            target.closest("tr") &&
            target.tagName !== "INPUT" &&
            target.tagName !== "BUTTON"
          ) {
            e.preventDefault();
            const row = target.closest("tr");
            const checkbox = row?.querySelector(
              'input[type="checkbox"]',
            ) as HTMLInputElement;
            if (checkbox) {
              checkbox.click();
            }
          }
          break;
      }
    },
    [selectedRows.size, announce],
  );

  // Improved focus management for resize handles
  const handleResizeKeyDown = useCallback(
    (e: React.KeyboardEvent, columnIndex: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        announce(
          `Entered resize mode for ${columns[columnIndex].label} column. Use left and right arrow keys to adjust width, then press Enter to confirm.`,
        );
        // Here you could implement keyboard-driven column resizing
      }
    },
    [announce, columns],
  );

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply filters
    filters.forEach((filter) => {
      if (!filter.value) return;

      filtered = filtered.filter((item) => {
        const value = item[filter.column];
        if (value == null) return false;

        // Handle multi-select filters (checkbox format with ||)
        if (filter.value.includes("||")) {
          const selectedValues = filter.value.split("||");
          let itemValue: string;

          if (
            (filter.column === "drawDate" || filter.column === "drawCutOff") &&
            value instanceof Date
          ) {
            // For date columns, use date-only format for comparison
            itemValue = value.toLocaleDateString();
          } else if (filter.column === "drawNumber") {
            // For draw number, use exact number match (remove # prefix for comparison)
            itemValue = String(value);
          } else {
            itemValue = String(value);
          }

          return selectedValues.includes(itemValue);
        }

        // Handle single value filters based on column type
        switch (filter.column) {
          case "drawNumber":
            // Exact number matching for draw numbers
            const filterNum = filter.value.replace("#", "");
            const itemNum = String(value).replace("#", "");
            return itemNum === filterNum;

          case "drawDate":
            // Date comparison using locale format (date only)
            if (value instanceof Date) {
              const dateStr = value.toLocaleDateString();
              return dateStr.toLowerCase().includes(filter.value.toLowerCase());
            }
            return String(value)
              .toLowerCase()
              .includes(filter.value.toLowerCase());

          case "drawCutOff":
            // Cut-off date comparison using locale date format (no time)
            if (value instanceof Date) {
              const dateStr = value.toLocaleDateString();
              return dateStr.toLowerCase().includes(filter.value.toLowerCase());
            }
            return String(value)
              .toLowerCase()
              .includes(filter.value.toLowerCase());

          case "drawCRS":
          case "drawSize":
            // Exact number matching for numeric values
            const cleanFilter = filter.value.replace(/[,\s]/g, "");
            const cleanValue = String(value).replace(/[,\s]/g, "");
            return cleanValue === cleanFilter;

          default:
            // Text-based substring matching for other columns
            return String(value)
              .toLowerCase()
              .includes(filter.value.toLowerCase());
        }
      });
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;

        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (pagination.pageSize === "all") return filteredAndSortedData;

    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, pagination]);

  // Update pagination when data changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredAndSortedData.length,
      page: Math.min(
        prev.page,
        Math.ceil(
          filteredAndSortedData.length /
            (prev.pageSize === "all" ? 1 : prev.pageSize),
        ) || 1,
      ),
    }));
  }, [filteredAndSortedData]);

  // Calculate pagination info (moved before callbacks that use it)
  const totalPages =
    pagination.pageSize === "all"
      ? 1
      : Math.ceil(pagination.total / pagination.pageSize);
  const startRecord =
    pagination.pageSize === "all"
      ? 1
      : (pagination.page - 1) * pagination.pageSize + 1;
  const endRecord =
    pagination.pageSize === "all"
      ? pagination.total
      : Math.min(pagination.page * pagination.pageSize, pagination.total);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
      announce(`Navigated to page ${page} of ${totalPages}`);
    },
    [announce, totalPages],
  );

  // Handle filtering
  const handleFilter = useCallback(
    (
      columnKey: keyof ParsedExpressEntryDraw,
      value: string,
      type: "text" | "checkbox" | "number" | "date",
    ) => {
      setFilters((prev) => {
        const existing = prev.findIndex((f) => f.column === columnKey);
        const newFilter = { column: columnKey, value, type };

        if (existing >= 0) {
          if (value) {
            prev[existing] = newFilter;
          } else {
            prev.splice(existing, 1);
          }
        } else if (value) {
          prev.push(newFilter);
        }

        const columnLabel =
          columns.find((col) => col.key === columnKey)?.label || columnKey;
        if (value) {
          announce(`Filter applied to ${columnLabel}: ${value}`);
        } else {
          announce(`Filter removed from ${columnLabel}`);
        }

        return [...prev];
      });
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page when filtering
    },
    [announce, columns],
  );

  const handleSort = useCallback(
    (key: keyof ParsedExpressEntryDraw) => {
      setSortConfig((prev) => {
        let direction: "asc" | "desc" = "asc";
        if (prev.key === key && prev.direction === "asc") {
          direction = "desc";
        }

        const columnLabel =
          columns.find((col) => col.key === key)?.label || key;
        announce(`Sorted by ${columnLabel} in ${direction}ending order`);

        return { key, direction };
      });
    },
    [announce, columns],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number | "all") => {
      setPagination((prev) => ({
        ...prev,
        pageSize,
        page: 1,
      }));
      const message =
        pageSize === "all"
          ? "Showing all entries"
          : `Showing ${pageSize} entries per page`;
      announce(message);
    },
    [announce],
  );

  // Handle row selection
  const handleRowSelect = useCallback(
    (drawNumber: number, selected: boolean) => {
      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(drawNumber);
        } else {
          newSet.delete(drawNumber);
        }
        return newSet;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedRows(new Set(paginatedData.map((item) => item.drawNumber)));
        announce(`Selected all ${paginatedData.length} visible draws`);
      } else {
        setSelectedRows(new Set());
        announce("Cleared all selections");
      }
    },
    [paginatedData, announce],
  );

  // Column resizing handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      const diff = e.clientX - dragState.current.startX;
      const newWidth = Math.max(
        columns[dragState.current.columnIndex].minWidth || 50,
        dragState.current.startWidth + diff,
      );

      setColumns((prev) => {
        const newColumns = [...prev];
        newColumns[dragState.current.columnIndex] = {
          ...newColumns[dragState.current.columnIndex],
          width: newWidth,
        };
        return newColumns;
      });
    },
    [columns],
  );

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnIndex: number) => {
      if (!canResize) return;

      e.preventDefault();
      dragState.current = {
        isDragging: true,
        columnIndex,
        startX: e.clientX,
        startWidth: columns[columnIndex].width || 150,
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [canResize, columns, handleMouseMove, handleMouseUp],
  );

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      role="region"
      aria-labelledby={captionId}
    >
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Table Controls */}
      <div
        className="p-4 border-b bg-gray-50"
        id={filterRegionId}
        role="region"
        aria-label="Table controls and filters"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 id={captionId} className="text-base sm:text-lg font-semibold text-gray-900">
            Express Entry Draws
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1" aria-live="polite">
              Showing {startRecord}-{endRecord} of {pagination.total} draws
            </span>
            <label className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Rows per page:
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  handlePageSizeChange(
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
                  )
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 sm:flex-initial"
                aria-describedby={`${filterRegionId}-rows-desc`}
              >
                {CONFIG.TABLE.PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All" : option}
                  </option>
                ))}
              </select>
              <span id={`${filterRegionId}-rows-desc`} className="sr-only">
                Select number of rows to display per page
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Express Entry draws table"
      >
        <table
          ref={tableRef}
          id={tableId}
          className="min-w-full divide-y divide-gray-200"
          role="table"
          aria-labelledby={captionId}
          aria-describedby={`${filterRegionId} ${paginationId}`}
          aria-rowcount={filteredAndSortedData.length}
          aria-colcount={columns.length + 1}
          onKeyDown={handleTableKeyDown}
        >
          <thead className="bg-gray-50" role="rowgroup">
            <tr role="row" aria-rowindex={1}>
              <th
                className="px-3 py-3 w-12"
                role="columnheader"
                aria-label="Select rows"
                scope="col"
              >
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((item) =>
                      selectedRows.has(item.drawNumber),
                    )
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  aria-label="Select all visible rows"
                  aria-describedby="select-all-desc"
                />
                <span id="select-all-desc" className="sr-only">
                  Check to select all {paginatedData.length} visible rows
                </span>
              </th>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group"
                  style={{ width: column.width }}
                  role="columnheader"
                  scope="col"
                  aria-colindex={index + 2}
                  aria-sort={
                    sortConfig.key === column.key
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : column.sortable
                        ? "none"
                        : undefined
                  }
                >
                  <div className="space-y-2">
                    {/* Column Header with Sort */}
                    <div className="flex items-center justify-between">
                      {column.sortable ? (
                        <button
                          className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-1"
                          onClick={() => handleSort(column.key)}
                          aria-label={`Sort by ${column.label}. Currently ${
                            sortConfig.key === column.key
                              ? sortConfig.direction === "asc"
                                ? "sorted ascending"
                                : "sorted descending"
                              : "not sorted"
                          }`}
                          aria-describedby={`${column.key}-sort-desc`}
                        >
                          <span>{column.label}</span>
                          {sortConfig.key === column.key && (
                            <span className="text-blue-600" aria-hidden="true">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span>{column.label}</span>
                      )}
                      <span id={`${column.key}-sort-desc`} className="sr-only">
                        {column.sortable
                          ? "Click to sort this column"
                          : "This column is not sortable"}
                      </span>
                      {canResize && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => handleMouseDown(e, index)}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${column.label} column`}
                          tabIndex={0}
                          onKeyDown={(e) => handleResizeKeyDown(e, index)}
                        />
                      )}
                    </div>

                    {/* Column Filter */}
                    {column.filterable && (
                      <div className="relative">
                        <HeaderFilterInput
                          column={column}
                          value={
                            filters.find((f) => f.column === column.key)
                              ?.value || ""
                          }
                          onChange={(value) =>
                            handleFilter(
                              column.key,
                              value,
                              column.filterType || "text",
                            )
                          }
                          data={data}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
            {paginatedData.map((item, rowIndex) => (
              <tr
                key={item.drawNumber}
                className={`hover:bg-gray-50 ${selectedRows.has(item.drawNumber) ? "bg-blue-50" : ""}`}
                role="row"
                aria-rowindex={rowIndex + 2}
                aria-selected={selectedRows.has(item.drawNumber)}
              >
                <td className="px-3 py-4" role="gridcell" aria-colindex={1}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.drawNumber)}
                    onChange={(e) =>
                      handleRowSelect(item.drawNumber, e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    aria-label={`Select draw #${item.drawNumber}`}
                    aria-describedby={`row-${item.drawNumber}-desc`}
                  />
                  <span id={`row-${item.drawNumber}-desc`} className="sr-only">
                    Express Entry draw #{item.drawNumber} from{" "}
                    {item.drawDate?.toLocaleDateString?.() || item.drawDateFull}
                  </span>
                </td>
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className="px-3 py-4 text-sm text-gray-900"
                    style={{ width: column.width }}
                    role="gridcell"
                    aria-colindex={colIndex + 2}
                    title={
                      column.key === "drawCutOff" &&
                      item[column.key] instanceof Date
                        ? `Exact cut-off time: ${(item[column.key] as Date).toLocaleString()}`
                        : undefined
                    }
                  >
                    {column.format
                      ? column.format(item[column.key])
                      : String(item[column.key] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pageSize !== "all" && totalPages > 1 && (
        <nav
          className="px-4 py-3 bg-white border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
          id={paginationId}
          role="navigation"
          aria-label="Table pagination"
        >
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              aria-label="Go to first page"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              aria-label="Go to previous page"
            >
              Previous
            </button>
          </div>

          <div
            className="flex items-center gap-1 sm:gap-1 justify-center"
            role="group"
            aria-label="Page numbers"
          >
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, pagination.page - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2.5 sm:py-2 text-xs sm:text-sm border rounded focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 ${
                    pageNum === pagination.page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={
                    pageNum === pagination.page ? "page" : undefined
                  }
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              aria-label="Go to next page"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={pagination.page === totalPages}
              className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              aria-label="Go to last page"
            >
              Last
            </button>
          </div>
        </nav>
      )}

      {/* Selected rows actions */}
      {selectedRows.size > 0 && (
        <div
          className="px-4 py-2 bg-blue-50 border-t"
          role="region"
          aria-label="Selected rows actions"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700" aria-live="polite">
              {selectedRows.size} draw{selectedRows.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <button
              onClick={() => {
                setSelectedRows(new Set());
                announce("Cleared all selections");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 focus:ring-2 focus:ring-blue-500 rounded px-1"
              aria-label={`Clear selection of ${selectedRows.size} draws`}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface HeaderFilterInputProps {
  column: Column;
  value: string;
  onChange: (value: string) => void;
  data: ParsedExpressEntryDraw[];
}

function HeaderFilterInput({
  column,
  value,
  onChange,
  data,
}: HeaderFilterInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const descId = useId();
  const listboxId = useId();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get unique values for the column (always use original data, not filtered data)
  const uniqueValues = useMemo(() => {
    const values = data // Use original data, not filtered data
      .map((item) => {
        const val = item[column.key];
        // Use consistent locale format for dates
        if (column.key === "drawDate" && val instanceof Date) {
          return val.toLocaleDateString();
        } else if (column.key === "drawCutOff" && val instanceof Date) {
          return val.toLocaleDateString(); // Date only, no time
        } else if (column.filterType === "date" && val instanceof Date) {
          return val.toLocaleDateString();
        }
        return val;
      })
      .filter(Boolean)
      .map(String);

    const uniqueStringValues = Array.from(new Set(values));

    // Sort appropriately based on data type
    return uniqueStringValues.sort((a, b) => {
      // Check if values look numeric (handle formatted numbers like "1,234" or "#123")
      const cleanA = a.replace(/[,#\s]/g, "");
      const cleanB = b.replace(/[,#\s]/g, "");
      const isNumericA = !isNaN(Number(cleanA)) && cleanA !== "";
      const isNumericB = !isNaN(Number(cleanB)) && cleanB !== "";

      if (isNumericA && isNumericB) {
        // Both are numeric - sort numerically
        return Number(cleanA) - Number(cleanB);
      } else if (
        column.key === "drawDate" ||
        column.key === "drawCutOff" ||
        a.includes("/") ||
        a.includes("-")
      ) {
        // Date-like values - try to sort by date
        const dateA = new Date(a);
        const dateB = new Date(b);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB.getTime() - dateA.getTime(); // Most recent first
        }
      }

      // Default to alphabetical sort
      return a.localeCompare(b);
    });
  }, [data, column.key, column.filterType]); // Use original data dependency

  // Filter values based on search text (typeahead)
  const filteredValues = useMemo(() => {
    if (!searchText.trim()) return uniqueValues;
    return uniqueValues.filter((val) =>
      val.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [uniqueValues, searchText]);

  // Initialize selected values from current filter
  useEffect(() => {
    if (value && value.includes("||")) {
      setSelectedValues(new Set(value.split("||")));
    } else if (value) {
      setSelectedValues(new Set([value]));
    } else {
      setSelectedValues(new Set());
    }
  }, [value]);

  // Handle checkbox selection for multi-select filters
  const handleCheckboxChange = (val: string, checked: boolean) => {
    setSelectedValues((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(val);
      } else {
        newSet.delete(val);
      }
      return newSet;
    });
  };

  // Apply selected filters
  const applyFilters = () => {
    if (selectedValues.size === 0) {
      onChange("");
    } else {
      onChange(Array.from(selectedValues).join("||"));
    }
    setIsOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedValues(new Set());
    setSearchText("");
    onChange("");
    setIsOpen(false);
  };

  // Handle single value selection (for direct apply)
  const handleSingleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        id={inputId}
        type="button"
        className={`w-full flex items-center justify-between px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
          value
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "bg-white border-gray-300 text-gray-600"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-describedby={descId}
        aria-controls={listboxId}
      >
        <span className="truncate text-left">
          {selectedValues.size === 0
            ? "Filter"
            : selectedValues.size === 1
              ? Array.from(selectedValues)[0]
              : `${selectedValues.size} selected`}
        </span>
        <svg
          className={`w-3 h-3 transition-transform flex-shrink-0 ml-1 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 right-0 sm:left-auto sm:right-auto sm:w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden"
          role="listbox"
          id={listboxId}
          aria-labelledby={inputId}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={`Search ${column.label.toLowerCase()}...`}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              aria-label={`Search ${column.label.toLowerCase()} values`}
            />
          </div>

          {/* Filter Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredValues.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No matching values found
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between text-xs">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                      onClick={() => {
                        const allVisible = new Set(filteredValues);
                        setSelectedValues(allVisible);
                      }}
                    >
                      Select All ({filteredValues.length})
                    </button>
                    <button
                      type="button"
                      className="text-gray-600 hover:text-gray-800 focus:outline-none"
                      onClick={() => setSelectedValues(new Set())}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Option List */}
                {filteredValues.map((val) => (
                  <div
                    key={val}
                    className="px-3 py-1 hover:bg-gray-50 flex items-center justify-between group"
                  >
                    {/* Checkbox for multi-select */}
                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedValues.has(val)}
                        onChange={(e) =>
                          handleCheckboxChange(val, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                        aria-describedby={`${val}-count`}
                      />
                      <span className="text-sm text-gray-900 truncate flex-1">
                        {val}
                      </span>
                    </label>

                    {/* Count of rows with this value */}
                    <span
                      id={`${val}-count`}
                      className="text-xs text-gray-500 ml-2"
                    >
                      (
                      {
                        data.filter((item) => {
                          const itemVal = item[column.key];
                          let stringVal: string;

                          if (
                            column.key === "drawDate" &&
                            itemVal instanceof Date
                          ) {
                            stringVal = itemVal.toLocaleDateString();
                          } else if (
                            column.key === "drawCutOff" &&
                            itemVal instanceof Date
                          ) {
                            stringVal = itemVal.toLocaleDateString(); // Date only, no time
                          } else if (
                            column.filterType === "date" &&
                            itemVal instanceof Date
                          ) {
                            stringVal = itemVal.toLocaleDateString();
                          } else {
                            stringVal = String(itemVal || "");
                          }

                          return stringVal === val;
                        }).length
                      }
                      )
                    </span>

                    {/* Quick select button */}
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 ml-1 focus:opacity-100 focus:outline-none"
                      onClick={() => handleSingleSelect(val)}
                      aria-label={`Select only ${val}`}
                    >
                      Only
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-3 py-2 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-500 rounded"
              onClick={clearFilters}
            >
              Clear All
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={applyFilters}
            >
              Apply ({selectedValues.size})
            </button>
          </div>
        </div>
      )}

      <span id={descId} className="sr-only">
        Filter table by {column.label.toLowerCase()}. {uniqueValues.length}{" "}
        unique values available.
        {selectedValues.size > 0 &&
          ` ${selectedValues.size} values currently selected.`}
      </span>
    </div>
  );
}
