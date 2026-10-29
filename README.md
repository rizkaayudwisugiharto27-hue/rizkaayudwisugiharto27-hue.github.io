# Portfolio — Rizka Ayu Dwi Sugiharto

Strategic Planning & Finance · State-owned enterprises & government

Website portofolio statis (HTML + CSS), di-host gratis lewat GitHub Pages:
https://rizkaayudwisugiharto27-hue.github.io

## Isi repo
- `index.html` — seluruh isi halaman (struktur mengikuti website kakak, warna abu-abu dari deck Canva)
- `assets/` — foto profil dan dokumentasi kerja (format .webp)
- `assets/exp/` — foto kegiatan magang (`nama.webp`) + versi kecilnya (`nama-thumb.webp`)
- `assets/certs/` — gambar sertifikat (`nama.webp`) + versi kecilnya (`nama-thumb.webp`)
- `assets/CV-Rizka-Ayu-Dwi-Sugiharto.pdf` — CV untuk tombol **Download CV**
- `assets/Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf` — versi PDF website untuk tombol **Download Portfolio**
- `tools/build-portfolio-pdf.mjs` — membuat ulang PDF portfolio dari `index.html`
- `portfolio-v1.html` — arsip desain sebelumnya (tidak diindeks mesin pencari)

## Cara update
**Mengubah teks**: buka `index.html` di GitHub, klik ikon pensil (Edit), cari teks yang mau
diubah (Ctrl+F), ubah, lalu klik **Commit changes**. Perubahan tampil dalam 1–2 menit.

**Mengganti CV**: upload CV baru ke folder `assets` dengan nama file yang sama
(`CV-Rizka-Ayu-Dwi-Sugiharto.pdf`), lalu commit.

**Menambah sertifikat**: upload gambar ke `assets/certs`, lalu di `index.html` salin salah satu
kartu sertifikat yang sudah ada, misalnya:

```html
<button class="ccard" data-group="cert" data-src="assets/certs/nama-file.webp" data-cap="Nama Sertifikat – Penerbit"><span class="im"><img src="assets/certs/nama-file.webp" alt="" loading="lazy"></span><span class="ct"><b>Nama Sertifikat</b><small>Penerbit · Tahun</small></span></button>
```

**Timeline karier** (bagian atas): setiap batang punya `--s` (bulan mulai) dan `--e` (bulan selesai),
dihitung dari Januari 2021 = 0. Contoh: Juni 2026 = 5×12 + 5 = 65.

## Memperbarui PDF portfolio
Setiap kali isi `index.html` berubah (butuh Node.js + Playwright):

```bash
node tools/build-portfolio-pdf.mjs
```

Lalu naikkan angka `?v=` pada link `Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf` di `index.html`.
