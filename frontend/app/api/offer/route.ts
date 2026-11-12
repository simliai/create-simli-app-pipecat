// Passes the page's WebRTC offer (POST) and ICE candidates (PATCH) on to the bot, so the browser
// only ever talks to its own origin and there's no CORS to set up.
//
// Every offer starts a conversation that uses your Simli minutes and OpenAI credit, and this
// route has no login: anyone who can reach it can start one. So in production (`next build` +
// `next start`, or a deployed host) it refuses unless you opt in with
// ALLOW_UNAUTHENTICATED_SESSIONS=true, which is only for demos and internal networks.

const isProduction = process.env.NODE_ENV === "production";

// A WebRTC offer is a few KB. Anything much bigger isn't one.
const MAX_BODY_BYTES = 64 * 1024;

// How long to wait for the bot to answer.
const BOT_TIMEOUT_MS = 15_000;

export const POST = forward;
export const PATCH = forward;

async function forward(request: Request): Promise<Response> {
  // TODO: before you deploy, check the user here (your session cookie, auth provider, ...)
  // and rate-limit per user. Return 401/403 when the check fails. Then remove the
  // ALLOW_UNAUTHENTICATED_SESSIONS escape hatch below, or keep it off.
  if (isProduction && process.env.ALLOW_UNAUTHENTICATED_SESSIONS !== "true") {
    return Response.json(
      {
        error:
          "This page has no login, so it doesn't start sessions in production. Add your own " +
          "auth to app/api/offer/route.ts first (or set ALLOW_UNAUTHENTICATED_SESSIONS=true " +
          "for a demo).",
      },
      { status: 403 },
    );
  }

  const body = await readBody(request, MAX_BODY_BYTES);
  if (body === null) {
    return Response.json({ error: "Request too large." }, { status: 413 });
  }

  // Read per request, so BOT_URL can change without a rebuild. Where the bot runs
  // (`uv run bot.py -t webrtc`): Pipecat's runner takes the WebRTC offer at /api/offer.
  const botUrl = process.env.BOT_URL || "http://localhost:7860";
  try {
    const res = await fetch(`${botUrl}/api/offer`, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(BOT_TIMEOUT_MS),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (e) {
    console.error(`api/offer: couldn't reach the bot at ${botUrl}`, e);
    return Response.json(
      {
        error: isProduction
          ? "Couldn't reach the bot."
          : `Couldn't reach the bot at ${botUrl}. Is it running (uv run bot.py -t webrtc)?`,
      },
      { status: 502 },
    );
  }
}

// The request body as text, or null if it's larger than maxBytes. Stops reading as soon as it
// is, instead of buffering whatever the client sends.
async function readBody(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
