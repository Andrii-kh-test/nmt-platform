import { prisma } from "@/app/lib/prisma";

import TestCard from "@/app/components/start/TestCard";

export default async function Home() {
  const tests = await prisma.test.findMany({
    where: {
      isPublished: true,
    },

    orderBy: {
      id: "desc",
    },

    include: {
      questions: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">

      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 w-full">

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
              Адміністратор ще не опублікував жодного тесту.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

            {tests.map((test) => (

              <TestCard
                key={test.id}
                id={test.id}
                href={`/test/start/${test.id}`}
                title={test.title}
                subject={test.subject}
                duration={test.duration}
                questions={test.questions.length}
              />

            ))}

          </div>

        )}

      </div>

      <footer className="bg-white border-t border-gray-200 py-6">

        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-gray-600">

          <span className="text-sm">
            Створено за підтримки
          </span>

          <span className="font-semibold">
            ChatGPT
          </span>

        </div>

      </footer>

    </main>
  );
}