// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia for tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    store: {},
    getItem: jest.fn((key) => window.localStorage.store[key] || null),
    setItem: jest.fn((key, value) => {
      window.localStorage.store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete window.localStorage.store[key];
    }),
    clear: jest.fn(() => {
      window.localStorage.store = {};
    }),
  },
  writable: true,
});

// Mock fetch for tests
global.fetch = jest.fn();

// Suppress console warnings during tests (optional)
// console.warn = jest.fn()
// console.error = jest.fn()
