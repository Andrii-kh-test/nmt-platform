"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ComplexTestSessionProvider,
  useComplexTestSession,
  type ComplexAnswerMap,
  type ComplexTestData,
} from "@/app/context/ComplexTestSessionContext";

import ComplexTestSessionMonitor from "./ComplexTestSessionMonitor";
import ComplexAutoSaveSession from "./ComplexAutoSaveSession";

function sanitizeHtml(html: string): string {
  let result = html;

  result = result.replace(
    /<(script|style|iframe|object|embed|form|textarea|button|select)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  result = result.replace(
    /<\/?(script|style|iframe|object|embed|form|textarea|button|select)[^>]*>/gi,
    ""
  );

  result = result.replace(
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  result = result.replace(
    /(href|src)\s*=\s*(["'])\s*(javascript:|vbscript:|data:)[^"']*\2/gi,
    ""
  );

  result = result.replace(/<>/g, "");
  result = result.replace(/<\/>/g, "");

  return result;
}

function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(html),
      }}
    />
  );
}

interface SessionResponse {
  success: boolean;
  message?: string;

  session?: {
    id: number;
    complexTestId: number;
    participantId: number | null;

    currentTestId: number | null;
    currentQuestion: number;

    savedAnswers: ComplexAnswerMap;

    timeLeft: number;
    extraTime: number;

    finished: boolean;
    finishedAt: string | null;

    blocked: boolean;
    blockReason: string | null;
    blockedAt: string | null;

    startedAt: string | null;
  };

  complexTest?: ComplexTestData;
}

export default function ComplexTestPage() {
  const params = useParams();

  const id = Number(params.id);
  const sessionId = Number(params.sessionId);

  return (
    <ComplexTestSessionProvider>
      <ComplexTestPageContent
        id={id}
        sessionId={sessionId}
      />
    </ComplexTestSessionProvider>
  );
}

function ComplexTestPageContent({
  id,
  sessionId,
}: {
  id: number;
  sessionId: number;
}) {
  const router = useRouter();

  const {
    complexTest,
    currentTestId,
    currentQuestion,
    selectedAnswers,
    savedAnswers,
    timeLeft,
    timerRunning,
    blocked,
    blockReason,
    finished,

    loadComplexTest,
    restoreSession,
    setCurrentTestId,
    setCurrentQuestion,
    selectAnswer,
    saveAnswer,
    setFinished,
  } = useComplexTestSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [switchingTestId, setSwitchingTestId] =
    useState<number | null>(null);

  const [savingQuestion, setSavingQuestion] =
    useState(false);

  const [finishing, setFinishing] = useState(false);

  const [participant, setParticipant] = useState<{
    lastName: string;
    firstName: string;
    middleName?: string;
  } | null>(null);

  useEffect(() => {
    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      setError("Некоректні параметри тестування.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSession() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/complex-tests/${id}/session?sessionId=${sessionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: SessionResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити сесію."
          );
        }

        if (!data.session) {
          throw new Error(
            "Сервер не повернув дані сесії."
          );
        }

        if (!data.complexTest) {
          throw new Error(
            "Сервер не повернув дані комплексного тесту."
          );
        }

        if (cancelled) {
          return;
        }

        const session = data.session;

        try {
          sessionStorage.setItem(
            "complexTestSessionId",
            String(session.id)
          );
        } catch {
          // sessionStorage може бути недоступним
        }

        loadComplexTest(data.complexTest);

        restoreSession(
          session.currentTestId,
          session.currentQuestion,
          session.savedAnswers,
          session.timeLeft,
          session.startedAt,
          session.finished,
          session.blocked,
          session.blockReason
        );

        if (session.finished) {
          router.replace(
            `/complex-tests/${id}/result/${session.id}`
          );
          return;
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "LOAD COMPLEX TEST SESSION:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити тестування."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    sessionId,
    loadComplexTest,
    restoreSession,
    router,
  ]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(
        `complex-test-participant-${id}`
      );

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);

      if (
        parsed &&
        typeof parsed.lastName === "string" &&
        typeof parsed.firstName === "string"
      ) {
        setParticipant({
          lastName: parsed.lastName,
          firstName: parsed.firstName,
          middleName:
            typeof parsed.middleName === "string"
              ? parsed.middleName
              : undefined,
        });
      }
    } catch {
      // Дані учасника не є критичними для завантаження тесту.
    }
  }, [id]);

  const currentTest = useMemo(() => {
    if (!complexTest) {
      return null;
    }

    if (currentTestId === null) {
      return complexTest.tests[0] ?? null;
    }

    return (
      complexTest.tests.find(
        (item) => item.test.id === currentTestId
      ) ?? null
    );
  }, [complexTest, currentTestId]);

  const unansweredCount = useMemo(() => {
    if (!complexTest) {
      return 0;
    }

    let count = 0;

    for (const item of complexTest.tests) {
      const testAnswers =
        savedAnswers[item.test.id] ?? {};

      for (const question of item.test.questions) {
        const answers =
          testAnswers[question.id] ?? [];

        if (answers.length === 0) {
          count += 1;
        }
      }
    }

    return count;
  }, [complexTest, savedAnswers]);

  async function switchTest(testId: number) {
    if (
      blocked ||
      finished ||
      finishing ||
      switchingTestId !== null ||
      testId === currentTest?.test.id
    ) {
      return;
    }

    setSwitchingTestId(testId);

    try {
      const response = await fetch(
        `/api/complex-tests/${id}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            currentTestId: testId,
            currentQuestion: 0,
            savedAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося переключити предмет."
        );
      }

      setCurrentTestId(testId);
      setCurrentQuestion(0);
      setSwitchingTestId(null);
    } catch (err) {
      console.error(
        "SWITCH COMPLEX TEST:",
        err
      );

      setSwitchingTestId(null);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося переключити предмет."
      );
    }
  }

  async function switchQuestion(
    questionIndex: number
  ) {
    if (
      blocked ||
      finished ||
      finishing ||
      savingQuestion ||
      !currentTest
    ) {
      return;
    }

    if (
      questionIndex < 0 ||
      questionIndex >=
        currentTest.test.questions.length
    ) {
      return;
    }

    if (
      questionIndex === currentQuestion
    ) {
      return;
    }

    setCurrentQuestion(questionIndex);

    setSavingQuestion(true);

    try {
      const response = await fetch(
        `/api/complex-tests/${id}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            currentTestId:
              currentTest.test.id,
            currentQuestion:
              questionIndex,
            savedAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося зберегти позицію питання."
        );
      }
    } catch (err) {
      console.error(
        "SAVE CURRENT QUESTION:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося зберегти позицію питання."
      );
    } finally {
      setSavingQuestion(false);
    }
  }

  async function finishTest() {
    if (
      blocked ||
      finished ||
      finishing ||
      !currentTest
    ) {
      return;
    }

    const confirmationMessage =
      unansweredCount > 0
        ? `У Вас залишилося ${unansweredCount} ${
            unansweredCount === 1
              ? "питання"
              : unansweredCount < 5
              ? "питання"
              : "питань"
          } без відповіді.\n\nВи впевнені, що хочете завершити тестування? Після завершення повернутися до тесту буде неможливо.`
        : "Усі питання мають відповіді.\n\nВи впевнені, що хочете завершити тестування? Після завершення повернутися до тесту буде неможливо.";

    const confirmed =
      window.confirm(confirmationMessage);

    if (!confirmed) {
      return;
    }

    setFinishing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/complex-tests/${id}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            currentTestId:
              currentTest.test.id,
            currentQuestion,
            savedAnswers,
            finished: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося завершити тестування."
        );
      }

      setFinished(true);

      router.replace(
        `/complex-tests/${id}/result/${sessionId}`
      );
    } catch (err) {
      console.error(
        "FINISH COMPLEX TEST:",
        err
      );

      setFinishing(false);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося завершити тестування."
      );
    }
  }

  const formattedTime = useMemo(() => {
    const safeSeconds = Math.max(
      0,
      Math.floor(timeLeft)
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const seconds = safeSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  }, [timeLeft]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-lg font-semibold text-gray-800">
            Завантаження тестування…
          </div>

          <div className="mt-2 text-sm text-gray-500">
            Будь ласка, зачекайте.
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900">
            Не вдалося завантажити тестування
          </h1>

          <p className="mt-3 text-gray-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(`/complex-tests/${id}`)
            }
            className="mt-6 rounded-lg bg-[#7A1F2B] px-5 py-3 text-white font-medium hover:opacity-90"
          >
            Повернутися до тесту
          </button>
        </div>
      </main>
    );
  }

  if (!complexTest || !currentTest) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">
            Дані тестування недоступні.
          </p>
        </div>
      </main>
    );
  }

  const questions =
    currentTest.test.questions;

  const currentQuestionData =
    questions[currentQuestion] ??
    questions[0] ??
    null;

  return (
    <main className="min-h-screen bg-gray-100">
      <ComplexTestSessionMonitor
        complexTestId={id}
        sessionId={sessionId}
        pollInterval={5000}
        heartbeatInterval={10000}
      />

      <ComplexAutoSaveSession
        complexTestId={id}
        sessionId={sessionId}
      />

      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-gray-500">
                {complexTest.examType}
              </div>

              <h1 className="text-lg font-bold text-gray-900 truncate">
                {complexTest.title}
              </h1>

              {participant && (
                <div className="text-sm text-gray-600 truncate">
                  {participant.lastName}{" "}
                  {participant.firstName}{" "}
                  {participant.middleName ?? ""}
                </div>
              )}
            </div>

            <div
              className={[
                "shrink-0 rounded-lg px-4 py-2 font-mono text-xl font-bold",
                timeLeft <= 300
                  ? "bg-red-100 text-red-700"
                  : "bg-[#7A1F2B] text-white",
              ].join(" ")}
            >
              {formattedTime}
            </div>
          </div>
        </div>
      </header>

      {blocked && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Тестування заблоковано
            </h2>

            <p className="mt-3 text-gray-600">
              Адміністратор зупинив виконання
              Вашого тестування.
            </p>

            {blockReason && (
              <p className="mt-3 text-sm text-gray-500">
                Причина: {blockReason}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          <section>
            <div className="bg-white rounded-xl shadow-sm p-6">

              {currentQuestionData ? (
                <div className="mt-6">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Питання {currentQuestion + 1}
                  </div>

                  <div className="text-lg font-semibold text-gray-900">
                    <RichText
                      html={currentQuestionData.text}
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    {currentQuestionData.answerOptions.map(
                      (option) => {
                        const selected =
                          (
                            selectedAnswers[
                              currentQuestionData.id
                            ] ?? []
                          ).includes(option.id);

                        return (
                          <label
                            key={option.id}
                            className={[
                              "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition",
                              selected
                                ? "border-[#7A1F2B] bg-red-50"
                                : "border-gray-200 bg-white hover:bg-gray-50",
                            ].join(" ")}
                          >
                            <input
                              type={
                                currentQuestionData.type ===
                                "multiple"
                                  ? "checkbox"
                                  : "radio"
                              }
                              name={`question-${currentQuestionData.id}`}
                              checked={selected}
                              disabled={
                                blocked ||
                                finished ||
                                finishing ||
                                switchingTestId !== null
                              }
                              onChange={() => {
                                const current =
                                  selectedAnswers[
                                    currentQuestionData.id
                                  ] ?? [];

                                let next: number[];

                                if (
                                  currentQuestionData.type ===
                                  "multiple"
                                ) {
                                  next = selected
                                    ? current.filter(
                                        (answerId) =>
                                          answerId !==
                                          option.id
                                      )
                                    : [
                                        ...current,
                                        option.id,
                                      ];
                                } else {
                                  next = [option.id];
                                }

                                selectAnswer(
                                  currentQuestionData.id,
                                  next
                                );

                                saveAnswer(
                                  currentTest.test.id,
                                  currentQuestionData.id,
                                  next
                                );
                              }}
                              className="mt-1"
                            />

                            <span className="text-gray-800">
                              <RichText
                                html={option.text}
                              />
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-gray-500">
                  Питання відсутні.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm text-gray-500">
                Залишилося часу
              </div>

              <div
                className={[
                  "mt-1 font-mono text-3xl font-bold",
                  timeLeft <= 300
                    ? "text-red-600"
                    : "text-[#7A1F2B]",
                ].join(" ")}
              >
                {formattedTime}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {timerRunning
                  ? "Тестування триває"
                  : "Таймер зупинено"}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900">
                Предмети
              </h3>

              <div className="mt-3 space-y-2">
                {complexTest.tests.map(
                  (item) => {
                    const active =
                      item.test.id ===
                      currentTest.test.id;

                    const switching =
                      switchingTestId ===
                      item.test.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={
                          blocked ||
                          finished ||
                          finishing ||
                          switchingTestId !== null ||
                          active
                        }
                        onClick={() =>
                          switchTest(
                            item.test.id
                          )
                        }
                        className={[
                          "w-full text-left rounded-lg border px-3 py-3 transition",
                          active
                            ? "border-[#7A1F2B] bg-red-50 text-[#7A1F2B] cursor-default"
                            : "border-gray-200 text-gray-700 hover:border-[#7A1F2B] hover:bg-gray-50",
                          switching
                            ? "opacity-60 cursor-wait"
                            : "",
                        ].join(" ")}
                      >
                        <div className="font-medium">
                          {item.test.title}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {switching
                            ? "Перемикання…"
                            : `${item.test.questions.length} питань`}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900">
                Питання
              </h3>

              <div className="grid grid-cols-5 gap-2 mt-4">
                {questions.map(
                  (question, index) => {
                    const answers =
                      selectedAnswers[
                        question.id
                      ] ?? [];

                    const saved =
                      savedAnswers[
                        currentTest.test.id
                      ]?.[question.id] ??
                      [];

                    const hasAnswer =
                      answers.length > 0 ||
                      saved.length > 0;

                    const active =
                      index ===
                      currentQuestion;

                    return (
                      <button
                        key={question.id}
                        type="button"
                        disabled={
                          blocked ||
                          finished ||
                          finishing ||
                          savingQuestion ||
                          switchingTestId !== null
                        }
                        onClick={() =>
                          switchQuestion(index)
                        }
                        className={[
                          "h-9 rounded-md text-sm font-medium border transition",
                          active
                            ? "border-[#7A1F2B] bg-[#7A1F2B] text-white"
                            : hasAnswer
                            ? "border-red-300 bg-red-50 text-[#7A1F2B] hover:bg-red-100"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {index + 1}
                      </button>
                    );
                  }
                )}
              </div>

              {savingQuestion && (
                <div className="mt-3 text-xs text-gray-500">
                  Збереження позиції…
                </div>
              )}

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#7A1F2B]" />
                  Поточне питання
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
                  Є відповідь
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-white border border-gray-200" />
                  Без відповіді
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <button
                type="button"
                disabled={
                  blocked ||
                  finished ||
                  finishing ||
                  switchingTestId !== null ||
                  savingQuestion
                }
                onClick={finishTest}
                className={[
                  "w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition",
                  "bg-[#7A1F2B] hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {finishing
                  ? "Завершення…"
                  : "Завершити тестування"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}