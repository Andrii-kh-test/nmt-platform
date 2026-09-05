"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   ТИПИ
   ========================================================= */

export type ComplexAnswerMap = Record<
  number,
  Record<number, number[]>
>;

export type ComplexSelectedAnswers = Record<
  number,
  number[]
>;

export interface ComplexTestQuestion {
  id: number;
  text: string;
  type: string;
  answerOptions: Array<{
    id: number;
    text: string;
  }>;
}

export interface ComplexTestItem {
  id: number;
  order: number;

  test: {
    id: number;
    title: string;
    subject: string;
    duration: number;
    questions: ComplexTestQuestion[];
  };
}

export interface ComplexTestData {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  section: string | null;
  tests: ComplexTestItem[];
}

/* =========================================================
   КОНТЕКСТ
   ========================================================= */

interface ComplexTestSessionContextValue {
  complexTest: ComplexTestData | null;

  sessionId: number | null;

  currentTestId: number | null;
  currentQuestion: number;

  selectedAnswers: ComplexSelectedAnswers;
  savedAnswers: ComplexAnswerMap;

  timeLeft: number;
  timerRunning: boolean;

  blocked: boolean;
  blockReason: string | null;

  finished: boolean;

  loadComplexTest: (
    complexTest: ComplexTestData
  ) => void;

  setSessionId: (
    sessionId: number | null
  ) => void;

  setCurrentTestId: (
    testId: number | null
  ) => void;

  setCurrentQuestion: (
    question: number
  ) => void;

  selectAnswer: (
    questionId: number,
    answers: number[]
  ) => void;

  saveAnswer: (
    testId: number,
    questionId: number,
    answers: number[]
  ) => void;

  setTimeLeft: (
    seconds: number
  ) => void;

  startTimer: () => void;

  restoreSession: (
    currentTestId: number | null,
    currentQuestion: number,
    savedAnswers: ComplexAnswerMap,
    timeLeft: number,
    startedAt: string | null,
    finished: boolean,
    blocked: boolean,
    blockReason: string | null
  ) => void;

  setBlocked: (
    blocked: boolean,
    blockReason?: string | null
  ) => void;

  setFinished: (
    finished: boolean
  ) => void;

  resetComplexTest: () => void;
}

/* =========================================================
   CONTEXT
   ========================================================= */

const ComplexTestSessionContext =
  createContext<
    ComplexTestSessionContextValue | undefined
  >(undefined);

/* =========================================================
   НОРМАЛІЗАЦІЯ ЧАСУ
   ========================================================= */

function normalizeSeconds(
  value: unknown
): number {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(seconds)
  );
}

/* =========================================================
   PROVIDER
   ========================================================= */

export function ComplexTestSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [complexTest, setComplexTest] =
    useState<ComplexTestData | null>(null);

  const [sessionId, setSessionIdState] =
    useState<number | null>(null);

  const [currentTestId, setCurrentTestIdState] =
    useState<number | null>(null);

  const [
    currentQuestion,
    setCurrentQuestionState,
  ] = useState(0);

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<ComplexSelectedAnswers>({});

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<ComplexAnswerMap>({});

  const [timeLeft, setTimeLeftState] =
    useState(0);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [blocked, setBlockedState] =
    useState(false);

  const [
    blockReason,
    setBlockReasonState,
  ] = useState<string | null>(null);

  const [finished, setFinishedState] =
    useState(false);

  const timerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const deadlineRef =
    useRef<number | null>(null);

  /* =======================================================
     CLEANUP TIMER
     ======================================================= */

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }

    deadlineRef.current = null;

    setTimerRunning(false);
  }, []);

  /* =======================================================
     LOAD COMPLEX TEST
     ======================================================= */

  const loadComplexTest = useCallback(
    (
      data: ComplexTestData
    ) => {
      setComplexTest(data);

      setCurrentTestIdState(
        data.tests[0]?.test.id ?? null
      );

      setCurrentQuestionState(0);

      setSelectedAnswers({});
      setSavedAnswers({});

      setTimeLeftState(
        normalizeSeconds(
          data.duration * 60
        )
      );

      setTimerRunning(false);

      setBlockedState(false);
      setBlockReasonState(null);

      setFinishedState(false);
    },
    []
  );

  /* =======================================================
     SESSION ID
     ======================================================= */

  const setSessionId = useCallback(
    (
      value: number | null
    ) => {
      setSessionIdState(value);

      if (typeof window === "undefined") {
        return;
      }

      if (value === null) {
        sessionStorage.removeItem(
          "complexTestSessionId"
        );

        localStorage.removeItem(
          "complexTestSessionId"
        );

        return;
      }

      sessionStorage.setItem(
        "complexTestSessionId",
        String(value)
      );

      localStorage.setItem(
        "complexTestSessionId",
        String(value)
      );
    },
    []
  );

  /* =======================================================
     CURRENT TEST
     ======================================================= */

  const setCurrentTestId = useCallback(
    (
      value: number | null
    ) => {
      setCurrentTestIdState(value);

      setCurrentQuestionState(0);
    },
    []
  );

  /* =======================================================
     CURRENT QUESTION
     ======================================================= */

  const setCurrentQuestion =
    useCallback(
      (
        question: number
      ) => {
        setCurrentQuestionState(
          Math.max(
            0,
            Math.floor(question)
          )
        );
      },
      []
    );

  /* =======================================================
     SELECT ANSWER
     ======================================================= */

  const selectAnswer = useCallback(
    (
      questionId: number,
      answers: number[]
    ) => {
      setSelectedAnswers(
        (previous) => ({
          ...previous,
          [questionId]: [
            ...answers,
          ],
        })
      );
    },
    []
  );

  /* =======================================================
     SAVE ANSWER
     ======================================================= */

  const saveAnswer = useCallback(
    (
      testId: number,
      questionId: number,
      answers: number[]
    ) => {
      setSavedAnswers(
        (previous) => ({
          ...previous,

          [testId]: {
            ...(previous[testId] ?? {}),

            [questionId]: [
              ...answers,
            ],
          },
        })
      );
    },
    []
  );

  /* =======================================================
     TIME LEFT
     ======================================================= */

  const setTimeLeft = useCallback(
    (
      seconds: number
    ) => {
      setTimeLeftState(
        normalizeSeconds(seconds)
      );
    },
    []
  );

  /* =======================================================
     START TIMER
     
     ВАЖЛИВО:
     Сервер уже передає актуальний timeLeft.
     Не рахуємо час через startedAt.
     ======================================================= */

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }

    const seconds =
      normalizeSeconds(
        timeLeft
      );

    if (
      seconds <= 0 ||
      blocked ||
      finished
    ) {
      setTimerRunning(false);
      return;
    }

    deadlineRef.current =
      Date.now() +
      seconds * 1000;

    setTimerRunning(true);

    timerRef.current =
      setInterval(() => {
        if (
          deadlineRef.current ===
          null
        ) {
          return;
        }

        const remainingMs =
          deadlineRef.current -
          Date.now();

        const remainingSeconds =
          Math.max(
            0,
            Math.ceil(
              remainingMs / 1000
            )
          );

        setTimeLeftState(
          remainingSeconds
        );

        if (
          remainingSeconds <= 0
        ) {
          if (
            timerRef.current !==
            null
          ) {
            clearInterval(
              timerRef.current
            );

            timerRef.current =
              null;
          }

          deadlineRef.current =
            null;

          setTimerRunning(false);
        }
      }, 250);
  }, [
    timeLeft,
    blocked,
    finished,
  ]);

  /* =======================================================
     RESTORE SESSION
     
     Сервер повертає вже актуальний timeLeft.
     
     НЕ:
       startedAt + duration
     
     НЕ:
       lastActivityAt → розрахунок часу
     
     Так само, як в еталонному
     TestSessionContext.
     ======================================================= */

  const restoreSession =
    useCallback(
      (
        restoredCurrentTestId:
          number | null,
        restoredCurrentQuestion:
          number,
        restoredSavedAnswers:
          ComplexAnswerMap,
        restoredTimeLeft: number,
        startedAt: string | null,
        restoredFinished: boolean,
        restoredBlocked: boolean,
        restoredBlockReason:
          string | null
      ) => {
        if (
          timerRef.current !==
          null
        ) {
          clearInterval(
            timerRef.current
          );

          timerRef.current =
            null;
        }

        deadlineRef.current =
          null;

        const seconds =
          normalizeSeconds(
            restoredTimeLeft
          );

        setCurrentTestIdState(
          restoredCurrentTestId
        );

        setCurrentQuestionState(
          Math.max(
            0,
            Math.floor(
              Number(
                restoredCurrentQuestion
              ) || 0
            )
          )
        );

        setSavedAnswers(
          restoredSavedAnswers ??
            {}
        );

        setTimeLeftState(
          seconds
        );

        setFinishedState(
          Boolean(
            restoredFinished
          )
        );

        setBlockedState(
          Boolean(
            restoredBlocked
          )
        );

        setBlockReasonState(
          restoredBlockReason ??
            null
        );

        setTimerRunning(false);

        if (
          !startedAt ||
          restoredFinished ||
          restoredBlocked ||
          seconds <= 0
        ) {
          return;
        }

        deadlineRef.current =
          Date.now() +
          seconds * 1000;

        setTimerRunning(true);

        timerRef.current =
          setInterval(() => {
            if (
              deadlineRef.current ===
              null
            ) {
              return;
            }

            const remainingMs =
              deadlineRef.current -
              Date.now();

            const remainingSeconds =
              Math.max(
                0,
                Math.ceil(
                  remainingMs /
                    1000
                )
              );

            setTimeLeftState(
              remainingSeconds
            );

            if (
              remainingSeconds <=
              0
            ) {
              if (
                timerRef.current !==
                null
              ) {
                clearInterval(
                  timerRef.current
                );

                timerRef.current =
                  null;
              }

              deadlineRef.current =
                null;

              setTimerRunning(
                false
              );
            }
          }, 250);
      },
      []
    );

  /* =======================================================
     BLOCK
     ======================================================= */

  const setBlocked =
    useCallback(
      (
        value: boolean,
        reason?: string | null
      ) => {
        setBlockedState(value);

        setBlockReasonState(
          value
            ? reason ?? null
            : null
        );

        if (value) {
          if (
            timerRef.current !==
            null
          ) {
            clearInterval(
              timerRef.current
            );

            timerRef.current =
              null;
          }

          deadlineRef.current =
            null;

          setTimerRunning(false);
        }
      },
      []
    );

  /* =======================================================
     FINISHED
     ======================================================= */

  const setFinished =
    useCallback(
      (
        value: boolean
      ) => {
        setFinishedState(value);

        if (value) {
          if (
            timerRef.current !==
            null
          ) {
            clearInterval(
              timerRef.current
            );

            timerRef.current =
              null;
          }

          deadlineRef.current =
            null;

          setTimerRunning(false);
        }
      },
      []
    );

  /* =======================================================
     RESET
     ======================================================= */

  const resetComplexTest =
    useCallback(() => {
      clearTimer();

      setComplexTest(null);

      setSessionIdState(null);

      setCurrentTestIdState(
        null
      );

      setCurrentQuestionState(
        0
      );

      setSelectedAnswers({});
      setSavedAnswers({});

      setTimeLeftState(0);

      setBlockedState(false);
      setBlockReasonState(null);

      setFinishedState(false);

      if (
        typeof window !== "undefined"
      ) {
        sessionStorage.removeItem(
          "complexTestSessionId"
        );

        localStorage.removeItem(
          "complexTestSessionId"
        );
      }
    }, [clearTimer]);

  /* =======================================================
     RESTORE SESSION ID ПІСЛЯ ПЕРЕЗАВАНТАЖЕННЯ
     ======================================================= */

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const stored =
      sessionStorage.getItem(
        "complexTestSessionId"
      ) ??
      localStorage.getItem(
        "complexTestSessionId"
      );

    if (!stored) {
      return;
    }

    const parsed =
      Number(stored);

    if (
      Number.isFinite(parsed) &&
      parsed > 0
    ) {
      setSessionIdState(parsed);
    }
  }, []);

  /* =======================================================
     CLEANUP ПРИ ЗНИЩЕННІ PROVIDER
     ======================================================= */

  useEffect(() => {
    return () => {
      if (
        timerRef.current !==
        null
      ) {
        clearInterval(
          timerRef.current
        );
      }

      timerRef.current = null;
      deadlineRef.current = null;
    };
  }, []);

  /* =======================================================
     VALUE
     ======================================================= */

  const value: ComplexTestSessionContextValue =
    {
      complexTest,

      sessionId,

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

      setSessionId,

      setCurrentTestId,

      setCurrentQuestion,

      selectAnswer,

      saveAnswer,

      setTimeLeft,

      startTimer,

      restoreSession,

      setBlocked,

      setFinished,

      resetComplexTest,
    };

  return (
    <ComplexTestSessionContext.Provider
      value={value}
    >
      {children}
    </ComplexTestSessionContext.Provider>
  );
}

/* =========================================================
   HOOK
   ========================================================= */

export function useComplexTestSession() {
  const context =
    useContext(
      ComplexTestSessionContext
    );

  if (!context) {
    throw new Error(
      "useComplexTestSession must be used inside ComplexTestSessionProvider"
    );
  }

  return context;
}