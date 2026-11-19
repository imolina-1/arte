/* Arte PAU — núcleo: utilidades, datos, rutas y estadísticas */
(function () {
"use strict";
var A = window.ARTE = {};
A.SEMB = window.ARTE_SEMB || [];
A.GLOS = window.ARTE_GLOS || [];
A.sById = {};
A.SEMB.forEach(function (e) { A.sById[e.id] = e; });
A.OBRAS = window.ARTE_OBRAS || [];          // obras de las presentaciones (sin semblanza propia)
A.OBRAS.forEach(function (e) { A.sById[e.id] = e; });

/* ---------- Utilidades ---------- */
A.norm = function (s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();
};
A.esc = function (s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
};
A.md = function (s) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
};
A.store = function (k, v) {
  try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { return null; }
};
A.shuffle = function (a) {
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
};
A.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
A.$ = function (id) { return document.getElementById(id); };
A.fmt = function (ms) {
  var s = Math.round(ms / 1000), a = Math.abs(s);
  return (s < 0 ? "-" : "") + String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
};
A.num = function (x) { return x.toFixed(2).replace(".", ","); };

/* ---------- Temas ---------- */
// Los nombres de tema salen de las semblanzas («Tema 1. El arte griego»); el T18 solo existe en el glosario
A.temaName = {};
A.SEMB.forEach(function (e) { A.temaName[e.tema] = e.temaNombre.replace(/^Tema \d+\.\s*/, ""); });
A.temaName[18] = "Las artes plásticas en la segunda mitad del siglo XX";
A.temaLabel = function (n) { return "T" + n + ". " + (A.temaName[n] || ""); };
A.EVAL = { e1: [1, 5], e2: [6, 12], e3: [13, 18] };
A.EVAL_LABEL = { e1: "1.ª evaluación (T1-T5)", e2: "2.ª evaluación (T6-T12)", e3: "3.ª evaluación (T13-T18)" };
A.inFilter = function (tema, v) {
  if (!v || v === "all") return true;
  if (A.EVAL[v]) return tema >= A.EVAL[v][0] && tema <= A.EVAL[v][1];
  return String(tema) === String(v);
};
A.temaOptions = function (max) {
  var o = '<option value="all">Todos los temas</option>';
  Object.keys(A.EVAL).forEach(function (k) { o += '<option value="' + k + '">' + A.EVAL_LABEL[k] + "</option>"; });
  for (var n = 1; n <= max; n++) o += '<option value="' + n + '">' + A.esc(A.temaLabel(n)) + "</option>";
  return o;
};

/* Selector de temas con chips (simulacros) */
A.temaPicker = function (box, max, onchange, initial) {
  var sel = new Set(initial || []);
  for (var n = 1; n <= max; n++) if (!initial) sel.add(n);
  var api = { sel: sel };
  function draw() {
    box.innerHTML = "";
    var pre = document.createElement("div"); pre.className = "row"; pre.style.marginBottom = "10px";
    [["e1", "1.ª evaluación (T1-T5)"], ["e2", "2.ª evaluación (T6-T12)"], ["e3", "3.ª evaluación (T13-T" + max + ")"], ["all", "Todo"]].forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = p[1];
      b.onclick = function () {
        sel.clear();
        for (var i = 1; i <= max; i++) if (p[0] === "all" || A.inFilter(i, p[0])) sel.add(i);
        draw(); onchange && onchange(sel);
      };
      pre.appendChild(b);
    });
    var chips = document.createElement("div"); chips.className = "row"; chips.setAttribute("role", "group"); chips.setAttribute("aria-label", "Temas que entran");
    for (var k = 1; k <= max; k++) (function (k) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = "T" + k; b.title = A.temaLabel(k);
      b.setAttribute("aria-pressed", sel.has(k) ? "true" : "false");
      b.onclick = function () { if (sel.has(k)) sel.delete(k); else sel.add(k); draw(); onchange && onchange(sel); };
      chips.appendChild(b);
    })(k);
    box.appendChild(pre); box.appendChild(chips);
  }
  api.redraw = draw; draw();
  return api;
};

/* ---------- Enlaces entre glosario y semblanzas ---------- */
A.termById = function (i) { return A.GLOS[i]; };
A.short = function (s, n) { s = s || ""; var p = s.split(/(?<=\.)\s/)[0]; return (p.length > n ? p.slice(0, n - 1) + "…" : p); };
A.termChip = function (i) {
  var t = A.GLOS[i];
  return '<a class="termchip" href="#glosario?id=' + t.id + '" title="' + A.esc(A.short(t.def, 160)) + '">' + A.esc(t.t) + "</a>";
};
A.termChips = function (ids, max) {
  var s = ids.slice(0, max || 12).map(A.termChip).join("");
  if (ids.length > (max || 12)) s += '<span class="small"> y ' + (ids.length - (max || 12)) + " más</span>";
  return s;
};
A.semLink = function (id) {
  var e = A.sById[id]; if (!e || e.obra) return "";
  return '<a class="semchip" href="#semblanzas?id=' + e.id + '">' + A.esc(e.nombre) + "</a>";
};
// términos del glosario aplicables a una imagen concreta (obra mostrada)
A.termsOfImg = {};
A.GLOS.forEach(function (t) { t.img.forEach(function (sid) { (A.termsOfImg[sid] = A.termsOfImg[sid] || []).push(t.id); }); });
A.imgs = A.SEMB.concat(A.OBRAS).filter(function (e) { return e.ok; });          // imagen con términos del glosario enlazados
A.imgsAll = A.SEMB.filter(function (e) { return e.u; });          // toda imagen de obra utilizable (fichas)
A.temasImg = []; A.imgs.forEach(function (e) { if (A.temasImg.indexOf(e.tema) < 0) A.temasImg.push(e.tema); });
A.temasImg.sort(function (a, b) { return a - b; });
A.temasImgText = (function () {
  var out = [], a = A.temasImg, i = 0;
  while (i < a.length) { var j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? "T" + a[i] + "-T" + a[j] : "T" + a[i]); i = j + 1; }
  return out.join(", ");
})();
A.noImgMsg = '<p class="lead">No hay imágenes para ese filtro: por ahora hay imágenes de las obras de los artistas del dossier y de las presentaciones (' + A.temasImgText + '). Elige otro tema.</p>';

/* ---------- Secciones de una semblanza (Época / Características / Obras) ---------- */
A.sections = function (t) {
  var parts = t.split(/\*\*(Época|Características|Obras)\.\*\*\s*/);
  if (parts.length < 3) return "<p>" + A.md(t) + "</p>";
  var out = "";
  for (var i = 1; i < parts.length; i += 2) out += '<p class="sec"><span class="lbl">' + parts[i] + "</span>" + A.md(parts[i + 1].trim()) + "</p>";
  return out;
};

/* ---------- Estadísticas anónimas (GoatCounter): sin cookies ni datos personales ---------- */
A.GC_CODE = "imolina";
var GC_QUEUE = [];
if (A.GC_CODE && location.protocol === "https:") {
  var gs = document.createElement("script"); gs.async = true; gs.src = "https://gc.zgo.at/count.js";
  gs.setAttribute("data-goatcounter", "https://" + A.GC_CODE + ".goatcounter.com/count");
  gs.onload = function () { GC_QUEUE.splice(0).forEach(function (a) { A.track(a[0], a[1]); }); };
  document.head.appendChild(gs);
}
A.track = function (path, title) {
  if (!A.GC_CODE) return;
  try {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title || path, event: true });
    else GC_QUEUE.push([path, title]);
  } catch (e) {}
};
A.bucket = function (v) { return v >= 0.7 ? "alta" : (v >= 0.4 ? "media" : "baja"); };

/* ---------- Repaso espaciado: lo fallado vuelve antes ---------- */
var BOX = A.store("ficBox") || {}, W = [8, 5, 3, 2, 1];
A.boxOf = function (k) { return BOX[k] === undefined ? 0 : BOX[k]; };
A.setBox = function (k, ok) { BOX[k] = ok ? Math.min(4, A.boxOf(k) + 1) : 0; A.store("ficBox", BOX); };
A.weightedPick = function (items, keyFn, avoid) {
  var cand = items.filter(function (x) { return x !== avoid || items.length === 1; });
  var tot = cand.reduce(function (s, x) { return s + W[A.boxOf(keyFn(x))]; }, 0), r = Math.random() * tot, out = cand[0];
  for (var k = 0; k < cand.length; k++) { r -= W[A.boxOf(keyFn(cand[k]))]; if (r <= 0) { out = cand[k]; break; } }
  return out;
};
A.mastered = function (items, keyFn) { return items.filter(function (x) { return A.boxOf(keyFn(x)) >= 3; }).length; };

/* ---------- Estadísticas locales (solo en el navegador del alumno) ---------- */
A.stat = function (key, ok) {
  var s = A.store("arte_stats") || {}; s[key] = s[key] || { ok: 0, n: 0 };
  s[key].n++; if (ok) s[key].ok++; A.store("arte_stats", s); return s[key];
};
A.getStat = function (key) { var s = A.store("arte_stats") || {}; return s[key] || { ok: 0, n: 0 }; };

/* ---------- Rutas ---------- */
var VIEWS = ["inicio", "simulacro", "fichas", "semblanzas", "glosario", "terminos", "test"];
var ALIAS = { consulta: "semblanzas" };
A.hooks = {};
A.params = {};
function parse() {
  var h = (location.hash || "#inicio").slice(1), q = h.indexOf("?"), view = q < 0 ? h : h.slice(0, q), p = {};
  if (q >= 0) h.slice(q + 1).split("&").forEach(function (kv) { var a = kv.split("="); if (a[0]) p[a[0]] = decodeURIComponent((a[1] || "").replace(/\+/g, " ")); });
  if (view.indexOf("a-") === 0) { p.id = view.slice(2); view = "semblanzas"; }   // enlaces directos #a-nombre-del-artista
  view = ALIAS[view] || view; if (VIEWS.indexOf(view) < 0) view = "inicio";
  return { view: view, p: p };
}
A.route = function () {
  var r = parse(); A.params = r.p;
  if (A.route.last !== r.view) { A.route.last = r.view; A.track("vista/" + r.view, "Vista: " + r.view); }
  VIEWS.forEach(function (v) { A.$("v-" + v).classList.toggle("hidden", v !== r.view); });
  document.querySelectorAll("nav a").forEach(function (a) { if (a.dataset.view === r.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (A.hooks[r.view]) A.hooks[r.view](r.p);
  document.title = (r.view === "inicio" ? "" : (document.querySelector('nav a[data-view="' + r.view + '"]') || {}).textContent + " · ") + "Arte PAU · Historia del Arte";
  if (!A.noScroll) window.scrollTo(0, 0);
};
window.addEventListener("hashchange", function () { A.route(); });

A.start = function () {
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  ["init"].forEach(function () { (A.inits || []).forEach(function (f) { f(); }); });
  A.route();
};
A.inits = [];
})();
