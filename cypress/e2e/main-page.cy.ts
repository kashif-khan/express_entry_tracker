/// <reference types="cypress" />

describe("Express Entry Tracker - Main Page", () => {
  beforeEach(() => {
    // Mock the API to ensure consistent test data
    cy.mockExpressEntryAPI();

    // Visit the main page
    cy.visit("/");

    // Wait for the page to load
    cy.waitForPageLoad();
  });

  describe("Page Structure and Accessibility", () => {
    it("should have proper page structure", () => {
      // Check main heading
      cy.get("h1").should("contain", "Express Entry Tracker");

      // Check that main content areas exist
      cy.get('[data-testid="stats-section"]').should("exist");
      cy.get('[data-testid="table-section"]').should("exist");

      // Check navigation links
      cy.get('a[href="/terms"]').should("exist");
      cy.get('a[href="/privacy"]').should("exist");
    });

    it("should pass basic accessibility checks", () => {
      // Check for accessibility violations
      cy.injectAxe();
      cy.checkA11y();
    });

    it("should have proper focus management", () => {
      // Test keyboard navigation
      cy.testKeyboardNavigation();
    });

    it("should support reduced motion preferences", () => {
      // Test with reduced motion
      cy.get("*").should("not.have.css", "animation-duration", "0.01ms");
    });
  });

  describe("Statistics Section", () => {
    it("should display animated statistics", () => {
      // Check that stats are visible
      cy.get('[data-testid="stats-section"]').within(() => {
        cy.get('[data-testid="stat-card"]').should(
          "have.length.greaterThan",
          0,
        );

        // Check for stat values
        cy.contains("Latest Draw").should("exist");
        cy.contains("Total Draws").should("exist");
        cy.contains("Average Invitations").should("exist");
      });
    });

    it("should have accessible stats with proper labels", () => {
      cy.get('[data-testid="stat-card"]').each(($card) => {
        cy.wrap($card).should("have.attr", "aria-label");
      });
    });
  });

  describe("Data Table", () => {
    it("should display table with proper accessibility", () => {
      cy.checkTableAccessibility();
    });

    it("should show Express Entry draw data", () => {
      // Wait for API response
      cy.wait("@getExpressEntryData");

      // Check table has data
      cy.get("table tbody tr").should("have.length.greaterThan", 0);

      // Check required columns exist
      cy.get("th").should("contain", "Draw #");
      cy.get("th").should("contain", "Date");
      cy.get("th").should("contain", "Category");
      cy.get("th").should("contain", "Invitations");
      cy.get("th").should("contain", "Min CRS");
    });

    it("should support row selection", () => {
      // Test select all functionality
      cy.get('th input[type="checkbox"]').check();
      cy.get('td input[type="checkbox"]').should("be.checked");

      // Test individual row selection
      cy.get('th input[type="checkbox"]').uncheck();
      cy.get("tbody tr").first().find('input[type="checkbox"]').check();

      // Check selection feedback
      cy.get('[aria-live="polite"]').should("contain", "selected");
    });

    it("should support sorting", () => {
      cy.testTableSorting();
    });

    it("should support filtering", () => {
      cy.testTableFilters();
    });

    it("should support pagination", () => {
      cy.testPagination();
    });

    it("should support keyboard navigation", () => {
      // Test table-specific keyboard shortcuts
      cy.get("table").focus();
      cy.get("table").type("{home}");
      cy.get("table").type("{end}");
      cy.get("table").type("{esc}");
    });

    it("should announce changes to screen readers", () => {
      // Test sort announcement
      cy.get('th button[aria-label*="Sort"]').first().click();
      cy.get('[aria-live="polite"]').should("not.be.empty");

      // Test filter announcement
      cy.get('input[placeholder*="Filter"]').first().type("123");
      cy.get('[aria-live="polite"]').should("not.be.empty");
    });
  });

  describe("Feature Flags", () => {
    it("should respect feature flag settings", () => {
      // Check if resize handles are present based on feature flag
      cy.window().then((win) => {
        const resizeEnabled = win.localStorage.getItem(
          "feature_FEATURE_TABLE_RESIZE",
        );

        if (resizeEnabled === "on") {
          cy.get('[role="separator"][aria-orientation="vertical"]').should(
            "exist",
          );
        } else {
          cy.get('[role="separator"][aria-orientation="vertical"]').should(
            "not.exist",
          );
        }
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      // Mock API failure
      cy.intercept("GET", "**/ee_rounds_123_en.json", { statusCode: 500 }).as(
        "getExpressEntryDataError",
      );

      cy.reload();
      cy.wait("@getExpressEntryDataError");

      // Check error state
      cy.get('[role="alert"], [aria-live="assertive"]').should("exist");
      cy.contains("error").should("exist");
    });

    it("should handle offline state", () => {
      // Simulate offline
      cy.intercept("GET", "**/ee_rounds_123_en.json", {
        forceNetworkError: true,
      }).as("getExpressEntryDataOffline");

      cy.reload();
      cy.wait("@getExpressEntryDataOffline");

      // Should show cached data or appropriate message
      cy.get("body")
        .should("contain.text", "offline")
        .or("contain.text", "cached")
        .or("contain.text", "error");
    });
  });
});
