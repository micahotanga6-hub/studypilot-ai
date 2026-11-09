import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents-screen";

export const metadata: Metadata = { title: "My Documents" };

export default function Page() {
  return <DocumentsScreen />;
}
