import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#e7e1d4]">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background shadow-[0_0_40px_rgba(28,43,36,0.08)]">
        <AppHeader />
        <main className="flex-1 px-4 py-4">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
