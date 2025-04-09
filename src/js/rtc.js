import { getMyId, socket } from ".";

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let remoteID = null;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, 
  ],
};

export function createConnection() {
  peerConnection = new RTCPeerConnection(config);
 
  localStream?.getTracks().forEach((track) => {
   peerConnection.addTrack(track, localStream);
 });

  peerConnection.onicecandidate =  (event) => {
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

  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
  };
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

export function setRemoteId(id) {
  remoteID = id;
}

export function getRemoteId() {
  return remoteID;
}

export function getConnection() {
  return peerConnection;
}

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

export function handleInitCall(e) {
  e.preventDefault();
  const id = e.target.elements.id.value;
  startCall(id);
}
