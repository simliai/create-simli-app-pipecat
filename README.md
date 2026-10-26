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
   uv run bot.py
   ```
2. In a second terminal, run the page:
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. Open http://localhost:3000, press **Start** and allow the microphone.

Pipecat's prebuilt client at http://localhost:7860 still works too.

Prefer pip? `pip install "pipecat-ai[openai,runner,simli,webrtc]==1.14.0" python-dotenv`, then `python bot.py` (Python 3.11 or newer).

## Make it yours

Everything about the agent is at the top of [`bot.py`](bot.py):

- **Face:** any Trinity-2 face ID. Pick a [preset](https://docs.simli.com/api-reference/preset-faces) or [make your own from a photo](https://app.simli.com). Or set `SIMLI_FACE_ID`.
- **Voice:** any OpenAI Realtime voice (the list is in the file). Or set `OPENAI_VOICE`.
- **Prompt and greeting.**
- **Framing:** the video is 16:9 (1366x768). 1:1 and 9:16 work too, and `avatar_position_x` / `avatar_position_y` move the avatar on the canvas. See [Framing the video](https://docs.simli.com/api-reference/trinity-2#framing-the-video).
- **Tools, other models and more:** it's a regular Pipecat pipeline, so everything in the [Pipecat docs](https://docs.pipecat.ai) applies.

The page is in [`frontend/app/page.tsx`](frontend/app/page.tsx). If the agent isn't on http://localhost:7860, start the page with `BOT_URL` set to where it is.

## How it works

1. The page sends your microphone to the agent over WebRTC (Pipecat's `SmallWebRTCTransport`, peer to peer, no media server). To set up the call it posts a WebRTC offer to `/api/offer`, which Next.js forwards to the agent ([`next.config.ts`](frontend/next.config.ts)), so there's no CORS to deal with.
2. For each visitor, the agent starts an OpenAI Realtime session and a Simli session.
3. OpenAI hears you, decides when you've finished and answers in voice. The agent sends that voice to Simli.
4. Simli returns the avatar's video and voice, in sync, and the agent passes both to the page.

All API keys stay in the agent.

## Before you go to production

The runner is for development. Anyone who can reach port 7860 can start a conversation, which uses your Simli minutes and OpenAI credit, so keep it on localhost or put it behind your own sign-in. Each Simli session is capped at 10 minutes (`max_session_length` in `bot.py`). To deploy, see [Pipecat's deployment guide](https://docs.pipecat.ai/pipecat/deployment/overview).

## More

- [Simli docs](https://docs.simli.com) and [all starters](https://docs.simli.com/api-reference/samples/all-samples)
- Source: https://github.com/simliai/create-simli-app-pipecat
- Questions? Ask on [Discord](https://discord.gg/yQx49zNF4d).
