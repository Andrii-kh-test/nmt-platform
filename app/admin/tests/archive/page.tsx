"use client";

import Link from "next/link";
import {
  Archive,
  FolderArchive,
  FileArchive,
  ArrowLeft,
} from "lucide-react";

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto py-10 px-8">

        {/* ================================
            ЗАГОЛОВОК
            ================================ */}

        <div className="flex items-center gap-4 mb-10">

          <Link
            href="/admin/tests"
            className="
              inline-flex
              items-center
              justify-center
              w-11
              h-11
              rounded-lg
              border
              border-gray-300
              bg-white
              text-gray-600
              hover:bg-gray-50
              transition
            "
            title="Повернутися до банку тестів"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">

            <Archive className="w-9 h-9 text-[#7A1F2B]" />

            <h1 className="text-5xl font-bold text-[#7A1F2B]">
              Архів
            </h1>

          </div>

        </div>

        {/* ================================
            ВИБІР АРХІВУ
            ================================ */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* АРХІВ РОЗДІЛІВ */}

          <Link
            href="/admin/tests/archive/subjects"
            className="
              group
              bg-white
              rounded-2xl
              shadow-lg
              border
              border-gray-200
              p-8
              hover:shadow-xl
              hover:border-[#7A1F2B]
              transition
            "
          >

            <div
              className="
                w-16
                h-16
                rounded-xl
                bg-[#7A1F2B]/10
                flex
                items-center
                justify-center
                mb-6
                group-hover:bg-[#7A1F2B]/20
                transition
              "
            >
              <FolderArchive className="w-9 h-9 text-[#7A1F2B]" />
            </div>

            <h2 className="text-2xl font-bold text-[#7A1F2B] mb-3">
              Архів розділів
            </h2>

            <p className="text-gray-600">
              Перегляд архівованих розділів,
              їх відновлення або остаточне
              видалення.
            </p>

          </Link>

          {/* АРХІВ ТЕСТІВ */}

          <Link
            href="/admin/tests/archive/tests"
            className="
              group
              bg-white
              rounded-2xl
              shadow-lg
              border
              border-gray-200
              p-8
              hover:shadow-xl
              hover:border-[#7A1F2B]
              transition
            "
          >

            <div
              className="
                w-16
                h-16
                rounded-xl
                bg-[#7A1F2B]/10
                flex
                items-center
                justify-center
                mb-6
                group-hover:bg-[#7A1F2B]/20
                transition
              "
            >
              <FileArchive className="w-9 h-9 text-[#7A1F2B]" />
            </div>

            <h2 className="text-2xl font-bold text-[#7A1F2B] mb-3">
              Архів тестів
            </h2>

            <p className="text-gray-600">
              Перегляд архівованих тестів,
              їх відновлення або остаточне
              видалення.
            </p>

          </Link>

        </div>

      </div>
    </main>
  );
}