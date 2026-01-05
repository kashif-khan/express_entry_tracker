# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Express Entry Tracker is a Progressive Web App (PWA) for tracking Canadian immigration Express Entry draws. Built with Next.js 14 App Router, TypeScript, and Tailwind CSS, it fetches data from IRCC's official JSON endpoint, stores it locally, and provides an interactive table with advanced filtering, sorting, and statistics.

**Live Site**: https://kashif-khan.github.io/express_entry_tracker/

## Common Commands

### Development
```bash
npm ci                    # Install dependencies (preferred for CI consistency)
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build (outputs to .next/)
npm run start            # Serve production build
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without writing
npm run type-check       # TypeScript type checking without build
```

### Testing
```bash
# Unit tests (Jest + Testing Library)
npm test                             # Run all tests
npm test -- --watch                  # Watch mode
npm test -- -t "test name"          # Run specific test by name
npm test -- path/to/file.test.tsx   # Run specific file
npm run test:coverage                # Generate coverage report

# E2E tests (Cypress)
npm run cypress:open                 # Interactive mode
npm run cypress:run                  # Headless mode
npm run cypress:run -- --spec cypress/e2e/main-page.cy.ts  # Single spec
```

### Deployment
```bash
npm run deploy:gh        # Build and deploy to GitHub Pages
npm run generate-icons   # Generate PWA icon files
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router) with static export
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with PostCSS
- **Animations**: anime.js for count-up statistics
- **Storage**: localStorage (previously IndexedDB, migrated to SimpleDrawRepository)
- **Testing**: Jest + React Testing Library (unit), Cypress (e2e)
- **Deployment**: GitHub Pages via static export

### Data Flow Architecture

```
IRCC API (canada.ca)
    ↓
HttpDataFetcher (with CORS proxy fallback)
    ↓
Data Validation & Parsing (parseExpressEntryDraw)
    ↓
SimpleDrawRepository (localStorage)
    ↓
useDraws Hook (state management, polling)
    ↓
Page Component (orchestrator)
    ├→ TimelineFilter
    ├→ AnimatedStats (8 stat cards with anime.js)
    └→ DataTable (advanced interactive table)
```

### Key Components

**useDraws Hook** (`src/hooks/useDraws.ts`)
- Core state management for draws, statistics, loading/error states
- Initial load: Displays cached data immediately, fetches fresh data in background
- Polling: Auto-refreshes every 1 hour (configurable via `CONFIG.DEFAULT_POLL_INTERVAL_MS`)
- Methods: `refetch()`, `clearCache()`

**HttpDataFetcher** (`src/lib/data-service.ts`)
- Implements `DataFetcher` interface (dependency inversion)
- CORS proxy fallback: Tries 5 different proxies sequentially
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Validation: Validates each draw, skips invalid ones, logs warnings

**parseExpressEntryDraw** (`src/lib/data-service.ts`)
- Parses and validates raw API data
- Security: Sanitizes strings, detects XSS patterns (`<script>`, `javascript:`, etc.)
- Date validation: Checks format, range (2015 to current year + 5)
- Numeric parsing: Converts comma-separated strings to numbers

**SimpleDrawRepository** (`src/lib/storage.ts`)
- Uses localStorage with JSON serialization
- Methods: `getAllDraws()`, `getLatestDraw()`, `upsertDraw()`, `upsertDraws()`, `clear()`
- Implements `DrawRepository` interface for dependency injection

**DataTable** (`src/components/DataTable.tsx`)
- Resizable columns (drag to resize)
- Multi-column sorting
- Multi-select filtering with typeahead search
- Pagination: 10, 25, 50, 100, or all rows
- Full keyboard navigation (Home, End, Escape, Space)
- Screen reader support with `aria-live` announcements
- Feature flags: `FEATURE_TABLE_RESIZE`, `FEATURE_TABLE_DRAG`

**AnimatedStats** (`src/components/AnimatedStats.tsx`)
- 8 statistics cards with count-up animations
- Intersection Observer for lazy animation triggering
- Respects `prefers-reduced-motion` system preference
- Feature flag: `FEATURE_STATS_ANIMATIONS`

### Feature Flags System

Three-level hierarchy for each flag:
1. Runtime override (localStorage) - highest priority
2. Build-time env var (`NEXT_PUBLIC_FEATURE_*`)
3. Default value in `config.ts`

**Available Flags**:
- `FEATURE_TABLE_DRAG` - Column dragging
- `FEATURE_TABLE_RESIZE` - Column resizing
- `FEATURE_STATS_ANIMATIONS` - Count-up animations
- `FEATURE_A11Y_CHECKS` - Accessibility validation

**Usage**:
```typescript
import { getFeatureFlag } from '@/lib/config';
const isEnabled = getFeatureFlag('FEATURE_TABLE_RESIZE') === 'on';
```

### Configuration Constants

All configuration lives in `src/lib/config.ts`:
```typescript
CONFIG = {
  DEFAULT_POLL_INTERVAL_MS: 3_600_000,    // 1 hour
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  IRCC_DATA_URL: "https://www.canada.ca/.../ee_rounds_123_en.json",
  CORS_PROXIES: [...5 fallback options...],
  TABLE: { DEFAULT_PAGE_SIZE: 25, ... },
  ANIMATIONS: { COUNT_UP_DURATION: 2000, ... }
}
```

### Data Schema

The IRCC API returns data matching `express-entry-schema.json`:
- Required fields: `drawNumber`, `drawDate`, `drawName`, `drawSize`, `drawCRS`
- All numeric fields are strings with commas (e.g., "1,234")
- All date fields use YYYY-MM-DD format
- CRS score distribution: `dd1` through `dd18` fields

### SOLID Principles Implementation

**Dependency Inversion**:
- `DataFetcher` interface → `HttpDataFetcher` implementation
- `DrawRepository` interface → `SimpleDrawRepository` implementation
- `Clock` interface → Testable time operations

**Single Responsibility**:
- Data fetching: `HttpDataFetcher`
- Data parsing: `parseExpressEntryDraw`
- Storage: `SimpleDrawRepository`
- Statistics: `calculateDrawStatistics`
- UI components: Separate concerns (table, stats, filters)

## GitHub Pages Deployment

The app conditionally sets `basePath` and `assetPrefix` for GitHub Pages:

**next.config.js**:
```javascript
{
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Only set for GitHub Pages builds
  ...(isProd && isGitHubPages && {
    basePath: '/express_entry_tracker',
    assetPrefix: '/express_entry_tracker/',
  })
}
```

**Local dev**: Runs on `localhost:3000` without base path
**GitHub Pages**: Runs on `kashif-khan.github.io/express_entry_tracker/`
**Detection**: Via `GITHUB_PAGES=true` environment variable

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
- Trigger: Push to main or manual dispatch
- Build: Node.js 24, `npm ci`, `npm run build` with `GITHUB_PAGES=true`
- Deploy: Uploads `./out` to GitHub Pages environment

## Testing Strategy

### Unit Tests (Jest)
- **Location**: `src/__tests__/`
- **Coverage targets**: 70% (branches, functions, lines, statements)
- **Key test files**:
  - `data-service.test.ts`: Fetching, parsing, validation, error handling
  - `useDraws.test.ts`: Hook state management, caching, polling

### E2E Tests (Cypress)
- **Location**: `cypress/e2e/main-page.cy.ts`
- **Coverage**:
  - Page structure and accessibility (axe checks)
  - Statistics animations and ARIA labels
  - Table interactions (sort, filter, paginate, select, keyboard nav)
  - Error handling (API failures, offline mode, cache fallback)
  - Feature flag behavior

### Mocking
- Global `fetch` mocking in Jest
- `localStorage` mocking for jsdom
- Cypress `cy.intercept()` for API stubbing

## Accessibility

**ARIA Attributes**:
- `aria-label`, `aria-labelledby`, `aria-describedby` for context
- `aria-live="polite"` for dynamic announcements
- `aria-sort`, `aria-expanded`, `aria-haspopup` for table states

**Keyboard Navigation**:
- `Ctrl+Home/End`: Navigate to table edges
- `Escape`: Clear selections
- `Space`: Toggle row selection
- `Tab/Shift+Tab`: Standard focus navigation

**Reduced Motion**:
- Detects `prefers-reduced-motion` media query
- Disables animations when user preference is set

**Semantic HTML**:
- Proper heading hierarchy
- Native `<table>`, `<button>`, `<label>` elements

## Security Patterns

**Input Validation**:
- Strict date format validation (YYYY-MM-DD with regex)
- Numeric field validation
- Required field checks

**XSS Prevention**:
- Sanitization of all input strings
- Detection of malicious patterns
- String length limits (200 chars for dates)
- No use of `dangerouslySetInnerHTML`

**DoS Prevention**:
- Request timeouts (30 seconds)
- Retry limits (3 attempts)
- String length constraints

## Performance Optimizations

**Memoization**:
- `useMemo` for filtered data and statistics calculations
- `useCallback` for event handlers
- Prevents unnecessary re-renders

**Lazy Loading**:
- Intersection Observer for stat animations
- Triggers only when elements are visible

**Caching**:
- localStorage for offline support
- One-hour polling interval to reduce API load
- Cache-first, network-second strategy

**Pagination**:
- Default 25 rows per page
- Options: 10, 25, 50, 100, or all

## Progressive Web App (PWA)

**Manifest** (`public/manifest.json`):
- App name: "Express Entry Tracker"
- Display mode: standalone
- Icons: 192x192 and 512x512 PNG
- Relative paths with `.` for scope/start_url (GitHub Pages compatibility)

**Service Worker** (`public/sw.js`):
- Cache-first strategy with network fallback
- Caches essential resources
- Cleans up old caches on activation

**Registration** (`src/components/ServiceWorkerRegistration.tsx`):
- Client component that registers service worker on mount
- Console logging for debugging

## Code Style

**Imports**:
- Use `@/*` alias for src imports
- Group: external libs, absolute app modules, relative modules, types

**Naming**:
- Components: PascalCase (`DataTable.tsx`)
- Hooks/utilities: camelCase (`useDraws.ts`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_POLL_INTERVAL_MS`)

**TypeScript**:
- Strict mode enabled
- Avoid `any`, prefer `unknown` with type guards
- Define shared types in `src/types/`

**React/Next.js**:
- Use `"use client"` only where needed (state, effects, browser APIs)
- Keep data presentation SSR-friendly
- Clean up timers/subscriptions in `useEffect`

## Important Notes from AGENTS.md

**Data Source**: Always use CORS proxy for the IRCC endpoint (configured in `config.ts`)
**Latest Draw**: Determined by max `drawNumber`
**Default Sort**: Table sorts by `drawNumber` descending
**Polling**: User-configurable interval, persisted in localStorage
**Validation**: All API data must be validated against schema before storage

**When adding features**:
- Add feature flag in `config.ts` with safe default
- Support runtime toggles via localStorage
- Respect SOLID principles (dependency injection, single responsibility)
- Maintain accessibility (keyboard nav, ARIA, reduced motion)
- Write unit and e2e tests
- Update this file if architecture changes
