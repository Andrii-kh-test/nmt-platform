import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/session";
import CabinetSidebar from "./CabinetSidebar";

import "./cabinet.css";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="cabinet-layout">
      <CabinetSidebar
        firstName={user.firstName}
        lastName={user.lastName}
      />

      <main className="cabinet-main">
        {children}
      </main>
    </div>
  );
}