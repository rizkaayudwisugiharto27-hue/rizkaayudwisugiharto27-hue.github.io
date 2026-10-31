/* ================================================================
   SPSL Innovation Hub — logika dashboard
   Data: window.SPSL_DATA (data/data.js) atau SPSL_CONFIG.DATA_URL (live)
   ================================================================ */
(function () {
  "use strict";

  const CFG = Object.assign({ FORM_URL: "", DATA_URL: "", PAGE_SIZE: 24 }, window.SPSL_CONFIG || {});
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => (s == null ? "" : String(s)).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => Number(n).toLocaleString("id-ID");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0) + "%";
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const fmtDate = s => {
    if (!s) return "—";
    const d = new Date(s);
    return isNaN(d) ? String(s) : `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  };

  /* ---------- META STATUS & WARNA ---------- */
  const STATUS_ORDER = ["Submitted", "Under Review", "Prioritized", "Incubation", "Implementation", "Implemented", "Benefit Validation", "Backlog", "Archived/Not Prioritized"];
  const STATUS_META = {
    "Submitted": { c: "--st-sub", d: "Ide baru diajukan, masuk ke bank data." },
    "Under Review": { c: "--st-rev", d: "Sedang diperiksa kelayakan & relevansinya." },
    "Prioritized": { c: "--st-pri", d: "Dipilih sebagai ide prioritas untuk dikembangkan." },
    "Incubation": { c: "--st-inc", d: "Sedang dikembangkan bersama unit terkait." },
    "Implementation": { c: "--st-imp", d: "Sedang diterapkan di lapangan." },
    "Implemented": { c: "--st-done", d: "Sudah diterapkan." },
    "Benefit Validation": { c: "--st-ben", d: "Manfaatnya sedang diukur (baseline–target–realisasi)." },
    "Backlog": { c: "--st-back", d: "Disimpan untuk dipertimbangkan kemudian." },
    "Archived/Not Prioritized": { c: "--st-arch", d: "Belum dilanjutkan / tidak diprioritaskan." }
  };
  const APPLIED = ["Implementation", "Implemented", "Benefit Validation"];
  const ACTIVE = ["Submitted", "Under Review", "Prioritized", "Incubation"];
  const statusVar = s => `var(${(STATUS_META[s] || { c: "--st-back" }).c})`;
  const sbadge = s => `<span class="sbadge"><i style="background:${statusVar(s)}"></i>${esc(s || "—")}</span>`;

  const HORIZON_ORDER = ["Core (Improvement)", "Adjacent", "Transformational"];
  const AREA_ORDER = ["Logistics", "Back Office", "Hinterland Dev."];
  const SLOTS = ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"];
  const NEUTRAL_KAT = ["Lainnya", "Belum Dikategorikan"];
  let KAT_COLOR = {};
  const katVar = k => KAT_COLOR[k] || "var(--c-other)";

  /* ---------- STATE ---------- */
  const DIMS = ["tahun", "unit", "kategori", "status", "area", "horizon"];
  const DIM_LABEL = { tahun: "Tahun", unit: "Unit", kategori: "Kategori", status: "Status", area: "Area bisnis", horizon: "Horizon" };
  let DATA = { innovations: [], history: [], master: {}, settings: {}, meta: {} };
  let INN = [];
  const F = { tahun: "", unit: "", kategori: "", status: "", area: "", horizon: "" };
  let Q = "", SORT = "id", VIEW = "cards", shown = CFG.PAGE_SIZE;

  /* ---------- DATA LOADING ---------- */
  async function loadData() {
    if (CFG.DATA_URL) {
      try {
        const r = await fetch(CFG.DATA_URL, { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        if (!j || !Array.isArray(j.innovations)) throw new Error("format tidak dikenal");
        j.meta = Object.assign({ live: true }, j.meta || {});
        return j;
      } catch (e) {
        console.warn("[SPSL] Gagal memuat DATA_URL, memakai data bawaan:", e);
      }
    }
    return window.SPSL_DATA || { innovations: [], history: [], master: {}, settings: {}, meta: {} };
  }

  function prepare(d) {
    DATA = d;
    INN = (d.innovations || []).map(x => Object.assign({}, x, { tahun: x.tahun === "" ? "" : String(x.tahun) }));
    const kats = (d.master && d.master.kategori && d.master.kategori.length) ? d.master.kategori : uniq(INN, "kategori");
    KAT_COLOR = {};
    kats.filter(k => !NEUTRAL_KAT.includes(k)).forEach((k, i) => { if (i < SLOTS.length) KAT_COLOR[k] = `var(${SLOTS[i]})`; });
  }

  /* ---------- FILTERS ---------- */
  function uniq(arr, key) { return [...new Set(arr.map(d => d[key]).filter(v => v !== "" && v != null))]; }
  function ordered(vals, order) {
    return vals.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || String(a).localeCompare(String(b));
    });
  }
  function optionsFor(dim) {
    const v = uniq(INN, dim);
    if (dim === "tahun") return v.sort((a, b) => b - a);
    if (dim === "status") return ordered(v, STATUS_ORDER);
    if (dim === "horizon") return ordered(v, HORIZON_ORDER);
    if (dim === "area") return ordered(v, AREA_ORDER);
    if (dim === "unit") return ordered(v, (DATA.master && DATA.master.unit) || []);
    if (dim === "kategori") return ordered(v, (DATA.master && DATA.master.kategori) || []);
    return v.sort();
  }
  function match(d, except) {
    for (const k of DIMS) if (k !== except && F[k] && String(d[k]) !== F[k]) return false;
    return true;
  }
  const filtered = except => INN.filter(d => match(d, except));
  function searched() {
    const q = Q.trim().toLowerCase();
    const base = filtered();
    if (!q) return base;
    return base.filter(d => [d.id, d.judul, d.tim, d.ketua, d.anggota, d.masalah, d.solusi, d.manfaat, d.bpo].join(" ").toLowerCase().includes(q));
  }
  function setFilter(dim, val) {
    F[dim] = F[dim] === String(val) ? "" : String(val);
    shown = CFG.PAGE_SIZE;
    renderAll();
  }
  function count(arr, key) { const m = {}; arr.forEach(d => { const v = d[key] === "" || d[key] == null ? "(kosong)" : String(d[key]); m[v] = (m[v] || 0) + 1; }); return m; }

  // Di Apps Script halaman berjalan di dalam iframe: URL induk diubah lewat google.script.history,
  // dan parameter awal dikirim server sebagai window.SPSL_PARAMS.
  const GAS = window.google && google.script && google.script.history;
  function syncUrl() {
    const params = {};
    DIMS.forEach(k => { if (F[k]) params[k] = F[k]; });
    if (Q) params.q = Q;
    try {
      if (GAS) return google.script.history.replace(null, params);
      const qs = new URLSearchParams(params).toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) { /* abaikan (mis. file://) */ }
  }
  function readUrl() {
    try {
      const p = window.SPSL_PARAMS ? new Map(Object.entries(window.SPSL_PARAMS)) : new URLSearchParams(location.search);
      DIMS.forEach(k => { if (p.get(k)) F[k] = String(p.get(k)); });
      if (p.get("q")) Q = String(p.get("q"));
    } catch (e) { /* abaikan */ }
  }

  function renderFilterbar() {
    $$("#filterbar select").forEach(sel => {
      const dim = sel.dataset.f;
      const first = sel.options[0].outerHTML;
      sel.innerHTML = first + optionsFor(dim).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
      sel.value = F[dim];
      sel.classList.toggle("on", !!F[dim]);
    });
    const chips = DIMS.filter(k => F[k]).map(k =>
      `<span class="fchip">${esc(DIM_LABEL[k])}: ${esc(F[k])}<button type="button" data-clear="${k}" aria-label="Hapus filter ${esc(DIM_LABEL[k])}">×</button></span>`);
    $("#activeFilters").innerHTML = chips.join("");
    $("#resetBtn").style.display = chips.length ? "" : "none";
  }

  /* ---------- HERO & KPI ---------- */
  function renderHero() {
    const tahunAktif = String((DATA.settings && DATA.settings["Tahun Aktif"]) || new Date().getFullYear());
    const years = uniq(INN, "tahun").sort();
    const tiles = [
      { n: fmt(INN.length), l: "Total inovasi" },
      { n: fmt(INN.filter(d => APPLIED.includes(d.status)).length), l: "Sudah/sedang diterapkan" },
      { n: fmt(INN.filter(d => d.tahun === tahunAktif).length), l: `Ide tahun berjalan (${tahunAktif})` },
      { n: fmt(uniq(INN, "unit").length), l: "Unit & anak perusahaan" }
    ];
    $("#heroStats").innerHTML = tiles.map(t => `<div class="hstat"><div class="n">${t.n}</div><div class="l">${esc(t.l)}</div></div>`).join("");
    const m = DATA.meta || {};
    const src = m.live ? "Data live dari Google Sheet" : `Data: ${esc(m.source || "bank data")}`;
    const yr = years.length ? ` · Periode ${years[0]}–${years[years.length - 1]}` : "";
    $("#dataStamp").textContent = "";
    $("#dataStamp").insertAdjacentHTML("beforeend", `${src}${m.generated ? " · diperbarui " + esc(fmtDate(m.generated)) : ""}${yr}`);
  }

  function renderKpis(rows) {
    const n = rows.length;
    const applied = rows.filter(d => APPLIED.includes(d.status)).length;
    const active = rows.filter(d => ACTIVE.includes(d.status)).length;
    const backlog = rows.filter(d => d.status === "Backlog" || d.status === "Archived/Not Prioritized").length;
    const ranked = rows.filter(d => d.rank != null && d.rank !== "").length;
    const k = [
      { l: "Total inovasi", n: fmt(n), s: DIMS.some(x => F[x]) ? `dari ${fmt(INN.length)} keseluruhan` : "seluruh bank data", hero: true },
      { l: "Sudah/sedang diterapkan", n: fmt(applied), s: `${pct(applied, n)} dari total` },
      { l: "Dalam proses", n: fmt(active), s: "Submitted s.d. Incubation" },
      { l: "Backlog / arsip", n: fmt(backlog), s: `${pct(backlog, n)} perlu ditinjau` },
      { l: "Punya peringkat lomba", n: fmt(ranked), s: `${pct(ranked, n)} dari total` }
    ];
    $("#kpis").innerHTML = k.map(t => `<div class="kpi${t.hero ? " hero-kpi" : ""}"><div class="l">${esc(t.l)}</div><div class="n">${t.n}</div><div class="s">${esc(t.s)}</div></div>`).join("");
  }

  /* ---------- CHARTS ---------- */
  function tipAttrs(label, v, total) {
    return `data-tl="${esc(label)}" data-tv="${v}" data-tp="${total ? pct(v, total) + " dari " + fmt(total) : ""}"`;
  }

  function hbars(el, dim, entries, colorFn) {
    const box = $(el);
    if (!entries.length) { box.innerHTML = `<div class="empty">Tidak ada data</div>`; return; }
    const max = Math.max(...entries.map(e => e[1]), 1);
    const total = entries.reduce((a, e) => a + e[1], 0);
    box.innerHTML = entries.map(([k, v]) => {
      const dim_ = F[dim] && F[dim] !== k ? " dim" : "";
      const col = colorFn ? colorFn(k) : "var(--c1)";
      return `<div class="bar-row${dim_}" tabindex="0" role="button" data-dim="${dim}" data-val="${esc(k)}" ${tipAttrs(k, v, total)} aria-label="${esc(k)}: ${v}">
        <div class="bl"><span class="sw" style="background:${col}"></span>${esc(k)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:0;background:${col}" data-w="${(v / max * 100).toFixed(1)}"></div></div>
        <div class="bar-val">${fmt(v)}</div></div>`;
    }).join("");
  }

  function vbars(el, dim, entries) {
    const max = Math.max(...entries.map(e => e[1]), 1);
    const total = entries.reduce((a, e) => a + e[1], 0);
    $(el).innerHTML = entries.map(([k, v]) =>
      `<div class="vbar-col${F[dim] && F[dim] !== k ? " dim" : ""}" tabindex="0" role="button" data-dim="${dim}" data-val="${esc(k)}" ${tipAttrs(k, v, total)} aria-label="${esc(k)}: ${v}">
        <div class="vbar" style="height:0" data-h="${(v / max * 100).toFixed(1)}"><span class="vv">${fmt(v)}</span></div></div>`).join("");
    let x = $(el).nextElementSibling;
    if (!x || !x.classList.contains("vbar-x")) { x = document.createElement("div"); x.className = "vbar-x"; $(el).after(x); }
    x.innerHTML = entries.map(([k]) => `<span>${esc(k)}</span>`).join("");
  }

  function stacked(el, dim, entries) {
    const box = $(el);
    const total = entries.reduce((a, e) => a + e[1], 0);
    if (!total) { box.innerHTML = `<div class="empty">Tidak ada data</div>`; return; }
    const col = i => `var(${SLOTS[i] || "--c-other"})`;
    box.innerHTML =
      `<div class="stack">${entries.map(([k, v], i) => v ? `<div style="flex:${v};background:${col(i)};${F[dim] && F[dim] !== k ? "opacity:.35" : ""}" data-dim="${dim}" data-val="${esc(k)}" ${tipAttrs(k, v, total)}></div>` : "").join("")}</div>
       <div class="legend">${entries.map(([k, v], i) =>
        `<div class="lg" tabindex="0" role="button" data-dim="${dim}" data-val="${esc(k)}" ${tipAttrs(k, v, total)} style="${F[dim] && F[dim] !== k ? "opacity:.45" : ""}">
          <span class="sw" style="background:${col(i)}"></span><span>${esc(k)}</span><span class="v">${fmt(v)}</span><span class="p">${pct(v, total)}</span></div>`).join("")}</div>`;
  }

  function heatmap() {
    // matriks memakai semua filter kecuali unit & kategori (keduanya adalah sumbu matriks)
    const base = INN.filter(d => DIMS.every(k => k === "unit" || k === "kategori" || !F[k] || String(d[k]) === F[k]));
    const units = optionsFor("unit"), kats = optionsFor("kategori");
    const m = {}; let max = 1;
    base.forEach(d => { const key = d.unit + "||" + d.kategori; m[key] = (m[key] || 0) + 1; max = Math.max(max, m[key]); });
    const step = v => v ? Math.min(7, 1 + Math.floor((v / max) * 6.999)) : 0;
    const ink = s => s >= 4 ? "#fff" : "var(--ink)";
    const short = k => k.replace("Customer, Marketing & Employee Experience", "Customer & Employee Exp.").replace("Proses Bisnis & Efisiensi", "Proses Bisnis");
    let html = `<table class="heat"><thead><tr><th class="rh">Unit \\ Kategori</th>${kats.map(k => `<th title="${esc(k)}">${esc(short(k))}</th>`).join("")}<th>Total</th></tr></thead><tbody>`;
    units.forEach(u => {
      let rt = 0;
      html += `<tr><th class="rh">${esc(u)}</th>`;
      kats.forEach(k => {
        const v = m[u + "||" + k] || 0; rt += v;
        const s = step(v);
        const sel = (F.unit === u && F.kategori === k) ? "outline:2px solid var(--ink);outline-offset:-2px;" : "";
        html += v
          ? `<td tabindex="0" role="button" style="background:var(--h${s});color:${ink(s)};${sel}" data-heat="${esc(u)}||${esc(k)}" data-tl="${esc(u)} · ${esc(k)}" data-tv="${v}" data-tp="">${v}</td>`
          : `<td class="z" style="background:var(--h0)">·</td>`;
      });
      html += `<td class="tot">${fmt(rt)}</td></tr>`;
    });
    html += `</tbody></table>`;
    $("#chartHeat").innerHTML = html;
  }

  function entriesFor(dim, order) {
    const c = count(filtered(dim), dim);
    let keys = order ? order.slice() : Object.keys(c);
    Object.keys(c).forEach(k => { if (!keys.includes(k)) keys.push(k); });
    return keys.map(k => [k, c[k] || 0]);
  }

  function renderCharts() {
    vbars("#chartYear", "tahun", entriesFor("tahun", optionsFor("tahun").slice().sort()));
    hbars("#chartStatus", "status", entriesFor("status", STATUS_ORDER), statusVar);
    hbars("#chartKat", "kategori", entriesFor("kategori").filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]), katVar);
    hbars("#chartUnit", "unit", entriesFor("unit").filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]));
    stacked("#chartHorizon", "horizon", entriesFor("horizon", HORIZON_ORDER).filter(e => e[1] > 0 || HORIZON_ORDER.includes(e[0])));
    stacked("#chartArea", "area", entriesFor("area", AREA_ORDER).filter(e => e[1] > 0 || AREA_ORDER.includes(e[0])));
    heatmap();
    requestAnimationFrame(() => {
      $$(".bar-fill").forEach(b => b.style.width = b.dataset.w + "%");
      $$(".vbar").forEach(b => b.style.height = b.dataset.h + "%");
    });
  }

  function renderHistory() {
    const h = (DATA.history || []).slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts))).slice(0, 10);
    if (!h.length) { $("#history").innerHTML = `<div class="empty">Belum ada riwayat perubahan status.</div>`; return; }
    const byId = Object.fromEntries(INN.map(d => [d.id, d]));
    $("#history").innerHTML = `<div class="hist">${h.map(r => {
      const d = byId[r.id];
      return `<div class="hrow"><span class="when">${esc(fmtDate(r.ts))}</span>
        <span class="hid" data-open="${esc(r.id)}" tabindex="0" role="button">${esc(r.id)}</span>
        <span class="tr">${r.dari ? sbadge(r.dari) + " →" : ""} ${sbadge(r.ke)} ${d ? `<span style="color:var(--ink-2)">${esc(d.judul)}</span>` : ""}</span>
        ${r.catatan ? `<span class="cat">${esc(r.catatan)}</span>` : ""}</div>`;
    }).join("")}</div>`;
  }

  /* ---------- DAFTAR ---------- */
  function sortRows(rows) {
    const r = rows.slice();
    const si = s => { const i = STATUS_ORDER.indexOf(s); return i < 0 ? 99 : i; };
    if (SORT === "tahun-desc") r.sort((a, b) => b.tahun - a.tahun || a.id.localeCompare(b.id));
    else if (SORT === "status") r.sort((a, b) => si(a.status) - si(b.status) || a.id.localeCompare(b.id));
    else if (SORT === "rank") r.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || a.id.localeCompare(b.id));
    else if (SORT === "judul") r.sort((a, b) => String(a.judul).localeCompare(String(b.judul)));
    else r.sort((a, b) => a.id.localeCompare(b.id));
    return r;
  }
  function cardHTML(d, withDesc) {
    const rank = d.rank ? `<span class="chip chip-gold">★ Peringkat ${esc(d.rank)}</span>` : "";
    return `<div class="card" tabindex="0" role="button" data-open="${esc(d.id)}">
      <div class="card-top"><span class="chip">${esc(d.tahun)}</span>${sbadge(d.status)}</div>
      <h3>${esc(d.judul)}</h3>
      ${withDesc ? `<p class="desc">${esc(d.solusi || d.manfaat || d.masalah || "—")}</p>` : ""}
      <div class="meta"><span class="u">${esc(d.unit)}</span>${d.tim && d.tim !== d.judul ? `<span>· ${esc(d.tim)}</span>` : ""}
        <span class="k"><i style="background:${katVar(d.kategori)}"></i>${esc(d.kategori)}</span>${rank}</div>
    </div>`;
  }
  function renderList() {
    const res = sortRows(searched());
    const page = res.slice(0, shown);
    $("#countLine").innerHTML = `Menampilkan <b>${fmt(page.length)}</b> dari <b>${fmt(res.length)}</b> inovasi`;
    const none = `<p class="empty" style="grid-column:1/-1">Tidak ada inovasi yang cocok dengan pencarian / filter.</p>`;
    if (VIEW === "cards") {
      $("#cards").hidden = false; $("#tableWrap").hidden = true;
      $("#cards").innerHTML = page.map(d => cardHTML(d, false)).join("") || none;
    } else {
      $("#cards").hidden = true; $("#tableWrap").hidden = false;
      $("#tableWrap").innerHTML = page.length ? `<table class="dtable"><thead><tr>
        <th>ID</th><th>Tahun</th><th>Judul</th><th>Unit</th><th>Kategori</th><th>Status</th><th>Horizon</th><th>Area</th><th>Peringkat</th></tr></thead><tbody>
        ${page.map(d => `<tr tabindex="0" data-open="${esc(d.id)}"><td class="num">${esc(d.id)}</td><td class="num">${esc(d.tahun)}</td><td>${esc(d.judul)}</td><td>${esc(d.unit)}</td>
          <td>${esc(d.kategori)}</td><td>${sbadge(d.status)}</td><td>${esc(d.horizon)}</td><td>${esc(d.area)}</td><td class="num">${esc(d.rank ?? "")}</td></tr>`).join("")}
        </tbody></table>` : none;
    }
    $("#moreBtn").style.display = res.length > shown ? "inline-flex" : "none";
  }

  function downloadCsv() {
    const rows = sortRows(searched());
    const cols = [["id", "ID Inovasi"], ["tahun", "Tahun"], ["judul", "Judul Inovasi"], ["unit", "Unit"], ["divisi", "Divisi"], ["tim", "Nama Tim"], ["ketua", "Pengusul / Ketua"],
      ["kategori", "Kategori"], ["status", "Status"], ["horizon", "Horizon Inovasi"], ["area", "Area Bisnis"], ["bpo", "BPO"], ["rank", "Peringkat"],
      ["masalah", "Permasalahan"], ["solusi", "Ide / Solusi"], ["manfaat", "Potensi / Realisasi Manfaat"], ["baseline", "Baseline"], ["target", "Target"],
      ["realisasi", "Realisasi"], ["hasil_benefit", "Hasil Benefit"], ["sumber", "Sumber Data"]];
    const q = v => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = "﻿" + [cols.map(c => q(c[1])).join(",")].concat(rows.map(d => cols.map(c => q(d[c[0]])).join(","))).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `inovasi-spsl-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- GALERI & LEGEND ---------- */
  function renderGallery() {
    const lim = Number((DATA.settings && DATA.settings["Batas Galeri"]) || 12);
    const feat = INN.filter(d => d.featured).slice(0, lim);
    $("#galeriCards").innerHTML = feat.map(d => cardHTML(d, true)).join("") || `<p class="empty" style="grid-column:1/-1">Belum ada inovasi yang ditandai Featured.</p>`;
  }
  function renderLegend() {
    const c = count(INN, "status");
    $("#legend").innerHTML = STATUS_ORDER.map(s =>
      `<div class="leg">${sbadge(s)}<div class="lt">${esc(STATUS_META[s].d)}</div><div class="cnt">${fmt(c[s] || 0)} inovasi</div></div>`).join("");
  }

  /* ---------- MODAL ---------- */
  function openModal(id) {
    const d = INN.find(x => x.id === id);
    if (!d) return;
    const f = (t, v) => v != null && String(v).trim() ? `<div class="mfield"><h4>${t}</h4><p>${esc(v)}</p></div>` : "";
    const rank = d.rank ? `<span class="chip chip-gold">★ Peringkat ${esc(d.rank)}</span>` : "";
    const ben = [["Baseline", d.baseline], ["Target", d.target], ["Realisasi", d.realisasi]];
    const hasBen = ben.some(b => b[1] !== "" && b[1] != null) || d.hasil_benefit;
    const link = /^https?:\/\//i.test(String(d.link_evidence || "")) ? `<div class="mfield"><h4>Link evidence</h4><p><a href="${esc(d.link_evidence)}" target="_blank" rel="noopener">${esc(d.link_evidence)}</a></p></div>` : "";
    const hist = (DATA.history || []).filter(h => h.id === d.id).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    $("#modal").innerHTML = `
      <div class="modal-h">
        <div class="row"><h2>${esc(d.judul)}</h2><button class="x" type="button" data-close aria-label="Tutup">×</button></div>
        <div class="modal-tags"><span class="chip">${esc(d.tahun)}</span>${sbadge(d.status)}
          <span class="sbadge"><i style="background:${katVar(d.kategori)}"></i>${esc(d.kategori)}</span>${rank}
          ${d.featured ? `<span class="chip">Featured</span>` : ""}</div>
      </div>
      <div class="modal-b">
        <div class="mgrid">
          ${f("ID Inovasi", d.id)}${f("Unit / Anak Perusahaan", d.unit)}
          ${f("Nama Tim", d.tim)}${f("Pengusul / Ketua", d.ketua)}
          ${f("Divisi", d.divisi)}${f("Anggota Tim", d.anggota)}
          ${f("Horizon Inovasi", d.horizon)}${f("Area Bisnis", d.area)}
          ${f("BPO (Business Process Owner)", d.bpo)}${f("Evidence", d.evidence ? "Ya" : "Tidak")}
        </div>
        ${f("Permasalahan yang diselesaikan", d.masalah)}
        ${f("Ide / Solusi", d.solusi)}
        ${f("Potensi / Realisasi Manfaat", d.manfaat)}
        ${hasBen ? `<div class="mfield"><h4>Pengukuran manfaat</h4></div><div class="benefit">${ben.map(b => `<div><b>${b[0]}</b><span>${esc(b[1] || "—")}</span></div>`).join("")}</div>${f("Hasil benefit", d.hasil_benefit)}` : ""}
        ${link}
        ${f("Catatan admin", d.catatan)}
        ${f("Sumber data", d.sumber)}
        ${d.last_update ? f("Terakhir diperbarui", fmtDate(d.last_update)) : ""}
        ${hist.length ? `<div class="mhist"><h4>Riwayat status</h4><ul>${hist.map(h => `<li><span class="when">${esc(fmtDate(h.ts))}</span>${h.dari ? sbadge(h.dari) + " →" : ""} ${sbadge(h.ke)}</li>`).join("")}</ul></div>` : ""}
      </div>`;
    $("#modalBg").classList.add("show");
    document.body.style.overflow = "hidden";
    $("#modal .x").focus();
  }
  function closeModal() { $("#modalBg").classList.remove("show"); document.body.style.overflow = ""; }

  /* ---------- TOOLTIP ---------- */
  const tip = $("#tip");
  function showTip(el, x, y) {
    tip.innerHTML = `<div class="tv">${fmt(el.dataset.tv)}</div><div class="tl">${esc(el.dataset.tl)}</div>${el.dataset.tp ? `<div class="tp">${esc(el.dataset.tp)}</div>` : ""}`;
    tip.classList.add("show");
    const r = tip.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    tip.style.left = Math.max(8, left) + "px"; tip.style.top = Math.max(8, top) + "px";
  }
  const hideTip = () => tip.classList.remove("show");

  /* ---------- RENDER ---------- */
  function renderAll() {
    renderFilterbar();
    renderKpis(filtered());
    renderCharts();
    renderList();
    syncUrl();
  }

  function bind() {
    $$(".js-form-link").forEach(a => {
      if (CFG.FORM_URL) a.href = CFG.FORM_URL; else { a.removeAttribute("target"); a.href = "#alur"; }
    });
    $("#filterbar").addEventListener("change", e => {
      const dim = e.target.dataset.f; if (!dim) return;
      F[dim] = e.target.value; shown = CFG.PAGE_SIZE; renderAll();
    });
    $("#resetBtn").addEventListener("click", () => { DIMS.forEach(k => F[k] = ""); shown = CFG.PAGE_SIZE; renderAll(); });
    $("#activeFilters").addEventListener("click", e => { const k = e.target.dataset.clear; if (k) { F[k] = ""; renderAll(); } });
    let t;
    $("#q").value = Q;
    $("#q").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { Q = e.target.value; shown = CFG.PAGE_SIZE; renderList(); syncUrl(); }, 150); });
    $("#sortBy").addEventListener("change", e => { SORT = e.target.value; renderList(); });
    $$(".seg button").forEach(b => b.addEventListener("click", () => {
      VIEW = b.dataset.view; $$(".seg button").forEach(x => x.classList.toggle("on", x === b)); renderList();
    }));
    $("#moreBtn").addEventListener("click", () => { shown += CFG.PAGE_SIZE; renderList(); });
    $("#csvBtn").addEventListener("click", downloadCsv);

    const activate = el => {
      if (el.dataset.open) return openModal(el.dataset.open);
      if (el.dataset.heat) {
        const [u, k] = el.dataset.heat.split("||");
        const same = F.unit === u && F.kategori === k;
        F.unit = same ? "" : u; F.kategori = same ? "" : k; shown = CFG.PAGE_SIZE; hideTip(); return renderAll();
      }
      if (el.dataset.dim) { hideTip(); setFilter(el.dataset.dim, el.dataset.val); }
    };
    document.addEventListener("click", e => {
      if (e.target.closest("[data-close]")) return closeModal();
      const el = e.target.closest("[data-open],[data-dim],[data-heat]");
      if (el) activate(el);
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") return closeModal();
      if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-open],[data-dim],[data-heat]")) { e.preventDefault(); activate(e.target); }
    });
    document.addEventListener("pointermove", e => {
      const el = e.target.closest("[data-tv]");
      el ? showTip(el, e.clientX, e.clientY) : hideTip();
    });
    document.addEventListener("focusin", e => {
      const el = e.target.closest && e.target.closest("[data-tv]");
      if (el) { const r = el.getBoundingClientRect(); showTip(el, r.right, r.top); } else hideTip();
    });
    addEventListener("scroll", hideTip, { passive: true });
    $("#modalBg").addEventListener("click", e => { if (e.target.id === "modalBg") closeModal(); });
    $("#burger").addEventListener("click", () => $("#navlinks").classList.toggle("open"));
    $$("#navlinks a").forEach(a => a.addEventListener("click", () => $("#navlinks").classList.remove("open")));
    // link "#bagian" digulir manual (di iframe Apps Script, navigasi hash bawaan tidak andal)
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.target) return;
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); }
    });

    // tema terang/gelap (disimpan per browser)
    const root = document.documentElement;
    try { const s = localStorage.getItem("spsl-theme"); if (s) root.dataset.theme = s; } catch (e) { /* abaikan */ }
    $("#themeBtn").addEventListener("click", () => {
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("spsl-theme", root.dataset.theme); } catch (e) { /* abaikan */ }
    });
  }

  async function init() {
    readUrl();
    bind();
    prepare(await loadData());
    // buang filter dari URL yang nilainya tidak ada di data
    DIMS.forEach(k => { if (F[k] && !optionsFor(k).map(String).includes(F[k])) F[k] = ""; });
    renderHero();
    renderHistory();
    renderGallery();
    renderLegend();
    renderAll();
    const m = DATA.meta || {};
    $("#footNote").textContent = `Sumber: ${m.live ? "Google Sheet (live)" : (m.source || "bank data inovasi")} · ${fmt(INN.length)} inovasi${m.generated ? " · diperbarui " + fmtDate(m.generated) : ""}. Live demo — data disamarkan: tanpa nama pengusul, email, tim, dan deskripsi internal.`;
  }
  init();
})();
