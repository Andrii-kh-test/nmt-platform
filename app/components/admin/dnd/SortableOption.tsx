"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: string;
  children: React.ReactNode;
};

export default function SortableOption({
  id,
  children,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move bg-gray-100 border rounded-lg px-3 py-2 mb-2 select-none"
      >
        ☰ Перетягніть
      </div>

      {children}
    </div>
  );
}