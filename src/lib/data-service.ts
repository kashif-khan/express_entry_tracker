/**
 * Data fetching service with robust error handling, retry logic, and validation
 * Follows SOLID principles for maintainability and testability
 */

import type {
  DataFetcher,
  ExpressEntryResponse,
  ExpressEntryDraw,
  ParsedExpressEntryDraw,
  Clock,
} from "@/types/express-entry";
import { DataFetchError, ValidationError } from "@/types/express-entry";
import { CONFIG, getDataUrl, getDataUrls } from "@/lib/config";

/**
 * Real clock implementation for production use
 */
export class RealClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * HTTP-based data fetcher implementing DataFetcher interface
 * Includes retry logic, timeout handling, multiple CORS proxy fallback, and proper error reporting
 */
export class HttpDataFetcher implements DataFetcher {
  private readonly urls: string[];

  constructor(
    urls: string[] = getDataUrls(),
    private readonly clock: Clock = new RealClock(),
  ) {
    this.urls = urls;
  }

  /**
   * Fetch Express Entry draws with multiple proxy fallback and retry logic
   */
  async fetchDraws(): Promise<ExpressEntryResponse> {
    let lastError: unknown;

    // Try each URL in sequence until one succeeds
    for (let urlIndex = 0; urlIndex < this.urls.length; urlIndex++) {
      const currentUrl = this.urls[urlIndex];

      // For each URL, try multiple times with exponential backoff
      for (let attempt = 1; attempt <= CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          const response = await this.fetchWithTimeout(currentUrl);
          const data = await this.parseAndValidateResponse(response);

          // Success! Log which proxy worked if we tried multiple
          if (urlIndex > 0 || this.urls.length > 1) {
            console.info(
              `Successfully fetched data using URL ${urlIndex + 1}/${this.urls.length}: ${this.getProxyName(currentUrl)}`,
            );
          }

          return data;
        } catch (error) {
          lastError = error;

          // Don't retry validation errors
          if (error instanceof ValidationError) {
            console.warn(
              `Validation error with URL ${urlIndex + 1}/${this.urls.length} (${this.getProxyName(currentUrl)}):`,
              error,
            );
            break; // Try next URL
          }

          // If this is the last attempt for this URL, try next URL
          if (attempt === CONFIG.MAX_RETRY_ATTEMPTS) {
            console.warn(
              `All ${CONFIG.MAX_RETRY_ATTEMPTS} attempts failed for URL ${urlIndex + 1}/${this.urls.length} (${this.getProxyName(currentUrl)}):`,
              error,
            );
            break; // Try next URL
          }

          // Wait before retry with exponential backoff
          const delay = CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          await this.sleep(delay);

          console.warn(
            `Attempt ${attempt}/${CONFIG.MAX_RETRY_ATTEMPTS} failed for URL ${urlIndex + 1}/${this.urls.length} (${this.getProxyName(currentUrl)}), retrying in ${delay}ms:`,
            error,
          );
        }
      }
    }

    throw new DataFetchError(
      "All proxy URLs and retry attempts failed",
      lastError,
    );
  }

  /**
   * Get a friendly name for the proxy being used
   */
  private getProxyName(url: string): string {
    if (url.includes("corsproxy.io")) return "corsproxy.io";
    if (url.includes("cors-anywhere.herokuapp.com")) return "cors-anywhere";
    if (url.includes("codetabs.com")) return "codetabs.com";
    if (url.includes("cors.sh")) return "cors.sh";
    if (url.includes("bridged.cc")) return "bridged.cc";
    if (url.includes("canada.ca")) return "Direct IRCC";
    return "Unknown proxy";
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    timeoutMs: number = 30000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new DataFetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, url },
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new DataFetchError("Request timeout", {
          timeoutMs,
          url,
        });
      }
      throw new DataFetchError("Network request failed", error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse response and validate against expected schema
   * Skips invalid draws instead of failing completely
   */
  private async parseAndValidateResponse(
    response: Response,
  ): Promise<ExpressEntryResponse> {
    try {
      const text = await response.text();

      if (!text.trim()) {
        throw new ValidationError("Empty response body");
      }

      const data = JSON.parse(text);

      // Validate basic structure
      if (!data || typeof data !== "object") {
        throw new ValidationError("Invalid JSON structure");
      }

      if (!Array.isArray(data.rounds)) {
        throw new ValidationError("Missing or invalid rounds array");
      }

      // Filter out invalid draws instead of throwing errors
      const validDraws: unknown[] = [];
      const invalidDraws: Array<{ index: number; reason: string }> = [];

      for (let i = 0; i < data.rounds.length; i++) {
        const draw = data.rounds[i];
        try {
          this.validateDraw(draw, i);
          validDraws.push(draw);
        } catch (error) {
          // Log invalid draw but continue processing
          const reason = error instanceof Error ? error.message : String(error);
          invalidDraws.push({ index: i, reason });
          console.warn(`Skipping invalid draw at index ${i}: ${reason}`, draw);
        }
      }

      // Warn if we skipped draws
      if (invalidDraws.length > 0) {
        console.warn(
          `Skipped ${invalidDraws.length} invalid draws out of ${data.rounds.length} total`,
          invalidDraws,
        );
      }

      // Ensure we have at least some valid data
      if (validDraws.length === 0) {
        throw new ValidationError(
          "No valid draws found in response",
          invalidDraws,
        );
      }

      return { ...data, rounds: validDraws } as ExpressEntryResponse;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError("Invalid JSON format", error);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DataFetchError("Failed to parse response", error);
    }
  }

  /**
   * Validate individual draw structure
   */
  private validateDraw(draw: unknown, index: number): void {
    if (!draw || typeof draw !== "object") {
      throw new ValidationError(`Draw at index ${index} is not an object`);
    }

    const d = draw as Record<string, unknown>;
    const required = [
      "drawNumber",
      "drawDate",
      "drawName",
      "drawSize",
      "drawCRS",
    ];

    for (const field of required) {
      if (typeof d[field] !== "string" || !d[field]) {
        throw new ValidationError(
          `Draw at index ${index} missing required field: ${field}`,
        );
      }
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(d.drawDate as string)) {
      throw new ValidationError(
        `Draw at index ${index} has invalid date format: ${d.drawDate}`,
      );
    }

    // Validate drawNumber is numeric
    if (!/^\d+$/.test(d.drawNumber as string)) {
      throw new ValidationError(
        `Draw at index ${index} has invalid drawNumber: ${d.drawNumber}`,
      );
    }

    // Validate drawCRS is numeric
    if (!/^\d+$/.test(d.drawCRS as string)) {
      throw new ValidationError(
        `Draw at index ${index} has invalid drawCRS: ${d.drawCRS}`,
      );
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Parse raw Express Entry draw to typed format with error handling
 */
export function parseExpressEntryDraw(
  raw: ExpressEntryDraw,
): ParsedExpressEntryDraw {
  try {
    // Parse required fields
    const drawNumber = parseInt(raw.drawNumber, 10);
    const drawDate = new Date(raw.drawDate);
    const drawSize = parseInt(raw.drawSize.replace(/,/g, ""), 10);
    const drawCRS = parseInt(raw.drawCRS, 10);

    // Validate parsed values
    if (isNaN(drawNumber) || drawNumber <= 0) {
      throw new ValidationError(`Invalid drawNumber: ${raw.drawNumber}`);
    }

    if (isNaN(drawDate.getTime())) {
      throw new ValidationError(`Invalid drawDate: ${raw.drawDate}`);
    }

    if (isNaN(drawSize) || drawSize <= 0) {
      throw new ValidationError(`Invalid drawSize: ${raw.drawSize}`);
    }

    if (isNaN(drawCRS) || drawCRS <= 0) {
      throw new ValidationError(`Invalid drawCRS: ${raw.drawCRS}`);
    }

    /**
     * Sanitize and parse drawCutOff date string
     * Handles various formats and ensures security against malicious inputs
     */
    function sanitizeDrawCutOff(rawCutOff: unknown): Date | undefined {
      // Input validation
      if (!rawCutOff || typeof rawCutOff !== "string") {
        return undefined;
      }

      // Security: limit string length to prevent DoS attacks
      const MAX_DATE_STRING_LENGTH = 200;
      if (rawCutOff.length > MAX_DATE_STRING_LENGTH) {
        console.warn(
          `drawCutOff string too long (${rawCutOff.length} chars), truncating`,
        );
        return undefined;
      }

      // Security: check for potentially malicious patterns
      const SUSPICIOUS_PATTERNS = [
        /<script/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];

      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(rawCutOff)) {
          console.warn(`Suspicious pattern detected in drawCutOff: ${pattern}`);
          return undefined;
        }
      }

      // Normalize the input string
      let normalizedInput = rawCutOff.trim();

      // Remove HTML entities if any
      normalizedInput = normalizedInput
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/");

      try {
        // Extract only the date part (up to year) using the specified regex pattern
        // This removes the time portion from formats like "January 4, 2020 at 12:16:45 UTC"
        const timePortionPattern = /[ ,]*at[ ,]*.*/;
        const dateOnlyInput = normalizedInput.replace(timePortionPattern, "");

        // Parse the date-only portion
        const date = new Date(dateOnlyInput.trim());

        // Validate the parsed date
        if (isNaN(date.getTime())) {
          console.warn(
            `Failed to parse drawCutOff date after time removal: "${dateOnlyInput}" (from original: "${rawCutOff}")`,
          );
          return undefined;
        }

        // Final validation
        if (isNaN(date.getTime())) {
          console.warn(
            `Failed to parse drawCutOff date: "${rawCutOff}" (processed: "${dateOnlyInput}")`,
          );
          return undefined;
        }

        // Sanity check: ensure date is within reasonable range
        const MIN_YEAR = 2015; // Express Entry started in 2015
        const MAX_YEAR = new Date().getFullYear() + 5; // Allow up to 5 years in future
        const year = date.getFullYear();

        if (year < MIN_YEAR || year > MAX_YEAR) {
          console.warn(
            `drawCutOff date outside reasonable range: ${year} (input: "${rawCutOff}")`,
          );
          return undefined;
        }

        return date;
      } catch (error) {
        console.warn(`Error parsing drawCutOff: "${rawCutOff}"`, error);
        return undefined;
      }
    }

    /**
     * Sanitize and parse drawDateTime string with similar logic
     */
    function sanitizeDrawDateTime(rawDateTime: unknown): Date | undefined {
      // Use the same sanitization logic as drawCutOff
      return sanitizeDrawCutOff(rawDateTime);
    }

    /**
     * Sanitize and parse drawDistributionAsOn date string
     */
    function sanitizeDrawDistributionAsOn(rawDate: unknown): Date | undefined {
      if (!rawDate || typeof rawDate !== "string") {
        return undefined;
      }

      // Security and length checks
      const MAX_DATE_STRING_LENGTH = 50; // Shorter for simple date strings
      if (rawDate.length > MAX_DATE_STRING_LENGTH) {
        return undefined;
      }

      try {
        // Simple date parsing for format like "December 14, 2025"
        const date = new Date(rawDate.trim());

        if (isNaN(date.getTime())) {
          return undefined;
        }

        // Sanity check
        const year = date.getFullYear();
        if (year < 2015 || year > new Date().getFullYear() + 5) {
          return undefined;
        }

        return date;
      } catch (error) {
        console.warn(`Error parsing drawDistributionAsOn: "${rawDate}"`, error);
        return undefined;
      }
    }

    // Call sanitization functions to get the sanitized dates
    const drawDateTime = sanitizeDrawDateTime(raw.drawDateTime);
    const drawCutOff = sanitizeDrawCutOff(raw.drawCutOff);
    const drawDistributionAsOn = sanitizeDrawDistributionAsOn(
      raw.drawDistributionAsOn,
    );

    // Debug logging for drawCutOff
    if (raw.drawCutOff) {
      console.log(
        `Draw ${raw.drawNumber}: rawCutOff="${raw.drawCutOff}", parsedCutOff=`,
        drawCutOff,
        `isValid=${drawCutOff && !isNaN(drawCutOff.getTime())}`,
      );
    }

    // Parse score distribution
    const scoreDistribution: Record<string, number> = {};
    let totalCandidates = 0;

    for (let i = 1; i <= 18; i++) {
      const key = `dd${i}` as keyof ExpressEntryDraw;
      const value = raw[key];
      if (value && typeof value === "string") {
        const num = parseInt(value.replace(/,/g, ""), 10);
        if (!isNaN(num)) {
          scoreDistribution[key] = num;
          if (i === 18) {
            totalCandidates = num; // dd18 is total candidates
          }
        }
      }
    }

    return {
      drawNumber,
      drawDate,
      drawDateFull: raw.drawDateFull,
      drawName: raw.drawName,
      drawSize,
      drawCRS,
      drawNumberURL: raw.drawNumberURL,
      mitext: raw.mitext,
      DrawText1: raw.DrawText1,
      drawText2: raw.drawText2,
      drawDateTime:
        drawDateTime && !isNaN(drawDateTime.getTime())
          ? drawDateTime
          : undefined,
      drawCutOff:
        drawCutOff && !isNaN(drawCutOff.getTime()) ? drawCutOff : undefined,
      drawDistributionAsOn:
        drawDistributionAsOn && !isNaN(drawDistributionAsOn.getTime())
          ? drawDistributionAsOn
          : undefined,
      scoreDistribution:
        Object.keys(scoreDistribution).length > 0
          ? scoreDistribution
          : undefined,
      totalCandidates: totalCandidates > 0 ? totalCandidates : undefined,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Failed to parse draw ${raw.drawNumber}`, error);
  }
}

/**
 * Calculate statistics from draws data
 */
export function calculateDrawStatistics(draws: ParsedExpressEntryDraw[]): {
  totalDraws: number;
  totalInvitations: number;
  averageCRS: number;
  lowestCRS: number;
  highestCRS: number;
  latestDraw: ParsedExpressEntryDraw | null;
  averageDrawSize: number;
  drawsThisYear: number;
  invitationsThisYear: number;
} {
  if (draws.length === 0) {
    return {
      totalDraws: 0,
      totalInvitations: 0,
      averageCRS: 0,
      lowestCRS: 0,
      highestCRS: 0,
      latestDraw: null,
      averageDrawSize: 0,
      drawsThisYear: 0,
      invitationsThisYear: 0,
    };
  }

  // Use actual current year for "this year" calculations
  // Note: This may result in zero values if no draws have occurred in the current calendar year yet
  const currentYear = new Date().getFullYear();
  const thisYearDraws = draws.filter(
    (draw) => draw.drawDate.getFullYear() === currentYear,
  );

  // Find latest draw by drawNumber
  const latestDraw = draws.reduce((latest, draw) =>
    !latest || draw.drawNumber > latest.drawNumber ? draw : latest,
  );

  const totalInvitations = draws.reduce((sum, draw) => sum + draw.drawSize, 0);
  const thisYearInvitations = thisYearDraws.reduce(
    (sum, draw) => sum + draw.drawSize,
    0,
  );

  const crsScores = draws.map((draw) => draw.drawCRS);
  const totalCRS = crsScores.reduce((sum, crs) => sum + crs, 0);

  // Calculate total draws including skipped draw numbers
  // This accounts for draws that were cancelled or skipped in the sequence
  const drawNumbers = draws.map((draw) => draw.drawNumber);
  const minDrawNumber = Math.min(...drawNumbers);
  const maxDrawNumber = Math.max(...drawNumbers);
  const totalDrawsIncludingSkipped = maxDrawNumber - minDrawNumber + 1;

  return {
    totalDraws: totalDrawsIncludingSkipped,
    totalInvitations,
    averageCRS: totalCRS / draws.length,
    lowestCRS: Math.min(...crsScores),
    highestCRS: Math.max(...crsScores),
    latestDraw,
    averageDrawSize: totalInvitations / draws.length,
    drawsThisYear: thisYearDraws.length,
    invitationsThisYear: thisYearInvitations,
  };
}

/**
 * Factory function to create DataFetcher instance with proxy fallback support
 */
export function createDataFetcher(urls?: string[], clock?: Clock): DataFetcher {
  return new HttpDataFetcher(urls, clock);
}

/**
 * Utility to check if data appears to be valid Express Entry data
 */
export function validateExpressEntryData(
  data: unknown,
): data is ExpressEntryResponse {
  try {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.rounds)) return false;
    if (obj.rounds.length === 0) return false;

    // Check first draw has required fields
    const firstDraw = obj.rounds[0];
    const required = [
      "drawNumber",
      "drawDate",
      "drawName",
      "drawSize",
      "drawCRS",
    ];

    return required.every(
      (field) =>
        typeof (firstDraw as Record<string, unknown>)[field] === "string",
    );
  } catch {
    return false;
  }
}
