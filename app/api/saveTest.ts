import { Test } from "@/app/types/test";

export async function saveTest(test: Test) {
  const isEdit =
    typeof test.id === "number" &&
    test.id > 0;

  const url = isEdit
    ? `/api/admin/tests/${test.id}`
    : "/api/admin/tests";

  const response = await fetch(url, {
    method: isEdit ? "PATCH" : "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      ...test,
      id: isEdit ? test.id : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    console.error(
      "SAVE TEST ERROR:",
      error
    );

    throw new Error(
      error ||
        "Помилка збереження тесту"
    );
  }

  return response.json();
}