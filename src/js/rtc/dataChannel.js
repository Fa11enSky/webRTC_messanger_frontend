/**
 * dataChannel.js
 * Модуль для ініціалізації та керування мережевим каналом.
 * Містить функції для додавання обробників подій та відправки повідомлень.
 */

import { closeConnection } from "./connection";

/**@type {RTCDataChannel|null} */
let dataChannel = null;

export function getDataChannel() {
  return dataChannel;
}

/**
 * Сеттер для змінної dataChannel
 * @param {RTCDataChannel|null} channel Результат peerConnection.createDataChannel()
 */
export function setDataChannel(channel) {
  if (dataChannel) {
    console.warn("Overwriting existing dataChannel");
  }
  dataChannel = channel;
}

/**
 * Закриває та очищує dataChennel
 */
export function clearDataChannel() {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.close();
  }
  setDataChannel(null);
}

/**
 * Додає обробники подій для мережевого каналу.
 */
export function setupDataChannel() {
  if (!dataChannel) {
    console.log("data channel error");
    return;
  }
  dataChannel.onopen = () => console.log("Data chanel is open");
  dataChannel.onmessage = handleDataChannelMessage;
  dataChannel.onerror = (error) => console.error("Data channel error:", error);
  dataChannel.onclose = () => console.log("data chanel closed");
}

/**
 * Відправляє повідомлення через мережевий канал.
 * @param {string} text текс повідомлення
 */
export function sendDataMessage(text) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(text);
  } else {
    console.warn("Data chanel is not open");
  }
}

/**
 * Обробник повідомлень з dataChannel
 * @param {RTCDataChannelEvent} event
 * @returns
 */
function handleDataChannelMessage(event) {
  if (event.data === "__CLOSE__") {
    console.log("Received CLOSE signal from remote peer");
    closeConnection();
    return;
  }
  console.log("Received message:", event.data);
}
