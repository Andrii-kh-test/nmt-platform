"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Layers3,
  Clock,
} from "lucide-react";

type Test = {
  id: number;
  title: string;
  subject: string;
  duration: number;
  isPublished: boolean;
  isArchived: boolean;
  questions: any[];
  subjectRef?: {
    id: number;
    name: string;
  } | null;
};

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

export default function ArchivedTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [complexTests, setComplexTests] = useState<ComplexTest[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionType, setActionType] = useState<
    "test" | "complex" | null
  >(null);

  const [actionId, setActionId] =
    useState<number | null>(null);

  async function loadTests() {
    try {
      setLoading(true);

      const [testsResponse, complexTestsResponse] =
        await Promise.all([
          fetch(
            "/api/admin/tests?archived=true",
            {
              cache: "no-store",
            }
          ),
          fetch(
            "/api/admin/complex-tests?archived=true",
            {
              cache: "no-store",
            }
          ),
        ]);

      const testsResult =
        await testsResponse.json();

      const complexTestsResult =
        await complexTestsResponse.json();

      if (
        !testsResponse.ok ||
        !testsResult.success
      ) {
        throw new Error(
          testsResult.message ||
            "Не вдалося завантажити архів звичайних тестів."
        );
      }

      if (
        !complexTestsResponse.ok ||
        !complexTestsResult.success
      ) {
        throw new Error(
          complexTestsResult.message ||
            "Не вдалося завантажити архів комбінованих тестів."
        );
      }

      setTests(testsResult.tests ?? []);

      setComplexTests(
        complexTestsResult.complexTests ?? []
      );
    } catch (error) {
      console.error(
        "LOAD ARCHIVED TESTS ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити архів тестів."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTests();
  }, []);

  async function handleRestoreTest(
    test: Test
  ) {
    if (actionId !== null) {
      return;
    }

    try {
      setActionType("test");
      setActionId(test.id);

      const response = await fetch(
        `/api/admin/tests/${test.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isArchived: false,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося відновити тест."
        );
      }

      await loadTests();
    } catch (error) {
      console.error(
        "RESTORE TEST ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося відновити тест."
      );
    } finally {
      setActionType(null);
      setActionId(null);
    }
  }

  async function handleDeleteTest(
    test: Test
  ) {
    if (actionId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Ви впевнені, що хочете остаточно видалити тест «${test.title}»?\n\nЦю дію неможливо скасувати.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionType("test");
      setActionId(test.id);

      const response = await fetch(
        `/api/admin/tests/${test.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося видалити тест."
        );
      }

      await loadTests();
    } catch (error) {
      console.error(
        "DELETE TEST ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити тест."
      );
    } finally {
      setActionType(null);
      setActionId(null);
    }
  }

  async function handleRestoreComplexTest(
    complexTest: ComplexTest
  ) {
    if (actionId !== null) {
      return;
    }

    try {
      setActionType("complex");
      setActionId(complexTest.id);

      const response = await fetch(
        `/api/admin/complex-tests/${complexTest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isArchived: false,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося відновити комбінований тест."
        );
      }

      await loadTests();
    } catch (error) {
      console.error(
        "RESTORE COMPLEX TEST ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося відновити комбінований тест."
      );
    } finally {
      setActionType(null);
      setActionId(null);
    }
  }

  async function handleDeleteComplexTest(
    complexTest: ComplexTest
  ) {
    if (actionId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Ви впевнені, що хочете остаточно видалити комбінований тест «${complexTest.title}»?\n\nЦю дію неможливо скасувати.\n\nЗвичайні тести, які входять до його складу, НЕ будуть видалені.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionType("complex");
      setActionId(complexTest.id);

      const response = await fetch(
        `/api/admin/complex-tests/${complexTest.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося видалити комбінований тест."
        );
      }

      await loadTests();
    } catch (error) {
      console.error(
        "DELETE COMPLEX TEST ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити комбінований тест."
      );
    } finally {
      setActionType(null);
      setActionId(null);
    }
  }

  const archiveIsEmpty =
    tests.length === 0 &&
    complexTests.length === 0;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto py-10 px-8">

        {/* Заголовок */}

        <div className="flex items-center gap-4 mb-10">

          <Link
            href="/admin/tests/archive"
            className="
              inline-flex
              items-center
              justify-center
              w-11
              h-11
              rounded-lg
              border
              border-gray-300
              bg-white
              text-gray-600
              hover:bg-gray-50
              transition
            "
            title="Повернутися до архіву"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">

            <Archive className="w-9 h-9 text-[#7A1F2B]" />

            <h1 className="text-5xl font-bold text-[#7A1F2B]">
              Архів тестів
            </h1>

          </div>

        </div>

        {/* Завантаження */}

        {loading ? (

          <div className="bg-white rounded-xl shadow-lg p-10 text-center">

            <p className="text-lg text-gray-500">
              Завантаження архіву...
            </p>

          </div>

        ) : archiveIsEmpty ? (

          /* Порожній архів */

          <div className="bg-white rounded-xl shadow-lg p-12 text-center">

            <Archive className="w-16 h-16 mx-auto mb-5 text-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Архів тестів порожній
            </h2>

            <p className="text-gray-500">
              Тут з'являтимуться звичайні та
              комбіновані тести, які ви архівуєте.
            </p>

          </div>

        ) : (

          <div className="space-y-10">

            {/* =================================================
                ЗВИЧАЙНІ ТЕСТИ
            ================================================= */}

            {tests.length > 0 && (

              <section>

                <div className="flex items-center gap-3 mb-5">

                  <Archive className="w-7 h-7 text-gray-600" />

                  <h2 className="text-2xl font-bold text-gray-700">
                    Звичайні тести
                  </h2>

                </div>

                <div className="space-y-4">

                  {tests.map((test) => (

                    <div
                      key={test.id}
                      className="
                        bg-white
                        rounded-xl
                        shadow
                        border
                        border-gray-200
                        p-6
                      "
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        <div className="flex items-start gap-4 min-w-0">

                          <div
                            className="
                              w-12
                              h-12
                              rounded-xl
                              bg-gray-100
                              flex
                              items-center
                              justify-center
                              flex-shrink-0
                            "
                          >
                            <Archive className="w-6 h-6 text-gray-500" />
                          </div>

                          <div className="min-w-0">

                            <h3 className="text-xl font-bold text-gray-800">
                              {test.title}
                            </h3>

                            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">

                              <span>
                                Розділ:{" "}
                                {test.subjectRef?.name ??
                                  test.subject}
                              </span>

                              <span>
                                Питань:{" "}
                                {test.questions.length}
                              </span>

                              <span>
                                Час:{" "}
                                {test.duration} хв.
                              </span>

                            </div>

                            <div className="mt-3">

                              <span className="inline-flex px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm">
                                Архів
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          {/* Відновити */}

                          <button
                            type="button"
                            disabled={
                              actionId !== null
                            }
                            onClick={() =>
                              handleRestoreTest(test)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-4
                              py-2
                              rounded-lg
                              border
                              border-green-500
                              text-green-700
                              hover:bg-green-50
                              disabled:opacity-50
                              disabled:cursor-not-allowed
                              transition
                              font-medium
                            "
                          >

                            <RotateCcw className="w-4 h-4" />

                            {actionType === "test" &&
                            actionId === test.id
                              ? "..."
                              : "Відновити"}

                          </button>

                          {/* Видалити */}

                          <button
                            type="button"
                            disabled={
                              actionId !== null
                            }
                            onClick={() =>
                              handleDeleteTest(test)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-4
                              py-2
                              rounded-lg
                              border
                              border-red-500
                              text-red-600
                              hover:bg-red-50
                              disabled:opacity-50
                              disabled:cursor-not-allowed
                              transition
                              font-medium
                            "
                          >

                            <Trash2 className="w-4 h-4" />

                            {actionType === "test" &&
                            actionId === test.id
                              ? "..."
                              : "Видалити назавжди"}

                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </section>

            )}

            {/* =================================================
                КОМБІНОВАНІ ТЕСТИ
            ================================================= */}

            {complexTests.length > 0 && (

              <section>

                <div className="flex items-center gap-3 mb-5">

                  <Layers3 className="w-7 h-7 text-gray-600" />

                  <h2 className="text-2xl font-bold text-gray-700">
                    Комбіновані тести
                  </h2>

                </div>

                <div className="space-y-4">

                  {complexTests.map(
                    (complexTest) => (

                      <div
                        key={complexTest.id}
                        className="
                          bg-white
                          rounded-xl
                          shadow
                          border
                          border-gray-200
                          p-6
                        "
                      >

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                          <div className="flex items-start gap-4 min-w-0">

                            <div
                              className="
                                w-12
                                h-12
                                rounded-xl
                                bg-gray-100
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                              "
                            >
                              <Layers3 className="w-6 h-6 text-gray-500" />
                            </div>

                            <div className="min-w-0">

                              <h3 className="text-xl font-bold text-gray-800">
                                {complexTest.title}
                              </h3>

                              {complexTest.description && (
                                <p className="text-gray-500 mt-1">
                                  {complexTest.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">

                                <span>
                                  Тестів у складі:{" "}
                                  {complexTest.tests.length}
                                </span>

                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Час:{" "}
                                  {complexTest.duration} хв.
                                </span>

                              </div>

                              {/* Складники */}

                              {complexTest.tests.length > 0 && (

                                <div className="mt-4">

                                  <p className="text-sm font-semibold text-gray-600 mb-2">
                                    Складники:
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

                              )}

                              <div className="mt-3">

                                <span className="inline-flex px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm">
                                  Архів комбінованого тесту
                                </span>

                              </div>

                            </div>

                          </div>

                          <div className="flex flex-wrap items-center gap-3">

                            {/* Відновити */}

                            <button
                              type="button"
                              disabled={
                                actionId !== null
                              }
                              onClick={() =>
                                handleRestoreComplexTest(
                                  complexTest
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2
                                rounded-lg
                                border
                                border-green-500
                                text-green-700
                                hover:bg-green-50
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                                transition
                                font-medium
                              "
                            >

                              <RotateCcw className="w-4 h-4" />

                              {actionType === "complex" &&
                              actionId ===
                                complexTest.id
                                ? "..."
                                : "Відновити"}

                            </button>

                            {/* Видалити назавжди */}

                            <button
                              type="button"
                              disabled={
                                actionId !== null
                              }
                              onClick={() =>
                                handleDeleteComplexTest(
                                  complexTest
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2
                                rounded-lg
                                border
                                border-red-500
                                text-red-600
                                hover:bg-red-50
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                                transition
                                font-medium
                              "
                            >

                              <Trash2 className="w-4 h-4" />

                              {actionType === "complex" &&
                              actionId ===
                                complexTest.id
                                ? "..."
                                : "Видалити назавжди"}

                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </section>

            )}

          </div>

        )}

      </div>
    </main>
  );
}