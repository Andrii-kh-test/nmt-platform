"use client";

import { useEffect, useState } from "react";

import { useSecurity } from "@/app/context/SecurityContext";
import ViolationModal from "./ViolationModal";

type Props = {
  onTerminate: () => void;
};

export default function FullscreenGuard({
  onTerminate,
}: Props) {

  const {
    violations,
    maxViolations,
    addViolation,
  } = useSecurity();

  const [open, setOpen] =
    useState(false);

  useEffect(() => {

    function handleFullscreenChange() {

      if (document.fullscreenElement) {
        return;
      }

      addViolation();
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };

  }, []);

  useEffect(() => {

    if (violations === 0) {
      return;
    }

    if (violations >= maxViolations) {

      onTerminate();

      return;

    }

    setOpen(true);

  }, [violations]);

  async function continueTesting() {

    setOpen(false);

    try {

      await document.documentElement.requestFullscreen();

    } catch {

      onTerminate();

    }

  }

  return (
    <>
      <ViolationModal
        open={open}
        violations={violations}
        maxViolations={maxViolations}
        onContinue={continueTesting}
      />
    </>
  );
}