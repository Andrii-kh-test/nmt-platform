"use client";

import TestSettings from "@/app/components/admin/TestSettings";
import QuestionList from "@/app/components/admin/QuestionList";

import { TestConstructorProvider } from "@/app/context/TestConstructorContext";

export default function NewTestPage() {
  return (
    <TestConstructorProvider>

      <main className="min-h-screen bg-[#F8FAFC] p-8">

        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-[#7A1F2B] mb-8">
            Створення тесту
          </h1>

          <div className="grid grid-cols-12 gap-8">

            <div className="col-span-4">
              <TestSettings />
            </div>

            <div className="col-span-8">
              <QuestionList />
            </div>

          </div>

        </div>

      </main>

    </TestConstructorProvider>
  );
}