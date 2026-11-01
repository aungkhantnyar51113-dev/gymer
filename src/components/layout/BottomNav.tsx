"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/nutrients",
    label: "Nutrients",
    icon: NutrientsIcon,
  },
  {
    href: "/account",
    label: "Account",
    icon: AccountIcon,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 mt-auto border-t border-line bg-card/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <tab.icon active={active} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinejoin="round"
        d="M4.5 11.2 12 5.2l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19z"
      />
    </svg>
  );
}

function NutrientsIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        d="M12 20.5c4 0 7-2.6 7-7.2C19 8.4 12 3.5 12 3.5S5 8.4 5 13.3c0 4.6 3 7.2 7 7.2Z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.2" fill={active ? "currentColor" : "none"} />
      <path
        strokeLinecap="round"
        d="M5.5 19.2c.8-3.1 3.3-5 6.5-5s5.7 1.9 6.5 5"
      />
    </svg>
  );
}
