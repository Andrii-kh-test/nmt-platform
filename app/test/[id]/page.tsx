import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/test/TestLoader";
import TimeoutHandler from "@/app/components/test/TimeoutHandler";
import TestHeader from "@/app/components/test/TestHeader";
import QuestionView from "@/app/components/test/QuestionView";
import Sidebar from "@/app/components/test/Sidebar";

import { mapPrismaTest } from "@/app/utils/mapPrismaTest";
import FullscreenGuard from "@/app/components/test/FullscreenGuard";
import SecurityGuard from "@/app/components/test/SecurityGuard";
import VisibilityGuard from "@/app/components/test/VisibilityGuard";
import AutoSaveSession from "@/app/components/test/AutoSaveSession";
import RestoreSession from "@/app/components/test/RestoreSession";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TestPage({
  params,
}: Props) {
  const { id } = await params;

  const prismaTest =
    await prisma.test.findUnique({
      where: {
        id: Number(id),
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

  const test =
    mapPrismaTest(prismaTest);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">

      <TestLoader test={test} />
      <RestoreSession />
      <AutoSaveSession />
      <SecurityGuard />
      <VisibilityGuard />
      <FullscreenGuard />

      <TimeoutHandler />

      <TestHeader />

      <div className="max-w-7xl mx-auto py-8 px-6">

        <div className="grid grid-cols-12 gap-8">

          <div className="col-span-8">

            <QuestionView />

          </div>

          <div className="col-span-4">

            <Sidebar />

          </div>

        </div>

      </div>

    </main>
  );
}