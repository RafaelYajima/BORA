import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Origem do preview do Arena (e qualquer domínio e2b.app) liberada para o dev server.
  allowedDevOrigins: ["*.e2b.app"],
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
