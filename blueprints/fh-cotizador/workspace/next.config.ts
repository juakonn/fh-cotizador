import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf y sharp se ejecutan tal cual en Node, sin pasar por el bundler.
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  // El membrete y el logo se leen del disco en la función del PDF: hay que incluirlos en el deploy.
  outputFileTracingIncludes: {
    "/api/pdf": ["./src/lib/pdf/assets/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
