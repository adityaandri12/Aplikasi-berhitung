# Ayo Berhitung! 🧮

Aplikasi web sederhana untuk anak SD kelas awal (kelas 1–2) berlatih **penjumlahan** dan **pengurangan**.

## Fitur

- Pilih jenis soal: Penjumlahan, Pengurangan, atau Campur.
- Pilih tingkat: Mudah (angka sampai 10) atau Sedang (sampai 20).
- 10 soal per putaran, dijawab dengan menekan tombol angka yang besar.
- Gambar bantu (buah, bintang, dll.) untuk soal dengan angka sampai 10, supaya anak bisa menghitung.
- Umpan balik langsung: suara dan pesan pujian saat benar, ajakan mencoba lagi saat salah.
- Skor bintang dihitung dari jawaban yang benar pada percobaan pertama, dan skor terbaik disimpan di perangkat.
- Hasil pengurangan tidak pernah negatif, dan hasil penjumlahan tidak melebihi batas tingkat.

## Cara menjalankan

Tidak perlu instalasi. Cukup buka `index.html` di browser.

Atau jalankan server lokal:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Menerbitkan

Karena hanya berisi HTML, CSS, dan JavaScript, aplikasi ini bisa langsung dipasang di GitHub Pages
(Settings → Pages → Deploy from a branch → `main` / root).
