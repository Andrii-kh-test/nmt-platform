"use client";

import Link from "next/link";

type Props = {
  tests: {
    id: number;
    title: string;
    subject: string;
    duration: number;
    createdAt: Date;
    questions: {
      id: number;
    }[];
  }[];
};

export default function TestTable({
  tests,
}: Props) {
  if (tests.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-6">
          Поки що немає жодного тесту.
        </p>

        <Link
          href="/admin/tests/new"
          className="inline-block bg-[#7A1F2B] hover:bg-[#651923] text-white px-5 py-3 rounded-lg transition"
        >
          Створити перший тест
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">

        <thead>
          <tr className="border-b bg-gray-50">

            <th className="text-left p-4">
              Назва
            </th>

            <th className="text-left p-4">
              Предмет
            </th>

            <th className="text-center p-4">
              Питань
            </th>

            <th className="text-center p-4">
              Тривалість
            </th>

            <th className="text-center p-4">
              Створено
            </th>

            <th className="text-right p-4">
              Дії
            </th>

          </tr>
        </thead>

        <tbody>

          {tests.map((test) => (

            <tr
              key={test.id}
              className="border-b hover:bg-gray-50 transition"
            >

              <td className="p-4 font-medium">
                {test.title}
              </td>

              <td className="p-4">
                {test.subject}
              </td>

              <td className="text-center p-4">
                {test.questions.length}
              </td>

              <td className="text-center p-4">
                {test.duration} хв
              </td>

              <td className="text-center p-4">
                {new Date(
                  test.createdAt
                ).toLocaleDateString("uk-UA")}
              </td>

              <td className="p-4">

                <div className="flex justify-end gap-2">

                  <Link
                    href={`/admin/tests/${test.id}/edit`}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                    title="Редагувати"
                  >
                    ✏️
                  </Link>

                  <button
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                    title="Копіювати"
                  >
                    📄
                  </button>

                  <button
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                    title="Видалити"
                  >
                    🗑️
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>
    </div>
  );
}