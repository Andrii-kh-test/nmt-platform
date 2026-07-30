"use client";

import { useEffect, useState } from "react";

import { Test } from "@/app/types/test";
import { getTests } from "@/app/services/test.api";

import TestCard from "./TestCard";

export default function TestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      const data = await getTests();
      setTests(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center">
        Завантаження...
      </p>
    );
  }

  if (tests.length === 0) {
    return (
      <p className="text-center">
        Тести поки що відсутні.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {tests.map((test) => (
        <TestCard
          key={test.id}
          id={test.id}
          title={test.title}
          subject={test.subject}
          duration={test.duration}
          questions={test.questions.length}
        />
      ))}
    </div>
  );
}