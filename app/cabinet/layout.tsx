import type { ReactNode } from "react";
import Link from "next/link";

import { getCurrentUser } from "@/app/lib/auth/session";

import CabinetSidebar from "./CabinetSidebar";

type Props = {
  children: ReactNode;
};

export default async function CabinetLayout({
  children,
}: Props) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          ВЕРХНЯ ПАНЕЛЬ
          ===================================================== */}

      <header className="h-20 border-b bg-white shadow-sm">

        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">

          <div>
            <h1 className="text-3xl font-bold text-[#7A1F2B]">
              Особистий кабінет
            </h1>

            <p className="text-gray-500">
              Платформа тестування
            </p>
          </div>

          <Link
            href="/logout"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-200
              bg-white
              px-4
              py-2
              font-semibold
              text-gray-700
              shadow-sm
              transition
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-700
            "
          >
            <span>🚪</span>
            <span>Вийти</span>
          </Link>

        </div>

      </header>


      {/* =====================================================
          ОСНОВНА ОБЛАСТЬ
          ===================================================== */}

      <div className="mx-auto flex max-w-7xl">

        <CabinetSidebar
          firstName={user.firstName}
          lastName={user.lastName}
        />

        <main className="flex-1 p-8">
          {children}
        </main>

      </div>

    </div>
  );
}