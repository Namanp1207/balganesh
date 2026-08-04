import axios from "axios";

/**
 * Sends the receipt PDF to a fixed WhatsApp number (configured in Settings —
 * the "whatsapp_notify_number" in the settings table) using the Twilio WhatsApp API.
 * This is an admin/archive copy of every receipt generated, NOT sent to the
 * donor's own phone number.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env.
 * The PDF is generated on-demand at PUBLIC_BASE_URL/api/members/receipt/:receiptNo
 * (no file needs to exist on disk — Twilio fetches that URL itself and the server
 * builds the PDF fresh at request time).
 *
 * If Twilio credentials are not configured, this silently skips sending (useful
 * for local development) and the caller can still let the admin download the PDF.
 */
export async function sendReceiptOnWhatsApp({ phone, receiptNo, memberName }) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, PUBLIC_BASE_URL } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("⚠️  Twilio not configured — skipping WhatsApp send. Set TWILIO_* env vars to enable.");
    return { sent: false, reason: "Twilio not configured" };
  }

  if (!PUBLIC_BASE_URL) {
    console.warn("⚠️  PUBLIC_BASE_URL not set — skipping WhatsApp send (Twilio needs a public URL to fetch the PDF from).");
    return { sent: false, reason: "PUBLIC_BASE_URL not configured" };
  }

  const toNumber = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const mediaUrl = `${PUBLIC_BASE_URL}/api/members/receipt/${receiptNo}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const params = new URLSearchParams();
  params.append("From", TWILIO_WHATSAPP_FROM);
  params.append("To", `whatsapp:${toNumber}`);
  params.append(
    "Body",
    `New donation receipt generated — ${memberName} (${receiptNo}). PDF attached.`
  );
  params.append("MediaUrl", mediaUrl);

  try {
    const response = await axios.post(url, params, {
      auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
    });
    return { sent: true, sid: response.data.sid };
  } catch (err) {
    console.error("WhatsApp send failed:", err.response?.data || err.message);
    return { sent: false, reason: err.response?.data?.message || err.message };
  }
}
