import { Test } from "@/app/types/test";

export async function saveTest(test: Test) {
  const isEdit = test.id !== undefined;

  const response = await fetch(
    isEdit
      ? `/api/admin/tests/${test.id}`
      : "/api/admin/tests",
    {
      method: isEdit ? "PUT" : "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(test),
    }
  );

  if (!response.ok) {
    throw new Error(
      isEdit
        ? "Не вдалося оновити тест"
        : "Не вдалося створити тест"
    );
  }

  return response.json();
}