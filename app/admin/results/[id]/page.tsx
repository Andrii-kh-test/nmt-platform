import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultDetailsPage({
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
    <main className="min-h-screen bg-[#F8FAFC] p-10">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-[#7A1F2B] mb-10">
          Деталі результату
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-5">

          <div className="flex justify-between">
            <span>Тест</span>
            <strong>{result.test.title}</strong>
          </div>

          <div className="flex justify-between">
            <span>Предмет</span>
            <strong>{result.test.subject}</strong>
          </div>

          <div className="flex justify-between">
            <span>Набрано балів</span>
            <strong>
              {result.earnedPoints} / {result.maxPoints}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Відсоток</span>
            <strong>{result.percent}%</strong>
          </div>

          <div className="flex justify-between">
            <span>Правильних відповідей</span>
            <strong>{result.correct}</strong>
          </div>

          <div className="flex justify-between">
            <span>Неправильних відповідей</span>
            <strong>{result.incorrect}</strong>
          </div>

          <div className="flex justify-between">
            <span>Без відповіді</span>
            <strong>{result.skipped}</strong>
          </div>

          <div className="flex justify-between">
            <span>Час проходження</span>
            <strong>{result.timeSpent} с</strong>
          </div>

          <div className="flex justify-between">
            <span>Дата</span>
            <strong>
              {new Date(result.createdAt).toLocaleString("uk-UA")}
            </strong>
          </div>

        </div>

      </div>

    </main>
  );
}