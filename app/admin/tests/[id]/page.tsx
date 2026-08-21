"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import TestSettings from "@/app/components/admin/TestSettings";
import QuestionList from "@/app/components/admin/QuestionList";

import {
  TestConstructorProvider,
  useTestConstructor,
} from "@/app/context/TestConstructorContext";

import { mapPrismaTest } from "@/app/utils/mapPrismaTest";

function EditTestContent() {
  const params = useParams();
  const { setTest } = useTestConstructor();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTest() {
      try {
        const id = params.id;

        if (!id) {
          throw new Error("Не вказано id тесту.");
        }

        const response = await fetch(
          `/api/admin/tests/${id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.test
        ) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити тест."
          );
        }

        /*
         * API повертає:
         *
         * test
         *  └── questions
         *       └── question
         *            └── answerOptions
         *
         * Конструктор працює з:
         *
         * test
         *  └── questions
         *       └── options
         *
         * Тому спочатку приводимо
         * структуру до формату конструктора.
         */

        const prismaTest = {
          ...data.test,

          questions:
            data.test.questions.map(
              (testQuestion: any) => ({
                ...testQuestion.question,

                order: testQuestion.order,

                options:
                  testQuestion.question
                    .answerOptions ?? [],
              })
            ),
        };

        const mappedTest =
          mapPrismaTest(prismaTest);

        setTest(mappedTest);
      } catch (err) {
        console.error(
          "LOAD EDIT TEST ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити тест."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [params.id, setTest]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <div className="text-xl font-semibold text-[#7A1F2B]">
              Завантаження тесту...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h1 className="mb-2 text-xl font-bold">
              Не вдалося завантажити тест
            </h1>

            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="mb-8 text-4xl font-bold text-[#7A1F2B]">
          Редагування тесту
        </h1>

        <div className="grid grid-cols-12 gap-8">

          <div className="col-span-4">
            <TestSettings />
          </div>

          <div className="col-span-8">
            <QuestionList />
          </div>

        </div>

      </div>
    </main>
  );
}

export default function EditTestPage() {
  return (
    <TestConstructorProvider>
      <EditTestContent />
    </TestConstructorProvider>
  );
}