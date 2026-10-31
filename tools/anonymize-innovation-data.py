"""Builds projects/innovation-hub/data/data.js from the real innovation bank data, ANONYMIZED for public use.

Input: a JSON export of the Google Sheet "BANK DATA INOVASI PSL", shaped as
    {"Database_Inovasi": [[header...], [row...], ...], "Riwayat_Status": [...], "Master_Data": [...]}
(the raw `values` arrays returned by the Sheets API for each tab).

Run:  python tools/anonymize-innovation-data.py sheet-export.json

Kept (not personal):  ID, year, unit, title, category, status, BPO unit, rank, evidence flag,
                      featured flag, horizon, business area, last update, source.
Removed (personal / internal detail):  proposer name & email, division, team name, team members,
                      problem, solution, benefit text, baseline/target/realisation, admin notes,
                      evidence links, and "Updated By" (emails) in the status history.
Test submissions from the form (junk titles) are skipped.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "projects" / "innovation-hub" / "data" / "data.js"
SKIP_IDS = {"INOV-2026-002", "INOV-2026-003"}  # form test entries ("MERUBAH JALAN JADI JALAN", "bfftgbfghtfh")


def rows(values):
    hdr = values[0]
    for r in values[1:]:
        r = r + [""] * (len(hdr) - len(r))
        if any(str(x).strip() for x in r):
            yield dict(zip(hdr, r))


def clean(v):
    return str(v or "").replace("​", "").strip()


def to_iso(s, day_first):
    """Sheets mixes '8/18/2026 17:22:56', '20/10/2026 11:03' and '2026-10-20 11:03:23'."""
    s = clean(s)
    if not s:
        return ""
    if re.match(r"\d{4}-\d{2}-\d{2}", s):
        return s.replace(" ", "T")[:19]
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?", s)
    if not m:
        return s
    a, b, y, hh, mm, ss = m.groups()
    a, b = int(a), int(b)
    day, month = (a, b) if (day_first or a > 12) else (b, a)
    return datetime(int(y), month, day, int(hh or 0), int(mm or 0), int(ss or 0)).isoformat()


def main(src):
    sheet = json.load(open(src, encoding="utf-8"))

    innovations = []
    for r in rows(sheet["Database_Inovasi"]):
        iid = clean(r.get("ID Inovasi"))
        if not iid or iid in SKIP_IDS:
            continue
        rank = clean(r.get("Peringkat"))
        innovations.append({
            "ts": to_iso(r.get("Timestamp"), day_first=False),
            "id": iid,
            "tahun": int(clean(r.get("Tahun")) or 0),
            "ketua": "", "unit": clean(r.get("Unit")), "divisi": "", "tim": "", "anggota": "",
            "judul": clean(r.get("Judul Inovasi")),
            "kategori": clean(r.get("Kategori")),
            "masalah": "", "solusi": "",
            "status": clean(r.get("Status")),
            "bpo": clean(r.get("BPO")),
            "manfaat": "",
            "rank": int(rank) if rank.isdigit() else None,
            "evidence": clean(r.get("Evidence")).lower() == "ya",
            "link_evidence": "", "baseline": "", "target": "", "realisasi": "", "hasil_benefit": "", "catatan": "",
            "last_update": to_iso(r.get("Last Update"), day_first=True),
            "sumber": clean(r.get("Sumber Data")),
            "featured": clean(r.get("Featured")).lower() == "ya",
            "horizon": clean(r.get("Horizon Inovasi")),
            "area": clean(r.get("Area Bisnis")),
        })
    keep = {d["id"] for d in innovations}

    history = [{
        "ts": to_iso(r.get("Timestamp"), day_first=False),
        "id": clean(r.get("ID Inovasi")),
        "dari": clean(r.get("Status Lama")),
        "ke": clean(r.get("Status Baru")),
        "catatan": clean(r.get("Catatan")),
        "bpo": clean(r.get("BPO")),
    } for r in rows(sheet["Riwayat_Status"]) if clean(r.get("ID Inovasi")) in keep]

    master = {"status": [], "kategori": [], "unit": []}
    for r in rows(sheet["Master_Data"]):
        for src_col, key in (("Status Inovasi", "status"), ("Kategori Inovasi", "kategori"), ("Unit / Anak Perusahaan", "unit")):
            if clean(r.get(src_col)):
                master[key].append(clean(r.get(src_col)))

    data = {
        "meta": {"source": "Bank data inovasi (disamarkan)", "generated": datetime.now().isoformat(timespec="seconds"),
                 "count": len(innovations)},
        "settings": {"Nama Portal": "Innovation Hub", "Tahun Aktif": 2026, "Prefix ID": "INOV", "Email Admin": "",
                     "Batas Galeri": 12, "Catatan": ""},
        "master": master,
        "innovations": innovations,
        "history": history,
    }
    OUT.write_text("/* Real innovation bank data, ANONYMIZED by tools/anonymize-innovation-data.py:"
                   " no names, emails, teams or internal descriptions. */\n"
                   "window.SPSL_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{OUT}: {len(innovations)} innovations, {len(history)} history rows")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
