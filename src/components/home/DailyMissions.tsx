"use client";

export type Mission = {
  id: string;
  title: string;
  hint: string;
};

type DailyMissionsProps = {
  missions: Mission[];
  progress: Record<string, boolean>;
  onToggle: (id: string) => void;
};

export function DailyMissions({
  missions,
  progress,
  onToggle,
}: DailyMissionsProps) {
  const completed = missions.filter((mission) => progress[mission.id]).length;

  return (
    <section aria-labelledby="daily-mission-heading" className="mt-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 id="daily-mission-heading" className="text-base font-semibold">
          Daily Mission
        </h2>
        <p className="text-xs text-muted">
          {completed}/{missions.length} done
        </p>
      </div>

      <ul className="space-y-2">
        {missions.map((mission) => {
          const checked = Boolean(progress[mission.id]);

          return (
            <li key={mission.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-card px-3 py-3 shadow-sm transition ${
                  checked
                    ? "border-brand/30 bg-brand-soft/60"
                    : "border-line hover:border-brand/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(mission.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                    checked
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-background"
                  }`}
                >
                  {checked ? (
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m3.5 8.2 2.7 2.7 6.3-6.4"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium ${
                      checked ? "text-muted line-through" : "text-foreground"
                    }`}
                  >
                    {mission.title}
                  </span>
                  <span className="block text-xs text-muted">{mission.hint}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
