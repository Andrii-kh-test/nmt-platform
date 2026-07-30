export async function createTest(test: unknown) {
  const response = await fetch("/api/admin/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(test),
  });

  if (!response.ok) {
    throw new Error("Не вдалося створити тест");
  }

  return response.json();
}

export async function getAllTests() {
  const response = await fetch("/api/admin/tests", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не вдалося отримати список тестів");
  }

  return response.json();
}

export async function getTest(id: number) {
  const response = await fetch(`/api/admin/tests/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не вдалося отримати тест");
  }

  return response.json();
}

export async function updateTest(
  id: number,
  test: unknown
) {
  const response = await fetch(`/api/admin/tests/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(test),
  });

  if (!response.ok) {
    throw new Error("Не вдалося оновити тест");
  }

  return response.json();
}

export async function deleteTest(id: number) {
  const response = await fetch(`/api/admin/tests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Не вдалося видалити тест");
  }

  return true;
}