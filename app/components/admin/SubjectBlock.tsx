"use client";

import { useState } from "react";
import Link from "next/link";

type Test = {
  id: number;
  title: string;
  duration: number;
  isPublished: boolean;
  questions: any[];
};

type Props = {
  subject: string;
  tests: Test[];
};

export default function SubjectBlock({
  subject,
  tests,
}: Props) {

  const [opened, setOpened] =
    useState(true);

  return (

    <div className="bg-white rounded-xl shadow border border-gray-200">

      <button
        onClick={() => setOpened(!opened)}
        className="
          w-full
          flex
          items-center
          justify-between
          px-6
          py-5
          hover:bg-gray-50
          transition
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

        <span className="text-3xl">

          {opened ? "▾" : "▸"}

        </span>

      </button>

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