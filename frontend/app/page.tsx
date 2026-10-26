"use client";

import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import Image from "next/image";
import { useRef, useState } from "react";
import IconExit from "@/media/IconExit";
import sparkle from "@/media/sparkle.svg";
import Navbar from "./components/Navbar";
import VideoBox from "./components/VideoBox";

type Status = "idle" | "connecting" | "live";

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
        // Fires when we hang up, and when the bot does (e.g. after max_session_length in bot.py).
        onDisconnected: () => setStatus("idle"),
      },
    });
    clientRef.current = client;

    try {
      // Asks for the microphone, sends the WebRTC offer to /api/offer (next.config.ts passes it
      // on to the bot) and resolves once the bot says it's ready.
      await client.connect({ webrtcRequestParams: { endpoint: "/api/offer" } });
      setStatus("live");
    } catch (e) {
      console.error(e);
      setError("Couldn't connect. Is the bot running (uv run bot.py), and is the microphone allowed?");
      await client.disconnect();
      setStatus("idle");
    }
  }

  async function end() {
    await clientRef.current?.disconnect();
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black p-8 font-abc-repro text-sm font-normal text-white">
      <Navbar />

      <div className="flex w-full flex-col items-center gap-6 rounded-xl p-6 pb-[40px]">
        <VideoBox live={status === "live"} videoRef={videoRef} audioRef={audioRef} />

        <div className="flex w-[350px] max-w-full flex-col items-center">
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

          {error && <p className="mt-4 text-center font-abc-repro-mono text-red">{error}</p>}
        </div>
      </div>

      <div className="flex max-w-[350px] flex-col items-center">
        <span className="mb-[8px] leading-5 font-bold">
          Create Simli App is a starter repo for creating visual avatars with Simli
        </span>
        <ul className="mt-2 ml-[6px] max-w-[350px] list-inside list-decimal">
          <li className="mb-1">Put your Simli and OpenAI API keys in the .env file next to bot.py.</li>
          <li className="mb-1">Run the bot with uv run bot.py, press Start and talk to the avatar.</li>
          <li className="mb-1">Change the face, voice and prompt at the top of bot.py.</li>
        </ul>
        <span className="mt-[16px]">
          The bot is a regular Pipecat pipeline, so you can add tools, swap models and deploy it
          like any other Pipecat bot.
        </span>
      </div>
    </main>
  );
}
