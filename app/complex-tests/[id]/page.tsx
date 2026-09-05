import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";
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
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      examType: true,
      isPublished: true,
      isArchived: true,

      tests: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          order: true,

          test: {
            select: {
              id: true,
              title: true,
              subject: true,

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
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-12">
        {/* Назад */}
        <Link
          href="/complex-tests"
          className="mb-8 inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-[#7A1F2B]"
        >
          <ArrowRight className="h-5 w-5 rotate-180" />
          Назад до комбінованих тестів
        </Link>

        {/* Основна картка */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Верхня частина */}
          <div className="px-6 py-8 text-center md:px-10 md:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7A1F2B] shadow-md">
              <Brain
                className="h-8 w-8 text-white"
                strokeWidth={2}
              />
            </div>

            <div className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
              {complexTest.examType}
            </div>

            <h1 className="mt-3 text-3xl font-bold text-[#7A1F2B] md:text-4xl">
              {complexTest.title}
            </h1>

            {complexTest.description && (
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-600">
                {complexTest.description}
              </p>
            )}
          </div>

          {/* Основна інформація */}
          <div className="border-y border-gray-200 bg-slate-50 px-6 py-6 md:px-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Тривалість */}
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7A1F2B]/10">
                  <Clock3
                    className="h-6 w-6 text-[#7A1F2B]"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Тривалість
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-800">
                    {complexTest.duration} хв.
                  </p>
                </div>
              </div>

              {/* Кількість предметів */}
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7A1F2B]/10">
                  <FileText
                    className="h-6 w-6 text-[#7A1F2B]"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Кількість предметів
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-800">
                    {complexTest.tests.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Предмети */}
          <div className="px-6 py-8 md:px-10">
            <h2 className="text-2xl font-bold text-gray-800">
              Структура тесту
            </h2>

            <p className="mt-2 text-gray-500">
              До складу комбінованого тесту входять такі
              предмети:
            </p>

            <div className="mt-6 space-y-4">
              {complexTest.tests.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
                >
                  {/* Номер */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A1F2B] text-sm font-bold text-white">
                    {index + 1}
                  </div>

                  {/* Інформація */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-lg font-bold text-gray-800">
                        {item.test.subject}
                      </h3>

                      <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                        {item.test._count.questions}{" "}
                        {item.test._count.questions === 1
                          ? "завдання"
                          : item.test._count.questions >= 2 &&
                              item.test._count.questions <= 4
                            ? "завдання"
                            : "завдань"}
                      </span>
                    </div>

                    <p className="mt-1 text-gray-600">
                      {item.test.title}
                    </p>
                  </div>

                  {/* Позначка */}
                  <CheckCircle2
                    className="mt-1 hidden h-5 w-5 shrink-0 text-[#7A1F2B] sm:block"
                    strokeWidth={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Кнопка старту */}
          <div className="border-t border-gray-200 bg-slate-50 px-6 py-8 md:px-10">
            <div className="text-center">
              <p className="text-gray-600">
                Перевірте інформацію про тест та перейдіть
                до введення даних учасника.
              </p>

              <div className="mt-6 flex justify-center">
                <Link
                  href={`/complex-tests/${complexTest.id}/start`}
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#7A1F2B] px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Обрати тест
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-8 text-center">
          <p className="font-medium text-gray-700">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="h-5 w-5 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <span>
              Створено за підтримки технологій штучного
              інтелекту
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}