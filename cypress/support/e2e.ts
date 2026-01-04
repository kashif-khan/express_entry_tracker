// Import commands.ts using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add axe-core for accessibility testing
import "cypress-axe";

// Configure Cypress to handle uncaught exceptions
Cypress.on("uncaught:exception", (err, runnable) => {
  // Prevent Cypress from failing on unhandled promise rejections
  // or other JavaScript errors that don't affect functionality
  if (
    err.message.includes("ResizeObserver") ||
    err.message.includes("IntersectionObserver") ||
    err.message.includes("AnimationFrame")
  ) {
    return false;
  }
  return true;
});
