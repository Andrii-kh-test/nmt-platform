"use client";

import { useRef } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import { Node } from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

/*
 * ============================================================
 * ГЕОМЕТРИЧНІ ФІГУРИ
 * ============================================================
 */

type ShapeType =
  | "triangle"
  | "trapezoid"
  | "circle"
  | "square"
  | "diamond";

const ShapeNode = Node.create({
  name: "shape",

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      shape: {
        default: "triangle",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-shape]',
      },
    ];
  },

  renderHTML({ node }) {
    const shape = node.attrs.shape as ShapeType;

    const commonSvgAttributes = {
      width: "32",
      height: "24",
      viewBox: "0 0 32 24",
      xmlns: "http://www.w3.org/2000/svg",
      style:
        "display:inline-block;vertical-align:middle;margin:0 3px;",
    };

    const strokeAttributes = {
      fill: "none",
      stroke: "#111827",
      "stroke-width": "2.5",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    };

    switch (shape) {
      /*
       * ТРИКУТНИК
       */
      case "triangle":
        return [
          "span",
          {
            "data-shape": "triangle",
            style:
              "display:inline-block;vertical-align:middle;",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "polygon",
              {
                ...strokeAttributes,
                points: "16,3 29,21 3,21",
              },
            ],
          ],
        ];

      /*
       * ТРАПЕЦІЯ
       *
       * Саме така форма, як на скриншоті:
       * верхня основа коротша,
       * нижня — довша,
       * бокові сторони нахилені.
       */
      case "trapezoid":
        return [
          "span",
          {
            "data-shape": "trapezoid",
            style:
              "display:inline-block;vertical-align:middle;",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "polygon",
              {
                ...strokeAttributes,
                points: "8,3 24,3 29,21 3,21",
              },
            ],
          ],
        ];

      /*
       * КОЛО
       */
      case "circle":
        return [
          "span",
          {
            "data-shape": "circle",
            style:
              "display:inline-block;vertical-align:middle;",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "circle",
              {
                ...strokeAttributes,
                cx: "16",
                cy: "12",
                r: "9",
              },
            ],
          ],
        ];

      /*
       * КВАДРАТ
       */
      case "square":
        return [
          "span",
          {
            "data-shape": "square",
            style:
              "display:inline-block;vertical-align:middle;",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "rect",
              {
                ...strokeAttributes,
                x: "7",
                y: "3",
                width: "18",
                height: "18",
              },
            ],
          ],
        ];

      /*
       * РОМБ
       */
      case "diamond":
        return [
          "span",
          {
            "data-shape": "diamond",
            style:
              "display:inline-block;vertical-align:middle;",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "polygon",
              {
                ...strokeAttributes,
                points: "16,2 29,12 16,22 3,12",
              },
            ],
          ],
        ];

      default:
        return [
          "span",
          {
            "data-shape": "triangle",
          },
          [
            "svg",
            commonSvgAttributes,
            [
              "polygon",
              {
                ...strokeAttributes,
                points: "16,3 29,21 3,21",
              },
            ],
          ],
        ];
    }
  },
});

/*
 * ============================================================
 * РЕДАКТОР
 * ============================================================
 */

export default function RichTextEditor({
  value,
  onChange,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,

      Underline,

      Link.configure({
        openOnClick: false,
      }),

      Image,

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      ShapeNode,
    ],

    content: value,

    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  /*
   * ==========================================================
   * ЗАВАНТАЖЕННЯ ЗОБРАЖЕННЯ
   * ==========================================================
   */

  async function uploadImage(file: File) {
    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!result.success) {
        alert(
          "Не вдалося завантажити зображення."
        );

        return;
      }

      editor
        ?.chain()
        .focus()
        .setImage({
          src: result.url,
        })
        .run();
    } catch (error) {
      console.error(error);

      alert(
        "Помилка завантаження зображення."
      );
    }
  }

  /*
   * ==========================================================
   * ВСТАВЛЕННЯ ФІГУРИ
   * ==========================================================
   */

  function insertShape(shape: ShapeType) {
  if (!editor) {
    return;
  }

  editor
    .chain()
    .focus()
    .insertContent({
      type: "shape",
      attrs: {
        shape,
      },
    })
    .run();
}

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">

      {/* ======================================================
          ПАНЕЛЬ ІНСТРУМЕНТІВ
          ====================================================== */}

      <div className="flex flex-wrap gap-2 p-3 border-b bg-slate-50">

        {/* ЖИРНИЙ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("bold")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Жирний текст"
        >
          <b>B</b>
        </button>

        {/* КУРСИВ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("italic")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Курсив"
        >
          <i>I</i>
        </button>

        {/* ПІДКРЕСЛЕННЯ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("underline")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Підкреслення"
        >
          <u>U</u>
        </button>

        {/* МАРКОВАНИЙ СПИСОК */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className="px-3 py-1 border rounded"
          title="Маркований список"
        >
          • List
        </button>

        {/* НУМЕРОВАНИЙ СПИСОК */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          className="px-3 py-1 border rounded"
          title="Нумерований список"
        >
          1. List
        </button>

        {/* ==================================================
            ВИРІВНЮВАННЯ
            ================================================== */}

        {/* ЛІВОРУЧ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive({
              textAlign: "left",
            })
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Вирівняти ліворуч"
        >
          ⬅
        </button>

        {/* ПО ЦЕНТРУ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("center")
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive({
              textAlign: "center",
            })
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Вирівняти по центру"
        >
          ☰
        </button>

        {/* ПРАВОРУЧ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("right")
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive({
              textAlign: "right",
            })
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Вирівняти праворуч"
        >
          ➡
        </button>

        {/* ПО ШИРИНІ */}

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("justify")
              .run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive({
              textAlign: "justify",
            })
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
          title="Вирівняти по ширині"
        >
          ≡
        </button>

        {/* ==================================================
            ФІГУРИ
            ================================================== */}

        <div className="flex items-center gap-1 border-l pl-2 ml-1">

          <span className="text-sm text-gray-500 mr-1">
            Фігури:
          </span>

          {/* ТРИКУТНИК */}

          <button
            type="button"
            onClick={() =>
              insertShape("triangle")
            }
            className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            title="Вставити трикутник"
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="16,3 29,21 3,21"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* ТРАПЕЦІЯ */}

          <button
            type="button"
            onClick={() =>
              insertShape("trapezoid")
            }
            className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            title="Вставити трапецію"
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="8,3 24,3 29,21 3,21"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* КОЛО */}

          <button
            type="button"
            onClick={() =>
              insertShape("circle")
            }
            className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            title="Вставити коло"
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="16"
                cy="12"
                r="9"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
              />
            </svg>
          </button>

          {/* КВАДРАТ */}

          <button
            type="button"
            onClick={() =>
              insertShape("square")
            }
            className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            title="Вставити квадрат"
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="7"
                y="3"
                width="18"
                height="18"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
              />
            </svg>
          </button>

          {/* РОМБ */}

          <button
            type="button"
            onClick={() =>
              insertShape("diamond")
            }
            className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            title="Вставити ромб"
          >
            <svg
              width="24"
              height="20"
              viewBox="0 0 32 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="16,2 29,12 16,22 3,12"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        </div>

        {/* ==================================================
            ЗОБРАЖЕННЯ
            ================================================== */}

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="px-3 py-1 border rounded"
          title="Вставити зображення"
        >
          🖼️
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file =
              e.target.files?.[0];

            if (file) {
              uploadImage(file);
            }

            e.target.value = "";
          }}
        />

      </div>

      {/* ======================================================
          РЕДАКТОР
          ====================================================== */}

      <EditorContent
  editor={editor}
  className="rich-text-editor min-h-[220px] p-5 prose max-w-none"
/>
<style jsx global>{`
  .rich-text-editor .ProseMirror [data-shape] {
    display: inline-block !important;
    vertical-align: middle !important;
    line-height: 1 !important;
    min-width: 32px !important;
    min-height: 24px !important;
  }

  .rich-text-editor .ProseMirror [data-shape] svg {
    display: inline-block !important;
    width: 32px !important;
    height: 24px !important;
    visibility: visible !important;
    opacity: 1 !important;
    vertical-align: middle !important;
  }

  .rich-text-editor .ProseMirror [data-shape] polygon,
  .rich-text-editor .ProseMirror [data-shape] circle,
  .rich-text-editor .ProseMirror [data-shape] rect {
    fill: none !important;
    stroke: #111827 !important;
    stroke-width: 2.5 !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`}</style>
    </div>
  );
}