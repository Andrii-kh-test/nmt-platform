import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import TestLoader from "@/app/components/admin/TestLoader";
import TestSettings from "@/app/components/admin/TestSettings";
import QuestionList from "@/app/components/admin/QuestionList";

import { mapPrismaTest } from "@/app/utils/mapPrismaTest";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTestPage({
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

  const test = mapPrismaTest(prismaTest);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8">
      <TestLoader test={test} />

      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold text-[#7A1F2B]">
          Редагування тесту
        </h1>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4">
            <TestSettings />
          </div>

          <div className="col-span-8">
            <QuestionList />
          </div>
        </div>
      </div>
    </main>
  );
}