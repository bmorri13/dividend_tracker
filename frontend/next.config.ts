import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  trailingSlash: false,
  outputFileTracingIncludes: {
    "/*": ["./public/**/*"],
  },
};

export default nextConfig;
