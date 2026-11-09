import type { Metadata } from "next";
import { PlannerScreen } from "@/components/screens/planner-screen";

export const metadata: Metadata = { title: "Study Planner" };

export default function Page() {
  return <PlannerScreen />;
}
