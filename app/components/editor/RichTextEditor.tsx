"use client";

import { useRef } from "react";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichTextEditor({
  value,
  onChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ],

    content: value,

    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  async function uploadImage(file: File) {
    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        alert("Не вдалося завантажити зображення.");
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

      alert("Помилка завантаження зображення.");
    }
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">

      <div className="flex flex-wrap gap-2 p-3 border-b bg-slate-50">

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("bold")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
        >
          <b>B</b>
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("italic")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
        >
          <i>I</i>
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleUnderline().run()
          }
          className={`px-3 py-1 border rounded ${
            editor.isActive("underline")
              ? "bg-[#7A1F2B] text-white"
              : ""
          }`}
        >
          <u>U</u>
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className="px-3 py-1 border rounded"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          className="px-3 py-1 border rounded"
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().setTextAlign("left").run()
          }
          className="px-3 py-1 border rounded"
        >
          ⬅
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().setTextAlign("center").run()
          }
          className="px-3 py-1 border rounded"
        >
          ☰
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().setTextAlign("right").run()
          }
          className="px-3 py-1 border rounded"
        >
          ➡
        </button>

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="px-3 py-1 border rounded"
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

      <EditorContent
        editor={editor}
        className="min-h-[220px] p-5 prose max-w-none"
      />

    </div>
  );
}