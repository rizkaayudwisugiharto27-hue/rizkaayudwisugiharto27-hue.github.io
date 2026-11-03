"""Builds the SI-REKAP PERJADIN live demo in projects/si-rekap-perjadin/.

The original Apps Script project (Code.gs + Index.html) runs unchanged in the browser:
gas-shim.js stands in for SpreadsheetApp / google.script.run. The data (seed-data.js) is the real
2026 recap, anonymized by tools/anonymize-perjadin-data.py; this script does not touch it.

Run:  python tools/build-perjadin-demo.py <folder with Code.gs and Index.html>
"""
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "projects" / "si-rekap-perjadin"

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

DEMO_PILL = """<div class="demo-pill" role="note"><span class="long"><b>Live demo</b> · data asli 2026, nama &amp; NIP disamarkan · perubahan hanya di browser Anda</span><span class="short"><b>Demo</b> · data asli, disamarkan</span>
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
     'Versi asli membaca Google Spreadsheet secara langsung; demo ini memakai salinan data rekap 2026 yang nama, NIP dan nomor SPM-nya disamarkan.'),
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


def main(src):
    src = Path(src)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "server.js").write_text(build_server((src / "Code.gs").read_text(encoding="utf-8")), encoding="utf-8")
    (OUT / "index.html").write_text(build_index((src / "Index.html").read_text(encoding="utf-8")), encoding="utf-8")
    print("Built", OUT)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
