import { prisma } from "@/app/lib/prisma";

import TestCard from "@/app/components/start/TestCard";

export default async function Home() {
  const tests = await prisma.test.findMany({
    orderBy: {
      id: "desc",
    },
    include: {
      questions: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="text-center mb-14">

          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Платформа комп'ютерного тестування
          </h1>

          <p className="mt-6 text-xl text-gray-600">
            Максимально наближений інтерфейс до НМТ, ЄВІ та ЄФВВ
          </p>

        </div>

        {tests.length === 0 ? (

          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">

            <h2 className="text-2xl font-semibold text-gray-700">
              Доступних тестів поки що немає
            </h2>

            <p className="mt-4 text-gray-500">
              Створіть тест в адміністративній панелі.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

            {tests.map((test) => (

              <TestCard
                key={test.id}
                id={test.id}
                title={test.title}
                subject={test.subject}
                duration={test.duration}
                questions={test.questions.length}
              />

            ))}

          </div>

        )}

      </div>

    </main>
  );
}