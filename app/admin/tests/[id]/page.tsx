import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/test/TestLoader";
import TestHeader from "@/app/components/test/TestHeader";
import QuestionView from "@/app/components/test/QuestionView";
import QuestionNavigator from "@/app/components/test/QuestionNavigator";

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

  const prismaTest = await prisma.test.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      questions: {
        include: {
          options: true,
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

      <TestLoader test={test} />

      <TestHeader />

      <div className="max-w-7xl mx-auto py-8 px-6">

        <div className="grid grid-cols-12 gap-8">

          <div className="col-span-9">

            <QuestionView />

          </div>

          <div className="col-span-3">

            <QuestionNavigator />

          </div>

        </div>

      </div>

    </main>
  );
}