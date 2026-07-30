import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

import ResultTable from "@/app/components/result/ResultTable";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultPage({
  params,
}: Props) {
  const { id } = await params;

  const result = await prisma.testResult.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      test: true,
    },
  });

  if (!result) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F4F6F8]">

      <div className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-10 rounded-xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-8 py-6">

            <h1 className="text-4xl font-bold text-[#7A1F2B]">

              Результати тестування

            </h1>

            <p className="mt-2 text-gray-600">

              Платформа тестування НМТ • ЄВІ • ЄФВВ

            </p>

          </div>

          <div className="bg-[#F8F9FA] px-8 py-5">

            <p className="text-lg text-gray-700">

              Нижче наведено результати проходження тесту.

              Дані автоматично збережено після завершення тестування.

            </p>

          </div>

        </div>

        <ResultTable result={result} />

      </div>

    </main>
  );
}