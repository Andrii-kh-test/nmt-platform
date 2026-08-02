"use client";

import { useRouter } from "next/navigation";

type Props = {
  id: number;

  title: string;

  subject: string;

  duration: number;

  questions: number;

  href?: string;
};

export default function TestCard({
  id,
  title,
  subject,
  duration,
  questions,
  href,
}: Props) {
  const router = useRouter();

  function openTest() {
    router.push(
      href ?? `/test/start/${id}`
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">

      <h2 className="text-2xl font-bold text-[#7A1F2B]">
        {title}
      </h2>

      <p className="mt-2 text-gray-600">
        {subject}
      </p>

      <div className="mt-6 space-y-2 text-gray-700">

        <div>
          <strong>Кількість питань:</strong>{" "}
          {questions}
        </div>

        <div>
          <strong>Тривалість:</strong>{" "}
          {duration} хв.
        </div>

      </div>

      <button
        type="button"
        onClick={openTest}
        className="mt-8 w-full bg-[#7A1F2B] hover:bg-[#641823] text-white py-3 rounded-lg font-semibold transition"
      >
        Обрати тест
      </button>

    </div>
  );
}