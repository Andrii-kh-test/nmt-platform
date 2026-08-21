"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MonitoringRefresh() {
  const router = useRouter();

  useEffect(() => {
    // ===================================================
    // ПЕРВИННЕ ОНОВЛЕННЯ
    // ===================================================

    router.refresh();

    // ===================================================
    // АВТООНОВЛЕННЯ КОЖНІ 2 СЕКУНДИ
    // ===================================================

    const interval = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  return null;
}