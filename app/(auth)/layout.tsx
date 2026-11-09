import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="px-5 py-5"><Brand /></header>
      <div className="mx-auto flex max-w-md flex-col px-5 pb-16">{children}</div>
    </div>
  );
}
