import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Every page here is per-user and blocks on the session by design, so only
    // validate instant navigation on segments that opt in explicitly.
    instantInsights: { validationLevel: "manual-warning" },
  },
};

export default nextConfig;
