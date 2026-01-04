// Quick test to verify proxy configuration
import { getDataUrls, CONFIG } from "./src/lib/config.js";

console.log("CORS Proxies configured:", CONFIG.CORS_PROXIES);
console.log("Generated proxy URLs:");

// Simulate browser environment for localhost
global.window = {
  location: {
    hostname: "localhost",
  },
};

const urls = getDataUrls();
urls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

// Simulate production environment
global.window = {
  location: {
    hostname: "example.github.io",
  },
};

console.log("\nProduction URL:");
const prodUrls = getDataUrls();
console.log("1.", prodUrls[0]);
