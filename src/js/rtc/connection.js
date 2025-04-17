/**
 * connection.js
 * Модуль для ініціалізації та керування WebRTC-з'єднанням.
 * Містить функції для створення peer-з'єднання, обробки offer/answer.
 */
import { getMyId, socket } from "../index";
import { clearVideo } from "../ui/video";
import {
  clearDataChannel,
  getDataChannel,
  setDataChannel,
  setupDataChannel,
} from "./dataChannel";
import {
  getLocalStream,
  initMedia,
  handleConnectionTrack,
  clearLocalStream,
  clearRemoteStream,
} from "./media";

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/** @type {RTCPeerConnection|null} */
let peerConnection = null;

export function getConnection() {
  return peerConnection;
}

export function clearConnection() {
  peerConnection = null;
}

/**@type {string|null} */
let remoteID = null;

export function setRemoteId(id) {
  remoteID = id;
}

export function getRemoteId() {
  return remoteID;
}

/**
 * Створює нове WebRTC-з'єднання та додає локальні треки.
 * Налаштовує обробники ICE-кандидатів, треків і зміни стану з'єднання.
 *
 * @returns {RTCPeerConnection}
 */
export function createConnection(isInitiator = false) {
  peerConnection = new RTCPeerConnection(config);

  if (isInitiator) {
    setDataChannel(peerConnection.createDataChannel("chat"));
    console.log(getDataChannel());
    setupDataChannel();
  } else {
    peerConnection.ondatachannel = (event) => {
      console.log(event.channel);
      setDataChannel(event.channel);
      setupDataChannel();
    };
  }

  const localStream = getLocalStream();
  localStream?.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  /**
   * Обробник події onicecandidate — надсилає ICE-кандидата на сервер
   */
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({
          type: "ice-candidate",
          data: {
            from: getMyId(),
            to: getRemoteId(),
            candidate: event.candidate,
          },
        })
      );
    }
  };
  peerConnection.onconnectionstatechange = handleConnectionStatus;

  peerConnection.ontrack = handleConnectionTrack;

  return peerConnection;
}

/**
 * Обробляє вхідну WebRTC-пропозицію (offer).
 * Ініціалізує медіапотік, встановлює опис з'єднання,
 * створює відповідь (answer) і надсилає її назад ініціатору.
 * @param {{ from: string, offer: RTCSessionDescriptionInit }} param0
 */

export async function handleIncomingOffer({ from, offer }) {
  await initMedia();
  setRemoteId(from);
  const connection = createConnection();
  await connection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);

  socket.send(
    JSON.stringify({
      type: "answer",
      data: {
        from: getMyId(),
        to: from,
        answer,
      },
    })
  );
}

/**
 * Ініціює WebRTC-дзвінок до вказаного користувача.
 * Запитує доступ до медіа, створює з'єднання та offer.
 * @param {string} peerId - Ідентифікатор користувача, якому телефонуємо
 */
export async function startCall(peerId) {
  await initMedia();
  setRemoteId(peerId);
  const connection = createConnection(true);
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  socket.send(
    JSON.stringify({
      type: "offer",
      data: {
        from: getMyId(),
        to: peerId,
        offer,
      },
    })
  );
}

/**
 * Слухач події "onconnectionstatechange"
 * @returns {string} Статус підключення
 */
function handleConnectionStatus() {
  console.log("Connection state:", peerConnection.connectionState);
  return peerConnection.connectionState;
}

/**
 * Закриває WebRTC підключення, очищає dataChannel відключає
 * та очищує медіапотоки
 */
export function closeConnection() {
  if (peerConnection) {
    const senders = peerConnection.getSenders();
    senders.forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
  }
  clearLocalStream();
  clearRemoteStream();
  clearDataChannel();
  peerConnection.close();
  clearConnection();
  clearVideo();
  console.log("Connection closed successfully ");
}
