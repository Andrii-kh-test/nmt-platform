"use client";

import { useRef } from "react";

import { EditorContent, useEditor } from "@tiptap/react";

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

  const inputRef =
    useRef<HTMLInputElement>(null);

  const editor =
    useEditor({

      extensions: [

        StarterKit,

        Underline,

        Link,

        Image,

        TextAlign.configure({
          types: [
            "heading",
            "paragraph",
          ],
        }),

      ],

      content: value,

      immediatelyRender: false,

      onUpdate({ editor }) {

        onChange(
          editor.getHTML()
        );

      },

    });

  async function uploadImage(
    file: File
  ) {

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

    if (!result.url) {

      alert(
        "Не вдалося завантажити файл."
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
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          className="px-3 py-1 border rounded"
        >
          <b>B</b>
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          className="px-3 py-1 border rounded italic"
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
          className="px-3 py-1 border rounded underline"
        >
          U
        </button>

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
        >
          • List
        </button>

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
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
          className="px-3 py-1 border rounded"
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
          className="px-3 py-1 border rounded"
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
          className="px-3 py-1 border rounded"
        >
          ➡
        </button>

        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          className="px-3 py-1 border rounded"
        >
          📷 Зображення
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {

            const file =
              e.target.files?.[0];

            if (file) {

              uploadImage(file);

            }

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