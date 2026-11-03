"""Builds the SI-REKAP PERJADIN live demo in projects/si-rekap-perjadin/.

The original Apps Script project (Code.gs + Index.html) runs unchanged in the browser:
gas-shim.js stands in for SpreadsheetApp / google.script.run, and seed-data.js holds a
SIMULATED dataset with the same sheet structure. No ministry data is used.

Run:  python tools/build-perjadin-demo.py <folder with Code.gs and Index.html>
"""
import json
import random
import re
import sys
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "projects" / "si-rekap-perjadin"
random.seed(2026)

# ---------------------------------------------------------------- server.js
def build_server(code_gs: str) -> str:
    names = re.findall(r"^function\s+([A-Za-z_$][\w$]*)\s*\(", code_gs, flags=re.M)
    exports = ", ".join(f"{n}: {n}" for n in names)
    return ("/* Original Code.gs (Apps Script), wrapped so it runs in the browser on gas-shim.js. */\n"
            "(function () {\n" + code_gs + "\n;window.__GAS_SERVER__ = {" + exports + "};\n})();\n")


# ---------------------------------------------------------------- index.html
DEMO_HEAD = """<title>SI-REKAP PERJADIN — Live Demo · Rizka Ayu Dwi Sugiharto</title>
  <meta name="robots" content="noindex">
  <style>
    .demo-pill{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;gap:8px;align-items:center;flex-wrap:wrap;
      max-width:calc(100vw - 32px);background:#071D35;color:#e8eef7;border:1px solid rgba(255,255,255,.25);border-radius:14px;
      padding:8px 10px;font:12px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)}
    .demo-pill b{color:#fff}
    .demo-pill a,.demo-pill button{width:auto;height:auto;margin:0;display:inline-block;line-height:1.4;box-shadow:none;color:#fff;background:transparent;border:1px solid rgba(255,255,255,.4);border-radius:999px;
      padding:3px 10px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
    .demo-pill a:hover,.demo-pill button:hover{background:#fff;color:#071D35}
    .embedded .demo-pill .back{display:none}
    .demo-pill .short{display:none}
    @media (max-width:640px){.demo-pill{right:10px;bottom:10px;padding:6px 8px;font-size:11px}.demo-pill .long{display:none}.demo-pill .short{display:inline}}
  </style>
  <script>if (window.self !== window.top) document.documentElement.classList.add('embedded');</script>
  <script src="seed-data.js"></script>
  <script src="gas-shim.js"></script>
  <script src="server.js"></script>"""

DEMO_PILL = """<div class="demo-pill" role="note"><span class="long"><b>Live demo</b> · data simulasi, tersimpan di browser Anda</span><span class="short"><b>Demo</b> · data simulasi</span>
    <button type="button" onclick="if(confirm('Kembalikan data demo ke awal?'))SIREKAP_RESET()">Reset data</button>
    <a class="back" href="../../index.html#more-work">← Portfolio</a></div>"""

REPLACE = [
    ('  <base target="_top">\n', ''),
    ('<div class="brand-logo">KIP</div>', '<div class="brand-logo">SR</div>'),
    ('<div class="brand-title">KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI</div>', '<div class="brand-title">SI-REKAP PERJADIN</div>'),
    ('<span class="brand-subtitle">Monitoring Administrasi Perjadin Biro</span>',
     '<span class="brand-subtitle">Monitoring Administrasi Perjadin Biro · Demo</span>'),
    ("subtitle: 'Form input perjalanan dinas langsung ke database Google Sheet'",
     "subtitle: 'Form input perjalanan dinas (demo: tersimpan di browser Anda)'"),
    # Fix from the original: the row ID was put in onclick="..." with raw double quotes, breaking Edit/Hapus
    ('var idJs = JSON.stringify(r.id);', 'var idJs = escapeHtml(JSON.stringify(r.id));'),
    # Fix from the original: table rows carry no NIP, so editing showed "undefined" in the NIP field
    ("document.getElementById('inpNip').value = row.nip !== '-' ? row.nip : '';",
     "document.getElementById('inpNip').value = (row.nip && row.nip !== '-') ? row.nip : (((masterData && masterData.pegawai) || []).find(function(p) { return p.nama === row.nama; }) || {}).nip || '';"),
    ('Data dibaca langsung dari Google Spreadsheet aktif tanpa mengubah struktur sheet.',
     'Versi asli membaca Google Spreadsheet secara langsung; demo ini memakai data simulasi di browser.'),
]


def build_index(index_html: str) -> str:
    s = index_html
    for a, b in REPLACE:
        if s.count(a) != 1:
            raise SystemExit(f"Expected exactly one match for: {a[:60]!r}")
        s = s.replace(a, b)
    s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1">',
                  '<meta name="viewport" content="width=device-width, initial-scale=1">\n  ' + DEMO_HEAD, 1)
    s = s.replace("<body>", "<body>\n  " + DEMO_PILL, 1)
    return s


# ---------------------------------------------------------------- seed-data.js (simulated)
DB_HEADERS = [
    'ID_REGISTER', 'TAHUN', 'BULAN', 'SATKER', 'JENIS_PERJADIN', 'NO', 'KEGIATAN', 'NO_SPM',
    'NAMA_PEGAWAI_RAW', 'JUMLAH_PEGAWAI', 'GOL_RAW', 'JABATAN_RAW', 'DURASI_HARI',
    'TANGGAL_MULAI', 'TANGGAL_SELESAI', 'TUJUAN_LOKASI', 'MODA',
    'UANG_HARIAN', 'UANG_PENGINAPAN', 'UANG_TRANSPORT', 'TAKSI_JAKARTA', 'TAKSI_DAERAH', 'TAKSI',
    'UANG_REPRESENTASI', 'HARGA_TIKET_BERANGKAT', 'HARGA_TIKET_KEMBALI', 'TIKET',
    'BIAYA_PENGEPAKAN', 'ANGKUTAN_BARANG', 'TOTAL_BIAYA', 'NAMA_PENGINAPAN', 'KETERANGAN',
    'STATUS_DATA', 'CATATAN_VALIDASI', 'SOURCE_SHEET', 'SOURCE_ROW', 'UPDATED_AT'
]
SATKER = ["PUSDATIN", "HUKERMA", "PUSTRAKA", "BMN", "SDMA", "RENKEU", "UMUM"]
SATKER_W = [14, 12, 9, 13, 15, 22, 15]
JENIS = ["Luar Kota", "Dalam Kota", "Paket Meeting", "Luar Negeri"]
JENIS_W = [52, 28, 17, 3]
FIRST = ["Andi", "Bayu", "Citra", "Dimas", "Eka", "Fitri", "Galih", "Hesti", "Irfan", "Jihan", "Kevin", "Laras",
         "Mega", "Nadia", "Oki", "Prasetyo", "Rani", "Satria", "Tiara", "Wahyu", "Yuni", "Zahra"]
LAST = ["Pratama", "Saputri", "Wibowo", "Lestari", "Hidayat", "Kurniawan", "Santoso", "Permatasari", "Nugroho",
        "Rahmawati", "Siregar", "Utami", "Setiawan", "Maharani"]
JABATAN = ["Analis Perencanaan", "Analis Keuangan", "Pranata Komputer", "Pengelola Barang Milik Negara",
           "Analis SDM Aparatur", "Perancang Peraturan", "Pustakawan", "Bendahara Pengeluaran", "Kepala Subbagian",
           "Pengadministrasi Umum"]
GOL = ["II/c", "II/d", "III/a", "III/b", "III/c", "III/d", "IV/a", "IV/b"]
KOTA_LUAR = ["Bandung", "Yogyakarta", "Surabaya", "Semarang", "Medan", "Makassar", "Denpasar", "Balikpapan",
             "Pekanbaru", "Batam", "Manado", "Kupang", "Pontianak", "Mataram", "Palembang", "Jayapura"]
KOTA_DALAM = ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Tangerang", "Bekasi", "Depok", "Bogor"]
KOTA_LN = ["Singapura", "Kuala Lumpur", "Bangkok", "Tokyo"]
KEGIATAN = [
    "Koordinasi penyusunan RKA-K/L", "Monitoring dan evaluasi pelaksanaan anggaran", "Rekonsiliasi data keuangan",
    "Rapat konsinyering penyusunan laporan kinerja", "Pendampingan pemeriksaan BPK", "Inventarisasi Barang Milik Negara",
    "Sosialisasi kebijakan kepegawaian", "Koordinasi pengelolaan arsip dinamis", "Bimbingan teknis aplikasi SAKTI",
    "Penyusunan rancangan peraturan menteri", "Uji petik penatausahaan BMN", "Koordinasi kerja sama antarlembaga",
    "Evaluasi pemanfaatan sistem informasi", "Rapat kerja teknis perencanaan", "Verifikasi dokumen pertanggungjawaban",
]
HOTEL = ["Hotel Nusantara", "Hotel Merdeka", "Grand Cendana", "Hotel Sriwijaya", "Hotel Bahari", "Hotel Mutiara"]
MODA = {"Luar Kota": ["Udara", "Udara", "Udara", "Kereta", "Darat"], "Dalam Kota": ["Kendaraan Dinas", "Darat", "Taksi"],
        "Paket Meeting": ["Kendaraan Dinas", "Darat"], "Luar Negeri": ["Udara"]}


def employees(n=48):
    used, out = set(), []
    while len(out) < n:
        nama = f"{random.choice(FIRST)} {random.choice(LAST)}"
        if nama in used:
            continue
        used.add(nama)
        born = date(random.randint(1972, 1998), random.randint(1, 12), random.randint(1, 28))
        nip = f"{born:%Y%m%d}{random.randint(2005, 2022)}{random.randint(1, 12):02d}{random.randint(1, 2)}{random.randint(1, 999):03d}"
        out.append([nama, nip, random.choice(GOL), random.choice(JABATAN), random.choice(SATKER)])
    return out


def rp(x):
    return int(round(x / 1000.0) * 1000)


def trips(pegawai, n=260):
    rows, per_day = [], {}
    for i in range(n):
        start = date(2026, 1, 6) + timedelta(days=random.randint(0, 296))  # Jan to late Oct 2026
        jenis = random.choices(JENIS, JENIS_W)[0]
        p = random.choice(pegawai)
        satker = p[4] if random.random() < 0.8 else random.choices(SATKER, SATKER_W)[0]
        days = {"Luar Kota": random.randint(2, 4), "Dalam Kota": 1, "Paket Meeting": random.randint(2, 3),
                "Luar Negeri": random.randint(3, 5)}[jenis]
        end = start + timedelta(days=days - 1)
        moda = random.choice(MODA[jenis])
        kota = (random.choice(KOTA_LUAR) if jenis == "Luar Kota" else random.choice(KOTA_DALAM) if jenis != "Luar Negeri"
                else random.choice(KOTA_LN))
        c = dict.fromkeys(["UANG_HARIAN", "UANG_PENGINAPAN", "UANG_TRANSPORT", "TAKSI_JAKARTA", "TAKSI_DAERAH", "TAKSI",
                           "UANG_REPRESENTASI", "HARGA_TIKET_BERANGKAT", "HARGA_TIKET_KEMBALI", "TIKET",
                           "BIAYA_PENGEPAKAN", "ANGKUTAN_BARANG"], 0)
        hotel = ""
        if jenis == "Luar Kota":
            c["UANG_HARIAN"] = rp(random.uniform(380, 580) * 1000) * days
            c["UANG_PENGINAPAN"] = rp(random.uniform(600, 1100) * 1000) * (days - 1)
            c["TAKSI_JAKARTA"] = rp(random.uniform(150, 250) * 1000)
            c["TAKSI_DAERAH"] = rp(random.uniform(100, 220) * 1000)
            if moda == "Udara":
                c["HARGA_TIKET_BERANGKAT"] = rp(random.uniform(900, 3200) * 1000)
                c["HARGA_TIKET_KEMBALI"] = rp(random.uniform(900, 3200) * 1000)
            else:
                c["UANG_TRANSPORT"] = rp(random.uniform(300, 900) * 1000)
            hotel = random.choice(HOTEL) + " " + kota
        elif jenis == "Dalam Kota":
            c["UANG_HARIAN"] = 150000
            c["UANG_TRANSPORT"] = rp(random.uniform(100, 250) * 1000)
        elif jenis == "Paket Meeting":
            c["UANG_HARIAN"] = 130000 * days
            c["UANG_TRANSPORT"] = rp(random.uniform(150, 300) * 1000)
            hotel = random.choice(HOTEL) + " Jakarta"
        else:
            c["UANG_HARIAN"] = rp(random.uniform(3000, 4500) * 1000) * days
            c["UANG_PENGINAPAN"] = rp(random.uniform(2000, 3500) * 1000) * (days - 1)
            c["HARGA_TIKET_BERANGKAT"] = rp(random.uniform(4000, 9000) * 1000)
            c["HARGA_TIKET_KEMBALI"] = rp(random.uniform(4000, 9000) * 1000)
            c["UANG_REPRESENTASI"] = rp(random.uniform(500, 1500) * 1000)
            hotel = random.choice(HOTEL) + " " + kota
        # Older trips are mostly reconciled; recent ones are still being verified
        age = (date(2026, 10, 28) - start).days
        w = [80, 14, 6] if age > 120 else [55, 28, 17] if age > 45 else [25, 40, 35]
        status = random.choices(["Lengkap", "Proses Verifikasi", "Belum Lengkap"], w)[0]
        catatan = {"Lengkap": "", "Proses Verifikasi": random.choice(["Menunggu verifikasi bendahara", "Kuitansi sedang dicek"]),
                   "Belum Lengkap": random.choice(["Boarding pass belum diunggah", "SPD belum ditandatangani",
                                                   "Kuitansi penginapan belum ada"])}[status]
        key = start.strftime("%Y%m%d")
        per_day[key] = per_day.get(key, 0) + 1
        row = {
            "ID_REGISTER": f"PERJ-{key}-{per_day[key]:04d}", "TAHUN": "2026", "BULAN": start.strftime("%Y-%m"),
            "SATKER": satker, "JENIS_PERJADIN": jenis, "NO": 0,
            "KEGIATAN": random.choice(KEGIATAN), "NO_SPM": f"{random.randint(100, 2999):05d}/SPM/{start.month:02d}/2026",
            "NAMA_PEGAWAI_RAW": p[0], "JUMLAH_PEGAWAI": 1, "GOL_RAW": p[2], "JABATAN_RAW": p[3], "DURASI_HARI": days,
            "TANGGAL_MULAI": start.isoformat(), "TANGGAL_SELESAI": end.isoformat(), "TUJUAN_LOKASI": kota, "MODA": moda,
            **c, "TOTAL_BIAYA": sum(c.values()), "NAMA_PENGINAPAN": hotel, "KETERANGAN": catatan,
            "STATUS_DATA": status, "CATATAN_VALIDASI": "", "SOURCE_SHEET": "DEMO", "SOURCE_ROW": "",
            "UPDATED_AT": f"{(end + timedelta(days=random.randint(2, 20))).isoformat()} {random.randint(8, 16):02d}:{random.randint(0, 59):02d}:00",
        }
        rows.append(row)
    rows.sort(key=lambda r: r["TANGGAL_MULAI"])
    for i, r in enumerate(rows, 1):
        r["NO"] = i
        r["SOURCE_ROW"] = i + 1
    return [[r[h] for h in DB_HEADERS] for r in rows]


def build_seed():
    pegawai = employees()
    book = {
        "DB_REKAP_PERJADIN": [DB_HEADERS] + trips(pegawai),
        "MASTER_PEGAWAI": [["NAMA_PEGAWAI", "NIP", "GOLONGAN", "JABATAN", "SATKER"]] + sorted(pegawai),
        "MASTER_JABATAN": [["JABATAN"]] + [[j] for j in sorted(JABATAN)],
        "MASTER_TUJUAN_KOTA": [["TUJUAN_KOTA"]] + [[k] for k in sorted(KOTA_LUAR + KOTA_DALAM + KOTA_LN)],
        "MASTER_SATKER": [["SATKER"]] + [[s] for s in SATKER],
    }
    return ("/* SIMULATED data for the SI-REKAP PERJADIN demo (tools/build-perjadin-demo.py). "
            "Names, NIPs, trips and amounts are generated, not ministry data. */\n"
            "window.SIREKAP_SEED = " + json.dumps(book, ensure_ascii=False) + ";\n")


def main(src):
    src = Path(src)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "server.js").write_text(build_server((src / "Code.gs").read_text(encoding="utf-8")), encoding="utf-8")
    (OUT / "index.html").write_text(build_index((src / "Index.html").read_text(encoding="utf-8")), encoding="utf-8")
    (OUT / "seed-data.js").write_text(build_seed(), encoding="utf-8")
    print("Built", OUT)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
