"use client";

import { useEffect, useState } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import Timer from "./Timer";

type Participant = {
  lastName: string;
  firstName: string;
  middleName: string;
};

export default function TestHeader() {
  const { test } = useTestSession();

  const [participant, setParticipant] =
    useState<Participant | null>(null);

  useEffect(() => {
    const saved =
      localStorage.getItem("participant");

    if (saved) {
      setParticipant(JSON.parse(saved));
    }
  }, []);

  if (!test) {
    return null;
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-start">

        <div>

          <h1 className="text-3xl font-bold text-[#7A1F2B]">
            {test.title}
          </h1>

          <div className="flex flex-wrap gap-6 mt-3 text-gray-700">

            <span>
              <strong>Предмет:</strong>{" "}
              {test.subject}
            </span>

            <span>
              <strong>Питань:</strong>{" "}
              {test.questions.length}
            </span>

            <span>
              <strong>Максимум:</strong>{" "}
              {test.maxPoints} б.
            </span>

          </div>

          {participant && (

            <div className="mt-4 bg-slate-100 rounded-lg px-4 py-3 border">

              <div className="text-sm text-gray-500">
                Учасник тестування
              </div>

              <div className="font-semibold text-lg text-[#7A1F2B]">

                {participant.lastName}{" "}
                {participant.firstName}{" "}
                {participant.middleName}

              </div>

            </div>

          )}

        </div>

        <Timer />

      </div>

    </header>
  );
}