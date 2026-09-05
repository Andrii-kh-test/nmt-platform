"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/subjects",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: subjectId,
            isArchived: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося архівувати розділ."
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "ARCHIVE SUBJECT ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося архівувати розділ."
      );

      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading) {
      return;
    }

    const confirmed = window.confirm(
      `Ви впевнені, що хочете остаточно видалити розділ «${subject}»?\n\nЦю дію неможливо скасувати.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/subjects",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: subjectId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Не вдалося видалити розділ."
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "DELETE SUBJECT ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити розділ."
      );

      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200">

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

        <div className="flex items-center gap-2 px-5">

          <button
            type="button"
            disabled={loading}
            onClick={handleArchive}
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
              disabled:opacity-50
              disabled:cursor-not-allowed
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
            disabled={loading}
            onClick={handleDelete}
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
            title="Видалити розділ"
          >
            <Trash2 className="w-4 h-4" />
            Видалити
          </button>

        </div>

      </div>

      {opened && (

        <div className="border-t">

          {tests.map((test) => (

            <Link
              key={test.id}
              href={`/admin/tests/${test.id}`}
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

              <div>

                <div className="font-semibold text-lg">
                  {test.title}
                </div>

                <div className="text-sm text-gray-500">
                  {test.questions.length} питань
                </div>

              </div>

              <div className="flex gap-3 items-center">

                {test.isPublished ? (

                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                    Опубліковано
                  </span>

                ) : (

                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm">
                    Чернетка
                  </span>

                )}

              </div>

            </Link>

          ))}

        </div>

      )}

    </div>
  );
}