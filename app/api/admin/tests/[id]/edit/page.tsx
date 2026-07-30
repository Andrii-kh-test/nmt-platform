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

  const prismaTest = await prisma.test.findFirst();

console.log(prismaTest);

return (
  <main className="p-10">
    <pre>{JSON.stringify(prismaTest, null, 2)}</pre>
  </main>
);

  const test = mapPrismaTest(prismaTest);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8">

      <TestLoader test={test} />

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold text-[#7A1F2B] mb-8">
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