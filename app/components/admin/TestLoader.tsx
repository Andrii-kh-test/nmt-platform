"use client";

import { useEffect, useRef } from "react";
import { Test } from "@/app/types/test";
import { useTestConstructor } from "@/app/context/TestConstructorContext";

type Props = {
  test?: Test;
};

export default function TestLoader({ test }: Props) {
  const { setTest } = useTestConstructor();

  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && test) {
      loaded.current = true;
      setTest(test);
    }
  }, [test, setTest]);

  return null;
}