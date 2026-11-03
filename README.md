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
- `assets/Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf` — versi PDF lengkap website (Full portfolio)
- `assets/Portfolio-Summary-Rizka-Ayu-Dwi-Sugiharto.pdf` — ringkasan 3 halaman, dibuat dari `tools/portfolio-summary.html`
- `assets/og-cover.jpg`, `assets/favicon.svg`, `assets/apple-touch-icon.png` — gambar preview link & ikon tab
- `tools/build-portfolio-pdf.mjs` — membuat ulang kedua PDF portfolio (lengkap & ringkasan)
- `projects/innovation-hub/` — **live demo** Innovation Hub Dashboard (kode asli dari repo `spsl-innovation-hub`) dengan **data asli yang disamarkan**
- `projects/si-rekap-perjadin/` — **live demo** SI-REKAP PERJADIN: kode Apps Script asli (`server.js`) dijalankan di browser lewat `gas-shim.js`, dengan **data asli rekap 2026 yang disamarkan** (`seed-data.js`, dibuat oleh `tools/anonymize-perjadin-data.py`: nama, NIP, nomor SPM dan jabatan pimpinan disamarkan)
- `tools/build-perjadin-demo.py` — membangun ulang demo PERJADIN dari `Code.gs` + `Index.html` asli (`python tools/build-perjadin-demo.py <folder>`)
- `tools/anonymize-innovation-data.py` — menyamarkan data bank inovasi untuk live demo (nama, email, tim, dan deskripsi internal dihapus)
- `portfolio-v1.html` — arsip desain sebelumnya (tidak diindeks mesin pencari)

## Cara update
**Mengubah teks**: buka `index.html` di GitHub, klik ikon pensil (Edit), cari teks yang mau
diubah (Ctrl+F), ubah, lalu klik **Commit changes**. Perubahan tampil dalam 1–2 menit.

**Mengganti CV**: upload PDF baru ke folder `assets` dengan nama file yang sama
(`CV-Rizka-Ayu-Dwi-Sugiharto.pdf`), lalu commit.

**Menambah sertifikat**: upload gambar ke `assets/certs`, lalu di `index.html` salin salah satu
kartu sertifikat yang sudah ada, misalnya:

```html
<button class="ccard" data-group="cert" data-src="assets/certs/nama-file.webp" data-cap="Nama Sertifikat – Penerbit"><span class="im"><img src="assets/certs/nama-file.webp" alt="" loading="lazy"></span><span class="ct"><b>Nama Sertifikat</b><small>Penerbit · Tahun</small></span></button>
```

## Memperbarui PDF portfolio
Setiap kali isi `index.html` berubah (butuh Node.js + Playwright):

```bash
node tools/build-portfolio-pdf.mjs
```

Lalu naikkan angka `?v=` pada link `Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf` di `index.html`.
