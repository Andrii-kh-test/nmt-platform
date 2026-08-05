"use client";

import { useState } from "react";
import AdminTestCard from "./AdminTestCard";

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
  subject: string;
  tests: TestItem[];
};

export default function SubjectGroup({
  subject,
  tests,
}: Props) {
  const [opened, setOpened] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">

      <button
        onClick={() => setOpened(!opened)}
        className="w-full flex justify-between items-center px-6 py-5 bg-[#7A1F2B] text-white"
      >
        <span className="text-xl font-semibold">
          📁 {subject}
        </span>

        <span>
          {tests.length} тестів
        </span>
      </button>

      {opened && (
        <div className="p-6 grid gap-5">

          {tests.map((test) => (
            <AdminTestCard
              key={test.id}
              test={test}
            />
          ))}

        </div>
      )}

    </div>
  );
}