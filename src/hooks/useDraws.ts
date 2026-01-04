/**
 * Custom hook for managing Express Entry draws data
 * Provides data fetching, caching, and polling functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ParsedExpressEntryDraw,
  DrawRepository,
  DataFetcher,
  DrawStatistics,
} from "@/types/express-entry";
import { createDrawRepository } from "@/lib/storage";
import {
  createDataFetcher,
  parseExpressEntryDraw,
  calculateDrawStatistics,
} from "@/lib/data-service";
import { getPollingInterval } from "@/lib/config";

interface UseDrawsState {
  draws: ParsedExpressEntryDraw[];
  latestDraw: ParsedExpressEntryDraw | null;
  statistics: DrawStatistics | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface UseDrawsResult extends UseDrawsState {
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Hook to manage Express Entry draws data with automatic polling
 */
export function useDraws(): UseDrawsResult {
  const [state, setState] = useState<UseDrawsState>({
    draws: [],
    latestDraw: null,
    statistics: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const repositoryRef = useRef<DrawRepository>();
  const dataFetcherRef = useRef<DataFetcher>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize services
  useEffect(() => {
    repositoryRef.current = createDrawRepository();
    dataFetcherRef.current = createDataFetcher();
  }, []);

  /**
   * Load draws from local storage
   */
  const loadCachedDraws = useCallback(async () => {
    try {
      if (!repositoryRef.current) return;

      const draws = await repositoryRef.current.getAllDraws();
      const latestDraw = draws.length > 0 ? draws[0] : null; // Already sorted by drawNumber desc
      const statistics = calculateDrawStatistics(draws);

      setState((prev) => ({
        ...prev,
        draws,
        latestDraw,
        statistics,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to load cached draws:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Failed to load data"),
      }));
    }
  }, []);

  /**
   * Fetch fresh data from IRCC and update cache
   */
  const fetchFreshData = useCallback(async () => {
    try {
      if (!repositoryRef.current || !dataFetcherRef.current) return;

      setState((prev) => ({ ...prev, error: null }));

      const response = await dataFetcherRef.current.fetchDraws();
      const parsedDraws = response.rounds.map(parseExpressEntryDraw);

      // Update repository
      await repositoryRef.current.upsertDraws(parsedDraws);

      // Sort by drawNumber descending (latest first)
      parsedDraws.sort((a, b) => b.drawNumber - a.drawNumber);

      const latestDraw = parsedDraws.length > 0 ? parsedDraws[0] : null;
      const statistics = calculateDrawStatistics(parsedDraws);

      setState((prev) => ({
        ...prev,
        draws: parsedDraws,
        latestDraw,
        statistics,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error("Failed to fetch fresh data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Failed to fetch data"),
      }));
    }
  }, []);

  /**
   * Refetch data (exposed to components)
   */
  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await fetchFreshData();
  }, [fetchFreshData]);

  /**
   * Clear cache and reload
   */
  const clearCache = useCallback(async () => {
    try {
      if (!repositoryRef.current) return;

      await repositoryRef.current.clear();
      setState({
        draws: [],
        latestDraw: null,
        statistics: null,
        isLoading: true,
        error: null,
        lastUpdated: null,
      });

      await fetchFreshData();
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, [fetchFreshData]);

  /**
   * Set up polling
   */
  useEffect(() => {
    const setupPolling = () => {
      // Clear existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Set up new polling interval
      const interval = getPollingInterval();
      pollingIntervalRef.current = setInterval(() => {
        fetchFreshData();
      }, interval);
    };

    setupPolling();

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchFreshData]);

  /**
   * Initial data load
   */
  useEffect(() => {
    const initialize = async () => {
      // Load cached data first for immediate display
      await loadCachedDraws();

      // Then try to fetch fresh data in background
      await fetchFreshData();
    };

    initialize();
  }, [loadCachedDraws, fetchFreshData]);

  return {
    ...state,
    refetch,
    clearCache,
  };
}
