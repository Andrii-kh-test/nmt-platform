"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";

import { finishTest } from "@/app/services/testEngine";

export default function TimeoutHandler() {
  const router = useRouter();

  const {
    test,
    savedAnswers,
    timeLeft,
    setOnTimeExpired,
  } = useTestSession();

  useEffect(() => {
    if (!test) return;

    setOnTimeExpired(() => {
      return async () => {
        try {
          const storedSessionId =
  localStorage.getItem("testSessionId");

const sessionId =
  Number(storedSessionId);

if (!sessionId) {
  throw new Error(
    "Не знайдено sessionId тестування"
  );
}

await finishTest(
  "timeout",
  test,
  savedAnswers,
  timeLeft,
  sessionId,
  router
);
        } catch (error) {
          console.error(error);
        }
      };
    });

    return () => {
      setOnTimeExpired(null);
    };
  }, [
    test,
    savedAnswers,
    timeLeft,
    router,
    setOnTimeExpired,
  ]);

  return null;
}