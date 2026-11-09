import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = { title: "App" };

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
