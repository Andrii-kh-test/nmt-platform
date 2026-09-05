"use client";

import { useEffect } from "react";

export default function TestSecurityGuard() {
  useEffect(() => {
    // =========================================================
    // БЛОКУВАННЯ КОНТЕКСТНОГО МЕНЮ
    // =========================================================
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // =========================================================
    // БЛОКУВАННЯ ВИДІЛЕННЯ ТЕКСТУ
    // =========================================================
    const handleSelectStart = (event: Event) => {
      event.preventDefault();
    };

    // =========================================================
    // БЛОКУВАННЯ ПЕРЕТЯГУВАННЯ ТЕКСТУ
    // =========================================================
    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    // =========================================================
    // БЛОКУВАННЯ КЛАВІАТУРНИХ КОМАНД
    // =========================================================
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Ctrl+C
      if (event.ctrlKey && key === "c") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Ctrl+X
      if (event.ctrlKey && key === "x") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Ctrl+U
      if (event.ctrlKey && key === "u") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Ctrl+Shift+C — відкриття DevTools
      // Додатково блокуємо, оскільки це команда перегляду елементів.
      if (event.ctrlKey && event.shiftKey && key === "c") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // F12 — DevTools
      if (event.key === "F12") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // =======================================================
      // PRINT SCREEN
      // =======================================================
      if (event.key === "PrintScreen") {
        event.preventDefault();
        event.stopPropagation();

        // Тимчасово прибираємо видимість сторінки.
        // Це не може фізично заборонити скриншот,
        // але зменшує шанс отримати нормальний кадр.
        document.documentElement.classList.add(
          "screenshot-protection-active"
        );

        window.setTimeout(() => {
          document.documentElement.classList.remove(
            "screenshot-protection-active"
          );
        }, 1200);

        return;
      }
    };

    // =========================================================
    // БЛОКУВАННЯ КОПІЮВАННЯ / ВИРІЗАННЯ ЧЕРЕЗ ПОДІЇ
    // =========================================================
    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    // =========================================================
    // ПІДКЛЮЧЕННЯ ОБРОБНИКІВ
    // =========================================================
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);

    document.addEventListener("keydown", handleKeyDown, true);

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);

    // =========================================================
    // CLEANUP
    // =========================================================
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);

      document.removeEventListener("keydown", handleKeyDown, true);

      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, []);

  return null;
}