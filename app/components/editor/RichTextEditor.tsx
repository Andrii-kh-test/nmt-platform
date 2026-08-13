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

/*
 * Створення SVG для фігури
 */
function createShapeSvg(shape: ShapeType): SVGSVGElement {
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("width", "32");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 32 24");
  svg.setAttribute("xmlns", svgNS);

  svg.style.display = "inline-block";
  svg.style.width = "32px";
  svg.style.height = "24px";
  svg.style.verticalAlign = "middle";
  svg.style.overflow = "visible";

  /*
   * ТРИКУТНИК
   */
  if (shape === "triangle") {
    const polygon = document.createElementNS(
      svgNS,
      "polygon"
    );

    polygon.setAttribute(
      "points",
      "16,3 29,21 3,21"
    );

    svg.appendChild(polygon);
  }

  /*
   * ТРАПЕЦІЯ
   *
   * ВАЖЛИВО:
   * довга основа зверху,
   * коротка основа знизу.
   */
  if (shape === "trapezoid") {
    const polygon = document.createElementNS(
      svgNS,
      "polygon"
    );

    polygon.setAttribute(
      "points",
      "3,3 29,3 24,21 8,21"
    );

    svg.appendChild(polygon);
  }

  /*
   * КОЛО
   */
  if (shape === "circle") {
    const circle = document.createElementNS(
      svgNS,
      "circle"
    );

    circle.setAttribute("cx", "16");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "9");

    svg.appendChild(circle);
  }

  /*
   * КВАДРАТ
   */
  if (shape === "square") {
    const rect = document.createElementNS(
      svgNS,
      "rect"
    );

    rect.setAttribute("x", "7");
    rect.setAttribute("y", "3");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "18");

    svg.appendChild(rect);
  }

  /*
   * РОМБ
   */
  if (shape === "diamond") {
    const polygon = document.createElementNS(
      svgNS,
      "polygon"
    );

    polygon.setAttribute(
      "points",
      "16,2 29,12 16,22 3,12"
    );

    svg.appendChild(polygon);
  }

  /*
   * Загальний стиль ліній.
   */
  svg.querySelectorAll(
    "polygon, circle, rect"
  ).forEach((element) => {
    element.setAttribute("fill", "none");
    element.setAttribute(
      "stroke",
      "#111827"
    );
    element.setAttribute(
      "stroke-width",
      "2.5"
    );
    element.setAttribute(
      "stroke-linejoin",
      "round"
    );
    element.setAttribute(
      "stroke-linecap",
      "round"
    );
  });

  return svg;
}

/*
 * ============================================================
 * TIPTAP NODE ДЛЯ ФІГУРИ
 * ============================================================
 */

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
      tag: "span[data-shape]",
      getAttrs: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        const shape = element.getAttribute("data-shape");

        if (
          shape === "triangle" ||
          shape === "trapezoid" ||
          shape === "circle" ||
          shape === "square" ||
          shape === "diamond"
        ) {
          return {
            shape,
          };
        }

        return false;
      },
    },
  ];
},

  renderHTML({ node }) {
    return [
      "span",
      {
        "data-shape": node.attrs.shape,
      },
    ];
  },

  /*
   * ==========================================================
   * NODE VIEW
   *
   * Саме тут фігура реально малюється в редакторі.
   * ==========================================================
   */

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement(
        "span"
      );

      wrapper.setAttribute(
        "data-shape",
        node.attrs.shape
      );

      wrapper.className =
        "editor-shape-node";

      wrapper.style.display =
        "inline-flex";

      wrapper.style.alignItems =
        "center";

      wrapper.style.justifyContent =
        "center";

      wrapper.style.width = "36px";

      wrapper.style.height = "28px";

      wrapper.style.margin =
        "0 3px";

      wrapper.style.verticalAlign =
        "middle";

      wrapper.style.cursor =
        "pointer";

      wrapper.style.lineHeight =
        "1";

      const svg = createShapeSvg(
        node.attrs.shape as ShapeType
      );

      wrapper.appendChild(svg);

      return {
        dom: wrapper,

        /*
         * При зміні атрибутів вузла
         * перемальовуємо SVG.
         */
        update(updatedNode) {
          if (
            updatedNode.type !== node.type
          ) {
            return false;
          }

          const newShape =
            updatedNode.attrs
              .shape as ShapeType;

          wrapper.setAttribute(
            "data-shape",
            newShape
          );

          wrapper.innerHTML = "";

          wrapper.appendChild(
            createShapeSvg(newShape)
          );

          return true;
        },

        /*
         * Коли фігура виділена Tiptap-ом,
         * додаємо клас для візуального
         * позначення.
         */
        selectNode() {
          wrapper.classList.add(
            "ProseMirror-selectednode"
          );
        },

        deselectNode() {
          wrapper.classList.remove(
            "ProseMirror-selectednode"
          );
        },
      };
    };
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
        types: [
          "heading",
          "paragraph",
        ],
      }),

      ShapeNode,
    ],

    content: value,

    immediatelyRender: false,

    onUpdate({ editor }) {
  const html = editor.getHTML();

  console.log("EDITOR HTML:", html);

  onChange(html);
},
  });

  /*
   * ==========================================================
   * ЗАВАНТАЖЕННЯ ЗОБРАЖЕННЯ
   * ==========================================================
   */

  async function uploadImage(file: File) {
    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
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

  function insertShape(
    shape: ShapeType
  ) {
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
            editor.isActive(
              "underline"
            )
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
              insertShape(
                "triangle"
              )
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
              insertShape(
                "trapezoid"
              )
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
                /*
                 * Довга основа зверху,
                 * коротка — знизу.
                 */
                points="3,3 29,3 24,21 8,21"
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
              insertShape(
                "diamond"
              )
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

      {/* ======================================================
          СТИЛІ ФІГУР
          ====================================================== */}

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          min-height: 220px;
        }

        .rich-text-editor
          .ProseMirror
          .editor-shape-node {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;

          width: 36px !important;
          height: 28px !important;

          margin: 0 3px !important;

          line-height: 1 !important;

          cursor: pointer !important;
        }

        .rich-text-editor
          .ProseMirror
          .editor-shape-node
          svg {
          display: inline-block !important;

          width: 32px !important;
          height: 24px !important;

          overflow: visible !important;

          visibility: visible !important;
          opacity: 1 !important;
        }

        .rich-text-editor
          .ProseMirror
          .editor-shape-node
          polygon,
        .rich-text-editor
          .ProseMirror
          .editor-shape-node
          circle,
        .rich-text-editor
          .ProseMirror
          .editor-shape-node
          rect {
          fill: none !important;

          stroke: #111827 !important;

          stroke-width: 2.5 !important;

          stroke-linejoin: round !important;

          stroke-linecap: round !important;
        }

        /*
         * Виділена фігура.
         *
         * Tiptap додає цей клас автоматично,
         * коли атомарний вузол виділений.
         */

        .rich-text-editor
          .ProseMirror
          .editor-shape-node.ProseMirror-selectednode {
          outline: 2px solid #7A1F2B !important;

          outline-offset: 2px !important;

          border-radius: 4px !important;
        }
      `}</style>

    </div>
  );
}