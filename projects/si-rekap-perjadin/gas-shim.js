/* ================================================================
   Browser stand-in for Google Apps Script, so the original Code.gs
   runs unchanged in this demo:
   - SpreadsheetApp: an in-memory spreadsheet (sheets = 2D arrays),
     saved to localStorage so visitors' edits survive a refresh
   - Utilities.formatDate, Session.getScriptTimeZone
   - google.script.run: calls the server functions asynchronously
   ================================================================ */
(function () {
  "use strict";
  var STORE_KEY = "sirekap-demo-v1";
  var BOOK_NAME = "Demo - Rekap Perjadin (data simulasi)";

  function load() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* storage unavailable: fall back to the seed */ }
    return JSON.parse(JSON.stringify(window.SIREKAP_SEED || {}));
  }
  var book = load();

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(book)); } catch (e) { /* ignore */ }
  }

  function lastRow(data) {
    for (var r = data.length - 1; r >= 0; r--) {
      if (data[r].some(function (c) { return String(c === null || c === undefined ? "" : c) !== ""; })) return r + 1;
    }
    return 0;
  }
  function lastCol(data) {
    var max = 0;
    data.forEach(function (row) {
      for (var c = row.length - 1; c >= 0; c--) {
        if (String(row[c] === null || row[c] === undefined ? "" : row[c]) !== "") { max = Math.max(max, c + 1); break; }
      }
    });
    return max;
  }

  function Range(sheet, row, col, numRows, numCols) {
    this.s = sheet; this.r = row; this.c = col;
    this.nr = numRows || 1; this.nc = numCols || 1;
  }
  Range.prototype.getValues = function () {
    var out = [];
    for (var i = 0; i < this.nr; i++) {
      var src = this.s.data[this.r - 1 + i] || [], row = [];
      for (var j = 0; j < this.nc; j++) {
        var v = src[this.c - 1 + j];
        row.push(v === undefined || v === null ? "" : v);
      }
      out.push(row);
    }
    return out;
  };
  Range.prototype.getDisplayValues = function () {
    return this.getValues().map(function (row) { return row.map(function (v) { return String(v); }); });
  };
  Range.prototype.getValue = function () { return this.getValues()[0][0]; };
  Range.prototype.setValues = function (values) {
    for (var i = 0; i < values.length; i++) {
      var ri = this.r - 1 + i;
      while (this.s.data.length <= ri) this.s.data.push([]);
      for (var j = 0; j < values[i].length; j++) this.s.data[ri][this.c - 1 + j] = values[i][j];
    }
    return this;
  };
  Range.prototype.setValue = function (v) { return this.setValues([[v]]); };
  Range.prototype.setFontWeight = function () { return this; };
  Range.prototype.setBackground = function () { return this; };

  function Sheet(name, data) { this.name = name; this.data = data; }
  Sheet.prototype.getName = function () { return this.name; };
  Sheet.prototype.getLastRow = function () { return lastRow(this.data); };
  Sheet.prototype.getLastColumn = function () { return lastCol(this.data); };
  Sheet.prototype.getRange = function (row, col, numRows, numCols) { return new Range(this, row, col, numRows, numCols); };
  Sheet.prototype.getDataRange = function () {
    return new Range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1));
  };
  Sheet.prototype.appendRow = function (values) {
    this.data.length = this.getLastRow();
    this.data.push(values.slice());
    return this;
  };
  Sheet.prototype.deleteRow = function (row) { this.data.splice(row - 1, 1); };
  Sheet.prototype.deleteColumn = function (col) { this.data.forEach(function (r) { r.splice(col - 1, 1); }); };
  Sheet.prototype.setFrozenRows = function () {};

  var spreadsheet = {
    getName: function () { return BOOK_NAME; },
    getSheetByName: function (name) { return book[name] ? new Sheet(name, book[name]) : null; },
    insertSheet: function (name) { book[name] = book[name] || []; return new Sheet(name, book[name]); }
  };

  window.SpreadsheetApp = {
    getActive: function () { return spreadsheet; },
    getActiveSpreadsheet: function () { return spreadsheet; }
  };
  window.Session = { getScriptTimeZone: function () { return "Asia/Jakarta"; } };

  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function pad(n, w) { n = String(n); while (n.length < w) n = "0" + n; return n; }
  window.Utilities = {
    formatDate: function (d, tz, pattern) {
      d = new Date(d);
      var map = {
        yyyy: d.getFullYear(), MMM: MON[d.getMonth()], MM: pad(d.getMonth() + 1, 2), dd: pad(d.getDate(), 2),
        HH: pad(d.getHours(), 2), mm: pad(d.getMinutes(), 2), ss: pad(d.getSeconds(), 2)
      };
      return pattern.replace(/yyyy|MMM|MM|dd|HH|mm|ss/g, function (t) { return map[t]; });
    }
  };

  /* google.script.run: each call runs on the next tick and hands a JSON copy to the handlers */
  var MUTATING = { savePerjadin: 1, updatePerjadin: 1, deletePerjadin: 1, addMasterEntry: 1 };
  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === "withSuccessHandler") return function (fn) { return runner(fn, fail); };
        if (name === "withFailureHandler") return function (fn) { return runner(ok, fn); };
        if (name === "withUserObject") return function () { return runner(ok, fail); };
        return function () {
          var args = JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments)));
          setTimeout(function () {
            var server = window.__GAS_SERVER__ || {};
            try {
              if (typeof server[name] !== "function") throw new Error("Server function not found: " + name);
              var res = server[name].apply(null, args);
              if (MUTATING[name]) persist();
              if (ok) ok(res === undefined ? undefined : JSON.parse(JSON.stringify(res)));
            } catch (e) {
              if (window.console) console.error(e);
              if (fail) fail(e); else throw e;
            }
          }, 120);
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = { run: runner(null, null) };

  window.SIREKAP_RESET = function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    location.reload();
  };
})();
