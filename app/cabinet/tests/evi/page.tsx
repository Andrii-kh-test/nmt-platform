export const dynamic = "force-dynamic";

import {
  ArrowLeft,
  FileText,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import TestCard from "@/app/components/start/TestCard";

export default async function CabinetEviPage() {
  const tests = await prisma.test.findMany({
    where: {
      isPublished: true,
      examType: "ЄВІ",
    },

    orderBy: {
      displayOrder: "asc",
    },

    include: {
      questions: true,
    },
  });

  return (
    <div>
      {/* Назад */}
      <Link
        href="/cabinet/tests"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#64152d]"
      >
        <ArrowLeft className="h-4 w-4" />
        Усі тести
      </Link>

      {/* Заголовок */}
      <div className="mb-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#64152d]/10">
            <FileText
              className="h-7 w-7 text-[#64152d]"
              strokeWidth={2}
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-[#64152d]">
              ЄВІ
            </h1>

            <p className="mt-1 text-gray-600">
              Тренувальні завдання для підготовки до
              Єдиного вступного іспиту
            </p>
          </div>
        </div>
      </div>

      {/* Список тестів */}
      {tests.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <FileText
            className="mx-auto h-12 w-12 text-gray-300"
            strokeWidth={1.5}
          />

          <h2 className="mt-5 text-2xl font-semibold text-gray-700">
            Доступних тестів ЄВІ поки що немає
          </h2>

          <p className="mt-3 text-gray-500">
            Адміністратор ще не опублікував тестів для цього іспиту.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
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
  );
}