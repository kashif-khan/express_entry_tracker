/**
 * TypeScript types for Express Entry draw data based on express-entry-schema.json
 */

/** Score distribution data with number of candidates per CRS score range */
export interface CRSScoreDistribution {
  /** CRS score 600 and above */
  dd1?: string;
  /** CRS score 501-600 */
  dd2?: string;
  /** CRS score 451-500 */
  dd3?: string;
  /** CRS score 401-450 */
  dd4?: string;
  /** CRS score 351-400 */
  dd5?: string;
  /** CRS score 301-350 */
  dd6?: string;
  /** CRS score 251-300 */
  dd7?: string;
  /** CRS score 201-250 */
  dd8?: string;
  /** CRS score 151-200 */
  dd9?: string;
  /** CRS score 101-150 */
  dd10?: string;
  /** CRS score 51-100 */
  dd11?: string;
  /** CRS score 1-50 */
  dd12?: string;
  /** CRS score 0 */
  dd13?: string;
  /** Additional score ranges (varies by draw) */
  dd14?: string;
  dd15?: string;
  dd16?: string;
  dd17?: string;
  /** Total candidates in pool */
  dd18?: string;
}

/** Individual Express Entry draw round information */
export interface ExpressEntryDraw extends CRSScoreDistribution {
  /** Unique sequential identifier number for the Express Entry draw */
  drawNumber: string;
  /** HTML anchor tag with hyperlink to the official IRCC draw details page */
  drawNumberURL?: string;
  /** Date when the Express Entry draw was conducted (YYYY-MM-DD format) */
  drawDate: string;
  /** Human-readable formatted date of the draw */
  drawDateFull?: string;
  /** Category or type of draw (e.g., 'French language proficiency', 'All programs') */
  drawName: string;
  /** Total number of Invitations to Apply (ITAs) issued in this draw */
  drawSize: string;
  /** Minimum Comprehensive Ranking System (CRS) score required */
  drawCRS: string;
  /** HTML link to the official Ministerial Instruction document */
  mitext?: string;
  /** HTML link to view the complete text of the Ministerial Instruction */
  DrawText1?: string;
  /** List of immigration programs included in this draw */
  drawText2?: string;
  /** Precise date and time when the draw was conducted (UTC) */
  drawDateTime?: string;
  /** Cut-off date and time for Express Entry profile creation eligibility (UTC) */
  drawCutOff?: string;
  /** Date when the CRS score distribution snapshot was captured (YYYY-MM-DD) */
  drawDistributionAsOn?: string;
}

/** Express Entry draws response from IRCC API */
export interface ExpressEntryResponse {
  /** CSS class name for styling the data table */
  classes?: string;
  /** Array of Express Entry invitation rounds/draws */
  rounds: ExpressEntryDraw[];
}

/** Parsed draw with numeric fields for calculations */
export interface ParsedExpressEntryDraw {
  drawNumber: number;
  drawDate: Date;
  drawDateFull?: string;
  drawName: string;
  drawSize: number;
  drawCRS: number;
  drawNumberURL?: string;
  mitext?: string;
  DrawText1?: string;
  drawText2?: string;
  drawDateTime?: Date;
  drawCutOff?: Date;
  drawDistributionAsOn?: Date;
  scoreDistribution?: {
    [key: string]: number;
  };
  totalCandidates?: number;
}

/** Feature flag configuration */
export type FeatureFlag =
  | "FEATURE_TABLE_DRAG"
  | "FEATURE_TABLE_RESIZE"
  | "FEATURE_STATS_ANIMATIONS"
  | "FEATURE_A11Y_CHECKS";

/** Feature flag state */
export type FeatureFlagValue = "on" | "off";

/** Table sorting configuration */
export interface SortConfig {
  key: keyof ParsedExpressEntryDraw;
  direction: "asc" | "desc";
}

/** Table filter configuration */
export interface FilterConfig {
  column: keyof ParsedExpressEntryDraw;
  value: string;
  type: "text" | "checkbox" | "number" | "date";
}

/** Pagination configuration */
export interface PaginationConfig {
  page: number;
  pageSize: number | "all";
  total: number;
}

/** Statistics derived from draw data */
export interface DrawStatistics {
  totalDraws: number;
  totalInvitations: number;
  averageCRS: number;
  lowestCRS: number;
  highestCRS: number;
  latestDraw: ParsedExpressEntryDraw | null;
  averageDrawSize: number;
  drawsThisYear: number;
  invitationsThisYear: number;
}

/** Repository interface for data persistence (SOLID - Interface Segregation) */
export interface DrawRepository {
  getAllDraws(): Promise<ParsedExpressEntryDraw[]>;
  getLatestDraw(): Promise<ParsedExpressEntryDraw | null>;
  upsertDraw(draw: ParsedExpressEntryDraw): Promise<void>;
  upsertDraws(draws: ParsedExpressEntryDraw[]): Promise<void>;
  clear(): Promise<void>;
}

/** Data fetcher interface (SOLID - Dependency Inversion) */
export interface DataFetcher {
  fetchDraws(): Promise<ExpressEntryResponse>;
}

/** Clock interface for testability (SOLID - Dependency Inversion) */
export interface Clock {
  now(): Date;
}

/** Error types for better error handling */
export class DataFetchError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataFetchError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
