"use client";

import Link from "next/link";

type Props = {
  id?: number;
  title: string;
  questions: number;
  description: string;
};

export default function TestCard({
  id,
  title,
  questions,
  description,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">

      <div className="flex justify-between items-start">

        <div>

          <h2 className="text-2xl font-bold text-[#7A1F2B] mb-2">
            {title}
          </h2>

          <p className="text-gray-600 mb-3">
            {description}
          </p>

          <div className="text-sm text-gray-500">
            Питань: <strong>{questions}</strong>
          </div>

        </div>

        {id && (
          <Link
            href={`/admin/tests/${id}/edit`}
            className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-5 py-2 rounded-lg transition"
          >
            Редагувати
          </Link>
        )}

      </div>

    </div>
  );
}