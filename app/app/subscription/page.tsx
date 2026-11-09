import type { Metadata } from "next";
import { SubscriptionScreen } from "@/components/screens/subscription-screen";

export const metadata: Metadata = { title: "Subscription" };

export default function Page() {
  return <SubscriptionScreen />;
}
