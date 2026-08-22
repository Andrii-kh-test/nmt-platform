"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Test } from "@/app/types/test";

export type UserAnswers = Record<number, number[]>;

type TestSessionContextType = {
  sessionId: number | null;
  setSessionId: (id: number | null) => void;

  test: Test | null;
  loadTest: (test: Test) => void;

  currentQuestion: number;
  setCurrentQuestion: (index: number) => void;

  selectedAnswers: UserAnswers;

  selectAnswer: (
    questionId: number,
    answers: number[]
  ) => void;

  savedAnswers: UserAnswers;

  saveAnswer: (questionId: number) => void;

  isQuestionSaved: (
    questionId: number
  ) => boolean;

  restoreSession: (
    currentQuestion: number,
    savedAnswers: UserAnswers,
    timeLeft: number
  ) => void;

  timeLeft: number;

  setTimeLeft: (seconds: number) => void;

  timerRunning: boolean;

  startTimer: () => void;

  stopTimer: () => void;

  onTimeExpired: (() => void) | null;

  setOnTimeExpired: (
    callback: (() => void) | null
  ) => void;

  resetTest: () => void;
};

const TestSessionContext =
  createContext<TestSessionContextType | null>(
    null
  );

export function TestSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // =====================================================
  // SESSION ID
  // =====================================================

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  useEffect(() => {
    const storedSessionId =
      localStorage.getItem("testSessionId");

    if (!storedSessionId) {
      return;
    }

    const numericSessionId =
      Number(storedSessionId);

    if (
      Number.isInteger(numericSessionId) &&
      numericSessionId > 0
    ) {
      setSessionId(numericSessionId);
    }
  }, []);

  // =====================================================
  // TEST
  // =====================================================

  const [test, setTest] =
    useState<Test | null>(null);

  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  // =====================================================
  // SELECTED ANSWERS
  // =====================================================

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<UserAnswers>({});

  // =====================================================
  // SAVED ANSWERS
  // =====================================================

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<UserAnswers>({});

  // =====================================================
  // TIME
  // =====================================================

  const [timeLeft, setTimeLeftState] =
    useState(0);

  // =====================================================
  // TIMER
  // =====================================================

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  // =====================================================
  // TIME EXPIRED CALLBACK
  // =====================================================

  const [
    onTimeExpired,
    setOnTimeExpired,
  ] = useState<(() => void) | null>(
    null
  );

  // =====================================================
  // ЗАВАНТАЖЕННЯ ТЕСТУ
  //
  // useCallback потрібен для того, щоб посилання
  // на функцію не змінювалося після кожного render.
  // =====================================================

  const loadTest = useCallback(
    (loadedTest: Test) => {
      setTest((previousTest) => {
        // Якщо це той самий тест —
        // нічого не скидаємо.
        if (
          previousTest &&
          previousTest.id === loadedTest.id
        ) {
          return previousTest;
        }

        // Новий тест.
        setCurrentQuestion(0);

        setSelectedAnswers({});

        setSavedAnswers({});

        // Початковий час встановлюємо
        // тільки для нового тесту.
        setTimeLeftState(
          loadedTest.duration * 60
        );

        setTimerRunning(false);

        return loadedTest;
      });
    },
    []
  );

  // =====================================================
  // СИНХРОНІЗАЦІЯ ЧАСУ
  // =====================================================

  const setTimeLeft = useCallback(
    (seconds: number) => {
      const normalized = Math.max(
        0,
        Math.floor(seconds)
      );

      setTimeLeftState(normalized);
    },
    []
  );

  // =====================================================
  // ВИБІР ВІДПОВІДІ
  // =====================================================

  const selectAnswer = useCallback(
    (
      questionId: number,
      answers: number[]
    ) => {
      setSelectedAnswers((previous) => ({
        ...previous,
        [questionId]: answers,
      }));
    },
    []
  );

  // =====================================================
  // ЗБЕРЕЖЕННЯ ВІДПОВІДІ
  // =====================================================

  const saveAnswer = useCallback(
    (questionId: number) => {
      const selected =
        selectedAnswers[questionId] ?? [];

      setSavedAnswers((previous) => ({
        ...previous,
        [questionId]: selected,
      }));
    },
    [selectedAnswers]
  );

  // =====================================================
  // ЧИ ЗБЕРЕЖЕНО ПИТАННЯ
  // =====================================================

  const isQuestionSaved = useCallback(
    (questionId: number) => {
      return (
        savedAnswers[questionId] !== undefined
      );
    },
    [savedAnswers]
  );

  // =====================================================
  // ЗАПУСК ТАЙМЕРА
  // =====================================================

  const startTimer = useCallback(() => {
    setTimerRunning(true);
  }, []);

  // =====================================================
  // ЗУПИНКА ТАЙМЕРА
  // =====================================================

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  // =====================================================
  // ЛОКАЛЬНИЙ ВІДЛІК
  //
  // interval НЕ залежить від timeLeft.
  //
  // Тому коли SessionMonitor отримує нове
  // значення з сервера, наприклад 3900,
  // він просто змінює timeLeft.
  //
  // Таймер продовжує відлік від нового значення.
  // =====================================================

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeftState((previous) => {
        if (previous <= 1) {
          setTimerRunning(false);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timerRunning]);

  // =====================================================
  // РЕАКЦІЯ НА ЗАВЕРШЕННЯ ЧАСУ
  // =====================================================

  useEffect(() => {
    if (
      timeLeft <= 0 &&
      timerRunning
    ) {
      setTimerRunning(false);

      if (onTimeExpired) {
        onTimeExpired();
      }
    }
  }, [
    timeLeft,
    timerRunning,
    onTimeExpired,
  ]);

  // =====================================================
  // ВІДНОВЛЕННЯ СЕСІЇ
  //
  // ВАЖЛИВО:
  //
  // useCallback робить функцію стабільною.
  //
  // Це не дозволяє RestoreSession повторно
  // запускати свій useEffect після кожного render.
  // =====================================================

  const restoreSession = useCallback(
    (
      question: number,
      answers: UserAnswers,
      seconds: number
    ) => {
      setCurrentQuestion(question);

      setSelectedAnswers(answers);

      setSavedAnswers(answers);

      // Серверне значення є головним.
      setTimeLeftState(
        Math.max(
          0,
          Math.floor(seconds)
        )
      );

      setTimerRunning(true);
    },
    []
  );

  // =====================================================
  // СКИДАННЯ ТЕСТУ
  // =====================================================

  const resetTest = useCallback(() => {
    setSessionId(null);

    localStorage.removeItem(
      "testSessionId"
    );

    setTest(null);

    setCurrentQuestion(0);

    setSelectedAnswers({});

    setSavedAnswers({});

    setTimeLeftState(0);

    setTimerRunning(false);

    setOnTimeExpired(null);
  }, []);

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <TestSessionContext.Provider
      value={{
        sessionId,
        setSessionId,

        test,
        loadTest,

        currentQuestion,
        setCurrentQuestion,

        selectedAnswers,
        selectAnswer,

        savedAnswers,
        saveAnswer,
        isQuestionSaved,

        restoreSession,

        timeLeft,
        setTimeLeft,

        timerRunning,
        startTimer,
        stopTimer,

        onTimeExpired,
        setOnTimeExpired,

        resetTest,
      }}
    >
      {children}
    </TestSessionContext.Provider>
  );
}

// =======================================================
// HOOK
// =======================================================

export function useTestSession() {
  const context =
    useContext(TestSessionContext);

  if (!context) {
    throw new Error(
      "useTestSession має використовуватися всередині TestSessionProvider"
    );
  }

  return context;
}