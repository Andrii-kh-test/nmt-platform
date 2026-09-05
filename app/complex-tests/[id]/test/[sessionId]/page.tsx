"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ComplexTestSessionProvider,
  useComplexTestSession,
  type ComplexAnswerMap,
  type ComplexTestData,
} from "@/app/context/ComplexTestSessionContext";

import FullscreenGuard from "@/app/components/test/FullscreenGuard";
import SecurityGuard from "@/app/components/test/SecurityGuard";
import VisibilityGuard from "@/app/components/test/VisibilityGuard";
import TestSecurityGuard from "@/app/components/test/TestSecurityGuard";

import ComplexTestSessionMonitor from "./ComplexTestSessionMonitor";

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

/*
 * ============================================================
 * ВНУТРІШНІЙ КОМПОНЕНТ
 * ============================================================
 */

function ComplexTestContent() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);
  const sessionId = Number(params.sessionId);

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
    selectAnswer,
    saveAnswer,
    setFinished,
  } = useComplexTestSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [switchingTestId, setSwitchingTestId] =
    useState<number | null>(null);

  const [savingQuestionId, setSavingQuestionId] =
    useState<number | null>(null);

  const [savedSuccessfully, setSavedSuccessfully] =
    useState<Record<number, boolean>>({});

  const [finishing, setFinishing] = useState(false);

  const [participant, setParticipant] = useState<{
    lastName: string;
    firstName: string;
    middleName?: string;
  } | null>(null);

  /*
   * =========================================================
   * ЗАВЕРШЕННЯ ЧЕРЕЗ ПОРУШЕННЯ ПРАВИЛ
   * =========================================================
   */

  async function finishSecurityTest() {
    if (finishing || finished) {
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
              currentTestId ??
              complexTest?.tests[0]?.test.id ??
              null,

            currentQuestion,

            savedAnswers,

            finished: true,

            finishReason: "security",
          }),
        }
      );

      const data: SessionResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося автоматично завершити тестування."
        );
      }

      setFinished(true);

      router.replace(
        `/complex-tests/${id}/result/${sessionId}`
      );
    } catch (err) {
      console.error(
        "SECURITY FINISH COMPLEX TEST:",
        err
      );

      setFinishing(false);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося автоматично завершити тестування."
      );
    }
  }

  /*
   * =========================================================
   * ЗАВАНТАЖЕННЯ СЕСІЇ
   * =========================================================
   */

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
            "Сервер не повернув структуру комбінованого тесту."
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

  /*
   * =========================================================
   * ДАНІ УЧАСНИКА
   * =========================================================
   */

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
      // Дані учасника не є критичними
    }
  }, [id]);

  /*
   * =========================================================
   * ПОТОЧНИЙ ПРЕДМЕТ
   * =========================================================
   */

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

  /*
   * =========================================================
   * КІЛЬКІСТЬ ПИТАНЬ БЕЗ ВІДПОВІДІ
   * =========================================================
   */

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

  /*
   * =========================================================
   * ПЕРЕМИКАННЯ МІЖ ПРЕДМЕТАМИ
   * =========================================================
   */

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

      window.location.reload();
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

  /*
   * =========================================================
   * ЗБЕРЕЖЕННЯ ВІДПОВІДІ
   *
   * ВАЖЛИВО:
   *
   * Вибір відповіді НЕ зберігається.
   * Сервер отримує відповідь лише після натискання
   * кнопки "Зберегти відповідь".
   * =========================================================
   */

  async function handleSaveAnswer(
    testId: number,
    questionId: number
  ) {
    if (
      blocked ||
      finished ||
      finishing ||
      savingQuestionId !== null
    ) {
      return;
    }

    const answers = [
      ...(selectedAnswers[questionId] ??
        savedAnswers[testId]?.[questionId] ??
        []),
    ];

    setSavingQuestionId(questionId);
    setError(null);

    try {
      const nextSavedAnswers: ComplexAnswerMap = {
        ...savedAnswers,
        [testId]: {
          ...(savedAnswers[testId] ?? {}),
          [questionId]: answers,
        },
      };

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
              currentTest?.test.id ??
              testId,
            currentQuestion,
            savedAnswers: nextSavedAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося зберегти відповідь."
        );
      }

      /*
       * Оновлюємо локальний стан тільки після
       * успішного запису на сервер.
       */
      saveAnswer(
        testId,
        questionId,
        answers
      );

      setSavedSuccessfully(
        (previous) => ({
          ...previous,
          [questionId]: true,
        })
      );
    } catch (err) {
      console.error(
        "SAVE COMPLEX ANSWER:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося зберегти відповідь."
      );
    } finally {
      setSavingQuestionId(null);
    }
  }

  /*
   * =========================================================
   * ВИБІР ВІДПОВІДІ
   *
   * ТУТ НІЯКОГО saveAnswer().
   *
   * Тільки локальна зміна selectedAnswers.
   * =========================================================
   */

  function handleSelectAnswer(
    questionId: number,
    answers: number[]
  ) {
    if (
      blocked ||
      finished ||
      finishing
    ) {
      return;
    }

    selectAnswer(
      questionId,
      answers
    );

    /*
     * Якщо користувач змінив уже збережену
     * відповідь — вона більше не вважається
     * актуальною збереженою відповіддю,
     * доки користувач не натисне
     * "Зберегти відповідь".
     */
    setSavedSuccessfully(
      (previous) => ({
        ...previous,
        [questionId]: false,
      })
    );
  }

  /*
   * =========================================================
   * ЗВИЧАЙНЕ ЗАВЕРШЕННЯ
   * =========================================================
   */

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

      const data: SessionResponse =
        await response.json();

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

  /*
   * =========================================================
   * ФОРМАТ ТАЙМЕРА
   * =========================================================
   */

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

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

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

  /*
   * =========================================================
   * ПОМИЛКА
   * =========================================================
   */

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
              router.push(
                `/complex-tests/${id}`
              )
            }
            className="mt-6 rounded-lg bg-[#7A1F2B] px-5 py-3 text-white font-medium hover:opacity-90"
          >
            Повернутися до тесту
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * НЕМАЄ ДАНИХ
   * =========================================================
   */

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

  /*
   * =========================================================
   * ОСНОВНІ ДАНІ
   * =========================================================
   */

  const questions =
    currentTest.test.questions;

  /*
   * =========================================================
   * ОСНОВНА СТОРІНКА
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =====================================================
          СИСТЕМА БЕЗПЕКИ
          ===================================================== */}

      <FullscreenGuard
        onViolationFinish={
          finishSecurityTest
        }
      />

      <SecurityGuard />

      <VisibilityGuard
        onViolationFinish={
          finishSecurityTest
        }
      />

      <TestSecurityGuard />

      {/* =====================================================
          MONITOR
          ===================================================== */}

      <ComplexTestSessionMonitor
        complexTestId={id}
        sessionId={sessionId}
        pollInterval={5000}
        heartbeatInterval={10000}
      />

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="w-full px-4 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            {/* Назва + учасник + таймер */}

            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">
                  {complexTest.examType}
                </div>

                <h1 className="text-xl font-bold text-gray-900 truncate">
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

              <div className="shrink-0 flex items-center gap-3">
                <div
                  className={[
                    "rounded-lg px-5 py-2 font-mono text-2xl font-bold min-w-[150px] text-center",
                    timeLeft <= 300
                      ? "bg-red-100 text-red-700"
                      : "bg-[#7A1F2B] text-white",
                  ].join(" ")}
                >
                  {formattedTime}
                </div>

                <button
                  type="button"
                  disabled={
                    blocked ||
                    finished ||
                    finishing ||
                    switchingTestId !== null
                  }
                  onClick={finishTest}
                  className="
                    rounded-lg
                    bg-[#7A1F2B]
                    hover:bg-[#651824]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    whitespace-nowrap
                  "
                >
                  {finishing
                    ? "Завершення…"
                    : "Завершити роботу над тестом"}
                </button>
              </div>
            </div>

            {/* =================================================
                ПЕРЕМИКАЧ ПРЕДМЕТІВ
                ================================================= */}

            <div className="w-full border-t border-gray-200 pt-2">
              <div className="flex w-full overflow-x-auto">
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
                          "flex-1 min-w-[180px] px-6 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap",
                          active
                            ? "bg-gray-100 border-gray-300 text-gray-900"
                            : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          switching
                            ? "opacity-60 cursor-wait"
                            : "",
                        ].join(" ")}
                      >
                        {switching
                          ? "Перемикання…"
                          : item.test.title}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          BLOCKED
          ===================================================== */}

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

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="w-full px-4 lg:px-8 py-6">
        {/* ===================================================
            ПАНЕЛЬ КНОПОК ПІД НАЗВОЮ ТЕСТУ
            =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-5">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <button
              type="button"
              className="
                rounded-lg
                bg-[#7A1F2B]
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
              "
            >
              Іспит
            </button>

            <button
              type="button"
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                transition
              "
            >
              Математика: довідкові матеріали
            </button>

            <button
              type="button"
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                transition
              "
            >
              Фізика: довідкові матеріали
            </button>

            <button
              type="button"
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                transition
              "
            >
              Хімія: довідкові матеріали
            </button>

            <button
              type="button"
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                transition
              "
            >
              Інструкція
            </button>
          </div>
        </div>

        {/* ===================================================
            ІНФОРМАЦІЯ ПРО ПРЕДМЕТ
            =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-5">
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  Предмет
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {currentTest.test.title}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {currentTest.test.subject}
                </p>
              </div>

              <div className="text-sm text-gray-500">
                Кількість питань:{" "}
                <span className="font-semibold text-gray-800">
                  {questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            ПОПЕРЕДЖЕННЯ ПРО НЕВІДПОВІДЕНІ ПИТАННЯ
            =================================================== */}

        {unansweredCount > 0 && (
          <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
            <div className="text-sm font-semibold text-orange-800">
              Увага
            </div>

            <div className="mt-1 text-sm text-orange-700">
              Залишилося без збереженої відповіді:{" "}
              <span className="font-bold">
                {unansweredCount}
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            УСІ ПИТАННЯ
            =================================================== */}

        <section className="space-y-5">
          {questions.map(
            (question, index) => {
              /*
               * Якщо є поточний локальний вибір —
               * показуємо його.
               *
               * Якщо локального вибору немає —
               * показуємо збережену відповідь.
               */

              const localAnswers =
                selectedAnswers[
                  question.id
                ];

              const saved =
                savedAnswers[
                  currentTest.test.id
                ]?.[question.id] ?? [];

              const displayedAnswers =
                localAnswers !== undefined
                  ? localAnswers
                  : saved;

              const isSaved =
                savedSuccessfully[
                  question.id
                ] === true;

              const hasSavedAnswer =
                saved.length > 0;

              const saving =
                savingQuestionId ===
                question.id;

              return (
                <article
                  key={question.id}
                  id={`question-${question.id}`}
                  className="
                    bg-white
                    rounded-xl
                    shadow-sm
                    border
                    border-gray-200
                    overflow-hidden
                  "
                >
                  {/* Заголовок питання */}

                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className="
                            shrink-0
                            w-10
                            h-10
                            rounded-full
                            bg-gray-100
                            text-gray-800
                            flex
                            items-center
                            justify-center
                            font-bold
                          "
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            Питання {index + 1}
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 leading-7">
                            {question.text}
                          </h3>
                        </div>
                      </div>

                      <div className="shrink-0 text-xs text-gray-500">
                        {question.points}{" "}
                        {question.points === 1
                          ? "бал"
                          : question.points < 5
                          ? "бали"
                          : "балів"}
                      </div>
                    </div>
                  </div>

                  {/* Варіанти відповіді */}

                  <div className="px-6 py-5">
                    <div className="space-y-3">
                      {question.answerOptions.map(
                        (option) => {
                          const selected =
                            displayedAnswers.includes(
                              option.id
                            );

                          return (
                            <label
                              key={option.id}
                              className={[
                                "flex items-start gap-3 rounded-lg border p-4 transition",
                                blocked ||
                                finished ||
                                finishing
                                  ? "cursor-not-allowed opacity-70"
                                  : "cursor-pointer",
                                selected
                                  ? "border-[#7A1F2B] bg-red-50"
                                  : "border-gray-200 bg-white hover:bg-gray-50",
                              ].join(" ")}
                            >
                              <input
                                type={
                                  question.type ===
                                  "multiple"
                                    ? "checkbox"
                                    : "radio"
                                }
                                name={`question-${question.id}`}
                                checked={selected}
                                disabled={
                                  blocked ||
                                  finished ||
                                  finishing
                                }
                                onChange={() => {
                                  const current =
                                    selectedAnswers[
                                      question.id
                                    ] ??
                                    savedAnswers[
                                      currentTest
                                        .test.id
                                    ]?.[
                                      question.id
                                    ] ??
                                    [];

                                  let next: number[];

                                  if (
                                    question.type ===
                                    "multiple"
                                  ) {
                                    next = selected
                                      ? current.filter(
                                          (
                                            answerId
                                          ) =>
                                            answerId !==
                                            option.id
                                        )
                                      : [
                                          ...current,
                                          option.id,
                                        ];
                                  } else {
                                    next = [
                                      option.id,
                                    ];
                                  }

                                  handleSelectAnswer(
                                    question.id,
                                    next
                                  );
                                }}
                                className="mt-1 h-4 w-4 accent-[#7A1F2B]"
                              />

                              <span className="text-gray-800 leading-6">
                                {option.text}
                              </span>
                            </label>
                          );
                        }
                      )}
                    </div>

                    {/* =================================================
                        КНОПКА ЗБЕРЕГТИ ВІДПОВІДЬ
                        ================================================= */}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
                      <div className="text-sm">
                        {isSaved ? (
                          <span className="font-medium text-green-700">
                            Відповідь збережено
                          </span>
                        ) : hasSavedAnswer &&
                          localAnswers === undefined ? (
                          <span className="text-gray-500">
                            Збережена відповідь
                          </span>
                        ) : displayedAnswers.length >
                          0 ? (
                          <span className="text-orange-600">
                            Відповідь не збережено
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Відповідь не вибрана
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          blocked ||
                          finished ||
                          finishing ||
                          savingQuestionId !== null ||
                          displayedAnswers.length ===
                            0
                        }
                        onClick={() =>
                          handleSaveAnswer(
                            currentTest.test.id,
                            question.id
                          )
                        }
                        className={[
                          "rounded-lg px-6 py-3 text-sm font-semibold transition",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          isSaved
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-[#7A1F2B] text-white hover:bg-[#651824]",
                        ].join(" ")}
                      >
                        {saving
                          ? "Збереження…"
                          : isSaved
                          ? "Відповідь збережено"
                          : "Зберегти відповідь"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </section>

        {/* ===================================================
            НИЖНЯ ПАНЕЛЬ
            =================================================== */}

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Завершення тестування
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Перед завершенням переконайтеся,
                що всі відповіді збережено.
              </div>
            </div>

            <button
              type="button"
              disabled={
                blocked ||
                finished ||
                finishing ||
                switchingTestId !== null ||
                savingQuestionId !== null
              }
              onClick={finishTest}
              className="
                rounded-lg
                bg-[#7A1F2B]
                hover:bg-[#651824]
                disabled:opacity-50
                disabled:cursor-not-allowed
                px-6
                py-3
                text-sm
                font-semibold
                text-white
                transition
              "
            >
              {finishing
                ? "Завершення…"
                : "Завершити роботу над тестом"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/*
 * ============================================================
 * ЗОВНІШНІЙ КОМПОНЕНТ
 * ============================================================
 */

export default function ComplexTestPage() {
  return (
    <ComplexTestSessionProvider>
      <ComplexTestContent />
    </ComplexTestSessionProvider>
  );
}