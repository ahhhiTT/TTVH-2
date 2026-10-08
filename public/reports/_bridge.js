/* Bridge between the Marketing Ecom dashboard and the report tools.
 *
 * The dashboard embeds a tool with ?from=YYYY-MM-DD&to=YYYY-MM-DD&scope=<text>.
 * This script (loaded at the end of each tool) shows that shared filter inside
 * the tool and exposes window.TTVH2 for the few lines the tools call.
 * Without those params (tool opened on its own) it does nothing and every
 * tool behaves exactly as before.
 *
 * Modes, set on the script tag (agreed with the Director 2026-10-08):
 *   data-mode="rows"            tool keeps only rows dated inside the period
 *   data-mode="calc" data-input="<id>"   prefill a date input with the period end
 *   data-mode="none"            no time filtering, only show the shared filter
 */
(function () {
  var script = document.currentScript;
  var mode = (script && script.getAttribute("data-mode")) || "none";
  var inputId = script && script.getAttribute("data-input");
  var p = new URLSearchParams(location.search);
  var iso = /^\d{4}-\d{2}-\d{2}$/;
  var from = p.get("from");
  var to = p.get("to");
  var scope = p.get("scope") || "";
  if (!iso.test(from || "") || !iso.test(to || "")) return;
  if (from > to) { var t = from; from = to; to = t; }

  var en = location.pathname.indexOf("/reports/en/") !== -1;
  var T = en
    ? {
        shared: "Shared filter from the Dashboard",
        rows: "This tool only counts data dated {from} to {to}.",
        last: "Last run: {out} rows outside the period and {nodate} rows without a date were left out.",
        calc: "Calculation date prefilled with {to}, the last day of the period. You can change it in the tool.",
        none: "This tool does not filter by period and keeps its own logic. Upload the export file that matches the scope above.",
        outside: "Outside the shared filter period",
        noDate: "No date, period cannot be checked",
      }
    : {
        shared: "Bộ lọc chung từ Dashboard",
        rows: "Công cụ này chỉ tính dữ liệu có ngày từ {from} đến {to}.",
        last: "Lần chạy gần nhất: bỏ {out} dòng ngoài kỳ và {nodate} dòng không có ngày.",
        calc: "Ngày tính toán đã điền sẵn là {to}, ngày cuối kỳ. Có thể đổi trong công cụ.",
        none: "Công cụ này không lọc theo kỳ, giữ nguyên cách tính của công cụ. Hãy tải file export đúng phạm vi ở trên.",
        outside: "Ngoài kỳ của bộ lọc chung",
        noDate: "Không có ngày, không xét được kỳ",
      };
  var dmy = function (s) { return s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4); };
  var fill = function (s) {
    return s.replace("{from}", dmy(from)).replace("{to}", dmy(to));
  };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var dayOf = function (d) {
    // Not instanceof: a Date made in another frame must still count.
    if (Object.prototype.toString.call(d) !== "[object Date]" || isNaN(d.getTime())) return null;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };

  // Counters for the banner. They reset at the first call of each new run
  // (a run parses all rows synchronously, in one task).
  var counts = { out: 0, nodate: 0 };
  var fresh = true;
  var lastLine = null;
  function tick() {
    if (fresh) {
      counts = { out: 0, nodate: 0 };
      fresh = false;
      setTimeout(function () { fresh = true; render(); }, 0);
    }
  }
  function render() {
    if (lastLine) lastLine.textContent = counts.out || counts.nodate
      ? T.last.replace("{out}", counts.out).replace("{nodate}", counts.nodate)
      : "";
  }

  // Reason a row is left out, or null when it is inside the period.
  function exclude(date) {
    if (mode !== "rows") return null;
    tick();
    var day = dayOf(date);
    if (day === null) { counts.nodate++; return T.noDate; }
    if (day < from || day > to) { counts.out++; return T.outside; }
    return null;
  }

  window.TTVH2 = {
    from: from,
    to: to,
    scope: scope,
    exclude: exclude,
    skip: function (date) { return exclude(date) !== null; },
  };

  function banner() {
    var bar = document.createElement("div");
    bar.setAttribute("data-ttvh2-bridge", "");
    bar.style.cssText =
      "position:sticky;top:0;z-index:2147483000;padding:8px 14px;font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;" +
      "background:#171717;color:#fafafa;border-bottom:1px solid #333";
    var a = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = T.shared + ": ";
    a.appendChild(b);
    a.appendChild(document.createTextNode(scope));
    var c = document.createElement("div");
    c.style.opacity = "0.85";
    c.textContent = fill(mode === "rows" ? T.rows : mode === "calc" ? T.calc : T.none);
    bar.appendChild(a);
    bar.appendChild(c);
    if (mode === "rows") {
      lastLine = document.createElement("div");
      lastLine.style.cssText = "opacity:0.85;color:#fcd34d";
      bar.appendChild(lastLine);
    }
    document.body.insertBefore(bar, document.body.firstChild);
    if (mode === "calc" && inputId) {
      var input = document.getElementById(inputId);
      if (input) {
        input.value = to;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }
  if (document.body) banner();
  else document.addEventListener("DOMContentLoaded", banner);
})();
