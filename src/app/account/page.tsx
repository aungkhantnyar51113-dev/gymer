"use client";

import { useAuth } from "@/contexts/AuthContext";
import { HistoryLog } from "@/components/account/HistoryLog";
import Link from "next/link";

export default function AccountPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Profile
        </p>
        <h2 className="mt-1 text-lg font-semibold">Account</h2>

        {user ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="text-sm font-medium text-foreground">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl border border-line bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-brand/30 hover:bg-brand-soft/30 active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              Sign in to sync your data across devices. The app works without
              sign-in for single-user usage.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand/90 active:scale-[0.98]"
            >
              Sign In (Optional)
            </Link>
          </div>
        )}

        <p className="mt-6 text-xs text-muted">
          Settings, goals, and personal details will live here in future
          updates.
        </p>
      </section>

      <HistoryLog />
    </div>
  );
}
