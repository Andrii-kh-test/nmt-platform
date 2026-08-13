"use client";

import { useEffect, useRef } from "react";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
  onChange: (question: Question) => void;
};

/**
 * ============================================================
 * КОМПАКТНИЙ РЕДАКТОР HTML-ТЕКСТУ
 * ============================================================
 *
 * Використовується для елементів лівої та правої колонок.
 *
 * Підтримує:
 * - жирний текст;
 * - курсив;
 * - підкреслення;
 * - HTML, який уже збережений у полі.
 *
 * Це НЕ окремий Tiptap-редактор, тому ми не створюємо
 * багато повноцінних панелей інструментів усередині Matching.
 */

type InlineEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function InlineEditor({
  value,
  onChange,
  placeholder,
}: InlineEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Встановлюємо початковий HTML.
   *
   * Важливо: не встановлюємо innerHTML на кожному рендері,
   * інакше курсор буде постійно перескакувати в кінець.
   */
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML =
        value || "";
    }
  }, [value]);

  function emitChange() {
    if (!editorRef.current) {
      return;
    }

    onChange(
      editorRef.current.innerHTML
    );
  }

  function runCommand(
    command:
      | "bold"
      | "italic"
      | "underline"
  ) {
    editorRef.current?.focus();

    document.execCommand(
      command,
      false
    );

    emitChange();
  }

  return (
    <div className="w-full rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-[#7A1F2B]">

      {/* ======================================================
          ПАНЕЛЬ ФОРМАТУВАННЯ
          ====================================================== */}

      <div className="flex items-center gap-1 border-b border-gray-200 bg-slate-50 p-1.5">

        {/* Жирний */}

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("bold");
          }}
          className="h-8 w-8 rounded border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-100"
          title="Жирний"
        >
          B
        </button>

        {/* Курсив */}

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("italic");
          }}
          className="h-8 w-8 rounded border border-gray-300 bg-white italic text-gray-700 hover:bg-gray-100"
          title="Курсив"
        >
          I
        </button>

        {/* Підкреслення */}

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("underline");
          }}
          className="h-8 w-8 rounded border border-gray-300 bg-white text-gray-700 underline hover:bg-gray-100"
          title="Підкреслення"
        >
          U
        </button>

      </div>

      {/* ======================================================
          ТЕКСТ
          ====================================================== */}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder={placeholder}
        className="
          min-h-[44px]
          w-full
          p-2
          text-gray-800
          outline-none
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-gray-400
          empty:before:pointer-events-none
        "
      />

    </div>
  );
}

/**
 * ============================================================
 * MATCHING
 * ============================================================
 */

export default function Matching({
  question,
  onChange,
}: Props) {

  /**
   * ==========================================================
   * Літери правих варіантів
   * ==========================================================
   */

  const letters = [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
  ];

  /**
   * ==========================================================
   * Умова завдання
   * ==========================================================
   *
   * Тут залишається ОДНЕ поле умови.
   *
   * question.text — єдине джерело тексту умови.
   */

  function updateQuestionText(
    value: string
  ) {
    onChange({
      ...question,
      text: value,
    });
  }

  /**
   * ==========================================================
   * ЛІВА ЧАСТИНА
   * ==========================================================
   */

  function updateLeft(
    id: number,
    value: string
  ) {
    onChange({
      ...question,

      matchingLeftItems:
        question.matchingLeftItems.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  text: value,
                }
              : item
        ),
    });
  }

  /**
   * ==========================================================
   * ПРАВА ЧАСТИНА
   * ==========================================================
   */

  function updateRight(
    id: number,
    value: string
  ) {
    onChange({
      ...question,

      matchingRightItems:
        question.matchingRightItems.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  text: value,
                }
              : item
        ),
    });
  }

  /**
   * ==========================================================
   * ПРАВИЛЬНА ВІДПОВІДНІСТЬ
   * ==========================================================
   */

  function updateCorrect(
    leftId: number,
    rightId: number
  ) {
    onChange({
      ...question,

      matchingLeftItems:
        question.matchingLeftItems.map(
          (item) =>
            item.id === leftId
              ? {
                  ...item,
                  correctRightId:
                    rightId,
                }
              : item
        ),
    });
  }

  return (
    <div className="space-y-8">

      {/* ======================================================
          УМОВА
          ====================================================== */}

      <div>
        <label className="mb-2 block font-semibold">
          Умова завдання
        </label>

        <textarea
          value={question.text}
          onChange={(event) =>
            updateQuestionText(
              event.target.value
            )
          }
          rows={4}
          className="
            w-full
            rounded-lg
            border
            border-gray-300
            p-3
            outline-none
            focus:border-[#7A1F2B]
          "
          placeholder="Введіть умову завдання..."
        />
      </div>

      {/* ======================================================
          ДВІ КОЛОНКИ
          ====================================================== */}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* ====================================================
            ЛІВА КОЛОНКА
            ==================================================== */}

        <div>
          <h3 className="mb-3 font-semibold">
            Ліва колонка
          </h3>

          <div className="space-y-4">

            {question.matchingLeftItems.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    p-3
                  "
                >

                  {/* Номер + редактор */}

                  <div className="flex items-start gap-3">

                    <div className="w-6 shrink-0 pt-2 font-bold">
                      {index + 1}.
                    </div>

                    <div className="min-w-0 flex-1">

                      <InlineEditor
                        value={item.text}
                        onChange={(value) =>
                          updateLeft(
                            item.id,
                            value
                          )
                        }
                        placeholder={`Лівий елемент ${
                          index + 1
                        }`}
                      />

                    </div>

                  </div>

                  {/* Правильна відповідність */}

                  <div className="ml-9 mt-3">

                    <label className="mb-1 block text-sm font-medium text-gray-600">
                      Правильна відповідь
                    </label>

                    <select
                      value={
                        item.correctRightId ??
                        ""
                      }
                      onChange={(event) => {
                        const value =
                          Number(
                            event.target.value
                          );

                        if (!value) {
                          return;
                        }

                        updateCorrect(
                          item.id,
                          value
                        );
                      }}
                      className="
                        w-full
                        rounded
                        border
                        border-gray-300
                        bg-white
                        p-2
                        outline-none
                        focus:border-[#7A1F2B]
                      "
                    >

                      <option value="">
                        Оберіть правильний
                        варіант
                      </option>

                      {question.matchingRightItems.map(
                        (
                          rightItem,
                          rightIndex
                        ) => (
                          <option
                            key={
                              rightItem.id
                            }
                            value={
                              rightItem.id
                            }
                          >
                            {letters[
                              rightIndex
                            ] ?? ""}{" "}
                            —{" "}
                            {rightItem.text
                              ? rightItem.text.replace(
                                  /<[^>]*>/g,
                                  ""
                                )
                              : `Варіант ${
                                  rightIndex +
                                  1
                                }`}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>
              )
            )}

          </div>
        </div>

        {/* ====================================================
            ПРАВА КОЛОНКА
            ==================================================== */}

        <div>

          <h3 className="mb-3 font-semibold">
            Права колонка
          </h3>

          <div className="space-y-4">

            {question.matchingRightItems.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    p-3
                  "
                >

                  <div className="flex items-start gap-3">

                    <div className="w-6 shrink-0 pt-2 font-bold">
                      {letters[index] ??
                        String.fromCharCode(
                          1040 + index
                        )}
                      .
                    </div>

                    <div className="min-w-0 flex-1">

                      <InlineEditor
                        value={item.text}
                        onChange={(value) =>
                          updateRight(
                            item.id,
                            value
                          )
                        }
                        placeholder={`Правий варіант ${
                          letters[index] ??
                          index + 1
                        }`}
                      />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}