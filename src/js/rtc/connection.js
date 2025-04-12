import { getMyId, socket } from "../index";
import { getRemoteStream,getLocalStream, initMedia, setRemoteStream } from "./media";


const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/** @type {RTCPeerConnection|null} */
let peerConnection = null;

export function getConnection() {
  return peerConnection;
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
 * @returns {RTCPeerConnection}
 */

export function createConnection() {
  peerConnection = new RTCPeerConnection(config);
  const localStream = getLocalStream();
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
      
    if (!getRemoteStream()) {
      setRemoteStream(new MediaStream());
      const remoteVideo = document.getElementById("remoteVideo");
      remoteVideo.srcObject = getRemoteStream();
    }
    event.streams[0]
      .getTracks()
      .forEach((track) => getRemoteStream().addTrack(track));
  };
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