"use client";

import { useState } from "react";
import { Download, FileText, X } from "lucide-react";

type ExportMode = "summary" | "answers" | "full";

type ExportResultPdfButtonProps = {
  resultId: number;
};

const modes: Array<{
  value: ExportMode;
  title: string;
  description: string;
}> = [
  {
    value: "summary",
    title: "Лише загальні відомості",
    description:
      "ПІБ учасника, тест, результат, час проходження та інші основні показники.",
  },
  {
    value: "answers",
    title: "Загальні відомості + відповіді",
    description:
      "Загальні відомості та таблиця з відповіддю учасника і правильною відповіддю.",
  },
  {
    value: "full",
    title: "Повний результат",
    description:
      "Загальні відомості, відповіді учасника, правильні відповіді, умови та зміст усіх завдань.",
  },
];

export default function ExportResultPdfButton({
  resultId,
}: ExportResultPdfButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] =
    useState<ExportMode>("summary");
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/results/${resultId}/pdf?mode=${mode}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        let message =
          "Не вдалося сформувати PDF-файл.";

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          }
        } catch {
          // Якщо сервер повернув не JSON —
          // залишаємо стандартне повідомлення.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const contentDisposition =
        response.headers.get(
          "Content-Disposition"
        );

      let filename =
        `result-${resultId}.pdf`;

      const match =
        contentDisposition?.match(
          /filename="([^"]+)"/
        );

      if (match?.[1]) {
        filename = decodeURIComponent(
          match[1]
        );
      }

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error(
        "EXPORT RESULT PDF ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося сформувати PDF-файл."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#7A1F2B]
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          shadow-sm
          transition
          hover:bg-[#651923]
          hover:shadow-md
        "
      >
        <Download className="h-4 w-4" />
        Експортувати PDF
      </button>

      {open && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpen(false);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-2xl
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-gray-200
                bg-[#7A1F2B]
                px-6
                py-5
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/10
                  "
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    Експорт результату у PDF
                  </h2>

                  <p className="text-sm text-white/70">
                    Оберіть потрібний формат документа
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="
                  rounded-lg
                  p-2
                  text-white/70
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6">
              {modes.map((item) => {
                const selected =
                  mode === item.value;

                return (
                  <label
                    key={item.value}
                    className={`
                      flex
                      cursor-pointer
                      gap-4
                      rounded-xl
                      border
                      p-4
                      transition
                      ${
                        selected
                          ? "border-[#7A1F2B] bg-[#7A1F2B]/5 ring-1 ring-[#7A1F2B]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="pdf-export-mode"
                      value={item.value}
                      checked={selected}
                      onChange={() =>
                        setMode(item.value)
                      }
                      disabled={loading}
                      className="
                        mt-1
                        h-5
                        w-5
                        shrink-0
                        accent-[#7A1F2B]
                      "
                    />

                    <div>
                      <div className="font-semibold text-gray-900">
                        {item.title}
                      </div>

                      <div className="mt-1 text-sm leading-6 text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                border-t
                border-gray-200
                bg-gray-50
                px-6
                py-4
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-gray-700
                  transition
                  hover:bg-gray-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#7A1F2B]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#651923]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Download className="h-4 w-4" />

                {loading
                  ? "Формування PDF..."
                  : "Завантажити PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}