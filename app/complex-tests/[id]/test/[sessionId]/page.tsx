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
 * ОЧИЩЕННЯ ТЕХНІЧНИХ ЗНАКІВ
 * ============================================================
 */

function cleanTechnicalSigns(text: string): string {
  if (!text) {
    return "";
  }

  return text
    // HTML-сутності
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")

    // Технічні конструкції типу ?<>
    .replace(/\?<<>/g, "")

    // Технічна конструкція <<>
    .replace(/<<>/g, "")

    // Маркер <|
    .replace(/<\|/g, "")

    // Маркери ***
    .replace(/\*\*\*/g, "")

    // Кутові дужки, що залишилися від технічних маркерів
    .replace(/</g, "")
    .replace(/>/g, "")

    // Зайві пробіли
    .replace(/\s{2,}/g, " ")

    .trim();
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
    blocked,
    blockReason,
    finished,
    loadComplexTest,
    restoreSession,
    selectAnswer,
    saveAnswer,
    setFinished,

    /*
     * ВАЖЛИВО:
     * Перемикання предмета відбувається без перезавантаження
     * сторінки.
     */
    setCurrentTestId,
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
   * НАЗВА РОЗДІЛУ / ПРЕДМЕТА
   * =========================================================
   */

  function getSectionTitle(subject: string): string {
    const normalized = subject.trim();

    const knownSubjects: Record<string, string> = {
      "Українська мова": "Українська мова",
      "Українська мова та література":
        "Українська мова",
      Математика: "Математика",
      "Історія України": "Історія України",
      Фізика: "Фізика",
      Хімія: "Хімія",
      Біологія: "Біологія",
      Географія: "Географія",
      "Англійська мова": "Англійська мова",
      "Німецька мова": "Німецька мова",
      "Французька мова": "Французька мова",
      "Іспанська мова": "Іспанська мова",
    };

    return (
      knownSubjects[normalized] ??
      normalized
    );
  }

  /*
   * =========================================================
   * ПЕРЕМИКАННЯ МІЖ ПРЕДМЕТАМИ
   *
   * НЕ використовуємо window.location.reload().
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
      /*
       * FULLSCREEN ПЕРЕД ПЕРЕМИКАННЯМ
       */

      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fullscreenError) {
        console.warn(
          "FULLSCREEN REQUEST DURING TEST SWITCH:",
          fullscreenError
        );
      }

      /*
       * ЗАПИСУЄМО НОВИЙ ПОТОЧНИЙ ПРЕДМЕТ НА СЕРВЕР
       *
       * timeLeft НЕ передаємо і НЕ змінюємо.
       */

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

      const data: SessionResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося переключити предмет."
        );
      }

      /*
       * Змінюємо currentTestId без reload().
       */

      setCurrentTestId(testId);

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

  /*
   * =========================================================
   * ЗБЕРЕЖЕННЯ ВІДПОВІДІ
   *
   * Відповідь потрапляє на сервер ТІЛЬКИ після
   * натискання "Зберегти відповідь".
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
       * Оновлюємо локальний savedAnswers
       * тільки після успішного запису.
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
   * Тільки selectedAnswers.
   * Ніякого запису на сервер.
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
      "Ви впевнені, що хочете завершити тестування?\n\nПісля завершення повернутися до тесту буде неможливо.";

    const confirmed =
      window.confirm(
        confirmationMessage
      );

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

    const seconds =
      safeSeconds % 60;

    return [
      hours
        .toString()
        .padStart(2, "0"),

      minutes
        .toString()
        .padStart(2, "0"),

      seconds
        .toString()
        .padStart(2, "0"),
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
            className="
              mt-6
              rounded-lg
              bg-[#7A1F2B]
              px-5
              py-3
              text-white
              font-medium
              hover:opacity-90
            "
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

  if (
    !complexTest ||
    !currentTest
  ) {
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
      {/*
       * =====================================================
       * СИСТЕМА БЕЗПЕКИ
       * =====================================================
       */}

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

      {/*
       * =====================================================
       * MONITOR
       * =====================================================
       */}

      <ComplexTestSessionMonitor
        complexTestId={id}
        sessionId={sessionId}
        pollInterval={5000}
        heartbeatInterval={10000}
      />

      {/*
       * =====================================================
       * HEADER
       * =====================================================
       */}

      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="w-full px-4 lg:px-8 py-3">
          <div className="flex flex-col gap-3">

            {/*
             * =================================================
             * ПЕРШИЙ РЯДОК
             * =================================================
             */}

            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-2 min-w-0">

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
                    whitespace-nowrap
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
                    whitespace-nowrap
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
                    whitespace-nowrap
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
                    whitespace-nowrap
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
                    whitespace-nowrap
                  "
                >
                  Інструкція
                </button>
              </div>

              {/*
               * =================================================
               * ТАЙМЕР + ЗАВЕРШЕННЯ
               * =================================================
               */}

              <div className="shrink-0 flex items-center gap-3">
                <div
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-5
                    py-2
                    min-w-[150px]
                    text-center
                    font-mono
                    text-2xl
                    font-bold
                    text-[#7A1F2B]
                    shadow-sm
                  "
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

            {/*
             * =================================================
             * ДРУГИЙ РЯДОК:
             * ПЕРЕМИКАЧ ПРЕДМЕТІВ
             * =================================================
             */}

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
                          : getSectionTitle(
                              item.test.subject
                            )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/*
       * =====================================================
       * BLOCKED
       * =====================================================
       */}

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

      {/*
       * =====================================================
       * CONTENT
       * =====================================================
       */}

      <div className="w-full px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">

          {/*
           * =================================================
           * ОСНОВНА ОБЛАСТЬ
           * =================================================
           */}

          <div className="min-w-0">

            {/*
             * =================================================
             * УСІ ПИТАННЯ
             * =================================================
             */}

            <section className="space-y-5">
              {questions.map(
                (question, index) => {
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
                        scroll-mt-40
                      "
                    >
                      {/*
                       * =====================================
                       * ЗАГОЛОВОК ПИТАННЯ
                       * =====================================
                       */}

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
                                {cleanTechnicalSigns(
                                  question.text
                                )}
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

                      {/*
                       * =====================================
                       * ВАРІАНТИ ВІДПОВІДІ
                       * =====================================
                       */}

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
                                        next =
                                          selected
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
                                    {cleanTechnicalSigns(
                                      option.text
                                    )}
                                  </span>
                                </label>
                              );
                            }
                          )}
                        </div>

                        {/*
                         * =====================================
                         * ЗБЕРЕГТИ ВІДПОВІДЬ
                         * =====================================
                         */}

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">

                          <div className="text-sm">
                            {isSaved ? (
                              <span className="font-medium text-green-700">
                                Відповідь збережено
                              </span>
                            ) : hasSavedAnswer &&
                              localAnswers ===
                                undefined ? (
                              <span className="text-gray-500">
                                Збережена відповідь
                              </span>
                            ) : displayedAnswers.length >
                              0 ? (
                              <span className="text-gray-500">
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
          </div>

          {/*
           * =================================================
           * ПРАВА НАВІГАЦІЙНА ПАНЕЛЬ
           * =================================================
           */}

          <aside
            className="
              hidden
              lg:block
              sticky
              top-40
              bg-white
              rounded-xl
              shadow-sm
              border
              border-gray-200
              overflow-hidden
            "
          >
            {/*
             * Заголовок
             */}

            <div className="px-5 py-4 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900">
                Навігація
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {getSectionTitle(
                  currentTest.test.subject
                )}
              </div>
            </div>

            {/*
             * Питання
             */}

            <div className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {questions.map(
                  (question, index) => {
                    const saved =
                      savedAnswers[
                        currentTest.test.id
                      ]?.[question.id] ?? [];

                    const hasSaved =
                      saved.length > 0;

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => {
                          document
                            .getElementById(
                              `question-${question.id}`
                            )
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                        className={[
                          "relative w-full aspect-square rounded-lg border text-sm font-semibold transition",

                          hasSaved
                            ? "border-[#7A1F2B] bg-[#7A1F2B] text-white hover:bg-[#651824]"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        {index + 1}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/*
             * Легенда
             */}

            <div className="px-5 py-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded bg-[#7A1F2B]" />

                <span>
                  Відповідь збережено
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />

                <span>
                  Відповідь не збережена
                </span>
              </div>
            </div>
          </aside>
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