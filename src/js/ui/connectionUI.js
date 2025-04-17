import { closeConnection } from "../rtc/connection";
import { sendDataMessage } from "../rtc/dataChannel";

document.getElementById("closeBtn").addEventListener("click", () => {
  sendDataMessage("__CLOSE__");
    closeConnection();
});
