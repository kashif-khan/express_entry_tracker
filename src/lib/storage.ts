/**
 * Simple storage implementation using localStorage as fallback
 * This simplified version avoids IndexedDB complexity for initial implementation
 */

import type {
  DrawRepository,
  ParsedExpressEntryDraw,
} from "@/types/express-entry";
import { StorageError } from "@/types/express-entry";

/**
 * Simple localStorage-based repository implementation
 */
export class SimpleDrawRepository implements DrawRepository {
  private readonly STORAGE_KEY = "expressEntryTracker_draws";

  private getData(): ParsedExpressEntryDraw[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);
      // Ensure dates are properly parsed
      return data.map((draw: any) => ({
        ...draw,
        drawDate: new Date(draw.drawDate),
        drawDateTime: draw.drawDateTime
          ? new Date(draw.drawDateTime)
          : undefined,
        drawCutOff: draw.drawCutOff ? new Date(draw.drawCutOff) : undefined,
        drawDistributionAsOn: draw.drawDistributionAsOn
          ? new Date(draw.drawDistributionAsOn)
          : undefined,
      }));
    } catch {
      return [];
    }
  }

  private setData(draws: ParsedExpressEntryDraw[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(draws));
    } catch (error) {
      throw new StorageError("Failed to save to localStorage", error);
    }
  }

  async getAllDraws(): Promise<ParsedExpressEntryDraw[]> {
    const draws = this.getData();
    return draws.sort((a, b) => b.drawNumber - a.drawNumber);
  }

  async getLatestDraw(): Promise<ParsedExpressEntryDraw | null> {
    const draws = this.getData();
    return draws.length > 0
      ? draws.reduce((latest, draw) =>
          draw.drawNumber > latest.drawNumber ? draw : latest,
        )
      : null;
  }

  async upsertDraw(draw: ParsedExpressEntryDraw): Promise<void> {
    const draws = this.getData();
    const index = draws.findIndex((d) => d.drawNumber === draw.drawNumber);

    if (index >= 0) {
      draws[index] = draw;
    } else {
      draws.push(draw);
    }

    this.setData(draws);
  }

  async upsertDraws(draws: ParsedExpressEntryDraw[]): Promise<void> {
    const existing = this.getData();
    const drawMap = new Map(existing.map((d) => [d.drawNumber, d]));

    // Update/add new draws
    draws.forEach((draw) => {
      drawMap.set(draw.drawNumber, draw);
    });

    this.setData(Array.from(drawMap.values()));
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new StorageError("Failed to clear localStorage", error);
    }
  }
}

/**
 * Factory function to create DrawRepository instance
 */
export function createDrawRepository(): DrawRepository {
  return new SimpleDrawRepository();
}
