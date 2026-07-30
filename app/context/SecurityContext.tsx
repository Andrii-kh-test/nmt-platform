"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

type SecurityContextType = {
  violations: number;

  maxViolations: number;

  addViolation: () => void;

  resetViolations: () => void;
};

const SecurityContext =
  createContext<SecurityContextType | null>(
    null
  );

export function SecurityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [violations, setViolations] =
    useState(0);

  const maxViolations = 2;

  function addViolation() {
    setViolations((prev) => prev + 1);
  }

  function resetViolations() {
    setViolations(0);
  }

  return (
    <SecurityContext.Provider
      value={{
        violations,
        maxViolations,
        addViolation,
        resetViolations,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context =
    useContext(SecurityContext);

  if (!context) {
    throw new Error(
      "useSecurity має використовуватися всередині SecurityProvider"
    );
  }

  return context;
}