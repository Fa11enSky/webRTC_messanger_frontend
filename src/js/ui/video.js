
export function clearVideo() {
  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;
}

//для контролю відео використовувати 
//const stream = getLocalStream();
//stream.getVideoTracks()[0].enabled = false; // або true
//stream.getAudioTracks()[0].enabled = false;