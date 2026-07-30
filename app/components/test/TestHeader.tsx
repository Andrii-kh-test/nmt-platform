"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

import Timer from "./Timer";

export default function TestHeader() {
  const { test } = useTestSession();

  if (!test) {
    return null;
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold text-[#7A1F2B]">
            {test.title}
          </h1>

          <div className="flex gap-6 mt-2 text-gray-600">

            <span>
              <strong>Предмет:</strong> {test.subject}
            </span>

            <span>
              <strong>Питань:</strong> {test.questions.length}
            </span>

            <span>
              <strong>Максимум:</strong> {test.maxPoints} б.
            </span>

          </div>

        </div>

        <Timer />

      </div>

    </header>
  );
}