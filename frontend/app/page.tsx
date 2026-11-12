"use client";

import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import Image from "next/image";
import { useRef, useState } from "react";
import IconExit from "@/media/IconExit";
import sparkle from "@/media/sparkle.svg";
import SimliHeaderLogo from "./components/Logo";
import VideoBox from "./components/VideoBox";

type Status = "idle" | "connecting" | "live";

const REPO_URL = "https://github.com/simliai/create-simli-app-pipecat";

const links = [
  { href: "https://docs.simli.com", label: "Docs" },
  { href: "https://discord.gg/yQx49zNF4d", label: "Discord" },
  { href: REPO_URL, label: "GitHub" },
];

const code = "font-abc-repro-mono text-xs whitespace-nowrap";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const clientRef = useRef<PipecatClient | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function start() {
    setError("");
    setStatus("connecting");

    const client = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
      callbacks: {
        // The bot sends two tracks: the Simli avatar's video and its voice. Our own
        // microphone shows up here too, as a local track, so skip that one.
        onTrackStarted: (track, participant) => {
          if (participant?.local) return;
          const element = track.kind === "video" ? videoRef.current : audioRef.current;
          if (element) element.srcObject = new MediaStream([track]);
        },
        // Fires when we hang up, and when the bot ends the call (at MAX_SESSION_SECONDS or
        // MAX_IDLE_SECONDS in bot.py).
        onDisconnected: () => setStatus("idle"),
      },
    });
    clientRef.current = client;

    try {
      // Asks for the microphone, sends the WebRTC offer to /api/offer (app/api/offer/route.ts
      // passes it on to the bot) and resolves once the bot says it's ready.
      await client.connect({ webrtcRequestParams: { endpoint: "/api/offer" } });
      setStatus("live");
    } catch (e) {
      console.error(e);
      setError("Couldn't connect. Is the bot running (uv run bot.py -t webrtc), and is the microphone allowed?");
      await client.disconnect();
      setStatus("idle");
    }
  }

  async function end() {
    await clientRef.current?.disconnect();
  }

  return (
    <div className="flex min-h-screen flex-col bg-black font-abc-repro text-sm font-normal text-white">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-6">
        <SimliHeaderLogo />
        <nav className="flex items-center gap-6 text-gray-300">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center px-6 pb-12">
        <div className="mb-6 text-center">
          <h1 className="text-2xl leading-tight font-bold">Talk to a Pipecat voice agent</h1>
          <p className="mt-2 text-gray-400">OpenAI Realtime answers, and a Simli avatar speaks it in real time.</p>
        </div>

        <div className="w-full max-w-[960px]">
          <VideoBox live={status === "live"} videoRef={videoRef} audioRef={audioRef} />

          <div className="mx-auto flex w-full max-w-[350px] flex-col items-center">
            {status === "live" ? (
              <button
                onClick={end}
                className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[100px] bg-red px-6 text-white transition-all duration-300 hover:rounded-sm hover:bg-white hover:text-black"
              >
                <IconExit />
                <span className="font-abc-repro-mono font-bold">End</span>
              </button>
            ) : (
              <button
                onClick={start}
                disabled={status === "connecting"}
                className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[100px] bg-simliblue px-6 py-3 text-white transition-all duration-300 hover:rounded-sm hover:bg-white hover:text-black disabled:bg-[#343434] disabled:text-white disabled:hover:rounded-[100px]"
              >
                {status === "connecting" ? (
                  <Image src={sparkle} alt="Connecting" className="h-[20px] w-auto animate-loader" />
                ) : (
                  <span className="font-abc-repro-mono font-bold">Start</span>
                )}
              </button>
            )}

            {status !== "idle" && (
              <span className="mt-2 font-abc-repro-mono text-xs text-gray-400" aria-live="polite">
                {status === "connecting" ? "Connecting…" : "Connected. Say hello."}
              </span>
            )}

            {error && (
              <p role="alert" className="mt-4 text-center font-abc-repro-mono text-red">
                {error}
              </p>
            )}
          </div>
        </div>

        <section className="mt-12 w-full max-w-[960px] rounded-lg border border-white/10 p-6 text-gray-300">
          <h2 className="mb-4 font-bold text-white">Run it yourself</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            <li>
              <span className="mb-1 block text-white">1. Add your keys</span>
              Copy <code className={code}>.env.example</code> to <code className={code}>.env</code> and add your
              Simli and OpenAI keys. <code className={code}>frontend/.env.local</code> is optional: it only sets{" "}
              <code className={code}>BOT_URL</code>.
            </li>
            <li>
              <span className="mb-1 block text-white">2. Start it</span>
              Run <code className={code}>uv run bot.py -t webrtc</code>, then{" "}
              <code className={code}>npm run dev</code> in <code className={code}>frontend/</code>, and open this
              page.
            </li>
            <li>
              <span className="mb-1 block text-white">3. Make it yours</span>
              Change <code className={code}>SIMLI_FACE_ID</code> for another avatar, and the voice and prompt in{" "}
              <code className={code}>bot.py</code>.
            </li>
          </ol>
          <p className="mt-6 text-xs text-gray-500">
            Before deploying, put <code className={code}>/api/offer</code> behind your own sign-in. See the{" "}
            <a
              href={`${REPO_URL}#before-you-go-to-production`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              README
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
