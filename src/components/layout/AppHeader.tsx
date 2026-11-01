"use client";

import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-background/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Gymer
          </p>
          <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
            Fit Your LifeStyle
          </h1>
        </div>
        <Link
          href="/account"
          aria-label="Open account profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-brand shadow-sm transition hover:border-brand/30 hover:bg-brand-soft"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.2" />
            <path
              strokeLinecap="round"
              d="M5.5 19.2c.8-3.1 3.3-5 6.5-5s5.7 1.9 6.5 5"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
