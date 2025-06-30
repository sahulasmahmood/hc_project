const axios = require("axios");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Send WhatsApp message using Meta Cloud API
 * @param {string} toPhone - E.164 format, e.g. +919876543210
 * @param {string} message - Message text
 */
async function sendWhatsAppMessage(toPhone, message) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("WhatsApp API credentials missing");
    return false;
  }
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  try {
    const res = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: toPhone,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`WhatsApp message sent successfully to ${toPhone}:`, res.data);
    return true;
  } catch (err) {
    if (err.response) {
      console.error(`WhatsApp send error to ${toPhone}:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`WhatsApp send error to ${toPhone}:`, err.message);
    }
    return false;
  }
}

function formatAppointmentMessage({ patientName, date, time, type, doctorName, department, hospitalName, hospitalPhone }) {
  return (
    `Hello ${patientName},\n\n` +
    `Your appointment is confirmed at ${hospitalName}.\n\n` +
    `Date: ${date}\nTime: ${time}\nType: ${type}` +
    (doctorName ? `\nDoctor: ${doctorName}` : "") +
    (department ? `\nDepartment: ${department}` : "") +
    `\n\nFor queries, contact: ${hospitalPhone}\n\nThank you!`
  );
}

module.exports = { sendWhatsAppMessage, formatAppointmentMessage };