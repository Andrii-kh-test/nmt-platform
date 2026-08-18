"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteResultButtonProps = {
  resultId: number;
  participantName: string;
};

export default function DeleteResultButton({
  resultId,
  participantName,
}: DeleteResultButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Видалити результат учасника "${participantName}"?\n\nЦю дію неможливо скасувати.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/results/${resultId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося видалити результат"
        );
      }

      // Оновлюємо серверну сторінку
      window.location.reload();
    } catch (error) {
      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      alert(
        "Не вдалося видалити результат."
      );

      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        bg-red-600
        px-4
        py-2
        font-semibold
        text-white
        transition
        hover:bg-red-700
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <Trash2 className="h-4 w-4" />

      {deleting
        ? "Видалення..."
        : "Видалити"}
    </button>
  );
}