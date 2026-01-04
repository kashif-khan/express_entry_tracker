/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

describe("Jest Configuration", () => {
  it("should be properly configured", () => {
    expect(true).toBe(true);
  });

  it("should have localStorage mock", () => {
    localStorage.setItem("test", "value");
    expect(localStorage.getItem("test")).toBe("value");
  });

  it("should have fetch mock", () => {
    expect(global.fetch).toBeDefined();
  });

  it("should have IntersectionObserver mock", () => {
    expect(global.IntersectionObserver).toBeDefined();
  });

  it("should support async/await", async () => {
    const promise = Promise.resolve("success");
    const result = await promise;
    expect(result).toBe("success");
  });
});
