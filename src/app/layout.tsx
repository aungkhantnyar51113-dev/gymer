import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { NutritionProvider } from "@/contexts/NutritionContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fit Your LifeStyle",
  description: "Daily diet, exercise, and fitness tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>
          <NutritionProvider>
            <AppShell>{children}</AppShell>
          </NutritionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
