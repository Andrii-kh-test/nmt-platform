"use client";

import Link from "next/link";

type TestItem = {
  id: number;
  title: string;
  duration: number;
  maxPoints: number;
  isPublished: boolean;
  accessCode: string;
  questionsCount: number;
};

type Props = {
  test: TestItem;
};

export default function AdminTestCard({
  test,
}: Props) {
  return (
    <div className="border rounded-xl p-5 hover:shadow-lg transition">

      <div className="flex justify-between items-start">

        <div>

          <h3 className="text-xl font-bold text-[#7A1F2B]">
            {test.title}
          </h3>

          <div className="mt-3 space-y-1 text-gray-600">

            <p>
              📝 Питань: {test.questionsCount}
            </p>

            <p>
              ⏱ {test.duration} хв
            </p>

            <p>
              ⭐ {test.maxPoints} балів
            </p>

            {test.isPublished ? (
              <p className="text-green-600 font-semibold">
                🌐 Опублікований
              </p>
            ) : (
              <p className="text-red-600 font-semibold">
                🔒 Чернетка
              </p>
            )}

            {test.accessCode && (
              <p>
                🔑 {test.accessCode}
              </p>
            )}

          </div>

        </div>

        <div className="flex flex-col gap-2">

          <Link
            href={`/admin/tests/${test.id}/edit`}
            className="bg-[#7A1F2B] text-white px-4 py-2 rounded-lg hover:bg-[#641823]"
          >
            ✏️ Редагувати
          </Link>

          <button
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            📄 Копія
          </button>

          <button
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            🌐 Публікація
          </button>

          <button
            className="border rounded-lg px-4 py-2 text-red-600 hover:bg-red-50"
          >
            🗑 Видалити
          </button>

        </div>

      </div>

    </div>
  );
}