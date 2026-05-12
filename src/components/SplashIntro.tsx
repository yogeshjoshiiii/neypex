import { useEffect, useState } from "react";

export const SplashIntro = ({ onDone }: { onDone: () => void }) => {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1900);
    const t2 = setTimeout(onDone, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      aria-hidden
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-3xl opacity-60 gradient-primary rounded-full scale-150" />
        <h1 className="font-display text-6xl sm:text-8xl md:text-9xl text-foreground animate-logo-reveal tracking-[0.15em]">
          NEY<span className="text-gradient">PEX</span>
        </h1>
        <p className="mt-4 text-center text-xs sm:text-sm tracking-[0.4em] text-muted-foreground animate-fade-in" style={{ animationDelay: "0.8s", animationFillMode: "both" }}>
          STREAM • PAY • WATCH
        </p>
      </div>
    </div>
  );
};
