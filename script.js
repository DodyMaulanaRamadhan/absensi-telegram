// 1. Auto-update judul sesuai tanggal hari ini (format Indonesia)
document.addEventListener('DOMContentLoaded', () => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  document.getElementById('dynamic-title').textContent = `ABSENSI ${date} ${month} ${year}`;
  
  // 2. Tampilkan/menyembunyikan alasan jika "Tidak Hadir" dipilih
  const statusOptions = document.querySelectorAll('.status-option');
  const absensiInput = document.querySelector('input[name="absensi"]');
  const alasanGroup = document.getElementById('alasan-group');
  
  statusOptions.forEach(option => {
    option.addEventListener('click', () => {
      statusOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      absensiInput.value = option.dataset.value;
      
      if (option.dataset.value === 'tidak hadir') {
        alasanGroup.style.display = 'block';
        alasanGroup.querySelector('textarea').required = true;
      } else {
        alasanGroup.style.display = 'none';
        alasanGroup.querySelector('textarea').required = false;
      }
    });
  });
  
  // 3. Kirim form ke serverless function
  document.getElementById('absensi-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    const successMsg = document.getElementById('success-message');
    
    // Tampilkan loading state
    submitBtn.classList.add('loading');
    
    try {
      const nama = document.querySelector('[name="nama"]').value;
      const posisi = document.querySelector('[name="posisi"]').value;
      const absensi = document.querySelector('[name="absensi"]').value;
      const alasan = document.querySelector('[name="alasan"]').value;
      
      // Ambil lokasi
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation tidak didukung browser'));
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // Kirim ke server
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama, posisi, absensi, alasan, lat, lon
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim absensi');
      }
      
      // Tampilkan pesan sukses
      successMsg.classList.add('show');
      
      // Reset form
      setTimeout(() => {
        form.reset();
        statusOptions[0].click(); // Set default to "Hadir"
        successMsg.classList.remove('show');
        submitBtn.classList.remove('loading');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengirim absensi. Pastikan izin lokasi diaktifkan.');
      submitBtn.classList.remove('loading');
    }
  });
});