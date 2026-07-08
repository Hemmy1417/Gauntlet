"use client";

/**
 * Console backdrop — near-black with a faint scanline grid and two static
 * red/amber glows. GPU-cheap: no moving blur, only opacity pulses.
 */
export function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--void)" }} />
      {/* scanline grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,90,77,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,90,77,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(1100px 620px at 50% 0%, black, transparent 78%)",
          WebkitMaskImage: "radial-gradient(1100px 620px at 50% 0%, black, transparent 78%)",
        }}
      />
      <div
        className="absolute rounded-full motion-reduce:!animate-none"
        style={{ width: 520, height: 520, top: "-14%", left: "6%",
          background: "radial-gradient(circle, rgba(255,90,77,0.10), transparent 66%)", filter: "blur(46px)",
          animation: "glow-fade 7s ease-in-out infinite" }}
      />
      <div
        className="absolute rounded-full"
        style={{ width: 460, height: 460, bottom: "-16%", right: "4%",
          background: "radial-gradient(circle, rgba(255,180,77,0.07), transparent 66%)", filter: "blur(50px)" }}
      />
    </div>
  );
}
