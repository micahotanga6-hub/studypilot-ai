import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { TAGLINE } from "@/lib/content";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: { default: "StudyPilot AI", template: "%s · StudyPilot AI" },
  description: `${TAGLINE} Turn your own notes into summaries, flashcards, and practice quizzes.`,
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
