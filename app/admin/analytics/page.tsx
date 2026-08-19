import Link from "next/link";

import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const tests = await prisma.test.findMany({
    select: {
      id: true,
      title: true,
      subject: true,

      questions: {
        select: {
          id: true,
        },
      },

      results: {
        select: {
          id: true,
        },
      },
    },

    orderBy: {
      subject: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#F4F6F8]">
      <div className="mx-auto max-w-7xl px-8 py-10">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              Аналітика тестування
            </h1>

            <p className="mt-2 text-lg text-gray-600">
              Оберіть тест, щоб переглянути детальну статистику
              виконання завдань та результати учасників.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923]"
          >
            ← Повернутися до адміністративної панелі
          </Link>

        </div>

        {/* TESTS */}
        {tests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <h2 className="text-xl font-bold text-gray-800">
              Тестів поки немає
            </h2>

            <p className="mt-2 text-gray-500">
              Створіть тест, щоб згодом переглядати його аналітику.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {tests.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <h2 className="text-xl font-bold text-[#7A1F2B]">
                  {test.title}
                </h2>

                {test.subject && (
                  <p className="mt-2 text-sm text-gray-500">
                    Предмет: {test.subject}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-lg bg-[#F8F9FA] p-4">
                    <p className="text-xs font-medium text-gray-500">
                      Завдань
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {test.questions.length}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#F8F9FA] p-4">
                    <p className="text-xs font-medium text-gray-500">
                      Учасників
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {test.results.length}
                    </p>
                  </div>

                </div>

                <Link
                  href={`/admin/analytics/${test.id}`}
                  className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white transition hover:bg-[#641923]"
                >
                  Переглянути аналітику
                </Link>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}