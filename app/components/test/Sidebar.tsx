"use client";

import QuestionNumbers from "./QuestionNumbers";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function Sidebar() {
  const {
    test,
  } = useTestSession();

  if (!test) {
    return null;
  }

  return (
    <aside
      className="
        sticky
        top-6
        w-64
        shrink-0
        bg-white
        border
        border-gray-200
        rounded-xl
        shadow-md
        p-6
        max-h-[calc(100vh-3rem)]
        overflow-y-auto
      "
    >

      {/* =================================================
          TITLE
      ================================================= */}

      <h2
        className="
          text-xl
          font-semibold
          text-gray-800
          mb-5
        "
      >
        Завдання
      </h2>


      {/* =================================================
          QUESTION NUMBERS
      ================================================= */}

      <QuestionNumbers />


      {/* =================================================
          LEGEND
      ================================================= */}

      <div
        className="
          mt-8
          border-t
          border-gray-200
          pt-6
        "
      >

        {/* SAVED */}

        <div
          className="
            flex
            items-center
            gap-3
            mb-3
          "
        >

          <div
            className="
              w-5
              h-5
              rounded
              bg-[#7A1F2B]
              shrink-0
            "
          />

          <span className="text-sm">
            Відповідь збережена
          </span>

        </div>


        {/* NOT SAVED */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              w-5
              h-5
              rounded
              border
              border-gray-300
              bg-white
              shrink-0
            "
          />

          <span className="text-sm">
            Відповідь не збережена
          </span>

        </div>

      </div>

    </aside>
  );
}