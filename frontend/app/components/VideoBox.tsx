import Image from "next/image";
import type { Ref } from "react";
import dottedFace from "@/media/dottedface.gif";

interface Props {
  live: boolean;
  videoRef: Ref<HTMLVideoElement>;
  audioRef: Ref<HTMLAudioElement>;
}

// Shows Simli's dotted face until the conversation is live, then the avatar. Both are 16:9, like
// the 1366x768 video bot.py asks Simli for. The <video> and <audio> are always rendered so the
// bot's tracks have somewhere to go as soon as they arrive.
export default function VideoBox({ live, videoRef, audioRef }: Props) {
  return (
    <>
      {!live && (
        <div className="flex aspect-video w-full items-center justify-center rounded-sm bg-simligray">
          <Image src={dottedFace} alt="" width={300} height={300} unoptimized priority />
        </div>
      )}

      <div
        className={`${live ? "flex" : "hidden"} aspect-video w-full items-center justify-center overflow-hidden rounded-sm bg-simligray`}
      >
        {/* Muted because the voice plays through the <audio> below. */}
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
        <audio ref={audioRef} autoPlay />
      </div>
    </>
  );
}
