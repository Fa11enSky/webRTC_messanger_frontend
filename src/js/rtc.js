/**
 * rtc.js
 * Модуль для ініціалізації та керування WebRTC-з'єднанням.
 * Містить функції для створення peer-з'єднання, ініціації дзвінків, обробки offer/answer.
 */
import { getMyId, socket } from ".";

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
/** @type {RTCPeerConnection|null} */
let peerConnection = null;
/**@type {MediaStream|null} */
let localStream = null;
/**@type {MediaStream|null} */
let remoteStream = null;

/**@type {string|null} */
let remoteID = null;

export function setRemoteId(id) {
  remoteID = id;
}

export function getRemoteId() {
  return remoteID;
}

export function getConnection() {
  return peerConnection;
}

/**
 * Створює нове WebRTC-з'єднання та додає локальні треки.
 * Налаштовує обробники ICE-кандидатів, треків і зміни стану з'єднання.
 * @returns {RTCPeerConnection}
 */

export function createConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream?.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  /**
   * Обробник події onicecandidate — надсилає ICE-кандидата на серверОбробник події onicecandidate — надсилає ICE-кандидата на сервер
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
  /**
   * Обробник події onconnectionstatechange
   */
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
  };
  /**
   * Обробник події ontrack
   */
  peerConnection.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      const remoteVideo = document.getElementById("remoteVideo");
      remoteVideo.srcObject = remoteStream;
    }
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };
  return peerConnection;
}

/**
 * Запитує дозвіл на використання камери та мікрофона.
 * Встановлює локальний медіапотік у відеоелемент та додає треки до з'єднання.
 * @returns {Promise<MediaStream|undefined>} Локальний медіапотік або undefined у разі помилки
 */

export async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const videoElement = document.getElementById("localVideo");
    if (videoElement) {
      videoElement.srcObject = localStream;
    }

    const connection = getConnection();
    if (connection && localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });
    }
    return localStream;
  } catch (error) {
    console.error("Failed to get media:", error);
  }
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
  const connection = createConnection();
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
 * Обробляє подію відправки форми дзвінка.
 * Витягує ID одержувача з елемента форми та ініціює дзвінок.
 * @param {SubmitEvent} event - Подія надсилання форми
 */
export function handleInitCall(event) {
  event.preventDefault();
  const id = event.target.elements.id.value;
  startCall(id);
}
