import type { Metadata } from "next";
import { DocumentScreen } from "@/components/screens/document-screen";

export const metadata: Metadata = { title: "Document" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentScreen id={id} />;
}
