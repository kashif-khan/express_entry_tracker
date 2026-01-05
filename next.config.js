/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_FEATURE_TABLE_DRAG: "on",
    NEXT_PUBLIC_FEATURE_TABLE_RESIZE: "on",
    NEXT_PUBLIC_FEATURE_STATS_ANIMATIONS: "on",
    NEXT_PUBLIC_FEATURE_A11Y_CHECKS: "on",
  },
};

module.exports = nextConfig;
