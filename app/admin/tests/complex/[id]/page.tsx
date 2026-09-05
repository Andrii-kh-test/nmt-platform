"use client";

import { useParams } from "next/navigation";
import ComplexTestForm from "@/app/components/admin/ComplexTestForm";

export default function EditComplexTestPage() {
  const params = useParams();

  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-red-600 font-medium">
              Некоректний ідентифікатор комбінованого тесту.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <ComplexTestForm complexTestId={id} />;
}