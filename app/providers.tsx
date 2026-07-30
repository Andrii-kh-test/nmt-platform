"use client";

import { ReactNode } from "react";

import { SecurityProvider } from "@/app/context/SecurityContext";
import { FinishProvider } from "@/app/context/FinishTestContext";
import { TestConstructorProvider } from "@/app/context/TestConstructorContext";
import { TestSessionProvider } from "@/app/context/TestSessionContext";

type Props = {
  children: ReactNode;
};

export default function Providers({
  children,
}: Props) {
  return (
    <SecurityProvider>

      <FinishProvider>

        <TestConstructorProvider>

          <TestSessionProvider>

            {children}

          </TestSessionProvider>

        </TestConstructorProvider>

      </FinishProvider>

    </SecurityProvider>
  );
}