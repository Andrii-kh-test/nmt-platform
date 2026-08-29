"use client";

export default function RestoreSession() {
  /*
   * ВАЖЛИВО:
   *
   * Активна сторінка тестування більше
   * не використовує RestoreSession.
   *
   * Старт та синхронізацію сесії виконує
   * SessionMonitor.
   *
   * Це усуває конфлікт:
   *
   * RestoreSession → GET
   * SessionMonitor → POST /begin
   *
   * і не дозволяє старому timeLeft
   * перезаписати початкові 3600 секунд.
   */

  return null;
}