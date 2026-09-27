import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/test/TestLoader";
import AutoSaveSession from "@/app/components/test/AutoSaveSession";

import TimeoutHandler from "@/app/components/test/TimeoutHandler";
import TestHeader from "@/app/components/test/TestHeader";
import QuestionView from "@/app/components/test/QuestionView";
import SidebarSync from "@/app/components/test/SidebarSync";

import FullscreenGuard from "@/app/components/test/FullscreenGuard";
import SecurityGuard from "@/app/components/test/SecurityGuard";
import VisibilityGuard from "@/app/components/test/VisibilityGuard";
import SessionMonitor from "@/app/components/test/SessionMonitor";
import TestSecurityGuard from "@/app/components/test/TestSecurityGuard";

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

  const testId =
    Number(id);

  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    notFound();
  }

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

  if (!prismaTest) {
    notFound();
  }

  const test =
    mapPrismaTest(prismaTest);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <TestLoader test={test} />

      <SessionMonitor
        testId={testId}
      />

      <AutoSaveSession />

      <TimeoutHandler />

      <TestHeader />

      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-6
          py-8
        "
      >
        <div
          className="
            grid
            grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]
            gap-6
            items-start
          "
        >
          {/* =============================== */}
          {/* ПИТАННЯ                         */}
          {/* =============================== */}

          <section
            className="
              min-w-0
              w-full
            "
          >
            <QuestionView />
          </section>

          {/* =============================== */}
          {/* НАВІГАЦІЯ                       */}
          {/* =============================== */}

          <aside
            className="
              min-w-0
              w-full
              h-full
            "
          >
            <SidebarSync />
          </aside>
        </div>
      </div>

      <FullscreenGuard />

      <SecurityGuard />

      <VisibilityGuard />

      <TestSecurityGuard />
    </main>
  );
}