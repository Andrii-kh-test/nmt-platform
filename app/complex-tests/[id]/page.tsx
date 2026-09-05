import { notFound } from "next/navigation";
import { Brain, CheckCircle2, Clock3, FileText } from "lucide-react";
import { prisma } from "@/app/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ComplexTestDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const complexTestId = Number(id);

  if (!Number.isInteger(complexTestId) || complexTestId <= 0) {
    notFound();
  }

  const complexTest = await prisma.complexTest.findUnique({
    where: {
      id: complexTestId,
    },
    include: {
      tests: {
        orderBy: {
          order: "asc",
        },
        include: {
          test: {
            include: {
              _count: {
                select: {
                  questions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (
    !complexTest ||
    !complexTest.isPublished ||
    complexTest.isArchived
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto px-8 py-12 w-full">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#7A1F2B] shadow-md">
            <FileText
              className="h-8 w-8 text-white"
              strokeWidth={2}
            />
          </div>

          <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
            {complexTest.examType}
          </div>

          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[#7A1F2B]">
            {complexTest.title}
          </h1>

          {complexTest.description && (
            <p className="mt-5 text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto">
              {complexTest.description}
            </p>
          )}
        </div>

        {/* Основна інформація */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Час */}
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A1F2B]/10">
                <Clock3
                  className="h-6 w-6 text-[#7A1F2B]"
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Час на тестування
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-800">
                  {complexTest.duration} хв
                </p>
              </div>
            </div>
          </div>

          {/* Кількість предметів */}
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A1F2B]/10">
                <CheckCircle2
                  className="h-6 w-6 text-[#7A1F2B]"
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Предметів у тесті
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-800">
                  {complexTest.tests.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Предмети */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText
              className="h-6 w-6 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <h2 className="text-2xl font-bold text-[#7A1F2B]">
              Предмети
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {complexTest.tests.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 border border-gray-100 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.test.subject}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.test.title}
                  </p>
                </div>

                <div className="shrink-0 ml-4 text-right">
                  <span className="font-semibold text-[#7A1F2B]">
                    {item.test._count.questions}{" "}
                    {item.test._count.questions === 1
                      ? "питання"
                      : item.test._count.questions >= 2 &&
                        item.test._count.questions <= 4
                      ? "питання"
                      : "питань"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопка */}
        <div className="mt-10 flex justify-center">
          <a
            href={`/complex-tests/${complexTest.id}/start`}
            className="inline-flex items-center justify-center rounded-xl bg-[#7A1F2B] px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Обрати тест
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center px-8">
          <p className="text-gray-700 font-medium">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="w-5 h-5 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <span>
              Створено за підтримки технологій штучного інтелекту
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}