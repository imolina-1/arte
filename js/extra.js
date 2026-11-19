/* Historia del Arte — línea del tiempo, modo repaso y ficha de artista */
(function () {
"use strict";
var A = window.ARTE, esc = A.esc, norm = A.norm, $ = A.$, store = A.store;
var ART = A.SEMB.filter(function (e) { return e.y0 !== null && e.y0 !== undefined; });
var NOW = 2026;
function y1of(e) { return e.y1 === null || e.y1 === undefined ? NOW : e.y1; }
function hue(t) { return Math.round((t - 1) * 360 / 18 + 8); }
function yfmt(y) { return y < 0 ? (-y) + " a. C." : String(y); }

/* ---------- Escala: lineal si el rango es corto; por tramos si abarca siglos ---------- */
var PW = [[-500, 0], [0, .09], [500, .16], [1000, .26], [1400, .40], [1600, .55], [1800, .75], [2030, 1]];
function mkScale(lo, hi) {
  if (hi - lo < 1300) {
    var a = lo, b = hi; return { f: function (y) { return (y - a) / (b - a); }, ticks: ticks(a, b) };
  }
  return { f: function (y) {
    y = Math.max(PW[0][0], Math.min(PW[PW.length - 1][0], y));
    for (var i = 1; i < PW.length; i++) if (y <= PW[i][0]) return PW[i - 1][1] + (PW[i][1] - PW[i - 1][1]) * (y - PW[i - 1][0]) / (PW[i][0] - PW[i - 1][0]);
    return 1;
  }, ticks: [-500, 0, 500, 1000, 1400, 1500, 1600, 1700, 1800, 1900, 2000] };
}
function ticks(a, b) {
  var span = b - a, steps = [10, 20, 25, 50, 100, 200, 250, 500], st = steps[steps.length - 1];
  for (var i = 0; i < steps.length; i++) if (span / steps[i] <= 9) { st = steps[i]; break; }
  var out = []; for (var t = Math.ceil(a / st) * st; t <= b; t += st) out.push(t); return out;
}
A.tlScale = mkScale;

/* ---------- Línea del tiempo ---------- */
function drawTl() {
  var v = $("tlTema").value, compl = $("tlCompl").checked, q = norm($("tlQ").value);
  var list = ART.filter(function (e) { return A.inFilter(e.tema, v) && (compl || !e.compl) && (!q || norm(e.nombre).indexOf(q) >= 0); });
  var by = $("tlSort").value;
  list.sort(by === "tema" ? function (a, b) { return a.tema - b.tema || a.y0 - b.y0; } : function (a, b) { return a.y0 - b.y0 || y1of(a) - y1of(b); });
  if (!list.length) { $("tlBox").innerHTML = '<p class="lead">No hay artistas con ese filtro.</p>'; $("tlCount").textContent = ""; return; }
  var lo = Math.min.apply(null, list.map(function (e) { return e.y0; })), hi = Math.max.apply(null, list.map(y1of));
  var pad = Math.max(10, Math.round((hi - lo) * .03)); lo -= pad; hi = Math.min(hi + pad, 2030);
  var sc = mkScale(lo, hi), tk = sc.ticks.filter(function (t) { return t >= lo && t <= hi; });
  function pc(y) { return Math.max(0, Math.min(100, sc.f(y) * 100)); }
  var grid = tk.map(function (t) { return '<i style="left:' + pc(t).toFixed(2) + '%"></i>'; }).join("");
  var axis = tk.map(function (t) { return '<span style="left:' + pc(t).toFixed(2) + '%">' + yfmt(t) + "</span>"; }).join("");
  var rows = list.map(function (e) {
    var l = pc(e.y0), w = Math.max(.7, pc(y1of(e)) - l), right = l + w > 78;
    var thumb = e.rth ? '<img src="' + esc(e.rth) + '" alt="" loading="lazy" decoding="async">' : '<span class="tl-ph" aria-hidden="true"></span>';
    return '<li><a class="tl-name" href="#a-' + e.id + '">' + thumb + "<span>" + esc(e.nombre) + "</span></a>" +
      '<div class="tl-track"><a class="tl-bar" style="--h:' + hue(e.tema) + ";left:" + l.toFixed(2) + "%;width:" + w.toFixed(2) + '%" href="#a-' + e.id + '" aria-label="' + esc(e.nombre + ", " + e.yl + ", " + A.temaLabel(e.tema)) + '" title="' + esc(e.nombre + " · " + e.yl) + '"></a>' +
      '<span class="tl-yr" style="' + (right ? "right:" + (100 - l + .6).toFixed(2) : "left:" + (l + w + .6).toFixed(2)) + '%">' + esc(e.yl) + "</span></div></li>";
  }).join("");
  $("tlBox").innerHTML = '<div class="tl"><div class="tl-axis" aria-hidden="true"><div class="tl-ticks">' + axis + '</div></div>' +
    '<div class="tl-body"><div class="tl-grid" aria-hidden="true">' + grid + '</div><ol class="tl-rows">' + rows + "</ol></div></div>";
  $("tlCount").textContent = list.length + " artistas · barras = vida o actividad · pulsa una para abrir su ficha";
}
function initTl() {
  $("tlTema").innerHTML = A.temaOptions(17);
  $("tlTema").value = "all";
  ["tlTema", "tlSort", "tlCompl"].forEach(function (id) { $(id).addEventListener("change", drawTl); });
  $("tlQ").addEventListener("input", drawTl);
  $("tlLegend").innerHTML = A.TEMAS.slice(0, 17).map(function (n, i) { return '<span class="tl-key"><i style="--h:' + hue(i + 1) + '"></i>T' + (i + 1) + "</span>"; }).join("");
}
A.hooks.cronologia = function (p) { if (p.t && $("tlTema").value !== p.t) $("tlTema").value = p.t; drawTl(); };

/* ---------- Modo repaso: tarjetas ---------- */
var rep = { pool: [], cur: null, shown: false, seen: 0 };
function rkey(e) { return "r:" + e.id; }
function repPool() {
  var v = $("rpTema").value, mode = $("rpMode").value, compl = $("rpCompl").checked;
  return A.SEMB.filter(function (e) { return A.inFilter(e.tema, v) && (compl || !e.compl) && (mode !== "face" || e.ret); });
}
function repNext() {
  rep.pool = repPool();
  if (!rep.pool.length) { $("rpCard").innerHTML = '<p class="lead">No hay tarjetas con ese filtro.</p>'; $("rpRate").classList.add("hidden"); rep.cur = null; repStats(); return; }
  rep.cur = A.weightedPick(rep.pool, rkey, rep.cur); rep.shown = false; repDraw();
}
function repDraw() {
  var e = rep.cur; if (!e) return;
  var mode = $("rpMode").value, face = mode === "face";
  var front = face ? A.face(e, false).replace("data-zoom", "") : '<div class="rp-name">' + esc(e.nombre) + "</div>";
  var back = '<h3>' + esc(e.nombre) + "</h3><p class=\"stats\">" + esc(e.cab) + "</p><p><strong>" + esc(e.yl) + "</strong> · " + esc(A.temaLabel(e.tema)) + (e.compl ? " · complementaria" : "") + "</p>" +
    '<div class="rp-works">' + e.obras.replace(/\.$/, "").split(/;|, (?=[A-ZÁÉÍÓÚÑ])| y (?=[A-ZÁÉÍÓÚÑ])/).map(function (o) { return '<span class="cartela">' + esc(o.trim()) + "</span>"; }).join("") + "</div>" +
    '<p><a href="#a-' + e.id + '">Abrir la ficha completa →</a></p>';
  $("rpCard").innerHTML = '<div class="rp-front">' + front + (face ? '<p class="rp-q">¿Quién es y de qué época?</p>' : '<p class="rp-q">¿Época, estilo y obras?</p>') + "</div>" +
    (rep.shown ? '<div class="rp-back" aria-live="polite">' + back + "</div>" : "");
  $("rpFlip").classList.toggle("hidden", rep.shown); $("rpRate").classList.toggle("hidden", !rep.shown);
  if (rep.shown) $("rpCard").focus(); else if (rep.seen || rep.touched) $("rpFlip").focus();
  rep.touched = true;
  repStats();
}
function repStats() {
  var p = rep.pool.length ? rep.pool : repPool(), m = A.mastered(p, rkey);
  $("rpStat").textContent = m + " de " + p.length + " dominadas · " + rep.seen + " vistas en esta sesión";
  var bar = $("rpBar"); bar.style.width = (p.length ? Math.round(100 * m / p.length) : 0) + "%";
  bar.parentNode.setAttribute("aria-valuenow", p.length ? Math.round(100 * m / p.length) : 0);
}
function repRate(ok) { if (!rep.cur) return; A.setBox(rkey(rep.cur), ok); rep.seen++; repNext(); }
function initRep() {
  $("rpTema").innerHTML = A.temaOptions(17);
  ["rpTema", "rpMode", "rpCompl"].forEach(function (id) { $(id).addEventListener("change", function () { rep.cur = null; repNext(); }); });
  $("rpFlip").onclick = function () { if (rep.cur) { rep.shown = true; repDraw(); } };
  $("rpYes").onclick = function () { repRate(true); }; $("rpNo").onclick = function () { repRate(false); };
  $("rpReset").onclick = function () {
    if (!confirm("¿Borrar tu progreso de repaso de las tarjetas de artistas?")) return;
    repPool().concat(A.SEMB).forEach(function (e) { A.setBox(rkey(e), false); }); rep.seen = 0; rep.cur = null; repNext();
  };
  document.addEventListener("keydown", function (ev) {
    if (location.hash.indexOf("#repaso") !== 0 || /INPUT|SELECT|TEXTAREA/.test((ev.target || {}).tagName || "")) return;
    if (ev.key === " " || ev.key === "Enter") { if (!rep.shown && rep.cur && ev.target.tagName !== "BUTTON") { ev.preventDefault(); $("rpFlip").click(); } }
    else if (rep.shown && (ev.key === "1" || ev.key === "n")) repRate(false);
    else if (rep.shown && (ev.key === "2" || ev.key === "s")) repRate(true);
  });
}
A.hooks.repaso = function () { if (!rep.cur) repNext(); else repDraw(); };

/* ---------- Ficha de artista ---------- */
function surname(e) {
  var n = norm(e.nombre.replace(/\([^)]*\)/g, "")).split(" ").filter(function (w) { return w.length > 2; });
  return n.length ? n[n.length - 1] : "";
}
function worksGallery(e) {
  var full = norm(e.nombre.replace(/\([^)]*\)/g, "")), sn = surname(e), out = [];
  if (e.img) out.push({ src: e.th || e.img, full: e.img, cap: e.pie || e.nombre, cr: A.crOf(e) });
  A.OBRAS.forEach(function (o) {
    var n = norm(o.nombre); if (out.some(function (g) { return g.full === o.img || norm(g.cap) === norm(o.pie || ""); })) return;
    if ((n.indexOf(full) >= 0 || (sn.length >= 5 && new RegExp("\\b" + sn + "\\b").test(n))) && o.img) out.push({ src: o.th || o.img, full: o.img, cap: o.pie || o.nombre, cr: A.crOf(o) });
  });
  return out.slice(0, 12);
}
A.miniTl = function (e) {
  var sc = mkScale(-500, 2030);
  function pc(y) { return Math.max(0, Math.min(100, sc.f(y) * 100)); }
  var dots = ART.filter(function (o) { return o !== e && !o.compl; }).map(function (o) { return '<i style="left:' + pc((o.y0 + y1of(o)) / 2).toFixed(2) + '%"></i>'; }).join("");
  var l = pc(e.y0), w = Math.max(1.2, pc(y1of(e)) - l);
  var axis = [0, 500, 1000, 1500, 1800, 2000].map(function (t) { return '<span style="left:' + pc(t).toFixed(2) + '%">' + yfmt(t) + "</span>"; }).join("");
  return '<div class="mini" role="img" aria-label="' + esc(e.nombre + " en la línea del tiempo: " + e.yl) + '"><div class="mini-track">' + dots + '<b style="--h:' + hue(e.tema) + ";left:" + l.toFixed(2) + "%;width:" + w.toFixed(2) + '%"></b></div><div class="mini-ax" aria-hidden="true">' + axis + "</div></div>";
};
function fichaArt(id) {
  var e = A.sById[id];
  if (!e || e.obra) { $("fiBox").innerHTML = '<p class="lead">No encuentro ese artista. <a href="#semblanzas">Ver todas las semblanzas</a>.</p>'; return; }
  var same = A.SEMB.filter(function (o) { return o.tema === e.tema && !o.compl === !e.compl; }).sort(function (a, b) { return (a.y0 || 0) - (b.y0 || 0); });
  var i = same.indexOf(e), prev = same[i - 1], next = same[i + 1];
  var cont = ART.filter(function (o) { return o !== e && Math.min(y1of(o), y1of(e)) - Math.max(o.y0, e.y0) >= 15; })
    .sort(function (a, b) { return (a.tema === e.tema ? 0 : 1) - (b.tema === e.tema ? 0 : 1) || Math.abs(a.y0 - e.y0) - Math.abs(b.y0 - e.y0); }).slice(0, 8);
  var gal = worksGallery(e);
  var head = e.ret ? A.face(e, false) : (e.img ? A.img(e, false) : "");
  $("fiBox").innerHTML =
    '<article class="fi"><header class="fi-h">' + head + '<div><p class="eyebrow">' + esc(A.temaLabel(e.tema)) + (e.compl ? " · complementaria" : "") + "</p><h2>" + esc(e.nombre) + '</h2><p class="fi-dates">' + esc(e.yl) + '</p><p class="stats">' + esc(e.cab) + "</p></div></header>" +
    (e.y0 !== undefined && e.y0 !== null ? '<h3 class="fi-s">En la línea del tiempo</h3>' + A.miniTl(e) : "") +
    '<h3 class="fi-s">Semblanza</h3><div class="body">' + A.sections(e.texto) + "</div>" +
    (gal.length ? '<h3 class="fi-s">Obras</h3><div class="fi-gal">' + gal.map(function (g) { return '<figure><img src="' + esc(g.src) + '" data-zoom data-full="' + esc(g.full) + '" data-cap="' + esc(g.cap) + '" data-cr="' + esc(g.cr || "") + '" alt="' + esc(g.cap) + '" loading="lazy" decoding="async"><figcaption>' + esc(g.cap) + "</figcaption></figure>"; }).join("") + "</div>" : "") +
    (e.terms && e.terms.length ? '<h3 class="fi-s">Términos del glosario</h3><p class="rel">' + A.termChips(e.terms, 24) + "</p>" : "") +
    (cont.length ? '<h3 class="fi-s">Contemporáneos</h3><p class="rel">' + cont.map(function (o) { return '<a class="semchip" href="#a-' + o.id + '" title="' + esc(o.yl) + '">' + esc(o.nombre) + "</a>"; }).join("") + "</p>" : "") +
    '<div class="row fi-act"><a class="btn" href="#artista?id=' + e.id + '">Practicar esta semblanza</a><a class="btn ghost" href="#cronologia?t=' + e.tema + '">Ver su tema en la línea del tiempo</a></div>' +
    '<div class="fi-nav" role="navigation" aria-label="Artistas del mismo tema">' + (prev ? '<a href="#a-' + prev.id + '">← ' + esc(prev.nombre) + "</a>" : "<span></span>") + (next ? '<a href="#a-' + next.id + '">' + esc(next.nombre) + " →</a>" : "<span></span>") + "</div></article>";
  document.title = e.nombre + " · Historia del Arte · PAU " + A.pauYear();
  A.track("ficha/" + e.id, "Ficha: " + e.nombre);
}
A.hooks.ficha = function (p) { fichaArt(p.id); };

A.inits.push(initTl, initRep);
})();
