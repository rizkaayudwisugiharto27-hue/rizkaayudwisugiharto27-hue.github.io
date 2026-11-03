/* Original Code.gs (Apps Script), wrapped so it runs in the browser on gas-shim.js (plus the cost totals added in tools/build-perjadin-demo.py). */
(function () {
const CONFIG = {
  APP_TITLE: 'Dashboard Monitoring Perjadin & Rekonsiliasi Biro',
  DB: 'DB_REKAP_PERJADIN'
};

/** Header resmi DB_REKAP_PERJADIN — jangan tambah kolom di luar daftar ini */
const DB_HEADERS = [
  'ID_REGISTER', 'TAHUN', 'BULAN', 'SATKER', 'JENIS_PERJADIN', 'NO', 'KEGIATAN', 'NO_SPM',
  'NAMA_PEGAWAI_RAW', 'JUMLAH_PEGAWAI', 'GOL_RAW', 'JABATAN_RAW', 'DURASI_HARI',
  'TANGGAL_MULAI', 'TANGGAL_SELESAI', 'TUJUAN_LOKASI', 'MODA',
  'UANG_HARIAN', 'UANG_PENGINAPAN', 'UANG_TRANSPORT', 'TAKSI_JAKARTA', 'TAKSI_DAERAH', 'TAKSI',
  'UANG_REPRESENTASI', 'HARGA_TIKET_BERANGKAT', 'HARGA_TIKET_KEMBALI', 'TIKET',
  'BIAYA_PENGEPAKAN', 'ANGKUTAN_BARANG', 'TOTAL_BIAYA', 'NAMA_PENGINAPAN', 'KETERANGAN',
  'STATUS_DATA', 'CATATAN_VALIDASI', 'SOURCE_SHEET', 'SOURCE_ROW', 'UPDATED_AT'
];

const EXTRA_DB_HEADERS = [
  'CREATED_BY', 'CATATAN', 'STATUS_BERKAS', 'URAIAN_KEGIATAN', 'MODE_TRANSPORTASI',
  'TUJUAN_KOTA', 'WAKTU_KEGIATAN', 'JABATAN', 'GOLONGAN', 'NIP', 'NAMA_PEGAWAI',
  'TIMESTAMP', 'ID_PERJADIN', 'BIRO'
];

const EXTRA_HEADER_MIGRATION = {
  ID_PERJADIN: 'ID_REGISTER',
  TIMESTAMP: 'UPDATED_AT',
  NAMA_PEGAWAI: 'NAMA_PEGAWAI_RAW',
  GOLONGAN: 'GOL_RAW',
  JABATAN: 'JABATAN_RAW',
  TUJUAN_KOTA: 'TUJUAN_LOKASI',
  MODE_TRANSPORTASI: 'MODA',
  URAIAN_KEGIATAN: 'KEGIATAN',
  STATUS_BERKAS: 'STATUS_DATA',
  CATATAN: 'KETERANGAN'
};

const BIRO_JENIS_SUFFIXES = [
  'Paket Meeting', 'Luar Negeri', 'Dalam Negeri', 'Luar Kota', 'Dalam Kota'
];

const SATKER_DISPLAY = {
  PUSDATIN: 'Pusdatin', HUKERMA: 'Hukerma', PUSTRAKA: 'Pustraka',
  BMN: 'BMN', SDMA: 'SDMA', RENKEU: 'Renkeu', UMUM: 'Umum'
};

const SATKER_CODE = {
  Pusdatin: 'PUSDATIN', Hukerma: 'HUKERMA', Pustraka: 'PUSTRAKA',
  BMN: 'BMN', SDMA: 'SDMA', Renkeu: 'RENKEU', Umum: 'UMUM'
};

const COST_FIELDS = [
  'UANG_HARIAN', 'UANG_PENGINAPAN', 'UANG_TRANSPORT', 'TAKSI_JAKARTA', 'TAKSI_DAERAH', 'TAKSI',
  'UANG_REPRESENTASI', 'HARGA_TIKET_BERANGKAT', 'HARGA_TIKET_KEMBALI', 'TIKET',
  'BIAYA_PENGEPAKAN', 'ANGKUTAN_BARANG'
];

const SHEET_SCHEMA = {
  MASTER_PEGAWAI: ['NAMA_PEGAWAI', 'NIP', 'GOLONGAN', 'JABATAN', 'SATKER'],
  MASTER_BIRO: ['BIRO'],
  MASTER_GOLONGAN: ['GOLONGAN'],
  MASTER_JABATAN: ['JABATAN'],
  MASTER_WAKTU_KEGIATAN: ['WAKTU_KEGIATAN'],
  MASTER_TUJUAN_KOTA: ['TUJUAN_KOTA'],
  MASTER_TRANSPORTASI: ['MODE_TRANSPORTASI'],
  MASTER_SATKER: ['SATKER'],
  MASTER_JENIS_PERJADIN: ['JENIS_PERJADIN']
};

const SEED_DATA = {
  MASTER_BIRO: [
    'Pusdatin Luar Kota', 'Pusdatin Dalam Kota', 'Pusdatin Paket Meeting', 'Pusdatin Luar Negeri',
    'Hukerma Luar Kota', 'Hukerma Dalam Negeri', 'Hukerma Paket Meeting', 'Hukerma Luar Negeri',
    'Pustraka Luar Kota', 'Pustraka Dalam Kota', 'Pustraka Paket Meeting', 'Pustraka Luar Negeri',
    'BMN Luar Kota', 'BMN Dalam Kota', 'BMN Paket Meeting', 'BMN Luar Negeri',
    'SDMA Luar Kota', 'SDMA Dalam Kota', 'SDMA Paket Meeting', 'SDMA Luar Negeri',
    'Renkeu Luar Kota', 'Renkeu Dalam Kota', 'Renkeu Paket Meeting', 'Renkeu Luar Negeri',
    'Umum Luar Kota', 'Umum Dalam Kota', 'Umum Paket Meeting', 'Umum Luar Negeri'
  ],
  MASTER_GOLONGAN: ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d'],
  MASTER_WAKTU_KEGIATAN: ['Dalam Kota', 'Luar Kota', 'Dalam Provinsi', 'Luar Provinsi'],
  MASTER_TRANSPORTASI: ['Darat', 'Laut', 'Udara', 'Kereta', 'Kendaraan Dinas', 'Kendaraan Pribadi', 'Travel', 'Lainnya'],
  MASTER_JENIS_PERJADIN: [
    'Perjalanan Dinas Biasa', 'Perjalanan Dinas Dalam Kota', 'Perjalanan Dinas Luar Kota',
    'Konsultasi', 'Koordinasi', 'Rapat', 'Monitoring', 'Evaluasi', 'Lainnya'
  ]
};

function onOpen() {
  setupDatabase();
}

function doGet() {
  setupDatabase();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Inisialisasi web app: setup DB + master dropdown */
function initWebApp() {
  setupDatabase();
  return {
    ok: true,
    spreadsheetName: SpreadsheetApp.getActive().getName(),
    masters: getMasterData()
  };
}

/** Buat sheet & header jika belum ada; isi seed master jika kosong */
function setupDatabase() {
  const ss = SpreadsheetApp.getActive();
  let dbSh = ss.getSheetByName(CONFIG.DB);
  if (!dbSh) {
    dbSh = ss.insertSheet(CONFIG.DB);
  }
  ensureDbHeaders_(dbSh);

  Object.keys(SHEET_SCHEMA).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
    }
    ensureMasterHeaders_(sh, SHEET_SCHEMA[name]);
    if (SEED_DATA[name]) {
      seedIfEmpty_(sh, SHEET_SCHEMA[name][0], SEED_DATA[name]);
    }
  });
  normalizeDbHeader();
}

/** Header DB hanya diisi jika sheet benar-benar kosong — tidak append kolom baru */
function ensureDbHeaders_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const row1 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const hasData = row1.some(function(c) { return String(c || '').trim() !== ''; });
  if (!hasData) {
    sh.getRange(1, 1, 1, DB_HEADERS.length).setValues([DB_HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, DB_HEADERS.length)
      .setFontWeight('bold').setBackground('#E8EEF7');
  }
}

/**
 * Migrasi/hapus kolom tambahan di DB_REKAP_PERJADIN tanpa menghapus data lama.
 * Boleh dipanggil manual dari editor script.
 */
function normalizeDbHeader() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.DB);
  if (!sh || sh.getLastRow() < 1) return { ok: true, message: 'Sheet DB tidak ditemukan atau kosong.' };

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastCol < 1) return { ok: true, message: 'Tidak ada kolom.' };

  let data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  let headers = data[0].map(function(h) { return String(h || '').trim(); });
  let changed = false;

  EXTRA_DB_HEADERS.forEach(function(extra) {
    const fromIdx = headers.indexOf(extra);
    if (fromIdx < 0) return;
    const target = EXTRA_HEADER_MIGRATION[extra] || (extra === 'BIRO' ? 'SATKER' : '');
    if (!target) return;
    const toIdx = headers.indexOf(target);
    if (toIdx < 0) return;

    for (let r = 1; r < data.length; r++) {
      const srcVal = data[r][fromIdx];
      const srcText = String(srcVal === null || srcVal === undefined ? '' : srcVal).trim();
      if (!srcText) continue;
      const dstVal = data[r][toIdx];
      const dstText = String(dstVal === null || dstVal === undefined ? '' : dstVal).trim();
      if (!dstText) {
        if (extra === 'BIRO' && target === 'SATKER') {
          const parsed = parseBiroLabel_(srcText);
          data[r][toIdx] = parsed.satker || srcText;
          if (parsed.jenis) {
            const jenisIdx = headers.indexOf('JENIS_PERJADIN');
            if (jenisIdx >= 0 && !String(data[r][jenisIdx] || '').trim()) {
              data[r][jenisIdx] = parsed.jenis;
            }
          }
        } else {
          data[r][toIdx] = srcVal;
        }
        changed = true;
      }
    }
  });

  if (changed) {
    sh.getRange(1, 1, lastRow, lastCol).setValues(data);
    headers = data[0].map(function(h) { return String(h || '').trim(); });
  }

  const colsToDelete = [];
  EXTRA_DB_HEADERS.forEach(function(extra) {
    const idx = headers.indexOf(extra);
    if (idx < 0) return;
    let canDelete = true;
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idx] === null || data[r][idx] === undefined ? '' : data[r][idx]).trim()) {
        canDelete = false;
        break;
      }
    }
    if (canDelete) colsToDelete.push(idx + 1);
  });

  colsToDelete.sort(function(a, b) { return b - a; }).forEach(function(col) {
    sh.deleteColumn(col);
    changed = true;
  });

  return { ok: true, message: changed ? 'Normalisasi header DB selesai.' : 'Header DB sudah bersih.' };
}

function getHeaderMap() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.DB);
  if (!sh) return {};
  return getHeaderMap_(sh);
}

function getHeaderMap_(sh) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
    .map(function(h) { return String(h || '').trim(); });
  const map = {};
  headers.forEach(function(h, i) {
    if (h) map[h] = i + 1;
  });
  return map;
}

function getBiro_(r) {
  return String((r && r.SATKER) || '').trim();
}

function parseBiroLabel_(label) {
  const text = String(label || '').trim();
  if (!text) return { satker: '', jenis: '' };
  for (let i = 0; i < BIRO_JENIS_SUFFIXES.length; i++) {
    const jenis = BIRO_JENIS_SUFFIXES[i];
    if (text.length > jenis.length && text.slice(-jenis.length) === jenis) {
      const satkerName = text.slice(0, text.length - jenis.length).trim();
      return {
        satker: mapSatkerCode_(satkerName),
        jenis: jenis
      };
    }
  }
  return { satker: mapSatkerCode_(text), jenis: '' };
}

function mapSatkerCode_(name) {
  const key = String(name || '').trim();
  if (!key) return '';
  if (SATKER_CODE[key]) return SATKER_CODE[key];
  return key.toUpperCase();
}

function formatBiroLabel_(satker, jenis) {
  const code = String(satker || '').trim().toUpperCase();
  const display = SATKER_DISPLAY[code] || satker;
  const j = String(jenis || '').trim();
  return j ? display + ' ' + j : String(display || '');
}

function groupRowsByBiro_(rows) {
  return rows.reduce(function(acc, row) {
    const val = getBiro_(row) || '-';
    if (!acc[val]) acc[val] = [];
    acc[val].push(row);
    return acc;
  }, {});
}

function ensureMasterHeaders_(sh, headers) {
  const lastCol = Math.max(sh.getLastColumn(), headers.length);
  const row1 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const hasData = row1.some(function(c) { return String(c || '').trim() !== ''; });
  if (!hasData) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    const hdr = sh.getRange(1, 1, 1, headers.length);
    hdr.setFontWeight('bold').setBackground('#E8EEF7');
    return;
  }
  const existing = row1.map(function(c) { return String(c || '').trim(); });
  headers.forEach(function(h) {
    if (existing.indexOf(h) === -1) {
      sh.getRange(1, existing.length + 1).setValue(h);
    }
  });
}

function seedIfEmpty_(sh, valueCol, values) {
  if (sh.getLastRow() > 1) return;
  const col = findHeaderCol_(sh, valueCol) || 1;
  values.forEach(function(v, i) {
    sh.getRange(i + 2, col).setValue(v);
  });
}

function findHeaderCol_(sh, headerName) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === headerName) return i + 1;
  }
  return null;
}

function getMasterData() {
  setupDatabase();
  return {
    pegawai: readMasterPegawai_(),
    golongan: readMasterList_('MASTER_GOLONGAN', 'GOLONGAN'),
    jabatan: readMasterList_('MASTER_JABATAN', 'JABATAN'),
    waktuKegiatan: readMasterList_('MASTER_WAKTU_KEGIATAN', 'WAKTU_KEGIATAN'),
    tujuanKota: readMasterList_('MASTER_TUJUAN_KOTA', 'TUJUAN_KOTA'),
    transportasi: readMasterList_('MASTER_TRANSPORTASI', 'MODE_TRANSPORTASI'),
    biro: readMasterList_('MASTER_BIRO', 'BIRO'),
    jenisPerjadin: readMasterList_('MASTER_JENIS_PERJADIN', 'JENIS_PERJADIN')
  };
}

function readMasterList_(sheetName, colName) {
  const rows = readObjects_(sheetName);
  return unique_(rows.map(function(r) { return String(r[colName] || '').trim(); }).filter(Boolean)).sort();
}

function readMasterPegawai_() {
  return readObjects_('MASTER_PEGAWAI').map(function(r) {
    return {
      nama: String(r.NAMA_PEGAWAI || r.NAMA || '').trim(),
      nip: String(r.NIP || '').trim(),
      golongan: String(r.GOLONGAN || '').trim(),
      jabatan: String(r.JABATAN || '').trim(),
      unitKerja: String(r.SATKER || '').trim()
    };
  }).filter(function(p) { return p.nama; });
}

function getFilterOptions() {
  const rows = readDbRows_();
  const years = unique_(rows.map(function(r) { return r.TAHUN; }).filter(Boolean)).sort();
  const months = unique_(rows.map(function(r) { return r.BULAN; }).filter(Boolean)).sort();
  const birosFromDb = unique_(rows.map(function(r) {
    return r.biroLabel || getBiro_(r);
  }).filter(Boolean));
  const birosMaster = readMasterList_('MASTER_BIRO', 'BIRO');
  const biros = unique_(birosFromDb.concat(birosMaster)).sort();
  const jenis = unique_(rows.map(function(r) { return r.JENIS_PERJADIN; }).filter(Boolean)).sort();
  const statuses = ['Lengkap', 'Proses Verifikasi', 'Belum Lengkap'];

  return {
    years: years.length ? years : [String(new Date().getFullYear())],
    months: months,
    biros: biros,
    jenis: jenis,
    statuses: statuses
  };
}

function getDashboardData(filters) {
  filters = filters || {};
  setupDatabase();
  const rowsAll = readDbRows_();
  const rows = applyFilters_(rowsAll, filters);

  const totalRegister = rows.length;
  const biroAktif = unique_(rows.map(function(r) { return getBiro_(r); }).filter(Boolean)).length;

  const statusCounts = {
    lengkap: rows.filter(function(r) { return isStatus_(r, 'Lengkap'); }).length,
    proses: rows.filter(function(r) { return isStatus_(r, 'Proses Verifikasi'); }).length,
    belum: rows.filter(function(r) { return isStatus_(r, 'Belum Lengkap'); }).length
  };

  const trend = buildTrend_(rows, filters.tahun);
  const byBiro = groupRowsByBiro_(rows);
  const topBiro = Object.keys(byBiro).map(function(k) {
    const data = byBiro[k];
    return {
      biro: k || '-',
      register: data.length,
      progress: pct_(data.filter(function(r) { return isStatus_(r, 'Lengkap'); }).length, data.length)
    };
  }).sort(function(a, b) { return b.progress - a.progress || b.register - a.register; }).slice(0, 5);

  const selisihBiro = Object.keys(byBiro).map(function(k) {
    const data = byBiro[k];
    return {
      biro: k || '-',
      selisih: data.filter(function(r) { return !isStatus_(r, 'Lengkap'); }).length,
      total: data.length
    };
  }).sort(function(a, b) { return b.selisih - a.selisih; }).slice(0, 8);

  const byJenis = groupRows_(rows, 'JENIS_PERJADIN');
  const jenisSummary = Object.keys(byJenis).map(function(k) {
    return { jenis: k || '-', register: byJenis[k].length, totalBiaya: biaya_(byJenis[k]) };
  }).sort(function(a, b) { return b.register - a.register; });

  const recent = rows.slice().sort(function(a, b) {
    return String(b.TANGGAL_MULAI_RAW || '').localeCompare(String(a.TANGGAL_MULAI_RAW || ''));
  }).slice(0, 8).map(mapRecent_);

  const table = rows.slice(0, 100).map(mapTableRow_);
  const tableAll = rows.map(mapTableRow_);

  const biroSummary = Object.keys(byBiro).map(function(k) {
    const data = byBiro[k];
    const lengkap = data.filter(function(r) { return isStatus_(r, 'Lengkap'); }).length;
    const proses = data.filter(function(r) { return isStatus_(r, 'Proses Verifikasi'); }).length;
    const belum = data.filter(function(r) { return isStatus_(r, 'Belum Lengkap'); }).length;
    return {
      biro: k || '-',
      register: data.length,
      lengkap: lengkap,
      proses: proses,
      belum: belum,
      persen: pct_(lengkap, data.length),
      totalBiaya: biaya_(data)
    };
  }).sort(function(a, b) { return b.register - a.register; });

  const byBulan = groupRows_(rows, 'BULAN');
  const bulanSummary = Object.keys(byBulan).map(function(k) {
    return {
      bulan: k || '-',
      label: formatBulanLabel_(k),
      register: byBulan[k].length,
      lengkap: byBulan[k].filter(function(r) { return isStatus_(r, 'Lengkap'); }).length,
      totalBiaya: biaya_(byBulan[k])
    };
  }).sort(function(a, b) { return String(a.bulan).localeCompare(String(b.bulan)); });

  const masters = getMasterData();

  return {
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm'),
    filters: filters,
    kpi: {
      totalRegister: totalRegister,
      totalPeserta: totalRegister,
      biroAktif: biroAktif,
      totalBiaya: biaya_(rows),
      lengkap: statusCounts.lengkap,
      proses: statusCounts.proses,
      belum: statusCounts.belum,
      persenLengkap: pct_(statusCounts.lengkap, totalRegister),
      persenProses: pct_(statusCounts.proses, totalRegister),
      persenBelum: pct_(statusCounts.belum, totalRegister)
    },
    donut: [
      { label: 'Lengkap', value: statusCounts.lengkap, color: '#22C55E' },
      { label: 'Proses Verifikasi', value: statusCounts.proses, color: '#F59E0B' },
      { label: 'Belum Lengkap', value: statusCounts.belum, color: '#EF4444' }
    ],
    trend: trend,
    topBiro: topBiro,
    selisihBiro: selisihBiro,
    jenisSummary: jenisSummary,
    biroSummary: biroSummary,
    bulanSummary: bulanSummary,
    recent: recent,
    table: table,
    tableAll: tableAll,
    masterBiros: masters.biro,
    masterJenis: masters.jenisPerjadin,
    masterPegawai: masters.pegawai.slice(0, 200),
    totalMasterPegawai: masters.pegawai.length,
    masters: masters,
    spreadsheetName: SpreadsheetApp.getActive().getName()
  };
}

function getPerjadinTable(filters) {
  filters = filters || {};
  const rows = applyFilters_(readDbRows_(), filters);
  return { rows: rows.map(mapTableRow_), total: rows.length };
}

function savePerjadin(formData) {
  try {
    setupDatabase();
    const v = validatePerjadin_(formData, false);
    if (!v.ok) return { ok: false, message: v.message };

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(CONFIG.DB);
    const now = new Date();
    const id = generatePerjadinId_(now);
    const rowObj = buildDbRow_(formData, id, now, true);
    const newRowIndex = appendDbRow_(sh, rowObj);
    if (newRowIndex > 0) {
      writeDbCell_(sh, newRowIndex, 'SOURCE_ROW', newRowIndex);
    }
    maybeAddTujuanKota_(formData.tujuanKota || formData.tujuanLokasi);

    return { ok: true, message: 'Data perjadin berhasil disimpan.', id: id };
  } catch (e) {
    return { ok: false, message: String(e.message || e) };
  }
}

function updatePerjadin(id, formData) {
  try {
    setupDatabase();
    const v = validatePerjadin_(formData, true);
    if (!v.ok) return { ok: false, message: v.message };

    const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.DB);
    const idx = findRowById_(sh, id);
    if (idx < 0) return { ok: false, message: 'Data tidak ditemukan.' };

    const existing = readObjects_(CONFIG.DB).find(function(r) {
      return String(r.ID_REGISTER || r.ID_PERJADIN) === String(id);
    });
    const row = buildDbRow_(formData, id, new Date(), false, existing);
    writeDbRow_(sh, idx, row);
    maybeAddTujuanKota_(formData.tujuanKota || formData.tujuanLokasi);

    return { ok: true, message: 'Data perjadin berhasil diperbarui.', id: id };
  } catch (e) {
    return { ok: false, message: String(e.message || e) };
  }
}

function deletePerjadin(id) {
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.DB);
    const idx = findRowById_(sh, id);
    if (idx < 0) return { ok: false, message: 'Data tidak ditemukan.' };
    sh.deleteRow(idx);
    return { ok: true, message: 'Data perjadin berhasil dihapus.' };
  } catch (e) {
    return { ok: false, message: String(e.message || e) };
  }
}

function addMasterEntry(sheetKey, value) {
  try {
    setupDatabase();
    const name = String(sheetKey || '').trim();
    const val = String(value || '').trim();
    if (!SHEET_SCHEMA[name] || !val) {
      return { ok: false, message: 'Sheet master atau nilai tidak valid.' };
    }
    const col = SHEET_SCHEMA[name][0];
    const list = readMasterList_(name, col);
    if (list.indexOf(val) > -1) {
      return { ok: true, message: 'Data sudah ada di master.' };
    }
    const sh = SpreadsheetApp.getActive().getSheetByName(name);
    sh.appendRow([val]);
    return { ok: true, message: 'Master berhasil ditambahkan.' };
  } catch (e) {
    return { ok: false, message: String(e.message || e) };
  }
}

function validatePerjadin_(f, isUpdate) {
  f = f || {};
  const biroLabel = String(f.selectedBiroLabel || f.biro || '').trim();
  if (!biroLabel) {
    return { ok: false, message: 'Silakan pilih Biro terlebih dahulu.' };
  }
  const required = [
    ['namaPegawai', 'Nama Pegawai'],
    ['golongan', 'Golongan'],
    ['jabatan', 'Jabatan'],
    ['tanggalMulai', 'Tanggal Mulai'],
    ['tanggalSelesai', 'Tanggal Selesai'],
    ['tujuanKota', 'Tujuan/Kota'],
    ['modeTransportasi', 'Mode Transportasi'],
    ['statusBerkas', 'Status Berkas']
  ];
  for (let i = 0; i < required.length; i++) {
    const key = required[i][0];
    const label = required[i][1];
    if (!String(f[key] || '').trim()) {
      return { ok: false, message: label + ' wajib diisi.' };
    }
  }
  const mulai = parseDateInput_(f.tanggalMulai);
  const selesai = parseDateInput_(f.tanggalSelesai);
  if (!mulai || !selesai) {
    return { ok: false, message: 'Format tanggal tidak valid.' };
  }
  if (selesai < mulai) {
    return { ok: false, message: 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.' };
  }
  return { ok: true };
}

function buildDbRow_(f, id, now, isNew, existing) {
  const tz = Session.getScriptTimeZone();
  const ts = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
  const biroLabel = String(f.selectedBiroLabel || f.biro || '').trim();
  const parsedBiro = parseBiroLabel_(biroLabel);
  const mulai = parseDateInput_(f.tanggalMulai);
  const selesai = parseDateInput_(f.tanggalSelesai);
  const tahun = mulai ? String(mulai.getFullYear()) : String((existing && existing.TAHUN) || '');
  const bulan = mulai
    ? tahun + '-' + String(mulai.getMonth() + 1).padStart(2, '0')
    : String((existing && existing.BULAN) || '');
  const durasi = calcDurasiHari_(mulai, selesai);
  const costs = {};
  let totalBiaya = 0;
  COST_FIELDS.forEach(function(field) {
    const val = toNumber_(f[field]);
    costs[field] = val;
    totalBiaya += val;
  });

  const row = {
    ID_REGISTER: id,
    TAHUN: tahun,
    BULAN: bulan,
    SATKER: parsedBiro.satker || String((existing && existing.SATKER) || '').trim(),
    JENIS_PERJADIN: parsedBiro.jenis || String((existing && existing.JENIS_PERJADIN) || '').trim(),
    NO: isNew ? nextDbNo_() : ((existing && String(existing.NO || '').trim()) ? existing.NO : nextDbNo_()),
    KEGIATAN: String(f.uraianKegiatan || f.kegiatan || '').trim(),
    NO_SPM: String((existing && existing.NO_SPM) || '').trim(),
    NAMA_PEGAWAI_RAW: String(f.namaPegawai || '').trim(),
    JUMLAH_PEGAWAI: 1,
    GOL_RAW: String(f.golongan || '').trim(),
    JABATAN_RAW: String(f.jabatan || '').trim(),
    DURASI_HARI: durasi,
    TANGGAL_MULAI: formatDateStore_(f.tanggalMulai),
    TANGGAL_SELESAI: formatDateStore_(f.tanggalSelesai),
    TUJUAN_LOKASI: String(f.tujuanKota || f.tujuanLokasi || '').trim(),
    MODA: String(f.modeTransportasi || f.moda || '').trim(),
    UANG_HARIAN: costs.UANG_HARIAN || 0,
    UANG_PENGINAPAN: costs.UANG_PENGINAPAN || 0,
    UANG_TRANSPORT: costs.UANG_TRANSPORT || 0,
    TAKSI_JAKARTA: costs.TAKSI_JAKARTA || 0,
    TAKSI_DAERAH: costs.TAKSI_DAERAH || 0,
    TAKSI: costs.TAKSI || 0,
    UANG_REPRESENTASI: costs.UANG_REPRESENTASI || 0,
    HARGA_TIKET_BERANGKAT: costs.HARGA_TIKET_BERANGKAT || 0,
    HARGA_TIKET_KEMBALI: costs.HARGA_TIKET_KEMBALI || 0,
    TIKET: costs.TIKET || 0,
    BIAYA_PENGEPAKAN: costs.BIAYA_PENGEPAKAN || 0,
    ANGKUTAN_BARANG: costs.ANGKUTAN_BARANG || 0,
    TOTAL_BIAYA: totalBiaya,
    NAMA_PENGINAPAN: String(f.namaPenginapan || (existing && existing.NAMA_PENGINAPAN) || '').trim(),
    KETERANGAN: String(f.catatan || f.keterangan || '').trim(),
    STATUS_DATA: String(f.statusBerkas || f.statusData || '').trim(),
    CATATAN_VALIDASI: String(f.catatanValidasi || (existing && existing.CATATAN_VALIDASI) || '').trim(),
    SOURCE_SHEET: 'WEB_INPUT',
    SOURCE_ROW: existing ? String(existing.SOURCE_ROW || '') : '',
    UPDATED_AT: ts
  };

  if (!isNew && existing) {
    if (!row.NO_SPM && existing.NO_SPM) row.NO_SPM = existing.NO_SPM;
    if (!row.NO && existing.NO) row.NO = existing.NO;
    if (!row.SOURCE_SHEET && existing.SOURCE_SHEET) row.SOURCE_SHEET = existing.SOURCE_SHEET;
  }
  return row;
}

function calcDurasiHari_(mulai, selesai) {
  if (!mulai || !selesai) return 0;
  const diff = Math.floor((selesai.getTime() - mulai.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

function nextDbNo_() {
  const rows = readObjects_(CONFIG.DB);
  let maxNo = 0;
  rows.forEach(function(r) {
    const n = Number(String(r.NO || '').replace(/[^\d]/g, ''));
    if (!isNaN(n) && n > maxNo) maxNo = n;
  });
  return maxNo + 1;
}

function appendDbRow_(sh, rowObj) {
  const map = getHeaderMap_(sh);
  const width = sh.getLastColumn();
  const arr = new Array(width);
  for (let i = 0; i < width; i++) arr[i] = '';
  DB_HEADERS.forEach(function(h) {
    if (map[h] && rowObj[h] !== undefined) arr[map[h] - 1] = rowObj[h];
  });
  sh.appendRow(arr);
  return sh.getLastRow();
}

function writeDbRow_(sh, rowIndex, rowObj) {
  const map = getHeaderMap_(sh);
  DB_HEADERS.forEach(function(h) {
    if (map[h] && rowObj[h] !== undefined) {
      sh.getRange(rowIndex, map[h]).setValue(rowObj[h]);
    }
  });
}

function writeDbCell_(sh, rowIndex, header, value) {
  const map = getHeaderMap_(sh);
  if (map[header]) sh.getRange(rowIndex, map[header]).setValue(value);
}

function generatePerjadinId_(date) {
  const tz = Session.getScriptTimeZone();
  const ymd = Utilities.formatDate(date, tz, 'yyyyMMdd');
  const prefix = 'PERJ-' + ymd + '-';
  const rows = readObjects_(CONFIG.DB);
  let maxSeq = 0;
  rows.forEach(function(r) {
    const id = String(r.ID_REGISTER || r.ID_PERJADIN || '');
    if (id.indexOf(prefix) === 0) {
      const seq = Number(id.slice(prefix.length));
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  });
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

function maybeAddTujuanKota_(kota) {
  const val = String(kota || '').trim();
  if (!val || val === 'Lainnya') return;
  const list = readMasterList_('MASTER_TUJUAN_KOTA', 'TUJUAN_KOTA');
  if (list.indexOf(val) === -1) {
    addMasterEntry('MASTER_TUJUAN_KOTA', val);
  }
}

function readDbRows_() {
  return readObjects_(CONFIG.DB).map(normalizeDbRow_);
}

function normalizeDbRow_(r) {
  const mulai = r.TANGGAL_MULAI || r.TANGGAL || '';
  const parsed = parseDateInput_(mulai);
  const tahun = String(r.TAHUN || '').trim() || (parsed ? String(parsed.getFullYear()) : '');
  const bulan = String(r.BULAN || '').trim() || (parsed
    ? tahun + '-' + String(parsed.getMonth() + 1).padStart(2, '0')
    : '');
  const satker = String(r.SATKER || r.BIRO || '').trim();
  const jenis = String(r.JENIS_PERJADIN || '').trim();
  const totalBiaya = toNumber_(r.TOTAL_BIAYA) || sum_(COST_FIELDS.map(function(f) { return toNumber_(r[f]); }));

  return {
    ID_REGISTER: String(r.ID_REGISTER || r.ID_PERJADIN || '').trim(),
    TAHUN: tahun,
    BULAN: bulan,
    SATKER: satker,
    JENIS_PERJADIN: jenis,
    NO: r.NO,
    KEGIATAN: String(r.KEGIATAN || r.URAIAN_KEGIATAN || '').trim(),
    NO_SPM: String(r.NO_SPM || '').trim(),
    NAMA_PEGAWAI_RAW: String(r.NAMA_PEGAWAI_RAW || r.NAMA_PEGAWAI || r.NAMA || '').trim(),
    JUMLAH_PEGAWAI: toNumber_(r.JUMLAH_PEGAWAI) || 1,
    GOL_RAW: String(r.GOL_RAW || r.GOLONGAN || '').trim(),
    JABATAN_RAW: String(r.JABATAN_RAW || r.JABATAN || '').trim(),
    DURASI_HARI: toNumber_(r.DURASI_HARI),
    TANGGAL_MULAI_RAW: mulai,
    TANGGAL_MULAI: mulai,
    TANGGAL_SELESAI: r.TANGGAL_SELESAI || '',
    TUJUAN_LOKASI: String(r.TUJUAN_LOKASI || r.TUJUAN_KOTA || '').trim(),
    MODA: String(r.MODA || r.MODE_TRANSPORTASI || '').trim(),
    TOTAL_BIAYA: totalBiaya,
    NAMA_PENGINAPAN: String(r.NAMA_PENGINAPAN || '').trim(),
    KETERANGAN: String(r.KETERANGAN || r.CATATAN || '').trim(),
    STATUS_DATA: String(r.STATUS_DATA || r.STATUS_BERKAS || '').trim(),
    CATATAN_VALIDASI: String(r.CATATAN_VALIDASI || '').trim(),
    SOURCE_SHEET: String(r.SOURCE_SHEET || '').trim(),
    SOURCE_ROW: r.SOURCE_ROW,
    UPDATED_AT: r.UPDATED_AT || r.TIMESTAMP,
    biroLabel: formatBiroLabel_(satker, jenis)
  };
}

function mapTableRow_(r) {
  return {
    id: r.ID_REGISTER || '-',
    nama: r.NAMA_PEGAWAI_RAW || '-',
    biro: getBiro_(r) || '-',
    biroLabel: r.biroLabel || formatBiroLabel_(r.SATKER, r.JENIS_PERJADIN) || '-',
    jenis: r.JENIS_PERJADIN || '-',
    kegiatan: r.KEGIATAN || '-',
    tanggal: formatDate_(r.TANGGAL_MULAI),
    tanggalSelesai: formatDate_(r.TANGGAL_SELESAI),
    tanggalMulaiIso: formatDateStore_(r.TANGGAL_MULAI),
    tanggalSelesaiIso: formatDateStore_(r.TANGGAL_SELESAI),
    tujuan: r.TUJUAN_LOKASI || '-',
    transportasi: r.MODA || '-',
    golongan: r.GOL_RAW || '-',
    jabatan: r.JABATAN_RAW || '-',
    status: r.STATUS_DATA || '-',
    catatan: r.KETERANGAN || '-',
    bulan: r.BULAN || '-',
    tahun: r.TAHUN || '-',
    noSpm: r.NO_SPM || '-',
    peserta: r.JUMLAH_PEGAWAI || 1,
    totalBiaya: r.TOTAL_BIAYA || 0
  };
}

function mapRecent_(r) {
  return {
    status: r.STATUS_DATA || '-',
    biro: getBiro_(r) || '-',
    jenis: r.JENIS_PERJADIN || '-',
    register: r.NAMA_PEGAWAI_RAW || r.ID_REGISTER || '-',
    kegiatan: r.KEGIATAN || '-',
    tanggal: formatDate_(r.TANGGAL_MULAI),
    biaya: r.TOTAL_BIAYA || 0
  };
}

function findRowById_(sh, id) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return -1;
  const headers = data[0].map(function(h) { return String(h || '').trim(); });
  let col = headers.indexOf('ID_REGISTER');
  if (col < 0) col = headers.indexOf('ID_PERJADIN');
  if (col < 0) return -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][col]) === String(id)) return i + 1;
  }
  return -1;
}

function applyFilters_(rows, f) {
  return rows.filter(function(r) {
    if (f.tahun && f.tahun !== 'Semua' && String(r.TAHUN) !== String(f.tahun)) return false;
    if (f.bulan && f.bulan !== 'Semua' && String(r.BULAN) !== String(f.bulan)) return false;
    const filterBiro = f.biro || f.satker;
    if (filterBiro && filterBiro !== 'Semua') {
      const parsed = parseBiroLabel_(filterBiro);
      if (parsed.jenis) {
        if (String(r.SATKER) !== parsed.satker || String(r.JENIS_PERJADIN) !== parsed.jenis) return false;
      } else if (String(getBiro_(r)) !== String(filterBiro) && String(r.SATKER) !== parsed.satker) {
        return false;
      }
    }
    if (f.jenis && f.jenis !== 'Semua' && String(r.JENIS_PERJADIN) !== String(f.jenis)) return false;
    if (f.status && f.status !== 'Semua' && String(r.STATUS_DATA) !== String(f.status)) return false;
    return true;
  });
}

function readObjects_(sheetName) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const data = sh.getDataRange().getDisplayValues();
  if (!data || data.length < 2) return [];
  const headers = data[0].map(function(h) { return String(h || '').trim(); });
  return data.slice(1)
    .filter(function(row) { return row.join('').trim() !== ''; })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
}

function buildTrend_(rows, selectedYear) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const year = selectedYear && selectedYear !== 'Semua'
    ? String(selectedYear)
    : (rows[0] && rows[0].TAHUN) || String(new Date().getFullYear());

  return labels.map(function(label, idx) {
    const key = year + '-' + String(idx + 1).padStart(2, '0');
    const monthly = rows.filter(function(r) { return String(r.BULAN) === key; });
    return {
      label: label,
      total: monthly.length,
      lengkap: monthly.filter(function(r) { return isStatus_(r, 'Lengkap'); }).length,
      proses: monthly.filter(function(r) { return isStatus_(r, 'Proses Verifikasi'); }).length,
      belum: monthly.filter(function(r) { return isStatus_(r, 'Belum Lengkap'); }).length
    };
  });
}

function groupRows_(rows, key) {
  return rows.reduce(function(acc, row) {
    const val = String(row[key] || '-').trim() || '-';
    if (!acc[val]) acc[val] = [];
    acc[val].push(row);
    return acc;
  }, {});
}

function isStatus_(row, status) {
  return String(row.STATUS_DATA || row.STATUS_BERKAS || '').toLowerCase() === String(status || '').toLowerCase();
}

function parseDateInput_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const d = new Date(text);
  return isNaN(d) ? null : d;
}

function formatDateStore_(value) {
  const d = parseDateInput_(value);
  if (!d) return String(value || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatBulanLabel_(bulanKey) {
  const text = String(bulanKey || '').trim();
  const m = text.match(/^(\d{4})-(\d{2})$/);
  if (!m) return text || '-';
  const names = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const idx = Number(m[2]);
  return (names[idx] || m[2]) + ' ' + m[1];
}

function formatDate_(value) {
  if (!value) return '-';
  const d = parseDateInput_(value);
  if (!d) return String(value);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function pct_(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 10000) / 100;
}

function unique_(arr) {
  return Array.from(new Set(arr));
}

function sum_(arr) {
  return arr.reduce(function(a, b) { return a + b; }, 0);
}

function biaya_(rows) {
  return sum_(rows.map(function(r) { return toNumber_(r.TOTAL_BIAYA); }));
}

function toNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

;window.__GAS_SERVER__ = {onOpen: onOpen, doGet: doGet, include: include, initWebApp: initWebApp, setupDatabase: setupDatabase, ensureDbHeaders_: ensureDbHeaders_, normalizeDbHeader: normalizeDbHeader, getHeaderMap: getHeaderMap, getHeaderMap_: getHeaderMap_, getBiro_: getBiro_, parseBiroLabel_: parseBiroLabel_, mapSatkerCode_: mapSatkerCode_, formatBiroLabel_: formatBiroLabel_, groupRowsByBiro_: groupRowsByBiro_, ensureMasterHeaders_: ensureMasterHeaders_, seedIfEmpty_: seedIfEmpty_, findHeaderCol_: findHeaderCol_, getMasterData: getMasterData, readMasterList_: readMasterList_, readMasterPegawai_: readMasterPegawai_, getFilterOptions: getFilterOptions, getDashboardData: getDashboardData, getPerjadinTable: getPerjadinTable, savePerjadin: savePerjadin, updatePerjadin: updatePerjadin, deletePerjadin: deletePerjadin, addMasterEntry: addMasterEntry, validatePerjadin_: validatePerjadin_, buildDbRow_: buildDbRow_, calcDurasiHari_: calcDurasiHari_, nextDbNo_: nextDbNo_, appendDbRow_: appendDbRow_, writeDbRow_: writeDbRow_, writeDbCell_: writeDbCell_, generatePerjadinId_: generatePerjadinId_, maybeAddTujuanKota_: maybeAddTujuanKota_, readDbRows_: readDbRows_, normalizeDbRow_: normalizeDbRow_, mapTableRow_: mapTableRow_, mapRecent_: mapRecent_, findRowById_: findRowById_, applyFilters_: applyFilters_, readObjects_: readObjects_, buildTrend_: buildTrend_, groupRows_: groupRows_, isStatus_: isStatus_, parseDateInput_: parseDateInput_, formatDateStore_: formatDateStore_, formatBulanLabel_: formatBulanLabel_, formatDate_: formatDate_, pct_: pct_, unique_: unique_, sum_: sum_, biaya_: biaya_, toNumber_: toNumber_};
})();
