import { getConnection } from "./connection";

/**@type {MediaStream|null} */
let localStream = null;
/**
 * Геттер localStream
 *
 * @returns {MediaStream|null}
 */
export function getLocalStream() {
  return localStream;
}
/**
 * Сеттер для localStream;
 * @param {MediaStream} stream
 */
export function setLocalStream(stream) {
  localStream = stream;
}

/**@type {MediaStream|null} */
let remoteStream = null;

/**
 * Геттер remoteStream
 *
 * @returns {MediaStream|null}
 */
export function getRemoteStream() {
  return remoteStream;
}

/**
 * Сеттер для remoteStream;
 * @param {MediaStream} stream
 */
export function setRemoteStream(stream) {
  remoteStream = stream;
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
 * Встановлює віддалений медіапотік у відеоелемент та додає треки.
 * @param {Event} event Подія ontrack RTCPeerConnection
 */
export function handleConnectionTrack(event) {
  if (!getRemoteStream()) {
    setRemoteStream(new MediaStream());
    const remoteVideo = document.getElementById("remoteVideo");
    remoteVideo.srcObject = getRemoteStream();
  }
  event.streams[0]
    .getTracks()
    .forEach((track) => getRemoteStream().addTrack(track));
}
