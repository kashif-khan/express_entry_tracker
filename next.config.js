/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Only set basePath and assetPrefix for GitHub Pages deployment
  ...(isProd && isGitHubPages && {
    basePath: '/express_entry_tracker',
    assetPrefix: '/express_entry_tracker/',
  }),
  env: {
    NEXT_PUBLIC_FEATURE_TABLE_DRAG: "on",
    NEXT_PUBLIC_FEATURE_TABLE_RESIZE: "on",
    NEXT_PUBLIC_FEATURE_STATS_ANIMATIONS: "on",
    NEXT_PUBLIC_FEATURE_A11Y_CHECKS: "on",
  },
};

module.exports = nextConfig;
