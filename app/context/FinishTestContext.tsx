"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

type FinishReason =
  | "manual"
  | "timeout"
  | "security";

type FinishContextType = {
  finishReason: FinishReason | null;

  finishTest: (
    reason: FinishReason
  ) => void;

  finished: boolean;
};

const FinishContext =
  createContext<FinishContextType | null>(
    null
  );

export function FinishProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [finished, setFinished] =
    useState(false);

  const [
    finishReason,
    setFinishReason,
  ] = useState<FinishReason | null>(
    null
  );

  function finishTest(
    reason: FinishReason
  ) {

    if (finished) return;

    setFinished(true);

    setFinishReason(reason);

  }

  return (
    <FinishContext.Provider
      value={{
        finishReason,
        finishTest,
        finished,
      }}
    >
      {children}
    </FinishContext.Provider>
  );
}

export function useFinishTest() {

  const context =
    useContext(FinishContext);

  if (!context) {

    throw new Error(
      "useFinishTest має використовуватися всередині FinishProvider"
    );

  }

  return context;
}