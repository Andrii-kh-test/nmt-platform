"use client";

export default function FullscreenButton() {
  async function enterFullscreen() {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.error("Не вдалося перейти у повноекранний режим:", error);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={enterFullscreen}
      className="bg-[#7A1F2B] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
    >
      Повноекранний режим
    </button>
  );
}