# Simli + OpenAI Realtime on Pipecat

A real-time voice agent with a face. It talks through OpenAI's Realtime API, runs on [Pipecat](https://docs.pipecat.ai), and [Simli](https://www.simli.com) gives it a lip-synced Trinity-2 avatar.

It's one Python file for the agent and a small Next.js page to talk to it, connected over WebRTC. You only need two API keys.

## What's in here

- **[`bot.py`](bot.py)**: the agent. It hears you through OpenAI's Realtime API, answers in voice, and sends that voice to Simli, which returns the avatar's video and voice in sync.
- **[`frontend/`](frontend)**: the page. A Next.js app in Simli's style that connects to the agent with Pipecat's JS client ([`app/page.tsx`](frontend/app/page.tsx)). It holds no keys.

## Setup

You need [uv](https://docs.astral.sh/uv/) for Python, [Node.js](https://nodejs.org) 20.9 or newer for the page, and these keys:

- [Simli](https://app.simli.com) (free plan included)
- [OpenAI](https://platform.openai.com/api-keys)

```bash
git clone https://github.com/simliai/create-simli-app-pipecat
cd create-simli-app-pipecat
uv sync
cp .env.example .env   # then paste in your keys
```

Then:

1. Run the agent:
   ```bash
   uv run bot.py -t webrtc
   ```
   `-t webrtc` starts only the WebRTC transport this bot uses, instead of every transport Pipecat's runner supports.
2. In a second terminal, run the page:
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. Open http://localhost:3000, press **Start** and allow the microphone.

Pipecat's prebuilt client at http://localhost:7860 still works too.

Both listen on your machine only: the runner on `localhost`, and `npm run dev` on 127.0.0.1. `PIPECAT_ALLOWED_ORIGINS` in `.env` (from `.env.example`) stops other websites you visit from starting sessions on the runner from your browser. If you leave it empty, the runner allows every origin.

Prefer pip? `pip install "pipecat-ai[openai,runner,simli,webrtc]==1.16.0" python-dotenv`, then `python bot.py -t webrtc` (Python 3.11 or newer).

## Make it yours

Everything about the agent is at the top of [`bot.py`](bot.py):

- **Face:** any Trinity-2 face ID. Pick a [preset](https://docs.simli.com/api-reference/preset-faces) or [make your own from a photo](https://app.simli.com). Or set `SIMLI_FACE_ID`.
- **Voice:** any OpenAI Realtime voice (the list is in the file). Or set `OPENAI_VOICE`.
- **Prompt and greeting.**
- **Session limits:** `MAX_SESSION_SECONDS` (10 minutes) and `MAX_IDLE_SECONDS` (2 minutes). Simli's avatar leaves at these limits, and the bot then ends the whole conversation, OpenAI included.
- **Framing:** the video is 16:9 (1366x768). 1:1 and 9:16 work too, and `avatar_position_x` / `avatar_position_y` move the avatar on the canvas. See [Framing the video](https://docs.simli.com/api-reference/trinity-2#framing-the-video).
- **Tools, other models and more:** it's a regular Pipecat pipeline, so everything in the [Pipecat docs](https://docs.pipecat.ai) applies.

The page is in [`frontend/app/page.tsx`](frontend/app/page.tsx). If the agent isn't on http://localhost:7860, set `BOT_URL` to where it is (in `frontend/.env.local`, see [`frontend/.env.example`](frontend/.env.example), or the environment). The page reads it on each request, so it doesn't need a rebuild.

## How it works

1. The page sends your microphone to the agent over WebRTC (Pipecat's `SmallWebRTCTransport`, peer to peer, no media server). To set up the call it posts a WebRTC offer to `/api/offer`, which the page's server passes on to the agent ([`app/api/offer/route.ts`](frontend/app/api/offer/route.ts)), so there's no CORS to deal with.
2. For each visitor, the agent starts an OpenAI Realtime session and a Simli session.
3. OpenAI hears you, decides when you've finished and answers in voice. The agent sends that voice to Simli.
4. Simli returns the avatar's video and voice, in sync, and the agent passes both to the page.

All API keys stay in the agent.

## Before you go to production

The runner is for development. Anyone who can reach the page or port 7860 can start a conversation, which uses your Simli minutes and OpenAI credit: the page passes every offer on to the bot, so keeping the runner on localhost doesn't protect it once the page is reachable.

So a production build of the page (`npm run build` + `npm start`, or any deployed host) refuses offers with `403` until you put your own login in front of `/api/offer`. Add it, with rate limiting, where the `TODO` in [`app/api/offer/route.ts`](frontend/app/api/offer/route.ts) says. For a demo or an internal network only, `ALLOW_UNAUTHENTICATED_SESSIONS=true` turns the check off, and anyone who can reach the page can then start sessions on your keys. Don't set it on a public deployment. The route also rejects request bodies over 64 KB.

Each conversation ends after 10 minutes, or 2 minutes with nobody speaking (`MAX_SESSION_SECONDS` and `MAX_IDLE_SECONDS` in `bot.py`). If you expose the page on your network for testing (`npx next dev -H 0.0.0.0`), do it on purpose and only on a network you trust. To deploy the bot, see [Pipecat's deployment guide](https://docs.pipecat.ai/pipecat/deployment/overview).

## More

- [Simli docs](https://docs.simli.com) and [all starters](https://docs.simli.com/api-reference/samples/all-samples)
- Source: https://github.com/simliai/create-simli-app-pipecat
- Questions? Ask on [Discord](https://discord.gg/yQx49zNF4d).

## Using a coding agent?

This repo includes the [Simli agent skill](https://github.com/simliai/skills) in `.agents/skills/simli` (linked from `.claude/skills/simli`), so Claude Code, Codex, Cursor and other agents that support skills know how to change the face, framing, camera and prompt, and how to fix common errors. To add it to another project: `npx skills add simliai/skills`.

