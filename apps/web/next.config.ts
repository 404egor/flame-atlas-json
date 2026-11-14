import type { NextConfig } from "next";

// The site is a static export served from GitHub Pages under a sub-path.
// CI sets NEXT_PUBLIC_BASE_PATH=/flame-atlas; local dev serves from the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static export: no server runtime. `cacheComponents` and `partialPrefetching`
  // from the starter are removed on purpose: they cannot be combined with
  // `output: "export"` (the build fails with "PPR cannot be enabled in export mode").
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
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
