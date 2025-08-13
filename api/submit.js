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

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const { nama, posisi, absensi, alasan } = fields;
    const foto = files.foto?.[0];

    // Format tanggal Indonesia
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggal = new Date().toLocaleDateString('id-ID', options);

    // Buat pesan
    let message = `📅 *ABSENSI ${tanggal.toUpperCase()}*\n\n`;
    message += `👤 *Nama*: ${nama}\n`;
    message += `👔 *Posisi*: ${posisi}\n`;
    
    // Perbaiki logika status
    const status = absensi === 'hadir' ? 'HADIR' : 'TIDAK HADIR';
    message += `✅ *Status*: ${status}\n`;
    
    if (absensi === 'tidak hadir' && alasan) {
      message += `📝 *Alasan*: ${alasan}\n`;
    }

    // Kirim pesan ke Telegram
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // Kirim pesan teks dulu
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    // Jika ada foto, kirim terpisah
    if (foto) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', message);
      formData.append('photo', await fs.readFile(foto.filepath), foto.originalFilename);
      
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Gagal mengirim absensi', 
      details: error.message 
    });
  }
};