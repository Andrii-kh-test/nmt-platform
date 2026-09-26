import { prisma } from "@/app/lib/prisma";
import ResultsTable from "@/app/components/admin/ResultsTable";

export const dynamic = "force-dynamic";

// =====================================================
// СТОРІНКА РЕЗУЛЬТАТІВ
// =====================================================

export default async function AdminResultsPage() {
  const results =
    await prisma.testResult.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        test: true,
      },
    });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-[1900px]">

        {/* =====================================================
            ЗАГОЛОВОК
        ===================================================== */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#7A1F2B]">
            Журнал результатів тестування
          </h1>

          <p className="mt-2 text-gray-600">
            Перелік результатів учасників із детальною
            інформацією про проходження тестування.
          </p>
        </div>

        {/* =====================================================
            ЛІЧИЛЬНИК
        ===================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">
              Усього результатів
            </div>

            <div className="mt-1 text-3xl font-bold text-[#7A1F2B]">
              {results.length}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">
              Завершено
            </div>

            <div className="mt-1 text-3xl font-bold text-green-600">
              {
                results.filter(
                  (result) =>
                    result.finishReason ===
                    "manual"
                ).length
              }
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">
              Перервано / час вичерпано
            </div>

            <div className="mt-1 text-3xl font-bold text-orange-600">
              {
                results.filter(
                  (result) =>
                    result.finishReason !==
                    "manual"
                ).length
              }
            </div>
          </div>

        </div>

        {/* =====================================================
            ЖУРНАЛ
        ===================================================== */}

        <ResultsTable results={results} />

        {/* =====================================================
            ПІДКАЗКА
        ===================================================== */}

        {results.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              Підказка:
            </span>{" "}
            натисніть «Переглянути», щоб відкрити
            детальну інформацію про проходження
            тесту учасником.
          </div>
        )}

      </div>
    </main>
  );
}