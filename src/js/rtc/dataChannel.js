/**
 * dataChannel.js
 * Модуль для ініціалізації та керування мережевим каналом.
 * Містить функції для додавання обробників подій та відправки повідомлень.
 */

/**@type {RTCDataChannel|null} */
let dataChannel = null;

export function getDataChannel() {
  return dataChannel;
}

/**
 * Сеттер для змінної dataChannel
 * @param {RTCDataChannel} channel Результат peerConnection.createDataChannel()
 */
export function setDataChannel(channel) {
  if (dataChannel) {
    console.warn("Overwriting existing dataChannel");
  }
  dataChannel = channel;
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
  dataChannel.onmessage = (event) => {
    console.log("incoming message data chanel");
    console.log("Received message:", event.data);
  };
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
