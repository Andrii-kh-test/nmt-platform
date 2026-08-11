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
    test: currentTest,
  } = useTestSession();

  const initialized =
    useRef(false);

  useEffect(() => {
    // --------------------------------------------------
    // Не запускаємо ініціалізацію повторно
    // --------------------------------------------------

    if (initialized.current) {
      return;
    }

    // --------------------------------------------------
    // Якщо тест уже був відновлений із сесії —
    // нічого не перезавантажуємо
    // --------------------------------------------------

    if (currentTest) {
      initialized.current = true;
      return;
    }

    // --------------------------------------------------
    // Створюємо випадковий порядок питань
    // --------------------------------------------------

    const shuffled =
      shuffleTest(test);

    // --------------------------------------------------
    // Завантажуємо тест у Context
    //
    // ВАЖЛИВО:
    // TestLoader НЕ запускає таймер.
    //
    // Час буде отримано з серверної сесії
    // через RestoreSession.
    // --------------------------------------------------

    loadTest(shuffled);

    initialized.current = true;
  }, [
    currentTest,
    loadTest,
    test,
  ]);

  return null;
}