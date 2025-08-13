const formidable = require('formidable');
const { promises: fs } = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  // Parse form data (termasuk foto)
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), '/tmp');
  form.keepExtensions = true;

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Siapkan pesan untuk Telegram
    const { nama, posisi, absensi, alasan } = fields;
    const photo = files.foto?.[0];
    const tanggal = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    let message = `📅 *ABSENSI ${tanggal.toUpperCase()}*\n\n`;
    message += `👤 *Nama*: ${nama}\n`;
    message += `👔 *Posisi*: ${posisi}\n`;
    message += `✅ *Status*: ${absensi === 'hadir' ? 'HADIR' : 'TIDAK HADIR'}\n`;
    if (absensi === 'tidak hadir' && alasan) {
      message += `📝 *Alasan*: ${alasan}\n`;
    }

    // Kirim pesan ke Telegram
    await sendTelegramMessage(message);
    
    // Jika ada foto, kirim sebagai gambar
    if (photo) {
      await sendTelegramPhoto(photo.filepath, message);
    } else {
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal memproses absensi' });
  }
};

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    }),
  });
}

async function sendTelegramPhoto(filepath, caption) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('caption', caption);
  formData.append('photo', await fs.readFile(filepath), 'foto-absensi.jpg');
  
  await fetch(url, {
    method: 'POST',
    body: formData
  });
}