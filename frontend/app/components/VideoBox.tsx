import Image from "next/image";
import type { Ref } from "react";
import dottedFace from "@/media/dottedface.gif";

interface Props {
  live: boolean;
  videoRef: Ref<HTMLVideoElement>;
  audioRef: Ref<HTMLAudioElement>;
}

// Shows Simli's dotted face until the conversation is live, then the avatar. The <video> and
// <audio> are always rendered so the bot's tracks have somewhere to go as soon as they arrive.
export default function VideoBox({ live, videoRef, audioRef }: Props) {
  return (
    <>
      {!live && <Image src={dottedFace} alt="" width={350} height={350} unoptimized priority />}

      {/* 16:9, like the video bot.py asks Simli for. */}
      <div
        className={`${live ? "flex" : "hidden"} aspect-video w-[622px] max-w-full items-center justify-center overflow-hidden rounded-sm bg-simligray`}
      >
        {/* Muted because the voice plays through the <audio> below. */}
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
        <audio ref={audioRef} autoPlay />
      </div>
    </>
  );
}
