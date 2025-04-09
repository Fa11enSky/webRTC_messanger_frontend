import {
  createPeerListMarkup,
  createAppendPeerMarkup,
} from "./markupFunctions/peerList";
import { getConnection, handleIncomingOffer, handleInitCall } from "./rtc";

export const socket = new WebSocket("ws://localhost:3002");

const connectionForm = document.querySelector(".connection-form");
const peersContainer = document.getElementById("peers-container");
const messageForm = document.querySelector(".message-form");
const messagesList = document.querySelector(".messages-list");

socket.onerror = (error) => console.log(error);
socket.onopen = onConnectionEstablished;
socket.onmessage = onMessageHandler;
let selfId = null;
let peers = [];
messageForm.addEventListener("submit", sendMessageBroadcast);
connectionForm.addEventListener("submit", handleInitCall);

function sendMessageBroadcast(event) {
  event.preventDefault();
  const { value } = event.target.elements.message;
  if (value.trim().length === 0) return;
  const message = createMessageObject(value, selfId);
  socket.send(JSON.stringify(message));
  messagesList.insertAdjacentHTML(
    "beforeend",
    `<li><div>From: you</div><div>Message: ${message.data.message}</div></li>`
  );
}

function onConnectionEstablished() {
  console.log("Connected to WebSocket server");
}

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
        const { from, offer } = data;
        handleIncomingOffer({ from, offer });
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

function createMessageObject(text, sender) {
  return { data: { message: text, from: sender }, type: "broadcastMessage" };
}

export function getMyId() {
  return selfId;
}
