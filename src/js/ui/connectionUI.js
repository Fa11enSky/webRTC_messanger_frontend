/**
 * connectionUI.js
 * Модуль звязування всіх DOM елементів що відносяться до підключення
 * з відповідними функціями
 */

import { closeConnection, startCall } from "../rtc/connection";
import { sendDataMessage } from "../rtc/dataChannel";

const connectionForm = document.querySelector(".connection-form");
connectionForm.addEventListener("submit", handleInitCall);

document.getElementById("closeBtn").addEventListener("click", () => {
  sendDataMessage("__CLOSE__");
  closeConnection();
});

/**
 * Обробляє подію відправки форми дзвінка.
 * Витягує ID одержувача з елемента форми та ініціює дзвінок.
 * @param {SubmitEvent} event - Подія надсилання форми
 */
export function handleInitCall(event) {
  event.preventDefault();
  const id = event.target.elements.id.value;
  const connectionType = event.target.elements.connectionTypeSelect.value;
  startCall(connectionType, id);
}
