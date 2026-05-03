import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize, Minimize, RotateCcw, RotateCw, Settings, X } from "lucide-react";
import { getProgress, setProgress } from "@/lib/library";

type Props = {
  src: string;
  movieId: string;
  title: string;
  onClose?: () => void;
  resume?: boolean;
};

const QUALITIES = ["Auto", "1080p", "720p", "480p"];

function extractDriveId(url: string): string | null {
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

function isDriveUrl(url: string) {
  return /drive\.google\.com/.test(url || "");
}

export const VideoPlayer = ({ src, movieId, title, onClose, resume = true }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideTimer = useRef<number | null>(null);

  const driveId = extractDriveId(src);
  const useDrive = isDriveUrl(src);

  // ✅ SAFE PLAY FUNCTION (fix autoplay issue)
  const playVideo = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
    } catch {
      // autoplay blocked → wait for user interaction
    }
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) playVideo();
    else v.pause();
  }, []);

  const skip = (s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime += s;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const armHide = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 4000);
  };

  // ✅ FULLSCREEN
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ✅ VIDEO EVENTS
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setDuration(v.duration);
      if (resume) {
        const p = getProgress(movieId);
        if (p && p < v.duration - 5) v.currentTime = p;
      }
      playVideo(); // auto try play
    };

    const onTime = () => {
      setCurrent(v.currentTime);
      setProgress(movieId, v.currentTime);
    };

    const onPlay = () => {
      setPlaying(true);
      armHide();
    };

    const onPause = () => {
      setPlaying(false);
      setShowControls(true);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [movieId, resume]);

  const onSeek = (e: any) => {
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={armHide}
      onClick={() => setShowControls(s => !s)}
    >
      {/* ✅ GOOGLE DRIVE FIX */}
      {useDrive && driveId ? (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="w-full h-full"
          allow="autoplay; fullscreen"
        />
      ) : (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          playsInline
          muted
          autoPlay
          onClick={togglePlay}
        />
      )}

      {/* Top Bar */}
      <div className={`absolute top-0 w-full p-4 flex justify-between bg-black/60 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <span className="text-white">{title}</span>
        {onClose && (
          <button onClick={onClose}>
            <X className="text-white" />
          </button>
        )}
      </div>

      {/* Center Controls */}
      {!useDrive && showControls && (
        <div className="absolute inset-0 flex items-center justify-center gap-10">
          <button onClick={() => skip(-10)} className="bg-black/50 p-4 rounded-full">
            <RotateCcw className="text-white" />
          </button>

          <button onClick={togglePlay} className="bg-white p-6 rounded-full">
            {playing ? <Pause className="text-black" /> : <Play className="text-black" />}
          </button>

          <button onClick={() => skip(10)} className="bg-black/50 p-4 rounded-full">
            <RotateCw className="text-white" />
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      {!useDrive && (
        <div className={`absolute bottom-0 w-full p-4 bg-black/70 ${showControls ? "block" : "hidden"}`}>
          <div className="flex items-center gap-2 text-white text-sm">
            <span>{fmt(current)}</span>

            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              step={0.1}
              onChange={onSeek}
              className="flex-1"
            />

            <span>{fmt(duration)}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <button onClick={togglePlay}>
              {playing ? <Pause /> : <Play />}
            </button>

            <div className="relative">
              <button onClick={() => setShowSettings(s => !s)}>
                <Settings className="text-white" />
              </button>

              {showSettings && (
                <div className="absolute bottom-10 right-0 bg-black p-2 rounded">
                  {QUALITIES.map(q => (
                    <button key={q} onClick={() => setQuality(q)} className="block text-white">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize /> : <Maximize />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};