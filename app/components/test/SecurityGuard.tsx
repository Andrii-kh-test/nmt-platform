"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {

    function handleKeyDown(e: KeyboardEvent) {

      // F5
      if (e.key === "F5") {
        e.preventDefault();
        return;
      }

      // Ctrl + ...
      if (e.ctrlKey) {

        const key = e.key.toLowerCase();

        if (
          key === "r" ||
          key === "p" ||
          key === "a" ||
          key === "c" ||
          key === "s"
        ) {
          e.preventDefault();
          return;
        }

      }

    }

    function handleContextMenu(
      e: MouseEvent
    ) {
      e.preventDefault();
    }

    function handleSelectStart(
      e: Event
    ) {
      e.preventDefault();
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.addEventListener(
      "contextmenu",
      handleContextMenu
    );

    document.addEventListener(
      "selectstart",
      handleSelectStart
    );

    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.removeEventListener(
        "contextmenu",
        handleContextMenu
      );

      document.removeEventListener(
        "selectstart",
        handleSelectStart
      );

    };

  }, []);

  return null;
}