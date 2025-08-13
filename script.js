// 1. Auto-update judul sesuai tanggal hari ini (format Indonesia)
document.addEventListener('DOMContentLoaded', () => {
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const now = new Date();
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  document.getElementById('dynamic-title').textContent = `ABSENSI ${date} ${month} ${year}`;
  
  // 2. Tampilkan/menyembunyikan alasan jika "Tidak Hadir" dipilih
  document.getElementById('absensi-select').addEventListener('change', (e) => {
    const alasanField = document.getElementById('alasan');
    alasanField.style.display = e.target.value === 'tidak hadir' ? 'block' : 'none';
  });
  
  // 3. Kirim form ke serverless function
  document.getElementById('absensi-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();
    formData.append('nama', document.querySelector('[name="nama"]').value);
    formData.append('posisi', document.querySelector('[name="posisi"]').value);
    formData.append('absensi', document.querySelector('[name="absensi"]').value);
    formData.append('alasan', document.querySelector('[name="alasan"]').value);

    // Hanya kirim foto jika ada
    const foto = document.querySelector('[name="foto"]').files[0];
    if (foto) {
      formData.append('foto', foto);
    }
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Absensi berhasil dikirim ke Telegram!');
        form.reset();
      } else {
        alert('Gagal mengirim absensi. Coba lagi.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan teknis.');
    }
  });
});