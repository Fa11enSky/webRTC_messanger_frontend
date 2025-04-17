import { closeConnection, startCall } from "../rtc/connection";

/**
 * Обробляє подію відправки форми дзвінка.
 * Витягує ID одержувача з елемента форми та ініціює дзвінок.
 * @param {SubmitEvent} event - Подія надсилання форми
 */
export function handleInitCall(event) {
  event.preventDefault();
  const id = event.target.elements.id.value;
  startCall(id);
}

export function clearVideo() {
  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;
}