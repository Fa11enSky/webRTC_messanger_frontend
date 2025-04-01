const socket = new WebSocket("ws://localhost:3002");

const peersContainer = document.getElementById("peers-container");
const messageForm = document.querySelector(".message-form");
const messagesList = document.querySelector(".messages-list");

socket.onerror = (error) => console.log(error);
socket.onopen = onConnectionEstablished;
socket.onmessage = onMessageHandler;
let selfId = null;
let peers = [];
messageForm.addEventListener("submit", sendMessageBroadcast);

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

function onMessageHandler(message) {
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
          peersContainer.innerHTML = createMarkup(peers, selfId);
        }
        console.log("Active peers:", peers);
        break;
      }
      case "peersAppend": {
        peers.push(data);
        peersContainer.insertAdjacentHTML(
          "beforeend",
          createAppendMarkup(data)
        );
        break;
      }
      case "peerDisconnected": {
        peers = peers.filter((peer) => peer !== data);
        peersContainer.innerHTML = createMarkup(peers, selfId);
        break;
      }
      case "broadcastMessage": {
        console.log(data);
        messagesList.insertAdjacentHTML(
          "beforeend",
          `<li><div>From:${data.from}</div><p>Message:${data.message}</p></li>`
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {}
}

function createMarkup(data, selfId) {
  const markup = data
    .map((peer) => {
      if (selfId && selfId === peer)
        return `<li class=\"owner-id\">${selfId}</li>`;
      return `<li>${peer}</li>`;
    })
    .join(" ");
  return markup;
}
function createAppendMarkup(update) {
  return `<li>${update}</li>`;
}
function createMessageObject(text, sender) {
  return { data: { message: text, from: sender }, type: "broadcastMessage" };
}
