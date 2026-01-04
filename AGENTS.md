# AGENTS.md

This repository is a static Progressive Web App for tracking IRCC Express Entry draws. The stack is Next.js (TypeScript) for the application framework, anime.js for animated statistics, IndexedDB for local persistence, and hybrid browser tests (Jest + Cypress/Selenium). The app periodically fetches JSON from `https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json`, validates and upserts entries to IndexedDB, and highlights the latest draw. The main page presents animated statistics and a data table with resizable columns, rearrangement, typeahead filters, checkbox filters, paging (including show-all), sorting, and default descending sort by `drawNumber`.

Use this document as guidance for agentic coding assistants operating in this repo.

**Scope**

- Applies to the entire repository.
- If directory-specific rules are added later, those supersede conflicting items within their scope.

**Cursor/Copilot Rules**

- No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No Copilot instructions found at `.github/copilot-instructions.md`.
- If such files are added later, integrate their guidance and prefer them for style or behavior specifics.

**Project Setup**

- Initialize: `npx create-next-app@latest express_entry_tracker` with recommended defaults:
  - TypeScript: Yes
  - ESLint: Yes
  - Tailwind CSS: Yes
  - `src/` directory: Yes
  - App Router: Yes
  - Import alias (`@/*`): Yes
- Framework: Next.js with App Router. Static export for hosting (`next export`).
- Language: TypeScript for all application code.
- Styling: Tailwind CSS (from Next.js defaults); maintain consistent utility patterns.
- Animations: anime.js for statistic visualizations.
- Persistence: IndexedDB (via `idb`, Dexie, or native API).
- Testing: Jest + Testing Library for unit; Cypress (primary) and Selenium (optional) for hybrid browser tests.
- Hosting: GitHub Pages at `https://<username>.github.io/express_entry_tracker` via static export.

**SOLID Principles**

- Single Responsibility: each module/component handles one reason to change.
- Open/Closed: extend features (new columns/filters) without modifying core logic.
- Liskov Substitution: prefer interfaces/abstract types; interchangeable implementations (e.g., storage adapters).
- Interface Segregation: small, focused interfaces (e.g., `DrawRepository`, `Clock`).
- Dependency Inversion: depend on abstractions; inject implementations (fetcher, db, clock) for testability.

**Commands**

- Install: `npm ci` (or `npm install` if CI cache unavailable)
- Dev server: `npm run dev` (Next.js local development)
- Build: `npm run build` (Next.js production build)
- Start: `npm run start` (serve built app)
- Static export: `npm run export` (writes to `out/`)
- Lint: `npm run lint` (ESLint)
- Format check: `npm run format:check` (Prettier dry-run)
- Format write: `npm run format` (Prettier write)
- Type check: `npm run type-check` (tsc, if defined)
- Unit tests (all): `npm test` or `npm run test`
- Unit tests (watch): `npm run test -- --watch`
- Single unit test by name: `npm run test -- -t "<name or regex>"`
- Single unit test file: `npm run test -- path/to/file.test.tsx`
- Coverage: `npm run test -- --coverage`
- Cypress open (interactive): `npm run cypress:open`
- Cypress run (headless): `npm run cypress:run`
- Cypress single spec: `npm run cypress:run -- --spec cypress/e2e/<spec>.cy.ts`
- Selenium (example): `npm run selenium:test` (bootstrap WebDriver)
- Deploy (GitHub Pages): `npm run deploy:gh` (publish `out/` to `gh-pages`)

If scripts do not yet exist, agents should add minimal `package.json` scripts matching these names when implementing related features.

**GitHub Pages Deployment**

- Configure `next.config.js` for export + Pages:
  - `output: 'export'`, `images: { unoptimized: true }`
  - `basePath: '/express_entry_tracker'`, `assetPrefix: '/express_entry_tracker/'`
- Export: `npm run build && npm run export` (outputs to `out/`).
- Publish options (choose one):
  - `gh-pages` package: push `out/` to `gh-pages` branch via `npm run deploy:gh`.
  - Or GitHub Pages from `/docs`: copy `out/` to `docs/` on `main`.
- Verify site at `https://<username>.github.io/express_entry_tracker`.

**Commit Messages**

- Include what features were implemented and what bugs were fixed; explain why when helpful.
- Suggested format:
  - Title: `feat(table): resizable columns and typeahead filters`
  - Body:
    - `Features: column resize, drag-reorder, typeahead per column`
    - `Fixes: debounce filter input to prevent jank`
    - `Why: improves usability and performance under large datasets`
- Avoid committing secrets or `.env.local`.

**Configuration & Feature Flags**

- All major features should be toggleable:
  - Env flags: `NEXT_PUBLIC_FEATURE_<NAME>=on|off` for build-time defaults.
  - Runtime flags: `lib/config.ts` exposes `getFeatureFlag(name)`; overrides via IndexedDB/localStorage.
  - UI: optional Settings panel to toggle flags; persist changes locally.
- Examples: `FEATURE_TABLE_DRAG`, `FEATURE_TABLE_RESIZE`, `FEATURE_STATS_ANIMATIONS`, `FEATURE_A11Y_CHECKS`.
- Flags must be typed (string literal union) and safe by default.

**Data Fetching & Persistence Rules**

- Source: `https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json`
- Polling: user-configurable interval; default 1–6 hours. Persist the interval in local storage or IndexedDB.
- Networking: Use `fetch` with robust error handling and backoff on failure. Respect CORS.
- Data schema: Align to `express-entry-schema.json` at repo root when present. Validate before storing.
- Persistence: Store full set in IndexedDB. Use an object store keyed by `drawNumber`. Deduplicate on insert.
- Latest draw: Determine by max `drawNumber`. Always highlight the latest entry in UI.

**Data Table Requirements**

- Columns: resizable and draggable for rearrangement.
- Filters: typeahead and checkbox filters per column.
- Paging: include page size options and show-all. Maintain state in URL or local state.
- Sorting: default sort is descending on `drawNumber`. Support multi-sort if feasible.
- Accessibility: keyboard operable resizing/rearrangement; ARIA attributes; focus visible.

**anime.js Usage**

- Use anime.js for count-up and chart-like animations of statistics.
- Keep animations performant; avoid layout thrashing.
- Provide reduced-motion support via `prefers-reduced-motion` and disable or dampen animations accordingly.

**Code Style**

- Imports:
  - Use absolute imports via `tsconfig.json` paths where configured, otherwise relative with minimal `../` depth.
  - Group imports: external libs, absolute app modules, relative modules, types, styles.
  - Side-effect imports only where necessary (e.g., global CSS).
- Formatting:
  - Use Prettier defaults with 2-space indent, semicolons, single quotes, trailing commas where valid.
  - Keep line length ~100–120 chars; break long chains.
- Types:
  - Strict TypeScript (`strict` true). Avoid `any`; prefer specific types.
  - Define shared types in `types/` or co-located `*.types.ts`.
  - Use `unknown` over `any` for external inputs and narrow via type guards.
- Naming:
  - Components: PascalCase (`LatestDrawCard`).
  - Hooks/utilities: camelCase (`useLatestDraw`, `formatDate`).
  - Files: kebab-case for non-components; Component files PascalCase (`components/LatestDrawCard.tsx`).
  - Constants: UPPER_SNAKE_CASE (`DEFAULT_POLL_INTERVAL_MS`).
- React/Next.js:
  - Prefer Client Components only where needed (IndexedDB, animations); keep data presentation SSR-friendly.
  - Use `useEffect` for polling and persistence; clean up timers.
  - Separate UI and data logic; avoid heavy work in render.
- Error Handling:
  - Wrap fetch in try/catch; surface user-friendly errors and retry/backoff.
  - Log errors with context; avoid console noise in production.
  - Guard IndexedDB operations; detect availability and degrade gracefully.
- Accessibility:
  - Provide labels, roles, ARIA attributes, focus states.
  - Ensure color contrast and keyboard navigation for table interactions.
  - Respect reduced motion.
- Security:
  - Treat fetched JSON as untrusted; validate schema.
  - Avoid `dangerouslySetInnerHTML` unless sanitized.
  - No secrets in repo; configure environment via `.env.local`.

**Testing**

- Unit tests:
  - Use Jest + Testing Library for React components and hooks.
  - Test IndexedDB logic with mocks or `fake-indexeddb`.
  - Snapshot sparingly; prefer behavior assertions.
- Single test:
  - `npm run test -- -t "LatestDraw"` matches test names.
  - Or run a single file: `npm run test -- components/LatestDrawCard.test.tsx`.
- E2E (Cypress):
  - Cover table interactions (resize, rearrange, filters, paging, sorting).
  - Verify latest draw highlighting and animation starts.
  - Use `cy.intercept` to mock the IRCC JSON when offline or to stabilize tests.
- Selenium:
  - Optional additional cross-browser checks; keep scripts minimal and non-flaky.
- Performance & a11y:
  - Consider `@axe-core/react` in tests for a11y checks.
  - Measure animation frame impact if applicable.

**Project Structure (suggested)**

- `app/` or `pages/` for Next.js routes.
- `components/` for UI components.
- `hooks/` for custom hooks.
- `lib/` for utilities (fetch, db, feature flags, config).
- `types/` for TypeScript types.
- `tests/` for unit tests; `cypress/` for E2E.

**IndexedDB Guidance**

- Use a single database (e.g., `ee-tracker-db`) with store `draws` keyed by `drawNumber`.
- On fetch, upsert entries and maintain an index on date if needed.
- Expose a hook `useDraws()` returning `{ draws, latestDraw }`.

**Agents and Roles**

- Documentation Agent (Markdown):
  - Maintain `README.md`, usage docs, and this `AGENTS.md`.
  - Ensure instructions for build/test/lint/deploy are current.
- Code Documentation Agent:
  - Add JSDoc/TSDoc to functions, components, and public APIs.
  - Keep type comments aligned with definitions in `types/`.
- Test Agent:
  - Write Jest unit tests and Cypress specs.
  - Provide commands for single-test runs and CI pipeline guidance.
- Security Agent:
  - Review data handling, input validation, and dependencies.
  - Flag unsafe patterns (XSS, unsanitized HTML, insecure storage).
- Accessibility Agent:
  - Audit components for ARIA roles, keyboard navigation, and contrast.
  - Integrate a11y checks into tests where feasible.
- Policy Agent (Terms & Usage):
  - Maintain Terms of Use, Privacy, and disclaimers pages; ensure accessible presentation and link visibility.
  - Validate data-use disclaimers and attribution; coordinate consent/cookies if added.
- Shortcuts Agent (Power Users):
  - Add keyboard shortcuts (with `aria-keyshortcuts`), help overlay, focus management, and conflict-safe bindings.
  - Ensure discoverability (hint in UI), toggles via feature flags, and a11y-safe fallbacks.
- Project Manager Agent:
  - Delegate tasks to agents above; enforce SOLID and feature flag discipline.
  - Track scope for PWA features, anime.js integrations, table functionality, testing, and releases.

**CI/CD Notes**

- On PRs: run lint, type-check, unit tests, and Cypress.
- Cache `node_modules` or use `npm ci` for reproducibility.
- Upload Cypress videos/screenshots on failures to assist debugging.
- Pages deploy: on `main` tag or manual, export and publish `out/` to `gh-pages` or `docs/`.

**Environment & Config**

- `.env.local` for local-only variables (do not commit).
- Use `NEXT_PUBLIC_` prefix for client-side env vars and feature flags.
- For GitHub Pages: configure `basePath`/`assetPrefix` as above.

**Contribution Workflow**

- Branch naming: `feat/`, `fix/`, `chore/`, `test/`, `docs/`.
- Commit messages must state implemented features and fixed bugs; include rationale when relevant.
- Small, focused PRs with clear descriptions.
- Keep changes consistent with style, SOLID, and testing requirements here.

**Validation Before Merge**

- `npm run lint`, `npm run type-check`, `npm run test -- --coverage`, `npm run build`.
- `npm run cypress:run` with network stubbing when necessary.
- If deploying, `npm run export` and verify `out/` works with `basePath` locally.

**Notes**

- If new Cursor/Copilot rule files are added, update this document to include and prefer them where applicable.
- Keep this file authoritative for agents; update when scripts, architecture, or policies change.
