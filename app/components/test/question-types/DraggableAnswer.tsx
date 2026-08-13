"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  id: number;
  letter: string;
  text: string;
};

export default function DraggableAnswer({
  id,
  letter,
  text,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
  });

  const style = {
    transform: transform
      ? CSS.Translate.toString(transform)
      : undefined,

    transition: "transform 200ms ease",

    opacity: isDragging ? 0.5 : 1,

    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="
        rounded-lg
        border
        border-gray-300
        bg-white
        px-4
        py-3
        shadow-sm
        hover:bg-gray-50
        select-none
      "
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 font-bold text-[#7A1F2B]">
          {letter}
        </div>

        <HtmlContent
          html={text}
          className="flex-1"
        />
      </div>
    </div>
  );
}