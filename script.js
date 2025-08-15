// 1. Auto-update judul sesuai tanggal hari ini (format Indonesia)
document.addEventListener('DOMContentLoaded', () => {
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const now = new Date();
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  // Fungsi untuk mendapatkan lokasi
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser'));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// Fungsi untuk mendapatkan alamat dari koordinat (gunakan OpenStreetMap Nominatim)
async function getReverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await response.json();
    return data[0].display_name;
  } catch (error) {
    console.error('Gagal mendapatkan alamat:', error);
    return 'Alamat tidak tersedia';
  }
}
  
  document.getElementById('dynamic-title').textContent = `ABSENSI ${date} ${month} ${year}`;
  
  // 2. Tampilkan/menyembunyikan alasan jika "Tidak Hadir" dipilih
  document.getElementById('absensi-select').addEventListener('change', (e) => {
    const alasanField = document.getElementById('alasan');
    alasanField.style.display = e.target.value === 'tidak hadir' ? 'block' : 'none';
  });
  
  // 3. Kirim form ke serverless function
  document.getElementById('absensi-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Ambil data form
  const nama = document.querySelector('[name="nama"]').value;
  const posisi = document.querySelector('[name="posisi"]').selectedOptions[0].text;
  const absensi = document.querySelector('[name="absensi"]').selectedOptions[0].text;
  const alasan = document.querySelector('[name="alasan"]').value;

  // Ambil lokasi
  try {
    const position = await getLocation();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const alamat = await getReverseGeocode(lat, lon);

    // Kirim ke server
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama, posisi, absensi, alasan, lat, lon, alamat
      })
    });

    if (!response.ok) {
      throw new Error('Gagal mengirim absensi');
    }

    alert('Absensi berhasil dikirim!');
    document.getElementById('absensi-form').reset();
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal mengirim absensi. Pastikan izin lokasi diaktifkan.');
  }
});
});