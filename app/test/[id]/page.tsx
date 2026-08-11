import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/test/TestLoader";
import RestoreSession from "@/app/components/test/RestoreSession";
import AutoSaveSession from "@/app/components/test/AutoSaveSession";

import TimeoutHandler from "@/app/components/test/TimeoutHandler";
import TestHeader from "@/app/components/test/TestHeader";
import QuestionView from "@/app/components/test/QuestionView";
import Sidebar from "@/app/components/test/Sidebar";

import FullscreenGuard from "@/app/components/test/FullscreenGuard";
import SecurityGuard from "@/app/components/test/SecurityGuard";
import VisibilityGuard from "@/app/components/test/VisibilityGuard";
import SessionMonitor from "@/app/components/test/SessionMonitor";

import { mapPrismaTest } from "@/app/utils/mapPrismaTest";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TestPage({
  params,
}: Props) {
  const { id } = await params;

  const testId = Number(id);

  if (!Number.isInteger(testId) || testId <= 0) {
    notFound();
  }

  const prismaTest = await prisma.test.findUnique({
    where: {
      id: testId,
    },

    include: {
      questions: {
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },

        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!prismaTest) {
    notFound();
  }

  const test = mapPrismaTest(prismaTest);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* ==========================================
          Завантаження тесту в TestSessionContext
         ========================================== */}

      <TestLoader test={test} />

      {/* ==========================================
          Відновлення існуючої сесії
         ========================================== */}

      <RestoreSession />

      {/* ==========================================
          Синхронізація стану сесії з сервером
          (блокування, час, поточне питання)
         ========================================== */}

      <SessionMonitor />

      {/* ==========================================
          Автоматичне збереження відповідей
         ========================================== */}

      <AutoSaveSession />

      {/* ==========================================
          Захисні механізми
         ========================================== */}

      <SecurityGuard />

      <VisibilityGuard />

      <FullscreenGuard />

      {/* ==========================================
          Обробка завершення за таймером
         ========================================== */}

      <TimeoutHandler />

      {/* ==========================================
          Верхня панель тестування
         ========================================== */}

      <TestHeader />

      {/* ==========================================
          Основний інтерфейс тестування
         ========================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* ======================================
              Питання
             ====================================== */}

          <div className="col-span-8">
            <QuestionView />
          </div>

          {/* ======================================
              Бічна панель
             ====================================== */}

          <div className="col-span-4">
            <Sidebar />
          </div>
        </div>
      </div>
    </main>
  );
}