/* Historia del Arte — línea del tiempo a pantalla completa (adaptada de la de Historia de España).
   Cada obra del dossier es un hito. Varias obras pueden compartir año: aparecen todas y se pueden abrir. */
(function () {
"use strict";
var A = window.ARTE, $ = A.$, esc = A.esc, TL = window.ARTE_TL || {}, SETS = window.ARTE_SETS || [], SETOF = {};
var dirty = true, lastWave = 0, lastHue = 0, EV = [], G = [], N = 0, els = [], pos = 0, target = 0, hue = 260, htarget = 260, shown = -1, openI = -1, built = false, running = false, moved = false, hintOn = true;
var root, stage, rail, eraEl, bgEl, pn, sc, cv, cx, CW = 0, CH = 0, DPR = 1, cur;
var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function fy(y) { return y < 0 ? (-y) + " a. C." : String(y); }
function hueOf(t) { return Math.round((t - 1) * 330 / 17 + 270) % 360; }     // violeta → … por épocas
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function artistOf(o) {
  if (o._a !== undefined) return o._a;
  var n = A.norm(o.nombre || ""), r = null;
  if (n) A.SEMB.some(function (s) { if (!s.obra && n.indexOf(A.norm(s.nombre)) >= 0) { r = s; return true; } return false; });
  return (o._a = r);
}
function build() {
  if (built) return; built = true;
  A.OBRAS.forEach(function (o) { var t = TL[o.id]; if (t) EV.push({ o: o, y: t[0], lab: t[1] || "", tema: +o.tema }); });
  SETS.forEach(function (s) { s.ids.forEach(function (id, n) { SETOF[id] = { s: s, n: n }; }); });
  EV.forEach(function (e) { var m = SETOF[e.o.id]; if (m) { e.set = m.s; e.sn = m.n; } });
  EV.sort(function (a, b) { return a.y - b.y || a.tema - b.tema || (a.set && a.set === b.set ? a.sn - b.sn : 0); });
  EV.forEach(function (e, i) {
    e.i = i; var k = e.y + "|" + e.lab, g = G[G.length - 1];
    if (g && g.k === k) g.ev.push(e); else G.push({ k: k, y: e.y, lab: e.lab, ev: [e], tema: e.tema, u: [] });
  });
  G.forEach(function (g) {                                   // unidades: una obra suelta o un conjunto (varias imágenes de lo mismo)
    g.ev.forEach(function (e) {
      var u = e.set && g.u.filter(function (x) { return x.set === e.set; })[0];
      if (u) { u.ev.push(e); e.u = u; } else { u = { set: e.set || null, ev: [e] }; e.u = u; g.u.push(u); }
    });
  });
  EV.forEach(function (e) { e.sib = e.u.set && e.u.ev.length > 1 ? e.u.ev : null; });
  N = G.length;
  root = $("tl2");
  root.innerHTML =
    '<div id="tlbg"></div><canvas id="tlwaves" aria-hidden="true"></canvas>' +
    '<div class="tlh"><b>Cronología</b><div class="tlera" id="tlera" aria-live="polite"></div></div>' +
    '<div id="tlstage"></div><div id="tlsc"></div><aside id="tlpn" role="dialog" aria-label="Información de la obra"></aside>' +
    '<button class="tlnav" id="tlpv" type="button" aria-label="Anterior">‹</button><button class="tlnav" id="tlnx" type="button" aria-label="Siguiente">›</button>' +
    '<div id="tlhint">Rueda, flechas o arrastra · pulsa una obra para ver su ficha</div><div id="tlrail" aria-hidden="true"></div>';
  stage = $("tlstage"); rail = $("tlrail"); eraEl = $("tlera"); bgEl = $("tlbg"); pn = $("tlpn"); sc = $("tlsc"); cv = $("tlwaves"); cx = cv.getContext("2d");
  els = G.map(function (g) {
    var d = document.createElement("div"); d.className = "tli";
    var long = (g.lab || "").length > 12;
    d.innerHTML = '<div class="y' + (g.lab ? " lab" : "") + (long ? " long" : "") + '">' + esc(g.lab || fy(g.y)) + "</div>" +
      '<ul class="evs">' + g.u.map(function (u) {
        var e = u.ev[0];
        if (u.set && u.ev.length > 1) return '<li class="set"><button type="button" data-e="' + e.i + '"><span class="th stk">' + (e.o.th ? '<img src="' + esc(e.o.th) + '" alt="" loading="lazy" decoding="async" draggable="false">' : "") + '</span><span class="tx"><b>' + esc(u.set.n) + "</b><i>" + u.ev.length + " imágenes" + (u.set.s ? " · " + esc(u.set.s) : "") + "</i></span></button></li>";
        return '<li><button type="button" data-e="' + e.i + '"><span class="th">' + (e.o.th ? '<img src="' + esc(e.o.th) + '" alt="" loading="lazy" decoding="async" draggable="false">' : "") + '</span><span class="tx"><b>' + esc(e.o.pie) + "</b>" + (e.o.nombre ? "<i>" + esc(e.o.nombre) + "</i>" : "") + "</span></button></li>";
      }).join("") + "</ul>" +
      (g.u.length > 1 ? '<div class="n">+ ' + (g.u.length - 1) + (g.u.length === 2 ? " entrada más" : " entradas más") + "</div>" : "") +
      '<div class="e">Tema ' + g.tema + "</div>";
    stage.appendChild(d); return d;
  });
  var MARKS = [-500, 0, 500, 1000, 1300, 1450, 1550, 1650, 1750, 1850, 1900, 1950, 2000], mi = 0, lastL = -9;
  G.forEach(function (g, i) {
    var x = i / (N - 1) * 100, tk = document.createElement("div"), mk = false;
    while (mi < MARKS.length && g.y >= MARKS[mi]) { mk = true; mi++; }
    tk.className = "tk" + (mk ? " m" : ""); tk.style.left = x + "%"; rail.appendChild(tk);
    var px = x / 100 * (rail.clientWidth || 320);
    if (mk && px - lastL > 62) { var l = document.createElement("div"); l.className = "tlb"; l.style.left = x + "%"; l.textContent = fy(MARKS[mi - 1]); rail.appendChild(l); lastL = px; }
  });
  cur = document.createElement("div"); cur.className = "cur"; rail.appendChild(cur);
  bind();
}
function GAP() { var w = root.clientWidth; return w < 640 ? w * .8 : Math.min(430, w * .34); }
function go(i) { dirty = true; target = clamp(Math.round(i), 0, N - 1); if (hintOn) { hintOn = false; $("tlhint").style.opacity = 0; } }
function layout() {
  var gap = GAP();
  for (var i = 0; i < els.length; i++) {
    var el = els[i], d = i - pos, a = Math.abs(d);
    if (a > 3.2) { if (el._v !== 0) { el.style.visibility = "hidden"; el.style.opacity = 0; el._v = 0; } continue; }
    el._v = 1; el.style.visibility = "visible";
    var s = 1 - Math.min(a, 1) * .5 - Math.max(a - 1, 0) * .08;
    var x = (d < 0 ? -1 : 1) * (a < 1 ? a * gap : gap + (a - 1) * gap * .55);
    var o = a < 1 ? 1 - a * .72 : Math.max(0, .28 - (a - 1) * .14), y = a < 1 ? a * 10 : 10;
    el.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    el.style.opacity = o.toFixed(3);
  }
  cur.style.left = (pos / (N - 1) * 100) + "%";
}
function focus() {
  var i = clamp(Math.round(pos), 0, N - 1); if (i === shown) return;
  if (shown >= 0) els[shown].classList.remove("f");
  shown = i; els[i].classList.add("f");
  var g = G[i]; htarget = hueOf(g.tema); eraEl.textContent = A.temaName[g.tema] || "";
  if (pn.classList.contains("on") && !g.ev.some(function (e) { return e.i === openI; })) closePn();
}
function fit() { if (!cv) return; dirty = true; DPR = .6; CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW * DPR; cv.height = CH * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
function waves(t) {
  cx.clearRect(0, 0, CW, CH); if (still) t = 0;
  for (var k = 0; k < 4; k++) {
    var amp = 26 + k * 14, ph = t * (.22 + k * .07) + k * 1.7 + pos * .35, base = CH * (.45 + k * .14), x, y;
    cx.beginPath();
    for (x = 0; x <= CW; x += 20) { y = base + Math.sin(x / CW * Math.PI * (1.4 + k * .35) + ph) * amp + Math.sin(x / CW * Math.PI * 3.1 + ph * 1.6) * amp * .35; x ? cx.lineTo(x, y) : cx.moveTo(x, y); }
    var path = cx; cx.strokeStyle = "hsla(" + (hue + k * 10) + ",55%,72%," + (.17 - k * .03) + ")"; cx.lineWidth = 1; cx.stroke();
    cx.lineTo(CW, CH); cx.lineTo(0, CH); cx.closePath(); cx.fillStyle = "hsla(" + (hue + k * 10) + ",45%," + (34 + k * 4) + "%," + (.08 - k * .012) + ")"; cx.fill();
  }
}
function tick(now) {
  if (!running) return;
  requestAnimationFrame(tick);
  if (document.hidden) return;
  var d = target - pos, moving = Math.abs(d) > .0004;
  if (moving) pos += d * .095; else if (pos !== target) pos = target;
  var dh = htarget - hue; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  if (Math.abs(dh) > .6) { hue += dh * .06; if (now - lastHue > 60) { lastHue = now; bgEl.style.setProperty("--hue", hue.toFixed(0)); } }
  else if (dh !== 0) { hue = htarget; bgEl.style.setProperty("--hue", hue.toFixed(0)); }
  if (moving || dirty) { layout(); focus(); dirty = false; }
  if (now - lastWave > (moving ? 80 : 60)) { lastWave = now; waves(now / 1000); }       // el fondo se mueve despacio: ~15 fps bastan
}
function termChips(o) { return (o.terms || []).slice(0, 8).map(function (id) { var t = A.GLOS[id]; return t ? '<a class="chp" href="#glosario?id=' + id + '">' + esc(t.t) + "</a>" : ""; }).join(""); }
var wasSib = null;
function openEv(i) {
  var e = EV[i], o = e.o; openI = i;
  var gi = -1; G.some(function (g, k) { if (g.ev.some(function (x) { return x.i === i; })) { gi = k; return true; } return false; });
  if (gi !== Math.round(target)) go(gi);
  var art = artistOf(o), same = EV.filter(function (x) { return x !== e && x.tema === e.tema && !(e.sib && x.u === e.u); });
  same.sort(function (a, b) { return Math.abs(a.y - e.y) - Math.abs(b.y - e.y); }); same = same.slice(0, 6).sort(function (a, b) { return a.y - b.y; });
  var cab = (o.cab || "").split(" · "), when = cab.shift(), sub = cab.join(" · ");
  var co = e.lab ? [] : A.SEMB.filter(function (s) { return !s.obra && s.y0 != null && s !== art && s.y0 <= e.y && (s.y1 == null ? 2026 : s.y1) >= e.y; });
  co.sort(function (a, b) { return Math.abs(a.tema - e.tema) - Math.abs(b.tema - e.tema) || a.y0 - b.y0; }); co = co.slice(0, 8);
  pn.style.setProperty("--hue", hueOf(e.tema));
  pn.innerHTML = '<button class="x" type="button" aria-label="Cerrar">×</button>' +
    (o.img ? '<button class="pimg" type="button" data-z="' + i + '" data-full="' + esc(o.img) + '" aria-label="Ampliar la imagen"><img src="' + esc(o.th || o.img) + '" alt="' + esc(o.pie) + '" draggable="false"></button>' : "") +
    (e.sib ? '<div class="strip" role="group" aria-label="Imágenes de ' + esc(e.u.set.n) + '"><div class="sh"><b>' + esc(e.u.set.n) + "</b><span>" + (e.sib.indexOf(e) + 1) + " / " + e.sib.length + '</span></div><div class="sb">' + e.sib.map(function (x) { return '<button type="button" data-e="' + x.i + '"' + (x === e ? ' aria-current="true"' : "") + ' title="' + esc(x.o.pie) + '"><img src="' + esc(x.o.th || x.o.img) + '" alt="' + esc(x.o.pie) + '" draggable="false" decoding="async"></button>'; }).join("") + "</div></div>" : "") +
    '<div class="k">' + esc(A.temaLabel(e.tema)) + "</div><h2>" + esc(o.pie) + '</h2><div class="yr">' + esc(when) + (o.nombre ? " · " + esc(o.nombre) : "") + "</div>" +
    (sub ? "<h3>Estilo</h3><p class=\"sub\">" + esc(sub) + "</p>" : "") +
    (art ? '<p class="act"><a class="pbtn" href="#a-' + art.id + '">Ficha de ' + esc(art.nombre) + "</a></p>" : "") +
    (function () { var h = A.esHref(e.y, art && art.id); if (h && !art) h.t = "La España de entonces"; return h ? '<p class="act"><a class="pbtn alt" href="' + esc(h.u) + '" target="_blank" rel="noopener">' + esc(h.t) + " ↗</a></p>" : ""; })() +
    ((o.terms || []).length ? "<h3>Términos del glosario</h3><div class=\"chs\">" + termChips(o) + "</div>" : "") +
    (co.length ? "<h3>Vivían ese año</h3><div class=\"chs\">" + co.map(function (a) { return '<a class="chp" href="#a-' + a.id + '">' + esc(a.nombre) + "</a>"; }).join("") + "</div>" : "") +
    (same.length ? "<h3>Más de este tema</h3><ul>" + same.map(function (x) { return '<li><button type="button" data-e="' + x.i + '"><b>' + esc(x.lab ? x.lab.replace(/^Siglos? /, "S. ") : fy(x.y)) + "</b><span>" + esc(x.o.pie) + "</span></button></li>"; }).join("") + "</ul>" : "");
  A.pre(o.img); if (e.sib) e.sib.forEach(function (x) { A.pre(x.o.th); });
  var keep = e.sib && wasSib === e.u;
  pn.classList.add("on"); sc.classList.add("on"); pn.scrollTop = 0; wasSib = e.sib ? e.u : null;
  var cb = pn.querySelector('.sb [aria-current]'); if (cb) cb.scrollIntoView({ block: "nearest", inline: "center" });
  var x = keep && cb ? cb : pn.querySelector(".x"); if (x) x.focus({ preventScroll: true });
}
function closePn() { pn.classList.remove("on"); sc.classList.remove("on"); openI = -1; }
function railTo(ev) { var r = rail.getBoundingClientRect(); go((ev.clientX - r.left) / r.width * (N - 1)); }
function bind() {
  pn.addEventListener("click", function (ev) {
    if (ev.target.closest(".x")) { closePn(); return; }
    var z = ev.target.closest("[data-z]"); if (z) { var o = EV[+z.dataset.z].o; A.zoom(o.img, A.capOf(o), A.crOf(o), o.th); return; }
    var b = ev.target.closest("[data-e]"); if (b) openEv(+b.dataset.e);
  });
  sc.addEventListener("click", closePn);
  stage.addEventListener("click", function (ev) { var b = ev.target.closest("button[data-e]"); if (b && !moved) openEv(+b.dataset.e); });
  var acc = 0, lastW = 0;
  root.addEventListener("wheel", function (ev) {
    if (pn.contains(ev.target)) return; ev.preventDefault();
    var d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY; acc += d;
    if (Math.abs(acc) > 40 && performance.now() - lastW > 90) { go(target + (acc > 0 ? 1 : -1)); acc = 0; lastW = performance.now(); }
  }, { passive: false });
  document.addEventListener("keydown", function (ev) {
    if (!running || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector("dialog[open]")) return;
    var t = ev.target; if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    var k = ev.key;
    if (k === "Escape") { closePn(); return; }
    if (k === "Enter" && (!t || t === document.body)) { ev.preventDefault(); openEv(G[Math.round(target)].u[0].ev[0].i); return; }
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") { ev.preventDefault(); go(target + 1); }
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { ev.preventDefault(); go(target - 1); }
    else if (k === "Home") go(0); else if (k === "End") go(N - 1);
  });
  $("tlpv").onclick = function () { go(target - 1); }; $("tlnx").onclick = function () { go(target + 1); };
  var drag = null;
  stage.addEventListener("pointerdown", function (ev) { drag = { x: ev.clientX, p: pos, id: ev.pointerId }; moved = false; });
  stage.addEventListener("pointermove", function (ev) {
    if (!drag) return; var dx = ev.clientX - drag.x;
    if (!moved && Math.abs(dx) > 7) { moved = true; try { stage.setPointerCapture(drag.id); } catch (_) {} }
    if (moved) { pos = clamp(drag.p - dx / GAP(), 0, N - 1); target = pos; dirty = true; }
  });
  function end() { if (!drag) return; var m = moved; drag = null; if (m) go(Math.round(pos)); setTimeout(function () { moved = false; }, 0); }
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  var rd = false;
  rail.addEventListener("pointerdown", function (ev) { rd = true; rail.setPointerCapture(ev.pointerId); railTo(ev); });
  rail.addEventListener("pointermove", function (ev) { if (rd) railTo(ev); }); rail.addEventListener("pointerup", function () { rd = false; });
  window.addEventListener("resize", fit);
}
function jumpTo(p) {
  var gi = -1;
  if (p.o) G.some(function (g, k) { if (g.ev.some(function (e) { return e.o.id === p.o; })) { gi = k; return true; } return false; });
  else if (p.a) { var s = A.sById[p.a], n = s ? A.norm(s.nombre) : ""; if (n) G.some(function (g, k) { if (g.ev.some(function (e) { return A.norm(e.o.nombre || "").indexOf(n) >= 0; })) { gi = k; return true; } return false; }); }
  else if (p.t) G.some(function (g, k) { if (g.tema === +p.t) { gi = k; return true; } return false; });
  else if (p.y) G.some(function (g, k) { if (g.y >= +p.y) { gi = k; return true; } return false; });
  if (gi < 0) { gi = 0; G.some(function (g, k) { if (g.y >= 1500) { gi = k; return true; } return false; }); }
  go(gi); pos = target;
}
A.hooks.cronologia = function (p) {
  build(); root.classList.add("on"); fit();
  var m = document.querySelector("header.site"); root.style.setProperty("--hh", (m ? m.offsetHeight : 68) + "px");
  if (!A.tlSeen || p.o || p.a || p.t || p.y) { jumpTo(p || {}); A.tlSeen = true; }
  if (!running) { running = true; requestAnimationFrame(tick); }
};
A.tlStop = function () { running = false; if (pn) closePn(); };
window.addEventListener("hashchange", function () { if (running && (location.hash || "").replace(/\?.*/, "") !== "#cronologia") A.tlStop(); });
window.addEventListener("resize", function () { if (!running) return; fit(); dirty = true; var m = document.querySelector("header.site"); root.style.setProperty("--hh", (m ? m.offsetHeight : 68) + "px"); });
})();
