/**
 * config.js
 * Параметри і константи для rtc підключення.
 */
export const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const ConnectionType = {
  DATA_ONLY: "data-only",
  AUDIO: "audio",
  VIDEO: "video",
};
