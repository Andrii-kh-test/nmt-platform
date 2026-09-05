"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  Clock,
  FileText,
  Plus,
} from "lucide-react";

type ComplexTestItem = {
  id: number;
  order: number;
  test: {
    id: number;
    title: string;
    subject: string;
  };
};

type ComplexTest = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  isPublished: boolean;
  isArchived: boolean;
  tests: ComplexTestItem[];
};

export default function ComplexTestsBlock() {
  const [complexTests, setComplexTests] = useState<ComplexTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplexTests();
  }, []);

  async function loadComplexTests() {
    try {
      const response = await fetch(
        "/api/admin/complex-tests"
      );

      const data = await response.json();

      if (data.success) {
        setComplexTests(data.complexTests ?? []);
      }
    } catch (error) {
      console.error(
        "Помилка завантаження комбінованих тестів:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function createComplexTest() {
    window.location.href =
      "/admin/tests/complex/new";
  }

  function editComplexTest(id: number) {
    window.location.href =
      `/admin/tests/complex/${id}`;
  }

  async function archiveComplexTest(id: number) {
    const confirmed = window.confirm(
      "Перемістити цей комбінований тест до архіву?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/complex-tests/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isArchived: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ??
            "Не вдалося архівувати комбінований тест."
        );
        return;
      }

      setComplexTests((current) =>
        current.filter((test) => test.id !== id)
      );
    } catch (error) {
      console.error(
        "Помилка архівування комбінованого тесту:",
        error
      );

      alert(
        "Сталася помилка під час архівування."
      );
    }
  }

  if (loading) {
    return (
      <section className="mt-10">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-gray-500">
            Завантаження комбінованих тестів...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* Заголовок блоку */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">

        <div className="bg-[#7A1F2B] px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h2 className="text-2xl font-bold text-white">
              Комбіновані тести
            </h2>

            <p className="text-white/80 mt-1">
              Тести, що об'єднують завдання з кількох розділів
            </p>
          </div>

          <button
            type="button"
            onClick={createComplexTest}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-white
              text-[#7A1F2B]
              hover:bg-gray-100
              px-5
              py-3
              rounded-lg
              font-semibold
              shadow
              transition
              whitespace-nowrap
            "
          >
            <Plus className="w-5 h-5" />
            Створити комбінований тест
          </button>

        </div>

        {/* Список */}
        {complexTests.length === 0 ? (

          <div className="px-6 py-10 text-center">

            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />

            <h3 className="text-xl font-semibold text-gray-600">
              Комбінованих тестів ще немає
            </h3>

            <p className="text-gray-400 mt-2">
              Створіть тест, об'єднавши два або більше звичайних тестів.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-gray-200">

            {complexTests.map((complexTest) => (

              <div
                key={complexTest.id}
                className="px-6 py-6 hover:bg-gray-50 transition"
              >

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                  {/* Основна інформація */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-xl font-bold text-gray-800">
                        {complexTest.title}
                      </h3>

                      {complexTest.isPublished ? (
                        <span className="
                          inline-flex
                          items-center
                          px-3
                          py-1
                          rounded-full
                          text-sm
                          font-medium
                          bg-green-100
                          text-green-700
                        ">
                          Опублікований
                        </span>
                      ) : (
                        <span className="
                          inline-flex
                          items-center
                          px-3
                          py-1
                          rounded-full
                          text-sm
                          font-medium
                          bg-gray-100
                          text-gray-600
                        ">
                          Чернетка
                        </span>
                      )}

                    </div>

                    {complexTest.description && (
                      <p className="text-gray-500 mt-2">
                        {complexTest.description}
                      </p>
                    )}

                    {/* Складники */}
                    <div className="mt-5">

                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        Складники тесту:
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {complexTest.tests.map(
                          (item) => (
                            <span
                              key={item.id}
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-lg
                                bg-slate-100
                                text-gray-700
                                text-sm
                              "
                            >
                              <span className="font-medium">
                                {item.test.subject}
                              </span>

                              <span className="text-gray-400">
                                —
                              </span>

                              <span>
                                {item.test.title}
                              </span>
                            </span>
                          )
                        )}

                      </div>

                    </div>

                    {/* Тривалість */}
                    <div className="flex items-center gap-2 mt-4 text-gray-500">

                      <Clock className="w-4 h-4" />

                      <span>
                        Загальна тривалість:{" "}
                        <strong className="text-gray-700">
                          {complexTest.duration} хв
                        </strong>
                      </span>

                    </div>

                  </div>

                  {/* Кнопки */}
                  <div className="flex flex-wrap items-center gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        editComplexTest(complexTest.id)
                      }
                      className="
                        px-4
                        py-2
                        rounded-lg
                        border
                        border-gray-300
                        text-gray-700
                        hover:border-[#7A1F2B]
                        hover:text-[#7A1F2B]
                        transition
                        font-medium
                      "
                    >
                      Редагувати
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        archiveComplexTest(complexTest.id)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        px-4
                        py-2
                        rounded-lg
                        border
                        border-gray-300
                        text-gray-700
                        hover:border-[#7A1F2B]
                        hover:text-[#7A1F2B]
                        transition
                        font-medium
                      "
                    >
                      <Archive className="w-4 h-4" />
                      Архівувати
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </section>
  );
}