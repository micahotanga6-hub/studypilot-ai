import type { Metadata } from "next";
import { TutorScreen } from "@/components/screens/tutor-screen";

export const metadata: Metadata = { title: "AI Tutor" };

export default function Page() {
  return <TutorScreen />;
}
