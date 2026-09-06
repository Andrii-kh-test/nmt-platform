"use client";

import { useEffect } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";

type PdfMaterialViewerProps = {
  title: string;
  src: string;
  isOpen: boolean;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestore: () => void;
};

export default function PdfMaterialViewer({
  title,
  src,
  isOpen,
  isMinimized,
  onMinimize,
  onClose,
  onRestore,
}: PdfMaterialViewerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  /*
   * Згорнутий режим.
   * PDF залишається відкритим, але займає мінімум місця.
   */
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999]">
        <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-2xl">
          <button
            type="button"
            onClick={onRestore}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <Maximize2 className="h-4 w-4" />
            <span>{title}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  /*
   * Повністю розгорнутий режим.
   *
   * fixed + z-[9999] означає, що вікно знаходиться
   * поверх тесту, але всередині поточного fullscreen-контексту.
   */
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[calc(100vh-32px)] w-full max-w-[1400px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Верхня панель PDF */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-800">
              {title}
            </h2>
          </div>

          <div className="ml-4 flex shrink-0 items-center gap-2">
            {/* Згорнути */}
            <button
              type="button"
              onClick={onMinimize}
              title="Згорнути"
              aria-label="Згорнути"
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <Minimize2 className="h-5 w-5" />
            </button>

            {/* Закрити */}
            <button
              type="button"
              onClick={onClose}
              title="Закрити"
              aria-label="Закрити"
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF */}
        <div className="min-h-0 flex-1 bg-gray-100">
          <iframe
            src={src}
            title={title}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}