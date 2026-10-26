"""A Pipecat voice agent on OpenAI's Realtime API, with a Simli Trinity-2 avatar as its face.

Run it with `uv run bot.py` and open http://localhost:7860. Pipecat's runner serves a
browser client and connects it to the bot over WebRTC; the bot talks through OpenAI and Simli
turns its voice into lip-synced avatar video.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.runner.types import SmallWebRTCRunnerArguments
from pipecat.services.openai.realtime.events import AudioConfiguration, AudioOutput, SessionProperties
from pipecat.services.openai.realtime.llm import OpenAIRealtimeLLMService
from pipecat.services.simli.video import SimliVideoService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.workers.runner import WorkerRunner

# Your keys, from .env next to this file.
load_dotenv(Path(__file__).parent / ".env", override=True)

# Any Trinity-2 face: a preset from https://docs.simli.com/api-reference/preset-faces,
# or your own from https://app.simli.com. This one is Anna.
FACE_ID = os.getenv("SIMLI_FACE_ID") or "bf13113a-355a-4d97-8b90-4edccd1da7b2"

# OpenAI Realtime voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar.
VOICE = os.getenv("OPENAI_VOICE") or "marin"

# The video: 16:9 at the avatar's full height. 1:1 and 9:16 work too, each side at least 512.
WIDTH, HEIGHT = 1366, 768

INSTRUCTIONS = """You are Anna, a friendly assistant shown as a real-time video avatar made with Simli.
Keep every answer short and conversational: one to three sentences, no lists or markdown."""

FIRST_MESSAGE = "Hi, I'm Anna! I'm a real-time video avatar made with Simli. What would you like to talk about?"


async def bot(runner_args: SmallWebRTCRunnerArguments):
    """Runs one conversation. Pipecat's runner calls this for every browser that connects."""
    transport = SmallWebRTCTransport(
        webrtc_connection=runner_args.webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            video_out_enabled=True,
            video_out_is_live=True,
            video_out_width=WIDTH,
            video_out_height=HEIGHT,
            video_out_framerate=25,  # Simli streams at 25 fps
        ),
    )

    # Speech to speech: OpenAI hears the user, decides when they're done and answers in voice.
    llm = OpenAIRealtimeLLMService(
        api_key=os.environ["OPENAI_API_KEY"],
        settings=OpenAIRealtimeLLMService.Settings(
            system_instruction=INSTRUCTIONS,
            session_properties=SessionProperties(audio=AudioConfiguration(output=AudioOutput(voice=VOICE))),
        ),
    )

    # Simli gets the bot's voice and sends back the avatar's video and voice, in sync.
    simli = SimliVideoService(
        api_key=os.environ["SIMLI_API_KEY"],
        face_id=FACE_ID,
        max_session_length=600,  # seconds, so a forgotten tab doesn't use up your minutes
        max_idle_time=120,
    )
    # Trinity-2 framing (https://docs.simli.com/api-reference/trinity-2#framing-the-video).
    # SimliVideoService has no parameters for it yet, but the Simli SDK sends every field of
    # this config to Simli when the session starts, so we add the fields there.
    simli._simli_client.config.__dict__.update(
        streaming_width=WIDTH,
        streaming_height=HEIGHT,
        avatar_position_x=0.5,  # 0 (left) to 1 (right)
        avatar_position_y=1.0,  # 0 (top) to 1 (bottom)
    )

    context = LLMContext([{"role": "developer", "content": f'Greet the user by saying: "{FIRST_MESSAGE}"'}])
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    pipeline = Pipeline(
        [
            transport.input(),  # the user's microphone
            user_aggregator,
            llm,
            simli,
            transport.output(),  # the avatar's video and voice
            assistant_aggregator,
        ]
    )
    worker = PipelineWorker(pipeline, params=PipelineParams(enable_metrics=True))

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info("Client connected")
        await worker.queue_frames([LLMRunFrame()])  # Anna says hello first

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=runner_args.handle_sigint)
    await runner.add_workers(worker)
    await runner.run()


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
