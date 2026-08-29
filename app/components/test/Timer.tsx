"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function Timer() {
  const {
    timeLeft,
    timerRunning,
  } = useTestSession();

  console.log("TIMER RENDER:", {
    timeLeft,
    timerRunning,
  });

  const safeTimeLeft = Math.max(
    0,
    Math.floor(Number(timeLeft) || 0)
  );

  const hours = Math.floor(
    safeTimeLeft / 3600
  );

  const minutes = Math.floor(
    (safeTimeLeft % 3600) / 60
  );

  const seconds =
    safeTimeLeft % 60;

  return (
    <div className="min-w-[150px] text-right">
      <div className="mb-1 text-sm text-gray-500">
        Залишилося часу
      </div>

      <div
        className={`text-3xl font-bold ${
          safeTimeLeft <= 300
            ? "text-red-600"
            : "text-[#7A1F2B]"
        }`}
      >
        {String(hours).padStart(2, "0")}:
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </div>

      <div className="text-xs text-gray-400">
        {timerRunning
          ? "Таймер працює"
          : "Таймер зупинений"}
      </div>
    </div>
  );
}