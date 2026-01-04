{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "video": true,
  "screenshotOnRunFailure": true,
  "defaultCommandTimeout": 10000,
  "pageLoadTimeout": 30000,
  "requestTimeout": 10000,
  "responseTimeout": 10000,
  "retries": {
    "runMode": 2,
    "openMode": 0
  },
  "e2e": {
    "setupNodeEvents": null,
    "specPattern": "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    "supportFile": "cypress/support/e2e.ts"
  },
  "component": {
    "devServer": {
      "framework": "next",
      "bundler": "webpack"
    },
    "specPattern": "src/**/*.cy.{js,jsx,ts,tsx}",
    "supportFile": "cypress/support/component.ts"
  }
}