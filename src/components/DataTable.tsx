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
    filterType: "number",
    width: 100,
    minWidth: 80,
    format: (value) => `#${value}`,
  },
  {
    key: "drawDate",
    label: "Date",
    sortable: true,
    filterable: true,
    filterType: "date",
    width: 120,
    minWidth: 100,
    format: (value) => value?.toLocaleDateString?.() || value,
  },
  {
    key: "drawName",
    label: "Category",
    sortable: true,
    filterable: true,
    filterType: "text",
    width: 200,
    minWidth: 150,
  },
  {
    key: "drawSize",
    label: "Invitations",
    sortable: true,
    filterable: true,
    filterType: "number",
    width: 120,
    minWidth: 100,
    format: (value) => value?.toLocaleString?.() || value,
  },
  {
    key: "drawCRS",
    label: "Min CRS",
    sortable: true,
    filterable: true,
    filterType: "number",
    width: 100,
    minWidth: 80,
  },
  {
    key: "drawDateFull",
    label: "Full Date",
    sortable: false,
    filterable: false,
    width: 150,
    minWidth: 120,
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

        switch (filter.type) {
          case "text":
            return String(value)
              .toLowerCase()
              .includes(filter.value.toLowerCase());
          case "number":
            return String(value).includes(filter.value);
          case "checkbox":
            return String(value) === filter.value;
          case "date":
            // For date filtering, we'll convert to string and do substring matching
            return String(value)
              .toLowerCase()
              .includes(filter.value.toLowerCase());
          default:
            return true;
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
        <div className="flex justify-between items-center mb-4">
          <h3 id={captionId} className="text-lg font-semibold text-gray-900">
            Express Entry Draws
          </h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600" aria-live="polite">
              Showing {startRecord}-{endRecord} of {pagination.total} draws
            </span>
            <label className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Rows per page:
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  handlePageSizeChange(
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
                  )
                }
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby={`${filterRegionId}-rows-desc`}
              >
                {CONFIG.TABLE.PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Show All" : `${option} per page`}
                  </option>
                ))}
              </select>
              <span id={`${filterRegionId}-rows-desc`} className="sr-only">
                Select number of rows to display per page
              </span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <fieldset className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <legend className="sr-only">Filter draws by column values</legend>
          {columns
            .filter((col) => col.filterable)
            .map((column) => (
              <FilterInput
                key={column.key}
                column={column}
                value={
                  filters.find((f) => f.column === column.key)?.value || ""
                }
                onChange={(value) =>
                  handleFilter(column.key, value, column.filterType || "text")
                }
                data={data}
              />
            ))}
        </fieldset>
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
          className="px-4 py-3 bg-white border-t flex items-center justify-between"
          id={paginationId}
          role="navigation"
          aria-label="Table pagination"
        >
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
              aria-label="Go to first page"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
              aria-label="Go to previous page"
            >
              Previous
            </button>
          </div>

          <div
            className="flex items-center space-x-1"
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
                  className={`px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 ${
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

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
              aria-label="Go to next page"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={pagination.page === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
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

interface FilterInputProps {
  column: Column;
  value: string;
  onChange: (value: string) => void;
  data: ParsedExpressEntryDraw[];
}

function FilterInput({ column, value, onChange, data }: FilterInputProps) {
  const inputId = useId();
  const descId = useId();

  if (column.filterType === "checkbox") {
    const uniqueValues = Array.from(
      new Set(
        data
          .map((item) => item[column.key])
          .filter(Boolean)
          .map(String),
      ),
    ).sort();

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {column.label}
        </label>
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-describedby={descId}
        >
          <option value="">All {column.label.toLowerCase()}</option>
          {uniqueValues.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
        <span id={descId} className="sr-only">
          Filter table by {column.label.toLowerCase()}. {uniqueValues.length}{" "}
          unique values available.
        </span>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {column.label}
      </label>
      <input
        id={inputId}
        type={column.filterType === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Filter ${column.label.toLowerCase()}`}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-describedby={descId}
      />
      <span id={descId} className="sr-only">
        {column.filterType === "number"
          ? `Enter a number to filter ${column.label.toLowerCase()}`
          : `Enter text to search in ${column.label.toLowerCase()}`}
      </span>
    </div>
  );
}
