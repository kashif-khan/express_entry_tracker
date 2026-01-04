/**
 * @jest-environment jsdom
 */

import {
  HttpDataFetcher,
  parseExpressEntryDraw,
  calculateDrawStatistics,
  validateExpressEntryData,
} from "@/lib/data-service";
import {
  ValidationError,
  DataFetchError,
} from "@/types/express-entry";
import type {
  ExpressEntryDraw,
  ExpressEntryResponse,
} from "@/types/express-entry";

// Mock fetch globally
global.fetch = jest.fn();

describe("HttpDataFetcher", () => {
  let dataFetcher: HttpDataFetcher;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    dataFetcher = new HttpDataFetcher();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  describe("fetchDraws", () => {
    const mockResponse: ExpressEntryResponse = {
      classes: "wb-tables",
      rounds: [
        {
          drawNumber: "123",
          drawDate: "2023-12-01",
          drawDateFull: "December 1, 2023",
          drawName: "No Program Specified",
          drawSize: "1000",
          drawCRS: "480",
        },
        {
          drawNumber: "124",
          drawDate: "2023-12-15",
          drawDateFull: "December 15, 2023",
          drawName: "Canadian Experience Class",
          drawSize: "800",
          drawCRS: "475",
        },
      ],
    };

    it("should successfully fetch and return draws data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
        status: 200,
        statusText: "OK",
      } as Response);

      const result = await dataFetcher.fetchDraws();

      expect(result.rounds).toHaveLength(2);
      expect(result.rounds[0].drawNumber).toBe("123");
    });

    it("should throw DataFetchError on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(dataFetcher.fetchDraws()).rejects.toThrow(DataFetchError);
    });

    it("should throw DataFetchError on non-200 HTTP status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(dataFetcher.fetchDraws()).rejects.toThrow(DataFetchError);
    });

    it("should throw ValidationError on invalid JSON structure", async () => {
      const invalidData = { invalid: "structure" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(invalidData),
        status: 200,
        statusText: "OK",
      } as Response);

      await expect(dataFetcher.fetchDraws()).rejects.toThrow(ValidationError);
    });

    it("should skip invalid draws and return valid ones", async () => {
      const responseWithInvalidDraw: ExpressEntryResponse = {
        classes: "wb-tables",
        rounds: [
          {
            drawNumber: "123",
            drawDate: "2023-12-01",
            drawDateFull: "December 1, 2023",
            drawName: "No Program Specified",
            drawSize: "1000",
            drawCRS: "480",
          },
          {
            drawNumber: "91b",
            drawDate: "2023-12-15",
            drawDateFull: "December 15, 2023",
            drawName: "Invalid Draw",
            drawSize: "800",
            drawCRS: "475",
          },
          {
            drawNumber: "125",
            drawDate: "2023-12-20",
            drawDateFull: "December 20, 2023",
            drawName: "Another Valid Draw",
            drawSize: "900",
            drawCRS: "485",
          },
        ],
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(responseWithInvalidDraw),
        status: 200,
        statusText: "OK",
      } as Response);

      const result = await dataFetcher.fetchDraws();

      expect(result.rounds).toHaveLength(2);
      expect(result.rounds[0].drawNumber).toBe("123");
      expect(result.rounds[1].drawNumber).toBe("125");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipping invalid draw"),
        expect.anything(),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should throw ValidationError when all draws are invalid", async () => {
      const responseWithAllInvalid: ExpressEntryResponse = {
        classes: "wb-tables",
        rounds: [
          {
            drawNumber: "91b",
            drawDate: "2023-12-15",
            drawDateFull: "December 15, 2023",
            drawName: "Invalid Draw",
            drawSize: "800",
            drawCRS: "475",
          },
        ],
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(responseWithAllInvalid),
        status: 200,
        statusText: "OK",
      } as Response);

      await expect(dataFetcher.fetchDraws()).rejects.toThrow(ValidationError);
      await expect(dataFetcher.fetchDraws()).rejects.toThrow(
        "No valid draws found",
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

describe("parseExpressEntryDraw", () => {
  it("should parse valid draw data correctly", () => {
    const rawDraw: ExpressEntryDraw = {
      drawNumber: "123",
      drawDate: "2023-12-01",
      drawDateFull: "December 1, 2023",
      drawName: "No Program Specified",
      drawSize: "1,000",
      drawCRS: "480",
    };

    const parsed = parseExpressEntryDraw(rawDraw);

    expect(parsed.drawNumber).toBe(123);
    expect(parsed.drawDate).toBeInstanceOf(Date);
    expect(parsed.drawSize).toBe(1000);
    expect(parsed.drawCRS).toBe(480);
  });

  it("should throw ValidationError on invalid drawNumber", () => {
    const rawDraw: ExpressEntryDraw = {
      drawNumber: "91b",
      drawDate: "2023-12-01",
      drawDateFull: "December 1, 2023",
      drawName: "Invalid",
      drawSize: "1000",
      drawCRS: "480",
    };

    expect(() => parseExpressEntryDraw(rawDraw)).toThrow(ValidationError);
    expect(() => parseExpressEntryDraw(rawDraw)).toThrow(/Invalid drawNumber/);
  });
});

describe("calculateDrawStatistics", () => {
  it("should calculate correct statistics", () => {
    const draws = [
      {
        drawNumber: 123,
        drawDate: new Date("2025-01-01"),
        drawDateFull: "January 1, 2025",
        drawName: "Test",
        drawSize: 1000,
        drawCRS: 480,
      },
      {
        drawNumber: 124,
        drawDate: new Date("2025-01-15"),
        drawDateFull: "January 15, 2025",
        drawName: "Test",
        drawSize: 800,
        drawCRS: 475,
      },
    ];

    const stats = calculateDrawStatistics(draws);

    expect(stats.totalDraws).toBe(2);
    expect(stats.totalInvitations).toBe(1800);
    expect(stats.averageCRS).toBe(477.5);
    expect(stats.lowestCRS).toBe(475);
    expect(stats.highestCRS).toBe(480);
    expect(stats.latestDraw?.drawNumber).toBe(124);
  });

  it("should handle empty array", () => {
    const stats = calculateDrawStatistics([]);

    expect(stats.totalDraws).toBe(0);
    expect(stats.totalInvitations).toBe(0);
    expect(stats.latestDraw).toBeNull();
  });
});

describe("validateExpressEntryData", () => {
  it("should return true for valid data", () => {
    const validData: ExpressEntryResponse = {
      classes: "wb-tables",
      rounds: [
        {
          drawNumber: "123",
          drawDate: "2023-12-01",
          drawDateFull: "December 1, 2023",
          drawName: "Test",
          drawSize: "1000",
          drawCRS: "480",
        },
      ],
    };

    expect(validateExpressEntryData(validData)).toBe(true);
  });

  it("should return false for invalid data", () => {
    expect(validateExpressEntryData(null)).toBe(false);
    expect(validateExpressEntryData({})).toBe(false);
    expect(validateExpressEntryData({ rounds: "not an array" })).toBe(false);
    expect(validateExpressEntryData({ rounds: [] })).toBe(false);
  });
});
