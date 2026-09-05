"use client";

import { useEffect, useState } from "react";
import { Brain, Clock3, FileText, Loader2 } from "lucide-react";

type ExamType = "НМТ" | "ЄВІ" | "ЄФВВ";

type ComplexTestItem = {
  id: number;
  order: number;
  test: {
    id: number;
    title: string;
    subject: string;
    duration: number;
    _count: {
      questions: number;
    };
  };
};

type ComplexTest = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  section: string | null;
  codeRequired: boolean;
  tests: ComplexTestItem[];
};

const examTypes: ExamType[] = ["НМТ", "ЄВІ", "ЄФВВ"];

export default function ComplexTestsPage() {
  const [selectedExamType, setSelectedExamType] =
    useState<ExamType | null>(null);

  const [complexTests, setComplexTests] = useState<ComplexTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedExamType) {
      setComplexTests([]);
      return;
    }

    async function loadComplexTests() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
  `/api/complex-tests?examType=${encodeURIComponent(
    selectedExamType ?? ""
  )}`
);

        if (!response.ok) {
          throw new Error(
            "Не вдалося отримати список комбінованих тестів."
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message ||
              "Не вдалося отримати список комбінованих тестів."
          );
        }

        setComplexTests(data.complexTests || []);
      } catch (err) {
        console.error(err);

        setComplexTests([]);

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити комбіновані тести."
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplexTests();
  }, [selectedExamType]);

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 w-full">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Комбіновані тести
          </h1>

          <p className="mt-5 text-xl text-gray-600">
            Оберіть тип іспиту
          </p>
        </div>

        {/* Вибір типу іспиту */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {examTypes.map((examType) => {
            const isSelected = selectedExamType === examType;

            return (
              <button
                key={examType}
                type="button"
                onClick={() => setSelectedExamType(examType)}
                className={`min-w-[180px] rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-[#7A1F2B] text-white shadow-lg"
                    : "bg-white text-[#7A1F2B] border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {examType}
              </button>
            );
          })}
        </div>

        {/* Поки тип іспиту не обрано */}
        {!selectedExamType && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7A1F2B]/10">
              <FileText
                className="h-8 w-8 text-[#7A1F2B]"
                strokeWidth={2}
              />
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">
              Оберіть тип іспиту
            </h2>

            <p className="mt-3 text-gray-500">
              Після вибору з&apos;являться доступні комбіновані тести.
            </p>
          </div>
        )}

        {/* Завантаження */}
        {selectedExamType && loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              className="h-10 w-10 animate-spin text-[#7A1F2B]"
            />

            <p className="mt-4 text-gray-600">
              Завантаження тестів...
            </p>
          </div>
        )}

        {/* Помилка */}
        {selectedExamType && !loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
            <h2 className="text-2xl font-semibold text-red-700">
              Не вдалося завантажити тести
            </h2>

            <p className="mt-3 text-gray-600">
              {error}
            </p>
          </div>
        )}

        {/* Немає тестів */}
        {selectedExamType &&
          !loading &&
          !error &&
          complexTests.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-700">
                Комбінованих тестів поки що немає
              </h2>

              <p className="mt-4 text-gray-500">
                Опублікованих комбінованих тестів для іспиту{" "}
                <span className="font-semibold">
                  {selectedExamType}
                </span>{" "}
                поки що немає.
              </p>
            </div>
          )}

        {/* Картки комбінованих тестів */}
        {selectedExamType &&
          !loading &&
          !error &&
          complexTests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {complexTests.map((complexTest) => {
                const subjects = complexTest.tests.map((item) => ({
                  subject: item.test.subject,
                  questions: item.test._count.questions,
                }));

                return (
                  <div
                    key={complexTest.id}
                    className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Назва */}
                    <h2 className="text-2xl font-bold text-[#7A1F2B]">
                      {complexTest.title}
                    </h2>

                    {/* Опис */}
                    {complexTest.description && (
                      <p className="mt-3 text-gray-600 leading-relaxed">
                        {complexTest.description}
                      </p>
                    )}

                    {/* Предмети */}
                    <div className="mt-7">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <FileText
                          className="h-5 w-5 text-[#7A1F2B]"
                          strokeWidth={2}
                        />

                        <span>
                          Предмети та кількість питань
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {subjects.map((item, index) => (
                          <div
                            key={`${complexTest.id}-${item.subject}-${index}`}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                          >
                            <span className="text-gray-700">
                              {item.subject}
                            </span>

                            <span className="font-semibold text-[#7A1F2B]">
                              {item.questions}{" "}
                              {item.questions === 1
                                ? "питання"
                                : item.questions >= 2 &&
                                  item.questions <= 4
                                ? "питання"
                                : "питань"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Час */}
                    <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                      <Clock3
                        className="h-5 w-5 text-[#7A1F2B]"
                        strokeWidth={2}
                      />

                      <span className="text-gray-600">
                        Час на тестування:
                      </span>

                      <span className="font-semibold text-gray-800">
                        {complexTest.duration} хв
                      </span>
                    </div>
                  </div>
                );
              })}
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
