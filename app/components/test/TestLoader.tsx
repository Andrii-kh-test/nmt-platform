"use client";

import { useEffect } from "react";

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
  } = useTestSession();

  useEffect(() => {
    loadTest(test);

    startTimer();
  }, [test]);

  return null;
}