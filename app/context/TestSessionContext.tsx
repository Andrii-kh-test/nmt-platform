"use client";

import {
  createContext,
  ReactNode,
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
  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [test, setTest] =
    useState<Test | null>(null);

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<UserAnswers>({});

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<UserAnswers>({});

  const [timeLeft, setTimeLeftState] =
    useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  const [
    onTimeExpired,
    setOnTimeExpired,
  ] = useState<(() => void) | null>(
    null
  );

  // =====================================================
  // Завантаження тесту
  // =====================================================

  function loadTest(loadedTest: Test) {
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
  }

  // =====================================================
  // Синхронізація часу із сервером
  // =====================================================

  function setTimeLeft(seconds: number) {
    const normalized = Math.max(
      0,
      Math.floor(seconds)
    );

    setTimeLeftState(normalized);
  }

  // =====================================================
  // Вибір відповіді
  // =====================================================

  function selectAnswer(
    questionId: number,
    answers: number[]
  ) {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: answers,
    }));
  }

  // =====================================================
  // Збереження відповіді
  // =====================================================

  function saveAnswer(
    questionId: number
  ) {
    const selected =
      selectedAnswers[questionId] ?? [];

    setSavedAnswers((previous) => ({
      ...previous,
      [questionId]: selected,
    }));
  }

  // =====================================================
  // Чи збережено питання
  // =====================================================

  function isQuestionSaved(
    questionId: number
  ) {
    return (
      savedAnswers[questionId] !== undefined
    );
  }

  // =====================================================
  // Запуск таймера
  // =====================================================

  function startTimer() {
    setTimerRunning(true);
  }

  // =====================================================
  // Зупинка таймера
  // =====================================================

  function stopTimer() {
    setTimerRunning(false);
  }

  // =====================================================
  // Локальний відлік
  //
  // ВАЖЛИВО:
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
  // Реакція на завершення часу
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
  // Відновлення сесії
  // =====================================================

  function restoreSession(
    question: number,
    answers: UserAnswers,
    seconds: number
  ) {
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
  }

  // =====================================================
  // Скидання тесту
  // =====================================================

  function resetTest() {
    setSessionId(null);

    setTest(null);

    setCurrentQuestion(0);

    setSelectedAnswers({});

    setSavedAnswers({});

    setTimeLeftState(0);

    setTimerRunning(false);

    setOnTimeExpired(null);
  }

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