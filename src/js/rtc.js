import { getMyId, socket } from ".";

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let peerConnection = null;
let localStream = null;
let remoteStream = null;

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
 * Створює новий обєкт RTCPeerConnection.
 * Якщо користувач дозволив використання аудіо/відео додає stream до підключення
 * Додає слухачі подій.
 * @returns {RTCPeerConnection}
 */

export function createConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream?.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  //onicecandidate-при знаходжені кандидатів відправляє їх стороні що викликається
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
  //onconnectionstatechange-відображає статус підключення
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
  };
  //ontrack-коли приходить стрім від іншої сторони додає його в тег відео
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
 * Робить запит до користувача для можливості використання відео/аудіо.
 * В разі успіху встановлює stream в властивість srcObject тегу video
 * та додає його до треків RTCPeerConnection.
 * @returns {MediaStream}
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
    console.error("Failed to get media:", err);
  }
}

/**
 * Слухач для сокету на подію "incomingOffer".
 * створює RTC підключення, встановлює remote i local description,
 * генерує обєкт answer і відправляє його стороні ініціює зв'язок
 * @param {{from:Crypto.UUID,offer:RTCPeerConnection.createOffer}} param0
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
 * Ініціює виклик.Герерує офер, встановлює localDescription в RTCPeerConnection.
 * Відправляє офер.
 * @param {Crypto.UUID} peerId
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
 * Слухач форми для здійснення ініціації з'єднання
 * @param {FormDataEvent} event
 */
export function handleInitCall(event) {
  event.preventDefault();
  const id = event.target.elements.id.value;
  startCall(id);
}
