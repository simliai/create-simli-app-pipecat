import type { NextConfig } from "next";

// Where the bot runs (`uv run bot.py`). Pipecat's runner takes the WebRTC offer at /api/offer.
const BOT_URL = process.env.BOT_URL ?? "http://localhost:7860";

const nextConfig: NextConfig = {
  // The page sends its WebRTC offer to /api/offer on this server, and Next passes it on to the
  // bot. The browser only ever talks to its own origin, so there's no CORS to set up.
  async rewrites() {
    return [{ source: "/api/offer", destination: `${BOT_URL}/api/offer` }];
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
