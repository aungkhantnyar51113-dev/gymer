type ProgressRingProps = {
  current: number;
  total: number;
  label: string;
  tone?: "brand" | "accent";
};

export function ProgressRing({
  current,
  total,
  label,
  tone = "brand",
}: ProgressRingProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const ratio = total === 0 ? 0 : Math.min(current / total, 1);
  const offset = circumference * (1 - ratio);
  const stroke = tone === "accent" ? "var(--accent)" : "var(--brand)";
  const track = tone === "accent" ? "var(--accent-soft)" : "var(--brand-soft)";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="relative h-[108px] w-[108px]">
        <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={track}
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold leading-none text-foreground">
            {current}
            <span className="text-sm font-medium text-muted">/{total}</span>
          </span>
        </div>
      </div>
      <p className="text-xs text-muted">{Math.round(ratio * 100)}% complete</p>
    </div>
  );
}
