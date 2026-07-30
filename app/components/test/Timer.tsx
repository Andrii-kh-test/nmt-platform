"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function Timer() {
  const {
    timeLeft,
    startTimer,
    stopTimer,
  } = useTestSession();

  useEffect(() => {
    startTimer();

    return () => {
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  const hours = Math.floor(timeLeft / 3600);

  const minutes = Math.floor(
    (timeLeft % 3600) / 60
  );

  const seconds = timeLeft % 60;

  return (
    <div className="bg-white rounded-xl shadow px-5 py-3">

      <div className="text-sm text-gray-500 mb-1">
        Залишилося часу
      </div>

      <div
        className={`text-3xl font-bold ${
          timeLeft <= 300
            ? "text-red-600"
            : "text-[#7A1F2B]"
        }`}
      >
        {String(hours).padStart(2, "0")}:
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </div>

    </div>
  );
}