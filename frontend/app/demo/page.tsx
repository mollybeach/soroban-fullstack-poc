import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo | Soroban Fullstack POC",
  description: "Screen recording of the Soroban testnet POC in action",
};

/** Place your exported file at `public/demo/recording.mp4` (or webm). */
const DEMO_VIDEO_SRC = "/demo/recording.mp4";

export default function DemoPage() {
  return (
    <main>
      <h1>Demo</h1>
      <p>
        Screen recording of the app (contract reads, Freighter writes, and
        transaction log). Add your file as{" "}
        <code>frontend/public/demo/recording.mp4</code> — then refresh this
        page.
      </p>
      <div className="demo-video-wrap">
        <video
          className="demo-video"
          controls
          playsInline
          preload="metadata"
          aria-label="POC screen recording"
        >
          <source src={DEMO_VIDEO_SRC} type="video/mp4" />
          <source src="/demo/recording.webm" type="video/webm" />
          Your browser does not support embedded video. Use a modern browser or
          download the file from <code>public/demo/</code>.
        </video>
      </div>
    </main>
  );
}
