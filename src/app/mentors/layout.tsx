import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/public-header";

export default function MentorsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>{children}</main>
    </div>
  );
}
