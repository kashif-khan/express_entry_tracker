/// <reference types="cypress" />

describe("Express Entry Tracker - Navigation and Pages", () => {
  describe("Terms of Use Page", () => {
    it("should navigate to Terms page", () => {
      cy.visit("/");
      cy.get('a[href="/terms"]').click();
      cy.url().should("include", "/terms");
    });

    it("should have proper Terms page structure", () => {
      cy.visit("/terms");

      // Check page heading
      cy.get("h1").should("contain", "Terms of Use");

      // Check breadcrumb navigation
      cy.get('[aria-label="Breadcrumb"]').should("exist");
      cy.get('[aria-current="page"]').should("contain", "Terms of Use");

      // Check table of contents
      cy.get('[aria-labelledby="toc-heading"]').should("exist");

      // Check return link
      cy.get("a").contains("Return to Express Entry Tracker").should("exist");
    });

    it("should have accessible navigation", () => {
      cy.visit("/terms");

      // Check TOC links are properly labeled
      cy.get("#toc-heading + ol a").should("have.length.greaterThan", 0);
      cy.get("#toc-heading + ol a").first().should("have.attr", "href");

      // Test anchor navigation
      cy.get("#toc-heading + ol a").first().click();
      cy.location("hash").should("not.be.empty");
    });

    it("should pass accessibility checks", () => {
      cy.visit("/terms");
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe("Privacy Policy Page", () => {
    it("should navigate to Privacy page", () => {
      cy.visit("/");
      cy.get('a[href="/privacy"]').click();
      cy.url().should("include", "/privacy");
    });

    it("should have proper Privacy page structure", () => {
      cy.visit("/privacy");

      // Check page heading
      cy.get("h1").should("contain", "Privacy Policy");

      // Check privacy summary
      cy.get(".bg-green-50").should("contain", "Privacy Summary");

      // Check key privacy points
      cy.contains("No personal data collection").should("exist");
      cy.contains("Local storage only").should("exist");

      // Check return link
      cy.get("a").contains("Return to Express Entry Tracker").should("exist");
    });

    it("should have accessible navigation", () => {
      cy.visit("/privacy");

      // Check TOC navigation
      cy.get('[aria-labelledby="toc-heading"]').should("exist");
      cy.get("#toc-heading + ol a").should("have.length.greaterThan", 0);
    });

    it("should pass accessibility checks", () => {
      cy.visit("/privacy");
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe("Cross-page Navigation", () => {
    it("should navigate between all pages", () => {
      // Start at home
      cy.visit("/");
      cy.get("h1").should("contain", "Express Entry Tracker");

      // Go to Terms
      cy.get('a[href="/terms"]').click();
      cy.get("h1").should("contain", "Terms of Use");

      // Go to Privacy from Terms
      cy.get('a[href="/privacy"]').click();
      cy.get("h1").should("contain", "Privacy Policy");

      // Return home from Privacy
      cy.get("a").contains("Return to Express Entry Tracker").click();
      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("should maintain focus on navigation", () => {
      cy.visit("/");

      // Tab to navigation link
      cy.get("body").tab();
      cy.focused().should("be.visible");

      // Follow link and check focus management
      cy.focused().click();
      cy.get("h1").should("be.visible");
    });

    it("should handle direct URL access", () => {
      // Direct access to Terms
      cy.visit("/terms");
      cy.get("h1").should("contain", "Terms of Use");

      // Direct access to Privacy
      cy.visit("/privacy");
      cy.get("h1").should("contain", "Privacy Policy");

      // Invalid URL should redirect or show 404
      cy.request({ url: "/invalid-page", failOnStatusCode: false })
        .its("status")
        .should("eq", 404);
    });
  });

  describe("Responsive Design", () => {
    it("should work on mobile viewport", () => {
      cy.viewport("iphone-6");
      cy.visit("/");

      // Check mobile-specific elements
      cy.get("h1").should("be.visible");
      cy.get("table").should("exist");

      // Test mobile navigation
      cy.get('a[href="/terms"]').should("be.visible");
    });

    it("should work on tablet viewport", () => {
      cy.viewport("ipad-2");
      cy.visit("/");

      // Check tablet layout
      cy.get('[data-testid="stats-section"]').should("be.visible");
      cy.get("table").should("be.visible");
    });
  });
});
