"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Trash2,
} from "lucide-react";

type Test = {
  id: number;
  title: string;
  duration: number;
  isPublished: boolean;
  questions: any[];
};

type Props = {
  subjectId: number;
  subject: string;
  tests: Test[];
};

export default function SubjectBlock({
  subjectId,
  subject,
  tests,
}: Props) {
  const [opened, setOpened] = useState(true);

  const [loadingTestId, setLoadingTestId] =
    useState<number | null>(null);

  async function handleArchiveTest(
    test: Test
  ) {
    if (loadingTestId !== null) {
      return;
    }

    try {
      setLoadingTestId(test.id);

      const response = await fetch(
        `/api/admin/tests/${test.id}`,
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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося архівувати тест."
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "ARCHIVE TEST ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося архівувати тест."
      );

      setLoadingTestId(null);
    }
  }

  async function handleDeleteTest(
    test: Test
  ) {
    if (loadingTestId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Ви впевнені, що хочете остаточно видалити тест «${test.title}»?\n\nЦю дію неможливо скасувати.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingTestId(test.id);

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

      window.location.reload();
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

      setLoadingTestId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200">

      {/* ================================
          ЗАГОЛОВОК РОЗДІЛУ
          ================================ */}

      <div className="flex items-center justify-between">

        <button
          type="button"
          onClick={() => setOpened(!opened)}
          className="
            flex-1
            flex
            items-center
            justify-between
            px-6
            py-5
            hover:bg-gray-50
            transition
            text-left
          "
        >
          <div className="flex items-center gap-4">

            <span className="text-3xl">
              📂
            </span>

            <div>

              <div className="text-2xl font-bold text-[#7A1F2B]">
                {subject}
              </div>

              <div className="text-gray-500">
                Тестів: {tests.length}
              </div>

            </div>

          </div>

          <span className="text-3xl ml-4">
            {opened ? "▾" : "▸"}
          </span>
        </button>

        {/* Кнопки розділу */}

        <div className="flex items-center gap-2 px-5">

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              fetch(
                "/api/admin/subjects",
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    id: subjectId,
                    isArchived: true,
                  }),
                }
              )
                .then(async (response) => {
                  const result =
                    await response.json();

                  if (
                    !response.ok ||
                    !result.success
                  ) {
                    throw new Error(
                      result.message ||
                        "Не вдалося архівувати розділ."
                    );
                  }

                  window.location.reload();
                })
                .catch((error) => {
                  console.error(
                    "ARCHIVE SUBJECT ERROR:",
                    error
                  );

                  alert(
                    error instanceof Error
                      ? error.message
                      : "Не вдалося архівувати розділ."
                  );
                });
            }}
            className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              border
              border-amber-500
              text-amber-700
              hover:bg-amber-50
              transition
              font-medium
            "
            title="Архівувати розділ"
          >
            <Archive className="w-4 h-4" />
            Архівувати
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              const confirmed =
                window.confirm(
                  `Ви впевнені, що хочете остаточно видалити розділ «${subject}»?\n\nЦю дію неможливо скасувати.`
                );

              if (!confirmed) {
                return;
              }

              fetch(
                "/api/admin/subjects",
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    id: subjectId,
                  }),
                }
              )
                .then(async (response) => {
                  const result =
                    await response.json();

                  if (
                    !response.ok ||
                    !result.success
                  ) {
                    throw new Error(
                      result.message ||
                        "Не вдалося видалити розділ."
                    );
                  }

                  window.location.reload();
                })
                .catch((error) => {
                  console.error(
                    "DELETE SUBJECT ERROR:",
                    error
                  );

                  alert(
                    error instanceof Error
                      ? error.message
                      : "Не вдалося видалити розділ."
                  );
                });
            }}
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
              transition
              font-medium
            "
            title="Видалити розділ"
          >
            <Trash2 className="w-4 h-4" />
            Видалити
          </button>

        </div>

      </div>

      {/* ================================
          ТЕСТИ
          ================================ */}

      {opened && (

        <div className="border-t">

          {tests.map((test) => (

            <div
              key={test.id}
              className="
                flex
                justify-between
                items-center
                px-8
                py-4
                hover:bg-slate-50
                border-b
                last:border-0
              "
            >

              {/* Інформація про тест */}

              <Link
                href={`/admin/tests/${test.id}`}
                className="flex-1 min-w-0"
              >
                <div>

                  <div className="font-semibold text-lg">
                    {test.title}
                  </div>

                  <div className="text-sm text-gray-500">
                    {test.questions.length} питань
                  </div>

                </div>
              </Link>

              {/* Керування тестом */}

              <div className="flex gap-3 items-center ml-5">

                {test.isPublished ? (

                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm whitespace-nowrap">
                    Опубліковано
                  </span>

                ) : (

                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm whitespace-nowrap">
                    Чернетка
                  </span>

                )}

                <button
                  type="button"
                  disabled={
                    loadingTestId !== null
                  }
                  onClick={() =>
                    handleArchiveTest(test)
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-lg
                    border
                    border-amber-500
                    text-amber-700
                    hover:bg-amber-50
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition
                    text-sm
                    font-medium
                    whitespace-nowrap
                  "
                  title="Архівувати тест"
                >
                  <Archive className="w-4 h-4" />

                  {loadingTestId ===
                  test.id
                    ? "..."
                    : "Архівувати"}
                </button>

                <button
                  type="button"
                  disabled={
                    loadingTestId !== null
                  }
                  onClick={() =>
                    handleDeleteTest(test)
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-lg
                    border
                    border-red-500
                    text-red-600
                    hover:bg-red-50
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition
                    text-sm
                    font-medium
                    whitespace-nowrap
                  "
                  title="Видалити тест"
                >
                  <Trash2 className="w-4 h-4" />

                  {loadingTestId ===
                  test.id
                    ? "..."
                    : "Видалити"}
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}