/**
 * Gauntlet mark — a shield breached by a bolt: the honeypot (shield) and the
 * attack that cracks it (the red bolt/notch). Reads at favicon size.
 */
export function GauntletMark({ size = 28 }: { size?: number }) {
  const gid = `gtg-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff6f63" />
          <stop offset="1" stopColor="#e23b30" />
        </linearGradient>
      </defs>
      <path d="M16 3l10 3.5v7.5c0 6.6-4.3 11.4-10 14C10.3 25.4 6 20.6 6 14V6.5L16 3z"
            fill="none" stroke={`url(#${gid})`} strokeWidth="2" strokeLinejoin="round" />
      {/* the breach bolt */}
      <path d="M17.5 9l-5 7.5h3.2L14 23l6-8.2h-3.4L17.5 9z" fill={`url(#${gid})`} />
    </svg>
  );
}

export function GauntletWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 24 : size === "lg" ? 40 : 30;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <GauntletMark size={px} />
      <span className={`display ${text} tracking-tight`} style={{ color: "var(--ink)" }}>
        Gauntlet
      </span>
    </span>
  );
}
