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
          await finishTest(
            "timeout",
            test,
            savedAnswers,
            0,
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