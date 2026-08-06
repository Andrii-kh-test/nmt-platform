"use client";

import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center gap-3 text-center">

        <p className="text-gray-700 font-medium">
          © Хорунжий Андрій Володимирович, 2026
        </p>

        <div className="flex items-center gap-2 text-gray-500">
          <Brain
            className="w-5 h-5 text-[#7A1F2B]"
            strokeWidth={2}
          />

          <span>
            Створено за підтримки технологій штучного інтелекту
          </span>
        </div>

      </div>
    </footer>
  );
}