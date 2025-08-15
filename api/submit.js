const formidable = require('formidable');
const { promises: fs } = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const { nama, posisi, absensi, alasan, lat, lon, alamat } = req.body;
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lon}`;

    // Format pesan dengan lokasi
    let message = `📅 *ABSENSI ${new Date().toLocaleDateString('id-ID')}*\n\n`;
    message += `👤 *Nama*: ${nama}\n`;
    message += `👔 *Posisi*: ${posisi}\n`;
    message += `✅ *Status*: ${absensi === 'hadir' ? 'HADIR' : 'TIDAK HADIR'}\n`;
    if (absensi === 'tidak hadir' && alasan) {
      message += `📝 *Alasan*: ${alasan}\n`;
    }
    message += `📍 *Lokasi*: ${alamat}\n`;
    message += `🔗 *Google Maps*: ${googleMapsLink}\n`;
    message += `🌐 *Koordinat*: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;

    // Kirim ke Telegram
    await sendTelegramMessage(message);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim absensi' });
  }
};

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    }),
  });
}