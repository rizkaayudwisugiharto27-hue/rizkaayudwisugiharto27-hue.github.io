"""Creates projects/innovation-hub/data/data.js: a FICTIONAL dataset for the Innovation Hub live demo.

Nothing here comes from company data: titles, teams, names, units and numbers are generated.
Run:  python tools/make-demo-data.py
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(2026)
OUT = Path(__file__).resolve().parent.parent / "projects" / "innovation-hub" / "data" / "data.js"

STATUS = ["Submitted", "Under Review", "Prioritized", "Incubation", "Implementation", "Implemented",
          "Benefit Validation", "Backlog", "Archived/Not Prioritized"]
KATEGORI = ["Digital & Teknologi", "Proses Bisnis & Efisiensi", "Operasional & K3", "Produk & Layanan Baru",
            "Customer, Marketing & Employee Experience", "Finance & Aset", "Lainnya"]
UNIT = ["OPS", "LOG", "FIN", "HCM", "DIG", "MKT", "PRJ", "K3L", "Lainnya"]
UNIT_W = [22, 20, 12, 10, 14, 8, 8, 5, 1]
HORIZON = ["Core (Improvement)", "Adjacent", "Transformational"]
AREA = ["Logistics", "Back Office", "Hinterland Dev."]
YEARS = {2022: 34, 2023: 40, 2024: 30, 2025: 36, 2026: 22}

# Status mix per year: older ideas are mostly decided, recent ones are still moving through the funnel
STATUS_W = {
    2022: [0, 0, 1, 1, 2, 9, 3, 14, 6],
    2023: [0, 0, 2, 2, 3, 8, 3, 12, 5],
    2024: [0, 1, 3, 3, 4, 6, 2, 8, 3],
    2025: [1, 3, 5, 5, 4, 3, 1, 6, 2],
    2026: [8, 6, 4, 2, 1, 0, 0, 1, 0],
}

ACTIONS = {
    "Digital & Teknologi": ["Dashboard Monitoring", "Aplikasi Mobile", "Otomasi Laporan", "Chatbot Layanan",
                            "Digitalisasi Arsip", "Sistem Booking Online", "Integrasi Data", "Notifikasi Otomatis"],
    "Proses Bisnis & Efisiensi": ["Standarisasi Proses", "Penyederhanaan Alur", "Lean Review", "E-Approval",
                                  "Template Terpadu", "Pengukuran Waktu Siklus"],
    "Operasional & K3": ["Patroli Keselamatan", "Checklist Digital", "Sensor Pemantauan", "Inspeksi Berbasis Risiko",
                         "Simulasi Tanggap Darurat", "Penandaan Zona Aman"],
    "Produk & Layanan Baru": ["Layanan Paket", "Layanan Konsolidasi", "Skema Langganan", "Layanan Nilai Tambah",
                              "Layanan Jemput Antar"],
    "Customer, Marketing & Employee Experience": ["Portal Pelanggan", "Survei Kepuasan Digital", "Program Onboarding",
                                                  "Pusat Bantuan", "Program Apresiasi"],
    "Finance & Aset": ["Rekonsiliasi Otomatis", "Monitoring Anggaran", "Optimalisasi Aset", "Penagihan Digital",
                       "Analisis Biaya"],
    "Lainnya": ["Gerakan Hemat Energi", "Program Paperless", "Bank Ide Mingguan"],
}
OBJECTS = ["Gudang", "Armada Truk", "Peti Kemas", "Bongkar Muat", "Pengadaan", "Kepegawaian", "Tagihan Pelanggan",
           "Perawatan Alat", "Kunjungan Kapal", "Lapangan Penumpukan", "Dokumen Ekspor", "Kendaraan Operasional",
           "Stok Suku Cadang", "Perjalanan Dinas", "Pelatihan Pegawai", "Gate Terminal", "Jadwal Shift",
           "Pengiriman Domestik", "Klaim Asuransi", "Sewa Alat"]
TEAM = ["Arunika", "Bahtera", "Cakra", "Dermaga", "Elang", "Fajar", "Gelombang", "Harmoni", "Inti", "Jangkar",
        "Kompas", "Lentera", "Mercusuar", "Nusantara", "Ombak", "Pelita", "Rantai", "Samudra", "Tirta", "Wira"]
FIRST = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hana", "Indra", "Joko", "Kurnia", "Lestari",
         "Maya", "Nanda", "Oki", "Putri", "Raka", "Sari", "Tegar", "Wulan"]
LAST = ["Pratama", "Saputra", "Wijaya", "Lestari", "Hidayat", "Kusuma", "Santoso", "Permata", "Nugroho", "Rahma"]
PROBLEMS = ["Proses masih manual dan memakan waktu", "Data tersebar di banyak file", "Sering terjadi keterlambatan laporan",
            "Belum ada pemantauan real-time", "Biaya operasional tinggi", "Risiko kesalahan input data"]
GAINS = ["waktu proses", "biaya operasional", "kesalahan input", "waktu tunggu", "penggunaan kertas", "jam kerja lembur"]


def rand_dt(year, end=datetime(2026, 10, 28)):
    start = datetime(year, 1, 5)
    stop = min(datetime(year, 12, 20), end)
    return start + timedelta(seconds=random.randint(0, int((stop - start).total_seconds())))


used = set()
innovations, history = [], []
for year, n in YEARS.items():
    for i in range(1, n + 1):
        kat = random.choices(KATEGORI, [22, 19, 14, 12, 10, 8, 3])[0]
        while True:
            judul = f"{random.choice(ACTIONS[kat])} {random.choice(OBJECTS)}"
            if judul not in used:
                used.add(judul)
                break
        status = random.choices(STATUS, STATUS_W[year])[0]
        unit = random.choices(UNIT, UNIT_W)[0]
        submitted = rand_dt(year)
        applied = status in ("Implementation", "Implemented", "Benefit Validation")
        gain = random.choice(GAINS)
        pct = random.randint(10, 45)
        recent = year >= 2025
        d = {
            "ts": submitted.isoformat(timespec="seconds") if recent else "",
            "id": f"INOV-{year}-{i:03d}",
            "tahun": year,
            "ketua": f"{random.choice(FIRST)} {random.choice(LAST)}" if recent else "",
            "unit": unit,
            "divisi": "",
            "tim": f"Tim {random.choice(TEAM)}",
            "anggota": "",
            "judul": judul,
            "kategori": kat,
            "masalah": random.choice(PROBLEMS) + "." if recent else "",
            "solusi": f"Menerapkan {judul.lower()} agar {gain} berkurang." if recent else "",
            "status": status,
            "bpo": f"Unit {unit}" if applied else "",
            "manfaat": f"[{'Realisasi' if status in ('Implemented', 'Benefit Validation') else 'Potensi'}] Mengurangi {gain} sekitar {pct}%.",
            "rank": random.randint(1, 15) if status in ("Prioritized", "Incubation", "Implementation") else None,
            "evidence": applied,
            "link_evidence": "",
            "baseline": f"{gain.capitalize()} 100%" if applied else "",
            "target": f"Turun {pct}%" if applied else "",
            "realisasi": f"Turun {max(5, pct - random.randint(0, 8))}%" if status in ("Implemented", "Benefit Validation") else "",
            "hasil_benefit": "Tercapai" if status == "Implemented" else ("Sedang diukur" if status == "Benefit Validation" else ""),
            "catatan": "",
            "last_update": (submitted + timedelta(days=random.randint(5, 120))).isoformat(timespec="seconds"),
            "sumber": "Pengajuan lewat portal" if year == 2026 else "Bank data historis (demo)",
            "featured": False,
            "horizon": random.choices(HORIZON, [70, 20, 10])[0],
            "area": random.choices(AREA, [45, 38, 17])[0],
        }
        innovations.append(d)

# Feature up to 12 finished innovations in the gallery
done = [d for d in innovations if d["status"] in ("Implemented", "Benefit Validation")]
for d in random.sample(done, min(12, len(done))):
    d["featured"] = True

# Recent status changes for the "Riwayat" panel
order = STATUS[:7]
for d in random.sample([x for x in innovations if x["tahun"] >= 2025 and x["status"] != "Submitted"], 14):
    target = d["status"]
    prev = order[order.index(target) - 1] if target in order and order.index(target) > 0 else "Under Review"
    ts = datetime(2026, 8, 1) + timedelta(seconds=random.randint(0, 88 * 86400))
    history.append({"ts": ts.isoformat(timespec="seconds"), "id": d["id"], "dari": prev, "ke": target,
                    "catatan": f"Status diperbarui ke {target}.", "bpo": d["bpo"]})
for d in [x for x in innovations if x["status"] == "Submitted"][:6]:
    history.append({"ts": d["ts"], "id": d["id"], "dari": "", "ke": "Submitted",
                    "catatan": "Pengajuan inovasi baru melalui portal.", "bpo": ""})
history.sort(key=lambda h: h["ts"])

data = {
    "meta": {"source": "Dataset demo (fiktif)", "generated": "2026-10-31T09:00:00", "count": len(innovations)},
    "settings": {"Nama Portal": "Innovation Hub", "Tahun Aktif": 2026, "Prefix ID": "INOV", "Email Admin": "",
                 "Batas Galeri": 12, "Catatan": "Data fiktif untuk demo portofolio"},
    "master": {"status": STATUS, "kategori": KATEGORI, "unit": UNIT},
    "innovations": innovations,
    "history": history,
}
OUT.write_text("/* FICTIONAL demo data generated by tools/make-demo-data.py, not company data. */\n"
               "window.SPSL_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(f"{OUT}: {len(innovations)} innovations, {len(history)} history rows")
