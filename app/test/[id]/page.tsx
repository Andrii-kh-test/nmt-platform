import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/test/TestLoader";
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
  // =====================================================
  // TEST ID
  // =====================================================

  const { id } = await params;

  const testId = Number(id);

  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    notFound();
  }

  // =====================================================
  // ЗАВАНТАЖЕННЯ ТЕСТУ
  // =====================================================

  const prismaTest =
    await prisma.test.findUnique({
      where: {
        id: testId,
      },

      include: {
        questions: {
          orderBy: {
            order: "asc",
          },

          include: {
            question: {
              include: {
                answerOptions: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

  // =====================================================
  // ТЕСТ НЕ ЗНАЙДЕНО
  // =====================================================

  if (!prismaTest) {
    notFound();
  }

  // =====================================================
  // МАПІНГ
  // =====================================================

  const test =
    mapPrismaTest(prismaTest);

  // =====================================================
  // СТОРІНКА ТЕСТУВАННЯ
  //
  // КРИТИЧНО:
  //
  // RestoreSession тут НЕ використовується.
  //
  // SessionMonitor є ЄДИНИМ компонентом,
  // який працює з офіційним початком сесії.
  //
  // Перший вхід:
  //
  // page
  //   ↓
  // TestLoader
  //   ↓
  // SessionMonitor
  //   ↓
  // POST /api/test/begin
  //   ↓
  // startedAt = NOW
  // timeLeft = duration * 60 + extraTime
  //   ↓
  // Context отримує рівно 3600
  //   ↓
  // startTimer()
  //
  // Тобто для тесту на 60 хвилин:
  //
  // 01:00:00
  // 00:59:59
  // 00:59:58
  // ...
  //
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F8FAFC]">

      {/* =================================================
          TEST LOADER
         ================================================= */}

      <TestLoader
        test={test}
      />

      {/* =================================================
          SESSION MONITOR
         =================================================

          Саме цей компонент:

          1. знаходить sessionId;
          2. виконує POST /api/test/begin;
          3. отримує офіційний startedAt;
          4. отримує початковий timeLeft;
          5. запускає таймер;
          6. синхронізує сесію із сервером.
         ================================================= */}

      <SessionMonitor
        testId={testId}
      />

      {/* =================================================
          AUTO SAVE
         ================================================= */}

      <AutoSaveSession />

      {/* =================================================
          TIMEOUT
         ================================================= */}

      <TimeoutHandler />

      {/* =================================================
          HEADER
         ================================================= */}

      <TestHeader />

      {/* =================================================
          CONTENT
         ================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid grid-cols-12 gap-8">

          {/* =============================================
              QUESTIONS
             ============================================= */}

          <div className="col-span-8">
            <QuestionView />
          </div>

          {/* =============================================
              SIDEBAR
             ============================================= */}

          <div className="col-span-4">
            <Sidebar />
          </div>

        </div>

      </div>

      {/* =================================================
          SECURITY
         ================================================= */}

      <FullscreenGuard />

      <SecurityGuard />

      <VisibilityGuard />

    </main>
  );
}