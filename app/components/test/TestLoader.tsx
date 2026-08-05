"use client";

import { useEffect, useRef } from "react";

import { Test } from "@/app/types/test";
import { useTestSession } from "@/app/context/TestSessionContext";

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

    loadTest(test);
    startTimer();

    initialized.current = true;
  }, [currentTest, loadTest, startTimer, test]);

  return null;
}