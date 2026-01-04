/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useDraws } from "@/hooks/useDraws";
import type { ExpressEntryDraw } from "@/types/express-entry";

// Mock the data service
jest.mock("@/lib/data-service");
jest.mock("@/lib/storage");

import { DataFetcher } from "@/lib/data-service";
import { DrawStorageService } from "@/lib/storage";

const mockDataFetcher = DataFetcher as jest.MockedClass<typeof DataFetcher>;
const mockStorage = DrawStorageService as jest.MockedClass<
  typeof DrawStorageService
>;

describe("useDraws hook", () => {
  const mockDrawData: ExpressEntryDraw[] = [
    {
      drawNumber: 123,
      drawDate: "2023-12-01",
      drawDateFull: "December 1, 2023",
      drawName: "No Program Specified",
      drawSize: 1000,
      drawCRS: 480,
      dd1: "2023",
      dd2: "12",
      dd3: "01",
    },
    {
      drawNumber: 124,
      drawDate: "2023-12-15",
      drawDateFull: "December 15, 2023",
      drawName: "Canadian Experience Class",
      drawSize: 800,
      drawCRS: 475,
      dd1: "2023",
      dd2: "12",
      dd3: "15",
    },
  ];

  let mockFetchDraws: jest.Mock;
  let mockGetAllDraws: jest.Mock;
  let mockUpsertDraws: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Mock DataFetcher methods
    mockFetchDraws = jest.fn();
    mockDataFetcher.mockImplementation(
      () =>
        ({
          fetchDraws: mockFetchDraws,
        }) as any,
    );

    // Mock DrawStorageService methods
    mockGetAllDraws = jest.fn();
    mockUpsertDraws = jest.fn();
    mockStorage.mockImplementation(
      () =>
        ({
          getAllDraws: mockGetAllDraws,
          upsertDraws: mockUpsertDraws,
        }) as any,
    );

    // Clear localStorage
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should initialize with loading state", () => {
    mockGetAllDraws.mockResolvedValue([]);

    const { result } = renderHook(() => useDraws());

    expect(result.current.loading).toBe(true);
    expect(result.current.draws).toEqual([]);
    expect(result.current.latestDraw).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should load cached draws on mount", async () => {
    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.draws).toEqual(mockDrawData);
    expect(result.current.latestDraw).toEqual(mockDrawData[1]); // Latest by drawNumber
    expect(mockGetAllDraws).toHaveBeenCalledTimes(1);
  });

  it("should fetch fresh data and update cache", async () => {
    const updatedDrawData = [
      ...mockDrawData,
      {
        drawNumber: 125,
        drawDate: "2024-01-01",
        drawDateFull: "January 1, 2024",
        drawName: "New Year Draw",
        drawSize: 1200,
        drawCRS: 485,
        dd1: "2024",
        dd2: "01",
        dd3: "01",
      },
    ];

    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(updatedDrawData);
    mockUpsertDraws.mockResolvedValue();

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Manually trigger refresh
    await act(async () => {
      await result.current.refreshDraws();
    });

    expect(result.current.draws).toEqual(updatedDrawData);
    expect(result.current.latestDraw?.drawNumber).toBe(125);
    expect(mockFetchDraws).toHaveBeenCalledTimes(2); // Once on mount, once on manual refresh
    expect(mockUpsertDraws).toHaveBeenCalledWith(updatedDrawData);
  });

  it("should handle fetch errors gracefully", async () => {
    const errorMessage = "Failed to fetch data";
    mockGetAllDraws.mockResolvedValue([]);
    mockFetchDraws.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.draws).toEqual([]);
    expect(result.current.latestDraw).toBeNull();
  });

  it("should set up polling with default interval", async () => {
    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fast forward time to trigger polling
    act(() => {
      jest.advanceTimersByTime(6 * 60 * 60 * 1000); // 6 hours (default interval)
    });

    await waitFor(() => {
      expect(mockFetchDraws).toHaveBeenCalledTimes(2); // Once on mount, once from polling
    });
  });

  it("should respect custom polling interval from localStorage", async () => {
    const customInterval = 2 * 60 * 60 * 1000; // 2 hours
    window.localStorage.setItem("ee_poll_interval", customInterval.toString());

    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fast forward by custom interval
    act(() => {
      jest.advanceTimersByTime(customInterval);
    });

    await waitFor(() => {
      expect(mockFetchDraws).toHaveBeenCalledTimes(2);
    });
  });

  it("should clean up polling on unmount", async () => {
    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result, unmount } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear existing timers before unmounting
    jest.clearAllTimers();

    unmount();

    // Fast forward time - should not trigger any more fetches
    act(() => {
      jest.advanceTimersByTime(6 * 60 * 60 * 1000);
    });

    // Should only have been called once (on mount)
    expect(mockFetchDraws).toHaveBeenCalledTimes(1);
  });

  it("should find latest draw correctly", async () => {
    const drawsOutOfOrder = [
      { ...mockDrawData[1] }, // drawNumber: 124
      { ...mockDrawData[0] }, // drawNumber: 123
      {
        drawNumber: 125,
        drawDate: "2024-01-01",
        drawDateFull: "January 1, 2024",
        drawName: "Latest Draw",
        drawSize: 1500,
        drawCRS: 490,
        dd1: "2024",
        dd2: "01",
        dd3: "01",
      },
    ];

    mockGetAllDraws.mockResolvedValue(drawsOutOfOrder);
    mockFetchDraws.mockResolvedValue(drawsOutOfOrder);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latestDraw?.drawNumber).toBe(125);
    expect(result.current.latestDraw?.drawName).toBe("Latest Draw");
  });

  it("should handle storage errors gracefully", async () => {
    mockGetAllDraws.mockRejectedValue(new Error("Storage error"));
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still fetch fresh data even if storage fails
    expect(result.current.draws).toEqual(mockDrawData);
    expect(result.current.error).toBeNull(); // Storage errors should not surface as user errors
  });

  it("should update lastFetched timestamp", async () => {
    mockGetAllDraws.mockResolvedValue(mockDrawData);
    mockFetchDraws.mockResolvedValue(mockDrawData);

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLastFetched = result.current.lastFetched;
    expect(initialLastFetched).toBeInstanceOf(Date);

    // Wait a moment and refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.refreshDraws();
    });

    expect(result.current.lastFetched?.getTime()).toBeGreaterThan(
      initialLastFetched!.getTime(),
    );
  });
});
