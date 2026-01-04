// Custom commands for Express Entry Tracker E2E tests

// Command to wait for page to be fully loaded
Cypress.Commands.add("waitForPageLoad", () => {
  cy.get('[data-testid="main-content"]', { timeout: 10000 }).should(
    "be.visible",
  );
  cy.get('[aria-live="polite"]').should("exist"); // Wait for announcements area
});

// Command to intercept and mock IRCC API
Cypress.Commands.add(
  "mockExpressEntryAPI",
  (fixture = "express-entry-draws.json") => {
    cy.intercept("GET", "**/ee_rounds_123_en.json", { fixture }).as(
      "getExpressEntryData",
    );
  },
);

// Command to test table accessibility
Cypress.Commands.add("checkTableAccessibility", () => {
  // Check table has proper ARIA attributes
  cy.get('table[role="table"]').should("exist");
  cy.get("table").should("have.attr", "aria-labelledby");
  cy.get("table").should("have.attr", "aria-describedby");

  // Check column headers
  cy.get('th[role="columnheader"]').should("have.length.greaterThan", 0);

  // Check row accessibility
  cy.get('tr[role="row"]').should("have.length.greaterThan", 0);
  cy.get('td[role="gridcell"]').should("have.length.greaterThan", 0);
});

// Command to test keyboard navigation
Cypress.Commands.add("testKeyboardNavigation", () => {
  // Test tab navigation through interactive elements
  cy.get("body").tab();
  cy.focused().should("be.visible");

  // Test table keyboard shortcuts
  cy.get("table").focus().type("{home}");
  cy.get("table").type("{end}");
});

// Command to test filter functionality
Cypress.Commands.add("testTableFilters", () => {
  // Test text filter
  cy.get('input[placeholder*="Filter"]').first().type("123");
  cy.get("table tbody tr").should("have.length.lessThan", 10); // Assuming it filters

  // Clear filter
  cy.get('input[placeholder*="Filter"]').first().clear();
  cy.get("table tbody tr").should("have.length.greaterThan", 0);
});

// Command to test sorting
Cypress.Commands.add("testTableSorting", () => {
  // Click on a sortable column header
  cy.get('th button[aria-label*="Sort"]').first().click();

  // Check sort indicator
  cy.get("th").first().should("contain", "↑");

  // Click again to reverse sort
  cy.get('th button[aria-label*="Sort"]').first().click();
  cy.get("th").first().should("contain", "↓");
});

// Command to test pagination
Cypress.Commands.add("testPagination", () => {
  // Check pagination controls exist
  cy.get('[role="navigation"][aria-label*="pagination"]').should("exist");

  // Test page size change
  cy.get('select[aria-describedby*="rows-desc"]').select("10");
  cy.get("table tbody tr").should("have.length.lte", 10);

  // Test page navigation
  cy.get('button[aria-label*="next page"]').should("exist");
  cy.get('button[aria-label*="previous page"]').should("exist");
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      waitForPageLoad(): Chainable<void>;
      mockExpressEntryAPI(fixture?: string): Chainable<void>;
      checkTableAccessibility(): Chainable<void>;
      testKeyboardNavigation(): Chainable<void>;
      testTableFilters(): Chainable<void>;
      testTableSorting(): Chainable<void>;
      testPagination(): Chainable<void>;
    }
  }
}
