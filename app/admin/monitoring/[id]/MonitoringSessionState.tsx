"use client";

import { useEffect, useState } from "react";

type Props = {
  testId: number;
  sessionId: number;
  initialCurrentQuestion: number;
  initialTimeLeft: number;
  initialExtraTime: number;
  initialBlocked: boolean;
  initialBlockReason: string | null;
  initialFinished: boolean;
};

type SessionState = {
  id: number;
  currentQuestion: number;
  blocked: boolean;
  blockReason: string | null;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
  finishedAt: string | null;
  resultId?: number | null;
};

function formatTime(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function MonitoringSessionState({
  testId,
  sessionId,
  initialCurrentQuestion,
  initialTimeLeft,
  initialExtraTime,
  initialBlocked,
  initialBlockReason,
  initialFinished,
}: Props) {
  const [currentQuestion, setCurrentQuestion] =
    useState(initialCurrentQuestion);

  const [timeLeft, setTimeLeft] =
    useState(initialTimeLeft);

  const [extraTime, setExtraTime] =
    useState(initialExtraTime);

  const [blocked, setBlocked] =
    useState(initialBlocked);

  const [blockReason, setBlockReason] =
    useState(initialBlockReason);

  const [finished, setFinished] =
    useState(initialFinished);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionState() {
      try {
        const response = await fetch(
          `/api/session/${testId}?sessionId=${sessionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as
            | SessionState
            | null;

        if (
          cancelled ||
          !data
        ) {
          return;
        }

        setCurrentQuestion(
          data.currentQuestion
        );

        setTimeLeft(
          data.timeLeft
        );

        setExtraTime(
          data.extraTime
        );

        setBlocked(
          data.blocked
        );

        setBlockReason(
          data.blockReason
        );

        setFinished(
          data.finished
        );
      } catch (error) {
        console.error(
          "MONITORING SESSION STATE ERROR:",
          error
        );
      }
    }

    loadSessionState();

    const interval =
      window.setInterval(
        loadSessionState,
        2000
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval
      );
    };
  }, [testId, sessionId]);

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
        Поточний стан
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ПОТОЧНЕ ПИТАННЯ */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Поточне питання
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {currentQuestion + 1}
          </div>
        </div>

        {/* ЗАЛИШОК ЧАСУ */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Залишилось часу
          </div>

          <div className="mt-2 font-mono text-3xl font-bold text-[#7A1F2B]">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* ДОДАТКОВИЙ ЧАС */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Додатковий час
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {formatTime(extraTime)}
          </div>
        </div>
      </div>

      {/* ДОДАТКОВИЙ СТАН */}

      {blocked && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="font-bold text-red-700">
            Тестування заблоковано
          </div>

          {blockReason && (
            <div className="mt-1 text-sm text-red-600">
              Причина:{" "}
              {blockReason}
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="font-bold text-gray-700">
            Тестування завершено
          </div>
        </div>
      )}
    </section>
  );
}