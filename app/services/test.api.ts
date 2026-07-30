import { Test } from "@/app/types/test";

export async function getTests(): Promise<Test[]> {
  const response = await fetch("/api/tests");

  if (!response.ok) {
    throw new Error("Не вдалося отримати список тестів");
  }

  return response.json();
}