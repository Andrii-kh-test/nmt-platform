export const dynamic = "force-dynamic";

import { Brain } from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import TestCard from "@/app/components/start/TestCard";

export default async function YeviPage() {
  const tests = await prisma.test.findMany({
    where: {
      isPublished: true,
      examType: "ЄВІ",
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

        {/* Заголовок */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            ЄВІ
          </h1>

          <p className="mt-5 text-xl text-gray-600">
            Тренувальні тести для підготовки до
            Єдиного вступного іспиту
          </p>
        </div>

        {/* Тести */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-700">
              Доступних тестів ЄВІ поки що немає
            </h2>

            <p className="mt-4 text-gray-500">
              Адміністратор ще не опублікував тестів для цього іспиту.
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center">

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