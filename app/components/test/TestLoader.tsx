"use client";

import { useEffect, useRef } from "react";

import { Test } from "@/app/types/test";
import { useTestSession } from "@/app/context/TestSessionContext";

import { shuffleTest } from "@/app/utils/shuffleTest";

type Props = {
  test: Test;
};

export default function TestLoader({
  test,
}: Props) {
  const {
    loadTest,
    startTimer,
    test: currentTest,
  } = useTestSession();

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    // якщо тест уже був відновлений із сесії —
    // нічого не перезавантажуємо
    if (currentTest) {
      initialized.current = true;
      return;
    }

    // Створюємо випадковий порядок питань та відповідей
    const shuffled = shuffleTest(test);

    loadTest(shuffled);

    startTimer();

    initialized.current = true;
  }, [
    currentTest,
    loadTest,
    startTimer,
    test,
  ]);

  return null;
}