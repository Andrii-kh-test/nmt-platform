"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock3,
  LockKeyhole,
} from "lucide-react";

type AnswerValue = string | string[] | null;

type AnswerOption = {
  id: number;
  order: number;
  text: string;
};

type Question = {
  id: number;
  testQuestionId: number;
  order: number;
  type: string;
  text: string;
  points: number;
  shuffleQuestion: boolean;
  answerOptions: AnswerOption[];
  savedAnswer: AnswerValue;
};

type ComplexTestSubject = {
  id: number;
  complexTestItemId: number;
  order: number;
  title: string;
  subject: string;
  duration: number;
  questions: Question[];
};

type SessionData = {
  id: number;
  complexTestId: number;
  participantId: number | null;
  currentTestId: number | null;
  currentQuestion: number;
  timeLeft: number;
  finished: boolean;
  blocked: boolean;
  blockReason: string | null;
  extraTime: number;
  startedAt: string | null;
  finishedAt: string | null;
};

type ComplexTestData = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  section: string | null;
};

type ParticipantData = {
  id: number;
  lastName: string;
  firstName: string;
  middleName: string | null;
};

type SessionResponse = {
  success: boolean;
  message?: string;

  session: SessionData;

  participant: ParticipantData | null;

  complexTest: ComplexTestData;

  tests: ComplexTestSubject[];

  currentTest: ComplexTestSubject;
};

export default function ComplexTestPage() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const sessionStorageKey = `complex-test-session-${id}`;

  const [sessionId, setSessionId] = useState<number | null>(null);

  const [session, setSession] =
    useState<SessionData | null>(null);

  const [complexTest, setComplexTest] =
    useState<ComplexTestData | null>(null);

  const [tests, setTests] =
    useState<ComplexTestSubject[]>([]);

  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  const [selectedTestId, setSelectedTestId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [finishing, setFinishing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [finishModal, setFinishModal] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [blocked, setBlocked] =
    useState(false);

  /* =========================================================
     Отримання sessionId із sessionStorage
     ========================================================= */

  useEffect(() => {
    if (!id) {
      return;
    }

    const storedSession =
      sessionStorage.getItem(sessionStorageKey);

    if (!storedSession) {
      router.replace(
        `/complex-tests/${id}/start`
      );
      return;
    }

    try {
      const parsed = JSON.parse(
        storedSession
      );

      const storedSessionId =
        Number(parsed.sessionId);

      if (
        !Number.isInteger(storedSessionId) ||
        storedSessionId <= 0
      ) {
        sessionStorage.removeItem(
          sessionStorageKey
        );

        router.replace(
          `/complex-tests/${id}/start`
        );

        return;
      }

      setSessionId(storedSessionId);
    } catch (error) {
      console.error(
        "Invalid complex test session:",
        error
      );

      sessionStorage.removeItem(
        sessionStorageKey
      );

      router.replace(
        `/complex-tests/${id}/start`
      );
    }
  }, [id, router, sessionStorageKey]);

  /* =========================================================
     Завантаження сесії
     ========================================================= */

  const loadSession = useCallback(
    async (currentSessionId: number) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/complex-tests/session?sessionId=${currentSessionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as SessionResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити сесію."
          );
        }

        setSession(data.session);

        setComplexTest(
          data.complexTest
        );

        setTests(data.tests);

        setParticipant(
          data.participant
        );

        setTimeLeft(
          Math.max(
            0,
            data.session.timeLeft
          )
        );

        setBlocked(
          data.session.blocked
        );

        setFinished(
          data.session.finished
        );

        setSelectedTestId(
          data.session.currentTestId ??
            data.tests[0]?.id ??
            null
        );

        if (data.session.finished) {
          setFinished(true);
        }

        if (data.session.blocked) {
          setBlocked(true);
        }
      } catch (error) {
        console.error(
          "Load complex test session error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити тест."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    loadSession(sessionId);
  }, [sessionId, loadSession]);

  /* =========================================================
     Поточний тест
     ========================================================= */

  const currentTest =
    useMemo(() => {
      if (tests.length === 0) {
        return null;
      }

      return (
        tests.find(
          (test) =>
            test.id === selectedTestId
        ) ?? tests[0]
      );
    }, [tests, selectedTestId]);

  /* =========================================================
     Таймер
     
     timeLeft із БД є початковим значенням.
     Далі countdown працює на клієнті.
     
     Не використовуємо lastActivityAt.
     Не перераховуємо час через startedAt.
     ========================================================= */

  useEffect(() => {
    if (
      loading ||
      finished ||
      blocked ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1) {
            window.clearInterval(timer);
            return 0;
          }

          return previous - 1;
        });
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    loading,
    finished,
    blocked,
    timeLeft,
  ]);

  /* =========================================================
     Завершення за таймером
     ========================================================= */

  useEffect(() => {
    if (
      loading ||
      finished ||
      blocked ||
      timeLeft > 0 ||
      !sessionId
    ) {
      return;
    }

    async function finishByTimer() {
      try {
        setFinishing(true);

        const response = await fetch(
          "/api/complex-tests/session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Не вдалося завершити тест."
          );
        }

        setFinished(true);

        setSession((previous) =>
          previous
            ? {
                ...previous,
                finished: true,
              }
            : previous
        );
      } catch (error) {
        console.error(
          "Finish by timer error:",
          error
        );

        setError(
          "Час тестування завершився, але не вдалося зафіксувати завершення."
        );
      } finally {
        setFinishing(false);
      }
    }

    finishByTimer();
  }, [
    loading,
    finished,
    blocked,
    timeLeft,
    sessionId,
  ]);

  /* =========================================================
     Форматування часу
     ========================================================= */

  function formatTime(seconds: number) {
    const safeSeconds = Math.max(
      0,
      seconds
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

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

  /* =========================================================
     Зміна відповіді
     ========================================================= */

  function updateLocalAnswer(
    testId: number,
    questionId: number,
    answer: AnswerValue
  ) {
    setTests((previousTests) =>
      previousTests.map((test) => {
        if (test.id !== testId) {
          return test;
        }

        return {
          ...test,

          questions:
            test.questions.map(
              (question) => {
                if (
                  question.id !==
                  questionId
                ) {
                  return question;
                }

                return {
                  ...question,
                  savedAnswer: answer,
                };
              }
            ),
        };
      })
    );
  }

  /* =========================================================
     Збереження відповіді
     ========================================================= */

  async function saveAnswer(
    testId: number,
    questionId: number,
    answer: AnswerValue
  ) {
    if (
      !sessionId ||
      finished ||
      blocked
    ) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/complex-tests/session",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            testId,
            questionId,
            answer,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося зберегти відповідь."
        );
      }

      if (data.session) {
        setSession((previous) =>
          previous
            ? {
                ...previous,
                currentTestId:
                  data.session
                    .currentTestId,
                currentQuestion:
                  data.session
                    .currentQuestion,
              }
            : previous
        );
      }
    } catch (error) {
      console.error(
        "Save complex test answer error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти відповідь."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     Вибір варіанта відповіді
     ========================================================= */

  function isOptionSelected(
    answer: AnswerValue,
    optionId: number
  ) {
    if (Array.isArray(answer)) {
      return answer.includes(
        String(optionId)
      );
    }

    return (
      answer === String(optionId)
    );
  }

  function selectSingleAnswer(
    testId: number,
    questionId: number,
    optionId: number
  ) {
    const answer =
      String(optionId);

    updateLocalAnswer(
      testId,
      questionId,
      answer
    );

    void saveAnswer(
      testId,
      questionId,
      answer
    );
  }

  function selectMultipleAnswer(
    testId: number,
    questionId: number,
    currentAnswer: AnswerValue,
    optionId: number
  ) {
    const current =
      Array.isArray(currentAnswer)
        ? currentAnswer.map(String)
        : currentAnswer
          ? [String(currentAnswer)]
          : [];

    const option =
      String(optionId);

    const next = current.includes(
      option
    )
      ? current.filter(
          (value) => value !== option
        )
      : [...current, option];

    const answer =
      next.length > 0
        ? next
        : null;

    updateLocalAnswer(
      testId,
      questionId,
      answer
    );

    void saveAnswer(
      testId,
      questionId,
      answer
    );
  }

  /* =========================================================
     Перехід до іншого предмета
     ========================================================= */

  async function selectTest(
    testId: number
  ) {
    if (
      !sessionId ||
      finished ||
      blocked
    ) {
      return;
    }

    setSelectedTestId(testId);

    try {
      const response = await fetch(
        "/api/complex-tests/session",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            currentTestId: testId,
            currentQuestion: 0,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося змінити предмет."
        );
      }

      setSession((previous) =>
        previous
          ? {
              ...previous,
              currentTestId: testId,
              currentQuestion: 0,
            }
          : previous
      );
    } catch (error) {
      console.error(
        "Select complex test subject error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося змінити предмет."
      );
    }
  }

  /* =========================================================
     Завершення тесту
     ========================================================= */

  async function finishTest() {
    if (
      !sessionId ||
      finishing ||
      finished
    ) {
      return;
    }

    try {
      setFinishing(true);
      setError("");

      const response = await fetch(
        "/api/complex-tests/session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося завершити тест."
        );
      }

      setFinished(true);

      setFinishModal(false);

      setSession((previous) =>
        previous
          ? {
              ...previous,
              finished: true,
              finishedAt:
                data.finishedAt ??
                previous.finishedAt,
            }
          : previous
      );
    } catch (error) {
      console.error(
        "Finish complex test error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося завершити тест."
      );
    } finally {
      setFinishing(false);
    }
  }

  /* =========================================================
     Кількість відповідей
     ========================================================= */

  const totalQuestions =
    useMemo(() => {
      return tests.reduce(
        (total, test) =>
          total + test.questions.length,
        0
      );
    }, [tests]);

  const answeredQuestions =
    useMemo(() => {
      return tests.reduce(
        (total, test) =>
          total +
          test.questions.filter(
            (question) => {
              const answer =
                question.savedAnswer;

              if (
                Array.isArray(answer)
              ) {
                return answer.length > 0;
              }

              return (
                answer !== null &&
                answer !== ""
              );
            }
          ).length,
        0
      );
    }, [tests]);

  /* =========================================================
     Loading
     ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="mt-5 text-lg text-gray-600">
            Завантаження тесту...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     Помилка
     ========================================================= */

  if (error && !complexTest) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h1 className="mt-5 text-2xl font-bold text-gray-800">
            Не вдалося завантажити тест
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/complex-tests"
              )
            }
            className="mt-8 rounded-xl bg-[#7A1F2B] px-7 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Повернутися до тестів
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     Завершений тест
     ========================================================= */

  if (finished) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-11 w-11 text-green-600" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#7A1F2B]">
              Тест завершено
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              Ваші відповіді збережено.
              Дякуємо за проходження
              комбінованого тесту.
            </p>

            <div className="mt-8 rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-gray-500">
                Опрацьовано відповідей
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {answeredQuestions} /{" "}
                {totalQuestions}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/complex-tests"
                )
              }
              className="mt-8 rounded-xl bg-[#7A1F2B] px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Повернутися до тестів
            </button>
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <p className="font-medium text-gray-700">
              © Хорунжий Андрій Володимирович,
              2026
            </p>
          </div>
        </footer>
      </main>
    );
  }

  /* =========================================================
     Заблокований учасник
     ========================================================= */

  if (blocked) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <LockKeyhole className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-red-700">
            Тестування заблоковано
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Доступ до проходження тесту
            тимчасово заблоковано.
          </p>

          {session?.blockReason && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              {session.blockReason}
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!currentTest) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            У тесті немає доступних питань.
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     Основна сторінка тестування
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-100">
      {/* =====================================================
          Верхня панель
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Назва */} 
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A1F2B]">
                  <Brain className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
                    {complexTest?.examType}
                  </p>

                  <h1 className="truncate text-lg font-bold text-gray-800 md:text-xl">
                    {complexTest?.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Таймер + завершення */} 
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  timeLeft <= 300
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 bg-slate-50 text-gray-800"
                }`}
              >
                <Clock3 className="h-5 w-5" />

                <div>
                  <p className="text-xs text-gray-500">
                    Залишилося часу
                  </p>

                  <p className="font-mono text-xl font-bold leading-none">
                    {formatTime(
                      timeLeft
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={finishing}
                onClick={() =>
                  setFinishModal(true)
                }
                className="rounded-xl bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Завершити тест"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          Панель предметів
          ===================================================== */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 md:px-8">
          <div className="flex min-w-max gap-2 py-3">
            {tests.map((test, index) => {
              const isActive =
                test.id ===
                currentTest.id;

              const answered =
                test.questions.filter(
                  (question) => {
                    const answer =
                      question.savedAnswer;

                    if (
                      Array.isArray(answer)
                    ) {
                      return (
                        answer.length > 0
                      );
                    }

                    return (
                      answer !== null &&
                      answer !== ""
                    );
                  }
                ).length;

              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() =>
                    selectTest(test.id)
                  }
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[#7A1F2B] bg-[#7A1F2B] text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#7A1F2B]/40 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-semibold">
                        {test.subject}
                      </p>

                      <p
                        className={`text-xs ${
                          isActive
                            ? "text-white/75"
                            : "text-gray-500"
                        }`}
                      >
                        {answered} /{" "}
                        {test.questions.length}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================
          Основний вміст
          ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {/* Заголовок предмета */} 
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
                Предмет
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {currentTest.subject}
              </h2>

              <p className="mt-2 text-gray-600">
                {currentTest.title}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-5 py-4 text-center">
              <p className="text-xs text-gray-500">
                Завдання предмета
              </p>

              <p className="mt-1 text-2xl font-bold text-[#7A1F2B]">
                {currentTest.questions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Повідомлення про помилку */} 
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1 text-sm">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            Питання
            ================================================= */}

        <div className="space-y-6">
          {currentTest.questions.map(
            (question, questionIndex) => {
              const answer =
                question.savedAnswer;

              const isMultiple =
                question.type ===
                  "multiple" ||
                question.type ===
                  "multiple_choice" ||
                question.type ===
                  "MULTIPLE_CHOICE" ||
                question.type ===
                  "MULTIPLE";

              return (
                <section
                  key={question.id}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="p-6 md:p-8">
                    {/* Номер + бали */} 
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A1F2B] text-sm font-bold text-white">
                          {questionIndex +
                            1}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Завдання{" "}
                            {questionIndex +
                              1}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {question.points}{" "}
                            {question.points ===
                            1
                              ? "бал"
                              : question.points >=
                                    2 &&
                                  question.points <=
                                    4
                                ? "бали"
                                : "балів"}
                          </p>
                        </div>
                      </div>

                      {answer !== null &&
                        answer !== "" &&
                        (!Array.isArray(
                          answer
                        ) ||
                          answer.length >
                            0) && (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                        )}
                    </div>

                    {/* Текст питання */} 
                    <div className="mt-6">
                      <h3 className="whitespace-pre-wrap text-lg font-semibold leading-relaxed text-gray-800 md:text-xl">
                        {question.text}
                      </h3>
                    </div>

                    {/* Варіанти */} 
                    <div className="mt-7 space-y-3">
                      {question.answerOptions.map(
                        (
                          option,
                          optionIndex
                        ) => {
                          const selected =
                            isOptionSelected(
                              answer,
                              option.id
                            );

                          return (
                            <button
                              key={
                                option.id
                              }
                              type="button"
                              disabled={
                                saving ||
                                finished ||
                                blocked
                              }
                              onClick={() => {
                                if (
                                  isMultiple
                                ) {
                                  selectMultipleAnswer(
                                    currentTest.id,
                                    question.id,
                                    answer,
                                    option.id
                                  );
                                } else {
                                  selectSingleAnswer(
                                    currentTest.id,
                                    question.id,
                                    option.id
                                  );
                                }
                              }}
                              className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                                selected
                                  ? "border-[#7A1F2B] bg-[#7A1F2B]/5 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-[#7A1F2B]/40 hover:bg-slate-50"
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold ${
                                  isMultiple
                                    ? "rounded-lg"
                                    : "rounded-full"
                                } ${
                                  selected
                                    ? "bg-[#7A1F2B] text-white"
                                    : "bg-gray-100 text-gray-600 group-hover:bg-[#7A1F2B]/10 group-hover:text-[#7A1F2B]"
                                }`}
                              >
                                {String.fromCharCode(
                                  65 +
                                    optionIndex
                                )}
                              </span>

                              <span
                                className={`pt-1 text-base leading-relaxed ${
                                  selected
                                    ? "font-semibold text-gray-800"
                                    : "text-gray-700"
                                }`}
                              >
                                {
                                  option.text
                                }
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Статус збереження */} 
                    <div className="mt-5 flex justify-end">
                      <span className="text-xs text-gray-400">
                        {saving
                          ? "Збереження..."
                          : "Відповідь збережено"}
                      </span>
                    </div>
                  </div>
                </section>
              );
            }
          )}
        </div>

        {/* =================================================
            Нижня інформаційна панель
            ================================================= */}

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Загальний прогрес
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {answeredQuestions} /{" "}
                {totalQuestions}
              </p>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 sm:max-w-md">
              <div
                className="h-full rounded-full bg-[#7A1F2B] transition-all"
                style={{
                  width:
                    totalQuestions > 0
                      ? `${Math.round(
                          (answeredQuestions /
                            totalQuestions) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          Footer
          ===================================================== */}

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-8 text-center">
          <p className="font-medium text-gray-700">
            © Хорунжий Андрій Володимирович,
            2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="h-5 w-5 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <span>
              Створено за підтримки
              технологій штучного інтелекту
            </span>
          </div>
        </div>
      </footer>

      {/* =====================================================
          Модальне вікно завершення
          ===================================================== */}

      {finishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800">
              Завершити тестування?
            </h2>

            <p className="mt-4 leading-relaxed text-gray-600">
              Після завершення тесту
              змінити або додати відповіді
              буде неможливо.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Опрацьовано
                </span>

                <span className="font-bold text-gray-800">
                  {answeredQuestions} /{" "}
                  {totalQuestions}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setFinishModal(false)
                }
                disabled={finishing}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Продовжити тест
              </button>

              <button
                type="button"
                onClick={finishTest}
                disabled={finishing}
                className="rounded-xl bg-[#7A1F2B] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Так, завершити тест"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}