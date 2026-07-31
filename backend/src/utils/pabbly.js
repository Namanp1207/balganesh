import axios from "axios";

export async function sendToPabbly(data) {
  try {
    await axios.post(process.env.PABBLY_WEBHOOK_URL, data);

    console.log("Sent to Pabbly");
  } catch (error) {
    console.log("Pabbly Error:", error.message);
  }
}
