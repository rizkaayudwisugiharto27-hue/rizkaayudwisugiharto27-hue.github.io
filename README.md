# Portofolio Rizka Ayu Dwi Sugiharto

Website portofolio pribadi, di-host dengan GitHub Pages.

Alamat: https://rizkaayudwisugiharto27-hue.github.io

Isi website mengikuti deck Canva "Portofolio _ Rizka Ayu Dwi Sugiharto".

## Struktur file
- `index.html` — seluruh teks, tampilan, dan grafik website
- `assets/` — foto profil dan dokumentasi kerja (format .webp)
- `assets/certs/` — gambar sertifikat (`nama.webp`) + versi kecilnya (`nama-thumb.webp`)

## Cara update
**Mengubah teks** (pengalaman, keahlian, kontak): buka `index.html` di GitHub,
klik ikon pensil (Edit), cari teks yang mau diubah (Ctrl+F), ubah, lalu klik **Commit changes**.

**Menambah gambar/sertifikat**: buka folder `assets` → **Add file → Upload files**,
lalu di `index.html` tambahkan tombol seperti contoh yang sudah ada, misalnya:

```html
<button class="ccard" data-group="cert" data-src="assets/certs/nama-file.webp" data-cap="Nama Sertifikat – Penerbit"><span class="im"><img src="assets/certs/nama-file.webp" alt="" loading="lazy"></span><span class="ct"><b>Nama Sertifikat</b><small>Penerbit</small></span></button>
```

Perubahan tampil di website dalam 1–2 menit.
