const formidable = require('formidable');
const { promises: fs } = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(process.cwd(), '/tmp');
    form.keepExtensions = true;

    await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { nama, posisi, absensi, alasan } = fields;
    const photo = files.foto?.[0];

    // Kirim pesan ke Telegram
    await sendTelegramMessage(nama, posisi, absensi, alasan, photo);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim absensi' });
  }
};

async function sendTelegramMessage(nama, posisi, absensi, alasan, photoPath) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  let message = `📅 *ABSENSI ${new Date().toLocaleDateString('id-ID')}*\n\n`;
  message += `👤 *Nama*: ${nama}\n`;
  message += `💼 *Posisi*: ${posisi}\n`;
  message += `✅ *Status*: ${absensi === 'hadir' ? 'HADIR' : 'TIDAK HADIR'}\n`;
  if (absensi === 'tidak hadir' && alasan) {
    message += `📝 *Alasan*: ${alasan}\n`;
  }

  // Kirim pesan teks
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    }),
  });

  // Jika ada foto, kirim sebagai gambar
  if (photoPath) {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', await fs.readFile(photoPath.filepath), photoPath.originalFilename);

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
  }
}