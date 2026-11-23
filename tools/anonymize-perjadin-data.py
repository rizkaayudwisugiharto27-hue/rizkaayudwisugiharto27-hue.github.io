"""Builds projects/si-rekap-perjadin/seed-data.js from the REAL 2026 travel recap sheet, ANONYMIZED for public use.

Input: a JSON export of the Google Sheet "26MEI011-FIX", shaped as
    {"DB_REKAP_PERJADIN": [[header...], [row...], ...], "MASTER_PEGAWAI": [...], "MASTER_JABATAN": [...], ...}
(the raw `values` arrays returned by the Sheets API for each tab).

Run:  python tools/anonymize-perjadin-data.py sheet-export.json

Kept (the real recap):  register ID, year/month, bureau, trip type, activity, number of staff, grade, duration,
                        dates, destination, transport, every cost component and total, hotel, file status.
Skipped:                form test submissions (WEB_INPUT rows with a total cost of Rp 0).
Removed / masked:       staff names (-> "Pegawai 001" codes), NIPs (they encode date of birth), SPM numbers,
                        and leadership titles ("Kepala ..." -> "Pejabat Struktural") that would identify one person.
Cleaned:                Rupiah text such as "3.440.000" -> 3440000, Sheets date serials such as 46114 -> 2026-02-04,
                        so the original Code.gs reads the numbers and dates correctly.
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "projects" / "si-rekap-perjadin" / "seed-data.js"
MONEY = ['UANG_HARIAN', 'UANG_PENGINAPAN', 'UANG_TRANSPORT', 'TAKSI_JAKARTA', 'TAKSI_DAERAH', 'TAKSI',
         'UANG_REPRESENTASI', 'HARGA_TIKET_BERANGKAT', 'HARGA_TIKET_KEMBALI', 'TIKET', 'BIAYA_PENGEPAKAN',
         'ANGKUTAN_BARANG', 'TOTAL_BIAYA']
INTS = ['NO', 'JUMLAH_PEGAWAI', 'DURASI_HARI', 'SOURCE_ROW']
MASTER_COPY = ['MASTER_BIRO', 'MASTER_JABATAN', 'MASTER_TUJUAN_KOTA', 'MASTER_SATKER', 'MASTER_JENIS_PERJADIN']


def clean(v):
    return str(v if v is not None else "").replace("​", "").strip()


def money(v):
    """Indonesian Rupiah text: dots are thousands separators, a comma starts decimals."""
    s = clean(v).split(",")[0]
    digits = re.sub(r"[^\d-]", "", s)
    return int(digits) if digits not in ("", "-") else 0


def integer(v):
    m = re.match(r"\s*(\d+)", clean(v))  # "3\n3\n3" (one value per person) -> 3
    return int(m.group(1)) if m else 0


def iso_date(v):
    s = clean(v)
    if re.fullmatch(r"\d{5}", s):  # Sheets serial date
        d = date(1899, 12, 30) + timedelta(days=int(s))
        # These cells were typed day-first (dd/mm) but stored month-first, e.g. 4 Mar became 3 Apr.
        # Swapping back makes every such trip match its DURASI_HARI (3 Apr -> 3 Jun was a 3-day trip on 4-6 Mar).
        if d.day <= 12:
            d = date(d.year, d.day, d.month)
        return d.isoformat()
    return s


def mask_spm(v):
    s = clean(v)
    return re.sub(r"\d", "x", s) if s else ""


def mask_jabatan(v):
    lines = clean(v).split("\n")
    return "\n".join("Pejabat Struktural" if re.match(r"\s*kepala\b", l, re.I) else l for l in lines)


def is_test_entry(r):
    """Form test submissions: typed through the web form with no cost at all (Rp 0) and no real activity text."""
    return clean(r.get("SOURCE_SHEET")) == "WEB_INPUT" and money(r.get("TOTAL_BIAYA")) == 0


class Codes:
    """Same person -> same code, across every trip."""
    def __init__(self, prefix):
        self.prefix, self.map = prefix, {}

    def __call__(self, name):
        key = re.sub(r"[^a-z]", "", name.lower())
        if key not in self.map:
            self.map[key] = f"{self.prefix} {len(self.map) + 1:03d}"
        return self.map[key]


def rows(values):
    hdr = [clean(h) for h in values[0]]
    for r in values[1:]:
        r = list(r) + [""] * (len(hdr) - len(r))
        if any(clean(x) for x in r):
            yield dict(zip(hdr, r))


def main(src):
    sheet = json.load(open(src, encoding="utf-8"))
    out = {}

    # ---- trips
    staff = Codes("Peserta")
    db_hdr = [clean(h) for h in sheet["DB_REKAP_PERJADIN"][0]]
    trips = []
    for r in rows(sheet["DB_REKAP_PERJADIN"]):
        if is_test_entry(r):
            continue
        names = [re.sub(r"^\s*\d+\.\s*", "", n).strip() for n in clean(r["NAMA_PEGAWAI_RAW"]).split("\n")]
        names = [n for n in names if n]
        coded = [staff(n) for n in names]
        r["NAMA_PEGAWAI_RAW"] = coded[0] if len(coded) == 1 else "\n".join(f"{i}. {c}" for i, c in enumerate(coded, 1))
        r["JABATAN_RAW"] = mask_jabatan(r["JABATAN_RAW"])
        r["NO_SPM"] = mask_spm(r["NO_SPM"])
        for k in MONEY:
            r[k] = money(r[k])
        for k in INTS:
            r[k] = integer(r[k])
        r["TANGGAL_MULAI"], r["TANGGAL_SELESAI"] = iso_date(r["TANGGAL_MULAI"]), iso_date(r["TANGGAL_SELESAI"])
        if not clean(r["BULAN"]) and re.match(r"\d{4}-\d{2}", r["TANGGAL_MULAI"]):
            r["BULAN"] = r["TANGGAL_MULAI"][:7]
        r["KETERANGAN"] = "" if clean(r["KETERANGAN"]) in ("-",) else clean(r["KETERANGAN"])
        trips.append([r[h] for h in db_hdr])
    out["DB_REKAP_PERJADIN"] = [db_hdr] + trips

    # ---- staff master: grade and position only
    peg = [["NIP", "NAMA", "GOLONGAN", "NAMA_GOLONGAN", "JABATAN", "SATKER"]]
    for i, r in enumerate(rows(sheet["MASTER_PEGAWAI"]), 1):
        peg.append(["(disamarkan)", f"Pegawai {i:03d}", clean(r.get("GOLONGAN")), clean(r.get("NAMA_GOLONGAN")),
                    clean(r.get("JABATAN")), clean(r.get("SATKER"))])
    out["MASTER_PEGAWAI"] = peg

    # ---- other master lists, as they are (minus obvious test entries)
    for name in MASTER_COPY:
        if name in sheet:
            vals = sheet[name]
            out[name] = [vals[0]] + [v for v in vals[1:] if v and len(clean(v[0])) > 2]

    OUT.write_text("/* REAL 2026 travel recap (SI-REKAP PERJADIN), ANONYMIZED by tools/anonymize-perjadin-data.py:"
                   " staff names, NIPs, SPM numbers and leadership titles are masked; trips, dates and amounts are real. */\n"
                   "window.SIREKAP_SEED = " + json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"{OUT}: {len(trips)} trips, {len(staff.map)} travelling staff, {len(peg) - 1} staff in master")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
