"use client";

import { useDroppable } from "@dnd-kit/core";

import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  id: number;

  letter?: string;

  text?: string;

  onClear: () => void;
};

export default function DropZone({
  id,
  letter,
  text,
  onClear,
}: Props) {

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id,
  });

  return (

    <div
      ref={setNodeRef}
      className={`
        min-h-[90px]
        rounded-xl
        border-2
        border-dashed
        transition-all
        duration-200
        p-4

        ${
          isOver
            ? "border-[#7A1F2B] bg-red-50"
            : "border-gray-300 bg-gray-50"
        }
      `}
    >

      {text ? (

        <div className="flex justify-between gap-4">

          <div className="flex-1">

            <div className="font-bold text-[#7A1F2B] mb-2">

              {letter}

            </div>

            <HtmlContent
              html={text}
            />

          </div>

          <button
            type="button"
            onClick={onClear}
            className="
              text-red-600
              hover:text-red-800
              font-bold
              text-xl
            "
          >
            ✕
          </button>

        </div>

      ) : (

        <div
          className="
            flex
            items-center
            justify-center
            h-full
            text-gray-400
            italic
            text-center
          "
        >
          Перетягніть сюди відповідь
        </div>

      )}

    </div>

  );

}