/* Historia del Arte — buscador general (Ctrl+K o «/»): artistas, obras, términos y secciones. */
(function () {
"use strict";
var A = window.ARTE, $ = A.$, esc = A.esc, norm = A.norm;
var IDX = null, RES = [], SEL = 0;
var GN = ["Secciones", "Artistas", "Obras", "Términos"];
function build() {
  var out = [];
  document.querySelectorAll("nav a[data-view]").forEach(function (a) {
    var b = a.querySelector("b"), s = a.querySelector("span"); if (!b) return;
    out.push({ g: 0, lab: b.textContent, sub: s ? s.textContent : "", n: norm(b.textContent + " " + (s ? s.textContent : "")), nt: "", go: function () { location.hash = a.getAttribute("href"); } });
  });
  A.SEMB.forEach(function (e) {
    if (e.obra) return;
    out.push({ g: 1, lab: e.nombre, sub: "Artista · " + (e.yl ? e.yl + " · " : "") + A.temaLabel(e.tema), n: norm(e.nombre), nt: norm((e.cab || "") + " " + (e.obras || "") + " " + (e.pie || "")), go: function () { location.hash = "#a-" + e.id; } });
  });
  A.OBRAS.forEach(function (o) {
    out.push({ g: 2, lab: o.pie, sub: "Obra · " + (o.nombre ? o.nombre + " · " : "") + ((o.cab || "").split(" · ")[0]), n: norm(o.pie + " " + (o.nombre || "")), nt: norm(o.cab || ""), go: function () { location.hash = "#cronologia?o=" + o.id; } });
  });
  A.GLOS.forEach(function (t, i) {
    out.push({ g: 3, lab: t.t, sub: "Término · " + A.temaLabel(t.tema), n: norm(t.t), nt: norm(t.def || ""), go: function () { location.hash = "#glosario?id=" + i; } });
  });
  return out;
}
function run(q) {
  if (!IDX) IDX = build();
  var tk = norm(q).split(/\s+/).filter(Boolean); if (!tk.length) { RES = []; return; }
  var sc = [];
  IDX.forEach(function (it) {
    var inN = tk.every(function (t) { return it.n.indexOf(t) >= 0; });
    var inT = !inN && it.nt && tk.every(function (t) { return (it.n + " " + it.nt).indexOf(t) >= 0; });
    if (!inN && !inT) return;
    var l = norm(it.lab);
    sc.push({ it: it, s: (inN ? 0 : 20) + (l.indexOf(tk[0]) === 0 ? 0 : (l.indexOf(tk[0]) > 0 ? 3 : 6)) + it.g * .1 + (l.length * .002) });
  });
  sc.sort(function (a, b) { return a.s - b.s; });
  var cnt = {}; RES = [];
  sc.forEach(function (x) { cnt[x.it.g] = (cnt[x.it.g] || 0) + 1; if (cnt[x.it.g] <= 6) RES.push(x.it); });
  RES.sort(function (a, b) { return a.g - b.g; });
}
function draw() {
  var L = $("gsl"), q = $("gsq").value.trim();
  if (!q) { L.innerHTML = '<p class="gs-note">Escribe para buscar entre ' + A.SEMB.filter(function (e) { return !e.obra; }).length + " artistas, " + A.OBRAS.length + " obras y " + A.GLOS.length + " términos. También vale el nombre de una sección.</p>"; return; }
  if (!RES.length) { L.innerHTML = '<p class="gs-note">Nada con «' + esc(q) + "».</p>"; return; }
  var g = -1, h = "";
  RES.forEach(function (r, i) {
    if (r.g !== g) { g = r.g; h += '<div class="sdg">' + GN[g] + "</div>"; }
    h += '<button class="sdi' + (i === SEL ? " on" : "") + '" type="button" role="option" data-i="' + i + '"><b>' + esc(r.lab.length > 90 ? r.lab.slice(0, 88) + "…" : r.lab) + "</b><span>" + esc(r.sub) + "</span></button>";
  });
  L.innerHTML = h;
  L.querySelectorAll(".sdi").forEach(function (b) { b.onclick = function () { pick(+b.dataset.i); }; });
  var on = L.querySelector(".sdi.on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
}
function pick(i) { var r = RES[i]; if (!r) return; $("gs").close(); r.go(); }
function open() { var d = $("gs"); if (!d.open) d.showModal(); $("gsq").focus(); $("gsq").select(); SEL = 0; run($("gsq").value); draw(); }
A.inits.push(function () {
  var b = $("srchb"), d = $("gs"); if (!b || !d) return;
  b.onclick = open;
  $("gsq").addEventListener("input", function () { SEL = 0; run($("gsq").value); draw(); });
  d.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); SEL = Math.min(RES.length - 1, SEL + 1); draw(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); SEL = Math.max(0, SEL - 1); draw(); }
    else if (e.key === "Enter") { e.preventDefault(); pick(SEL); }
  });
  d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  document.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
    else if (e.key === "/" && !typing && !document.querySelector("dialog[open]")) { e.preventDefault(); open(); }
  });
});
})();
