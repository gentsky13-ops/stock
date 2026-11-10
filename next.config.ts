import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads per-request data (SQLite, session cookie, daily reviews),
  // so classic dynamic rendering is used instead of Cache Components.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
