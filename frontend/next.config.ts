import type { NextConfig } from "next";

// The page sends its WebRTC offer to /api/offer on this server, and app/api/offer/route.ts
// passes it on to the bot (BOT_URL, read when each request arrives).

// Security headers for every page and route. The CSP only stops other sites framing the page
// (clickjacking); the mic is allowed for this origin only.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Tailwind, as set up by create-next-app.
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
