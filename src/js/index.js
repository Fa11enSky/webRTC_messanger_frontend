import {
  createPeerListMarkup,
  createAppendPeerMarkup,
} from "./markupFunctions/peerList";
import { getConnection, handleIncomingOffer } from "./rtc/connection";

// Ініціалізація WebSocket-з'єднання
export const socket = new WebSocket("ws://localhost:3002");

// DOM-елементи
const peersContainer = document.getElementById("peers-container");
const messageForm = document.querySelector(".message-form");
const messagesList = document.querySelector(".messages-list");

// Стан користувача
let selfId = null;
let peers = [];

/**Додавання слухачів */
socket.onerror = (error) => console.log(error);
socket.onopen = onConnectionEstablished;
socket.onmessage = onMessageHandler;
messageForm.addEventListener("submit", sendMessageBroadcast);

/**
 * Відправляє повідомлення в загальний чат та додає його до DOM.
 * 
 * @param {SubmitEvent} event - Подія submit з форми повідомлення
 */

function sendMessageBroadcast(event) {
  event.preventDefault();
  const { value } = event.target.elements.message;
  if (value.trim().length === 0) return;
  const message = createBroadcastMessageObject(value, selfId);
  socket.send(JSON.stringify(message));
  messagesList.insertAdjacentHTML(
    "beforeend",
    `<li><div>From: you</div><div>Message: ${message.data.message}</div></li>`
  );
}

/**
 * Викликається при успішному з'єднанні з WebSocket-сервером.
 */
function onConnectionEstablished() {
  console.log("Connected to WebSocket server");
}

/**
 * Обробка надходження повідомлень від WebSocket-сервера.
 * Розпізнає тип повідомлення і виконує відповідну дію.
 *
 * @param {MessageEvent<string>} message - Повідомлення від WebSocket-сервера у форматі JSON
 */
async function onMessageHandler(message) {
  try {
    const { type, data } = JSON.parse(message.data);
    switch (type) {
      case "identifierAssigned": {
        selfId = data;

        break;
      }

      case "peers": {
        if (data.length !== 0) {
          peers = data;
          peersContainer.innerHTML = createPeerListMarkup(peers, selfId);
        }
        break;
      }
      case "peersAppend": {
        peers.push(data);
        peersContainer.insertAdjacentHTML(
          "beforeend",
          createAppendPeerMarkup(data)
        );
        break;
      }
      case "peerDisconnected": {
        peers = peers.filter((peer) => peer !== data);
        peersContainer.innerHTML = createPeerListMarkup(peers, selfId);
        break;
      }
      case "broadcastMessage": {
        messagesList.insertAdjacentHTML(
          "beforeend",
          `<li><div>From:${data.from}</div><p>Message:${data.message}</p></li>`
        );
        break;
      }
      case "incomingOffer": {
        const { from, offer,connectionType } = data;
        handleIncomingOffer({ from, offer,connectionType });
        break;
      }
      case "incomingAnswer": {
        const answer = data;
        const connection = getConnection();
        if (!connection) return;
        await connection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        break;
      }
      case "incomingIceCandidate": {
        const { from, candidate } = data;
        const connection = getConnection();

        if (connection) {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {}
}

/**
 * Створює об'єкт повідомлення для відправки в загальний чат.
 *
 * @param {string} text - Текст повідомлення
 * @param {string} sender - ID відправника
 * @returns {{data: {message: string, from:string}, type: 'broadcastMessage'}}
 */

function createBroadcastMessageObject(text, sender) {
  return { data: { message: text, from: sender }, type: "broadcastMessage" };
}

/**
 * Повертає ідентифікатор поточного користувача.
 *
 * @returns {string | null}
 */

export function getMyId() {
  return selfId;
}
