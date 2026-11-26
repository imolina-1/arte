/* Historia del Arte — juego: experiencia, racha, sesión diaria, estadísticas, álbum de cromos y clasificación anónima.
   Todo se guarda en el navegador del alumno (arte_g). Lo único que sale es, solo si el alumno lo decide, una fila anónima
   (identificador aleatorio + cifras) en la clasificación. */
(function () {
"use strict";
var A = window.ARTE, esc = A.esc, $ = A.$;
var LB_URL = "https://historiapau.pages.dev/api/lb?b=arte";
var AL_XP = 30, HOY_N = 8, HOY_XP = 25, HOY_FIC = 5, HOY_TEMA = 5;

/* ---------- tiempo ---------- */
function dayNum(t) { var d = new Date(t || Date.now()); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function dayKey(n) { var d = new Date(n * 864e5); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0"); }
function todayKey() { return dayKey(dayNum()); }
function nf(x) { return (x || 0).toLocaleString("es-ES"); }
function fmtMin(m) { m = Math.round(m); return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min"; }

/* ---------- estado ---------- */
var G = (function () {
  var g = A.store("arte_g"); if (!g || typeof g !== "object") g = {};
  g.xp = +g.xp || 0;
  ["act", "sec", "bt", "snap", "day", "vis", "hoy", "lb"].forEach(function (k) { if (!g[k] || typeof g[k] !== "object") g[k] = {}; });
  var a = g.album; if (!a || typeof a !== "object") a = g.album = {};
  if (!a.own || typeof a.own !== "object") a.own = {};
  a.opened = +a.opened || 0; a.bonus = a.bonus == null ? 1 : +a.bonus; a.day = a.day || "";
  return g;
})();
function prune() {
  var n = dayNum(), keep = function (o, days) { Object.keys(o).forEach(function (k) { var p = k.split("-"); if (p.length === 3 && n - Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5) > days) delete o[k]; }); };
  keep(G.act, 400); keep(G.sec, 400); keep(G.snap, 400); keep(G.day, 60); keep(G.vis, 60);
}
function save() { try { G.snap[todayKey()] = G.xp; prune(); A.store("arte_g", G); } catch (e) {} }
function addXP(n) { G.xp += n; }
function act(n) { var k = todayKey(); G.act[k] = (G.act[k] || 0) + (n || 1); }
function dayRec() { var k = todayKey(); return G.day[k] || (G.day[k] = { n: 0, ok: 0, rep: 0, fic: 0, tm: {} }); }
function streak() {
  var n = 0, d = dayNum(), has = function (x) { return (G.act[dayKey(x)] || 0) > 0; };
  if (!has(d)) d--; while (has(d)) { n++; d--; } return n;
}
var RANKS = [[0, "Visitante"], [100, "Aprendiz de taller"], [300, "Copista"], [700, "Discípulo"], [1400, "Oficial de taller"], [2500, "Maestro de taller"], [4000, "Académico"], [6500, "Mecenas"]];
function rankInfo() {
  var r = RANKS[0], nx = null;
  for (var i = 0; i < RANKS.length; i++) if (G.xp >= RANKS[i][0]) { r = RANKS[i]; nx = RANKS[i + 1] || null; }
  return { name: r[1], from: r[0], next: nx };
}
function minTot() { var s = 0; Object.keys(G.sec).forEach(function (k) { s += G.sec[k]; }); return Math.round(s / 60); }

/* ---------- registro de respuestas ---------- */
function temaOfKey(k) {
  var i = k.indexOf(":"), pre = i < 0 ? "" : k.slice(0, i), id = i < 0 ? k : k.slice(i + 1), o;
  if (pre === "rt" || pre === "rd" || pre === "m2" || pre === "m3") { o = A.GLOS[id]; return o ? +o.tema : 0; }
  o = A.sById[id]; return o ? +o.tema : 0;
}
var pend = null, _stat = A.stat, _box = A.setBox;
A.stat = function (k) { pend = { k: k, t: Date.now() }; return _stat.apply(A, arguments); };
A.setBox = function (key, ok) {
  _box.apply(A, arguments);
  var kind = pend && Date.now() - pend.t < 500 ? pend.k : "rep"; pend = null;
  record(kind, String(key), !!ok);
};
function record(kind, key, ok) {
  var t = temaOfKey(key), d = dayRec();
  d.n++; if (ok) d.ok++; if (kind === "rep") d.rep++; if (kind === "fichas") d.fic++;
  if (t) { d.tm[t] = (d.tm[t] || 0) + 1; var b = G.bt[t] || (G.bt[t] = [0, 0]); b[1]++; if (ok) b[0]++; }
  if (window.PULSO) { PULSO.add("q"); if (ok) PULSO.add("qo"); if (t) { PULSO.add("t" + t + "a"); if (ok) PULSO.add("t" + t + "o"); } }
  act(); addXP(ok ? (kind === "rep" ? 4 : 6) : 1);
  after();
}
/* simulacros: se guardan en localStorage con estas claves; el primer elemento es el último intento */
var HIST = { p1hist: 2, pau3hist: 3, pau1hist: 1 };
(function () {
  var set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    var prev = null;
    if (HIST[k] && this === window.localStorage) { try { prev = (JSON.parse(this.getItem(k) || "[]") || [])[0]; } catch (e) {} }
    set.apply(this, arguments);
    if (HIST[k] && this === window.localStorage) {
      try { var cur = (JSON.parse(v) || [])[0]; if (cur && JSON.stringify(cur) !== JSON.stringify(prev)) { act(2); addXP(10 + Math.round(20 * Math.max(0, Math.min(1, (+cur.s || 0) / HIST[k])))); after(); } } catch (e) {}
    }
  };
})();
/* visitas a fichas de artista */
var _ficha = A.hooks.ficha;
A.hooks.ficha = function (p) {
  if (_ficha) _ficha(p);
  if (p && p.id && A.sById[p.id]) {
    var k = todayKey(), v = G.vis[k] || (G.vis[k] = []);
    if (v.indexOf(p.id) < 0) { v.push(p.id); if (v.length > 40) v.shift(); act(); addXP(2); after(); }
  }
};
/* minutos de estudio: se cuentan solo con la pestaña visible y con actividad en el último minuto y medio */
var lastIn = Date.now();
["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) { window.addEventListener(ev, function () { lastIn = Date.now(); }, { passive: true }); });
setInterval(function () {
  if (document.hidden || Date.now() - lastIn > 90000) return;
  var k = todayKey(); G.sec[k] = (G.sec[k] || 0) + 15; if (G.sec[k] % 60 === 0) { act(); A.store("arte_g", G); if (window.PULSO) PULSO.add("mn"); }
}, 15000);
window.addEventListener("pagehide", function () { save(); });

var lbTimer = null;
function after() {
  hoyCheck(); save();
  if (A.route.last === "inicio") renderHoy();
  if (G.lb.on) { clearTimeout(lbTimer); lbTimer = setTimeout(function () { lbPush(); }, 45000); }
}

/* ============================================================
   PARA HOY · sesión diaria adaptativa
   ============================================================ */
var FACES = A.SEMB.filter(function (e) { return e.ret && e.rth; });
function hoyPick() {
  var k = todayKey(), h = G.hoy, d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  var face = FACES[(seed * 7919) % FACES.length];
  if (h.d !== k || !h.w) {
    var rows = []; for (var n = 1; n <= 18; n++) { var b = G.bt[n] || [0, 0]; rows.push({ n: n, m: b[1], p: b[1] ? b[0] / b[1] : null }); }
    var weak = rows.filter(function (r) { return r.m >= 5; }).sort(function (a, b) { return a.p - b.p; })[0];
    if (weak && weak.p < 0.9) { h.w = weak.n; h.why = "Tu punto más débil: " + Math.round(weak.p * 100) + " % de aciertos"; }
    else {
      var pool = rows.slice();
      pool.sort(function (a, b) { return a.m - b.m || ((a.n + seed) % 7) - ((b.n + seed) % 7); });
      h.w = pool[0].n; h.why = pool[0].m ? "El tema que menos has practicado" : "Un tema que aún no has tocado";
    }
    h.d = k;
  }
  return { face: face, w: h.w, why: h.why || "" };
}
function hoyState() {
  var P = hoyPick(), d = G.day[todayKey()] || { fic: 0, rep: 0, tm: {} }, v = G.vis[todayKey()] || [];
  var vis = !!P.face && v.indexOf(P.face.id) >= 0;
  return { P: P, vis: vis, fic: d.fic || 0, rep: d.rep || 0, tm: (d.tm || {})[P.w] || 0, done: [vis, (d.fic || 0) >= HOY_FIC, (d.rep || 0) >= HOY_N, ((d.tm || {})[P.w] || 0) >= HOY_TEMA] };
}
function hoyCheck() {
  var S = hoyState(), k = todayKey();
  if (S.done.every(Boolean) && G.hoy.paid !== k) {
    G.hoy.paid = k; G.hoy.n = (G.hoy.n || 0) + 1; if (window.PULSO) PULSO.add("hy"); addXP(HOY_XP); G.album.bonus++;
    toast("Sesión de hoy completa: +" + HOY_XP + " XP y un sobre de regalo");
  }
}
function renderHoy() {
  var el = $("hoySec"); if (!el) return;
  var S = hoyState(), P = S.P, d = S.done, n = d.filter(Boolean).length, R = 2 * Math.PI * 27, off = R * (1 - n / 4), r = rankInfo(), s = streak();
  function row(i, ic, t, sub, btn, href) {
    return '<li class="jg-hr' + (d[i] ? " ok" : "") + '"><span class="jg-hk" aria-hidden="true">' + (d[i] ? "✓" : ic) + '</span><div class="jg-ht"><b>' + t + "</b><small>" + sub + '</small></div><a class="btn' + (d[i] ? " ghost" : "") + ' jg-sm" href="' + href + '">' + (d[i] ? "Repetir" : btn) + "</a></li>";
  }
  var f = P.face;
  el.innerHTML = '<div class="hsec-h"><h3>Para hoy</h3><span class="hsec-n">10 minutos</span></div>' +
    '<div class="jg-card jg-hoy"><div class="jg-hoyh"><svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="' + n + ' de 4 tareas hechas"><circle cx="32" cy="32" r="27" class="rb"/><circle cx="32" cy="32" r="27" class="rf" style="stroke-dasharray:' + R.toFixed(1) + ";stroke-dashoffset:" + off.toFixed(1) + '"/><text x="32" y="38" text-anchor="middle">' + n + '/4</text></svg>' +
    "<div><h4>" + (n === 4 ? "Hecho por hoy" : "Tu sesión de hoy") + "</h4><p>" + (n === 4 ? "Vuelve mañana." : "Cuatro cosas, cambian cada día y se fijan en lo que fallas. Al terminar: +" + HOY_XP + " XP y un sobre.") + "</p></div>" +
    '<div class="jg-me"><b>' + esc(r.name) + "</b><span>" + nf(G.xp) + " XP · racha " + s + (s === 1 ? " día" : " días") + "</span></div></div>" +
    '<ol class="jg-hol">' +
    row(0, "1", "El artista del día", f ? esc(f.nombre) + " · " + esc(f.yl) + " · " + esc(A.temaLabel(f.tema).split(". ")[0]) : "", "Abrir", f ? "#a-" + f.id : "#semblanzas") +
    row(1, "2", "Cinco fichas de obras", Math.min(S.fic, HOY_FIC) + " de " + HOY_FIC + " hechas · ves la obra y eliges autor", "Empezar", "#fichas") +
    row(2, "3", "Repasa " + HOY_N + " tarjetas", Math.min(S.rep, HOY_N) + " de " + HOY_N + " hechas · las falladas vuelven antes", "Empezar", "#repaso") +
    row(3, "4", "Refuerza el tema " + P.w, esc(A.temaName[P.w] || "") + " · " + esc(P.why) + " (" + Math.min(S.tm, HOY_TEMA) + " de " + HOY_TEMA + ")", "Practicar", "#repaso?t=" + P.w + "&m=term") +
    "</ol></div>" + '<a id="pulsoH" hidden></a>';
  if (window.PULSO) PULSO.ticker($("pulsoH"));
}
var _inicio = A.hooks.inicio;
A.hooks.inicio = function (p) { if (_inicio) _inicio(p); renderHoy(); };

/* ============================================================
   ESTADÍSTICAS (dentro de «Mi progreso»)
   ============================================================ */
function statsHTML() {
  var today = dayNum(), wk = 0, i, r = rankInfo(), s = streak();
  for (i = 0; i < 7; i++) wk += (G.sec[dayKey(today - i)] || 0) / 60;
  var days = Object.keys(G.act).filter(function (k) { return G.act[k] > 0; }).length;
  var mon = today - ((today + 3) % 7), W = 20, cells = "";
  for (var c = 0; c < W; c++) for (var rr = 0; rr < 7; rr++) {
    var d = mon - (W - 1 - c) * 7 + rr, k = dayKey(d);
    if (d > today) { cells += '<i class="hz"></i>'; continue; }
    var m = (G.sec[k] || 0) / 60, a = (G.act[k] || 0) > 0, l = 0;
    if (m > 0 || a) l = m > 45 ? 4 : m > 25 ? 3 : m > 8 ? 2 : 1;
    cells += '<i class="hl' + l + '" title="' + esc(new Date(d * 864e5).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" })) + ": " + (m >= 1 ? Math.round(m) + " min" : (a ? "actividad" : "sin actividad")) + '"></i>';
  }
  var keys = []; for (i = 29; i >= 0; i--) keys.push(dayKey(today - i));
  var last = null, prior = Object.keys(G.snap).filter(function (k) { return k < keys[0]; }).sort().pop(); if (prior) last = G.snap[prior];
  var pts = keys.map(function (k) { if (G.snap[k] != null) last = G.snap[k]; return last; }), have = pts.filter(function (v) { return v != null; }).length;
  var xpc = '<p class="jg-note">La gráfica se dibuja a medida que estudies: cada día guarda tus puntos.</p>';
  if (have >= 2) {
    var first = pts.filter(function (v) { return v != null; })[0], vs = pts.map(function (v) { return v == null ? first : v; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), rg = Math.max(1, mx - mn);
    var X = function (j) { return 6 + j * (288 / 29); }, Y = function (v) { return 70 - ((v - mn) / rg) * 56; };
    var line = vs.map(function (v, j) { return (j ? "L" : "M") + X(j).toFixed(1) + " " + Y(v).toFixed(1); }).join("");
    xpc = '<svg viewBox="0 0 300 84" width="100%" role="img" aria-label="Puntos de experiencia en los últimos 30 días" class="jg-xpc"><path d="' + line + "L" + X(29) + ' 76L6 76Z" class="ar"/><path d="' + line + '" class="ln"/><circle cx="' + X(29) + '" cy="' + Y(vs[29]).toFixed(1) + '" r="3"/></svg><div class="jg-xpl"><span>hace 30 días</span><span>hoy · ' + nf(G.xp) + " XP</span></div>";
  }
  var rows = []; for (var n = 1; n <= 18; n++) { var b = G.bt[n] || [0, 0]; rows.push({ n: n, o: b[0], m: b[1], p: b[1] ? b[0] / b[1] : null }); }
  var weak = rows.filter(function (x) { return x.m >= 5; }).sort(function (a, b) { return a.p - b.p; })[0];
  var tb = rows.map(function (x) {
    return '<li class="jg-tb' + (weak && weak.n === x.n ? " weak" : "") + '"><span class="tn">T' + x.n + '</span><span class="tt">' + esc(A.temaName[x.n] || "") + '</span><span class="tbar"><i style="width:' + (x.m ? Math.round(x.p * 100) : 0) + '%"></i></span><span class="tv">' + (x.m ? Math.round(x.p * 100) + " % · " + x.o + "/" + x.m : "—") + "</span></li>";
  }).join("");
  var nx = r.next ? Math.min(100, Math.round(100 * (G.xp - r.from) / (r.next[0] - r.from))) : 100;
  return '<section class="jg-stats" aria-label="Tu actividad"><h3 class="fi-s">Tu actividad</h3>' +
    '<div class="jg-rank"><div><small>Rango</small><b>' + esc(r.name) + '</b><span class="jg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + nx + '"><i style="width:' + nx + '%"></i></span><em>' + (r.next ? nf(r.next[0] - G.xp) + " XP para «" + esc(r.next[1]) + "»" : "Rango máximo") + "</em></div></div>" +
    '<div class="jg-s4"><div><b>' + nf(G.xp) + "</b><span>puntos de experiencia</span></div><div><b>" + s + "</b><span>" + (s === 1 ? "día seguido" : "días seguidos") + "</span></div><div><b>" + fmtMin(minTot()) + "</b><span>de estudio · " + fmtMin(wk) + " esta semana</span></div><div><b>" + days + "</b><span>días con actividad</span></div></div>" +
    '<div class="jg-two"><div class="jg-card"><h4>Calendario de actividad</h4><div class="jg-hm" role="img" aria-label="Calendario de las últimas 20 semanas">' + cells + '</div><p class="jg-note">Cada casilla es un día; cuanto más oscura, más minutos de estudio. De lunes a domingo.</p></div>' +
    '<div class="jg-card"><h4>Evolución de la experiencia</h4>' + xpc + "</div></div>" +
    '<div class="jg-card" style="margin-top:14px"><h4>Aciertos por tema</h4><p class="jg-note">Cuentan tests, fichas y tarjetas.' + (weak ? " Tu punto más débil ahora: <b>tema " + weak.n + "</b> (" + Math.round(weak.p * 100) + " %). <a href=\"#repaso?t=" + weak.n + '&m=term">Repasarlo</a>' : " Con 5 respuestas en un tema, te señalo el más flojo.") + '</p><ul class="jg-tbs">' + tb + "</ul></div></section>";
}
var _prog = A.hooks.progreso;
A.hooks.progreso = function (p) { if (_prog) _prog(p); var b = $("pgBox"); if (b) b.insertAdjacentHTML("afterbegin", statsHTML()); };

/* ============================================================
   ÁLBUM DE ARTISTAS
   ============================================================ */
var LEG = "fidias leonardo-da-vinci miguel-angel-buonarroti rafael-sanzio diego-velazquez francisco-de-goya rembrandt-van-rijn vincent-van-gogh claude-monet pablo-picasso antoni-gaudi gian-lorenzo-bernini".split(" ");
var RARA = "giotto-di-bondone jan-van-eyck el-bosco filippo-brunelleschi donatello sandro-botticelli tiziano-vecellio el-greco caravaggio pedro-pablo-rubens bartolome-esteban-murillo francisco-de-zurbaran jose-de-ribera antonio-canova jacques-louis-david eugene-delacroix gustave-courbet edouard-manet auguste-rodin paul-cezanne paul-gauguin edvard-munch henri-matisse vasili-kandinsky joan-miro salvador-dali frida-kahlo le-corbusier frank-lloyd-wright frank-gehry piet-mondrian marcel-duchamp andrea-palladio donato-bramante francesco-borromini juan-de-herrera".split(" ");
var CARDS = A.SEMB.filter(function (e) { return !e.compl; });
var ALN = {}; CARDS.slice().sort(function (a, b) { return (a.y0 == null ? 9999 : a.y0) - (b.y0 == null ? 9999 : b.y0); }).forEach(function (e, i) { ALN[e.id] = i + 1; });
function rar(e) { return LEG.indexOf(e.id) >= 0 ? 3 : (RARA.indexOf(e.id) >= 0 ? 2 : 1); }
function alCount() { return Object.keys(G.album.own).filter(function (id) { return ALN[id]; }).length; }
function alPacks() { return Math.max(0, Math.floor(G.xp / AL_XP) + G.album.bonus - G.album.opened); }
function pad(n) { return String(n).padStart(3, "0"); }
var RN = ["", "común", "rara", "legendaria"];
function cromo(e, o) {
  o = o || {}; var r = rar(e), n = pad(ALN[e.id]), T = o.tag || "button", at = T === "button" ? ' type="button" data-id="' + e.id + '"' : "";
  if (!o.owned) return "<" + T + ' class="cro lock r' + r + '"' + at + ' aria-label="Cromo ' + n + ' por descubrir"><span class="cn">Nº ' + n + '</span><span class="cq" aria-hidden="true">?</span><span class="ct"><b>Por descubrir</b><small>' + esc(A.temaLabel(e.tema).split(". ")[0]) + "</small></span></" + T + ">";
  var im = e.rth || e.th || e.img;
  return "<" + T + ' class="cro r' + r + '"' + at + '><span class="cn">Nº ' + n + '</span><span class="cr" aria-label="' + RN[r] + '">' + "★".repeat(r) + '</span><span class="cim"><img src="' + esc(im) + '" alt="" loading="lazy" decoding="async"></span><span class="ct"><b>' + esc(e.nombre) + "</b><i>" + esc(e.yl) + "</i><small>" + esc("T" + e.tema + " · " + (A.temaName[e.tema] || "")) + "</small></span></" + T + ">";
}
function alOpen() {
  var a = G.album, out = [];
  for (var k = 0; k < 3; k++) {
    var roll = Math.random(), want = roll < 0.10 ? 3 : (roll < 0.38 ? 2 : 1);
    var ok = function (e) { return !out.some(function (o) { return o.e.id === e.id; }); };
    var cand = CARDS.filter(function (e) { return rar(e) === want && ok(e); }); if (!cand.length) cand = CARDS.filter(ok);
    var un = cand.filter(function (e) { return !a.own[e.id]; }), from = (un.length && Math.random() < 0.85) ? un : cand;
    out.push({ e: from[Math.floor(Math.random() * from.length)] });
  }
  out.forEach(function (o) { if (a.own[o.e.id]) { o.isNew = false; addXP(2); } else { o.isNew = true; a.own[o.e.id] = Date.now(); } });
  a.opened++; act(); save();
  if (window.PULSO) { PULSO.add("pk"); var nw = out.filter(function (o) { return o.isNew; }), lg = nw.filter(function (o) { return rar(o.e) === 3; }).length; if (nw.length) PULSO.add("nw", nw.length); if (lg) PULSO.add("lg", lg); }
  return out;
}
var PK = null;
function pkEnsure() {
  var d = $("pk"); if (d) return d;
  d = document.createElement("dialog"); d.id = "pk"; d.className = "pk"; d.setAttribute("aria-label", "Abrir un sobre");
  d.innerHTML = '<button class="pkx" id="pkx" type="button" aria-label="Cerrar">×</button><div id="pkb"></div><p class="pkfb" id="pkfb" role="status"></p>';
  document.body.appendChild(d);
  d.addEventListener("click", function (e) { if (e.target === d || e.target.id === "pkx") close(d); });
  d.addEventListener("close", function () { PK = null; if (A.route.last === "album") renderAlbum(); else if (A.route.last === "inicio") renderHoy(); });
  return d;
}
function close(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
function pkShow() { var d = pkEnsure(); if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute("open", ""); pkSealed(); }
function pkSealed() {
  var n = alPacks(), a = G.album; $("pkfb").textContent = "";
  $("pkb").innerHTML = n > 0
    ? '<div class="pkh"><span>Sobre nº ' + (a.opened + 1) + "</span><small>" + n + (n === 1 ? " sobre" : " sobres") + ' por abrir</small></div><button class="sobre" id="pkgo" type="button" aria-label="Abrir el sobre"><span class="flap"></span><span class="sl"><b>A</b><em>Historia del Arte</em><i>3 cromos</i></span></button><p class="pkn">Toca el sobre para abrirlo.</p>'
    : '<div class="pkh"><span>No te quedan sobres</span><small>' + alCount() + " de " + CARDS.length + ' cromos</small></div><p class="pkn">Ganas un sobre por cada ' + AL_XP + ' puntos de experiencia: tests, fichas, repaso y simulacros. Y cada día hay uno de regalo.</p><div class="row pkact" style="margin-top:18px;justify-content:center"><button class="btn" id="pkclose" type="button">Volver al álbum</button></div>';
  var g = $("pkgo"); if (g) { g.onclick = pkTear; g.focus({ preventScroll: true }); }
  var c = $("pkclose"); if (c) c.onclick = function () { close($("pk")); };
}
function pkTear() {
  var sb = $("pkgo"); if (!sb || sb.classList.contains("tear")) return;
  var res = alOpen(); sb.classList.add("tear"); sb.disabled = true;
  var quick = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  setTimeout(function () { pkDeal(res); }, quick ? 60 : 900);
}
function pkDeal(res) {
  PK = { res: res, n: 0 };
  $("pkb").innerHTML = '<div class="pkrow">' + res.map(function (r, i) {
    return '<div class="pkc g' + rar(r.e) + '" style="--i:' + i + '"><div class="fl" data-i="' + i + '" role="button" tabindex="0" aria-label="Voltear el cromo ' + (i + 1) + '"><div class="in"><div class="face back"><div class="cback"><b>A</b></div></div><div class="face front">' + cromo(r.e, { owned: 1, tag: "div" }) + "</div></div></div>" + (r.isNew ? '<span class="nw">¡Nuevo!</span>' : '<span class="nw rp">Repetido · +2 XP</span>') + "</div>";
  }).join("") + '</div><div class="row pkact" style="justify-content:center"><button class="btn ghost" id="pkall" type="button">Voltear todos</button></div>';
  function flip(el) {
    if (el.classList.contains("on")) return; el.classList.add("on"); el.removeAttribute("tabindex"); el.setAttribute("aria-label", "Cromo volteado"); PK.n++;
    var r = PK.res[+el.dataset.i], rr = rar(r.e); $("pkfb").textContent = "★".repeat(rr) + " " + RN[rr].charAt(0).toUpperCase() + RN[rr].slice(1) + ": " + r.e.nombre + ".";
    if (PK.n >= 3) setTimeout(pkDone, 650);
  }
  [].slice.call($("pkb").querySelectorAll(".fl")).forEach(function (el) { el.onclick = function () { flip(el); }; el.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(el); } }; });
  $("pkall").onclick = function () { [].slice.call($("pkb").querySelectorAll(".fl")).forEach(function (el, i) { setTimeout(function () { flip(el); }, i * 260); }); };
  var f = $("pkb").querySelector(".fl"); if (f) f.focus({ preventScroll: true });
}
function pkDone() {
  if (!PK) return; var nw = PK.res.filter(function (r) { return r.isNew; }).length, dup = 3 - nw, n = alPacks();
  $("pkfb").innerHTML = (nw ? "<b>" + nw + (nw === 1 ? " cromo nuevo" : " cromos nuevos") + "</b>" : "Ninguno nuevo esta vez") + (dup ? " · " + dup + (dup === 1 ? " repetido" : " repetidos") : "") + ". Llevas " + alCount() + " de " + CARDS.length + ".";
  $("pkb").querySelector(".pkact").innerHTML = (n > 0 ? '<button class="btn" id="pknext" type="button">Abrir otro sobre (' + n + ')</button>' : "") + '<button class="btn ghost" id="pkend" type="button">Ver el álbum</button>';
  var x = $("pknext"); if (x) { x.onclick = pkSealed; x.focus({ preventScroll: true }); }
  $("pkend").onclick = function () { close($("pk")); };
}
var ALF = { e: "", r: "" };
function renderAlbum() {
  var V = $("v-album"); if (!V) return;
  var a = G.album, own = a.own, tot = CARDS.length, k = alCount(), n = alPacks(), t = todayKey(), canDaily = a.day !== t;
  var by = function (r) { var all = CARDS.filter(function (e) { return rar(e) === r; }); return [all.filter(function (e) { return own[e.id]; }).length, all.length]; };
  var c1 = by(1), c2 = by(2), c3 = by(3);
  var L = CARDS.filter(function (e) { return (!ALF.e || (ALF.e === "si" ? own[e.id] : !own[e.id])) && (!ALF.r || String(rar(e)) === ALF.r); });
  var temas = {}; L.forEach(function (e) { (temas[e.tema] = temas[e.tema] || []).push(e); });
  var groups = Object.keys(temas).map(Number).sort(function (x, y) { return x - y; }).map(function (tn) {
    var all = CARDS.filter(function (e) { return e.tema === tn; }), got = all.filter(function (e) { return own[e.id]; }).length;
    return '<div class="al-t"><h3>' + esc(A.temaLabel(tn)) + '</h3><span class="k' + (got === all.length ? " full" : "") + '">' + got + " / " + all.length + (got === all.length ? " · completo" : "") + '</span></div><div class="al-grid">' + temas[tn].sort(function (x, y) { return ALN[x.id] - ALN[y.id]; }).map(function (e) { return cromo(e, { owned: !!own[e.id] }); }).join("") + "</div>";
  }).join("");
  V.innerHTML = '<h2 id="h-al">Álbum de artistas</h2><p class="lead">Los ' + tot + ' artistas del dossier, en cromos.</p>' +
    '<div class="jg-card al-sum"><div class="al1"><div class="big">' + k + "<small>/ " + tot + ' cromos</small></div><div class="jg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + tot + '" aria-valuenow="' + k + '"><i style="width:' + (k / tot * 100).toFixed(1) + '%"></i></div>' +
    '<div class="rars"><span><b>' + c1[0] + "/" + c1[1] + '</b> ★ comunes</span><span><b>' + c2[0] + "/" + c2[1] + '</b> ★★ raras</span><span><b>' + c3[0] + "/" + c3[1] + "</b> ★★★ legendarias</span></div></div>" +
    '<div class="al2"><h4>' + n + (n === 1 ? " sobre" : " sobres") + ' por abrir</h4><p>Uno cada ' + AL_XP + ' XP, más uno de regalo cada día.</p><div class="row"><button class="btn" id="alopen" type="button"' + (n ? "" : " disabled") + '>Abrir un sobre</button>' + (canDaily ? '<button class="btn ghost" id="aldaily" type="button">Sobre del día</button>' : '<span class="jg-note">Hoy ya has cogido el de regalo.</span>') + "</div></div></div>" +
    '<div class="al-f"><label>Mostrar<select id="ale"><option value="">Todos</option><option value="si">Conseguidos</option><option value="no">Por descubrir</option></select></label><label>Rareza<select id="alr"><option value="">Todas</option><option value="1">★ Común</option><option value="2">★★ Rara</option><option value="3">★★★ Legendaria</option></select></label><span class="jg-note">' + L.length + " cromos a la vista</span></div>" +
    (groups || '<p class="lead">Ningún cromo con esos filtros.</p>') +
    '<p class="jg-note al-leg"><b>Cómo se reparten las rarezas.</b> ★★★ legendaria: los grandes maestros del temario. ★★ rara: figuras decisivas de cada época. ★ común: el resto del dossier. Los cromos siguen el orden cronológico.</p>';
  $("ale").value = ALF.e; $("alr").value = ALF.r;
  ["ale", "alr"].forEach(function (i) { $(i).onchange = function () { ALF.e = $("ale").value; ALF.r = $("alr").value; renderAlbum(); }; });
  $("alopen").onclick = pkShow;
  var dd = $("aldaily"); if (dd) dd.onclick = function () { if (G.album.day === t) return; G.album.day = t; G.album.bonus++; save(); toast("Sobre del día añadido"); renderAlbum(); };
  [].slice.call(V.querySelectorAll(".cro")).forEach(function (b) { b.onclick = function () { var id = b.dataset.id; if (G.album.own[id]) location.hash = "#a-" + id; else toast("Aún no tienes ese cromo. Gana sobres estudiando."); }; });
}
A.hooks.album = renderAlbum;

/* ============================================================
   CLASIFICACIÓN ANÓNIMA
   ============================================================ */
var LBS = { d: null, tab: "xpT", busy: false, err: "", t: 0 };
function lbId() { if (!G.lb.id) { var a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); }); G.lb.id = [].slice.call(a).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); save(); } return G.lb.id; }
function lbPayload() { return { id: lbId(), xp: G.xp, streak: streak(), cards: alCount(), badges: G.hoy.n || 0, mins: minTot() }; }
function lbCall(method, q, body, hdr) {
  var c = window.AbortController ? new AbortController() : null, to = setTimeout(function () { c && c.abort(); }, 9000);
  var h = Object.assign(body ? { "content-type": "application/json" } : {}, hdr || {});
  return fetch(LB_URL + (q || ""), { method: method, signal: c ? c.signal : undefined, headers: h, body: body ? JSON.stringify(body) : undefined })
    .then(function (r) { return r.json().catch(function () { return null; }); })
    .then(function (j) { return j || { ok: false, error: "Respuesta no válida del servidor." }; })
    .catch(function () { return { ok: false, error: "No se pudo conectar. Comprueba tu conexión." }; })
    .then(function (j) { clearTimeout(to); return j; });
}
function lbLoad() {
  LBS.busy = true; LBS.err = ""; if (A.route.last === "clasif") renderClasif();
  return lbCall("GET", G.lb.on ? "&id=" + G.lb.id : "").then(function (j) {
    LBS.busy = false; if (j.ok) { LBS.d = j; LBS.t = Date.now(); } else LBS.err = j.error || "Error";
    if (A.route.last === "clasif") renderClasif();
  });
}
function lbPush() { if (!G.lb.on) return Promise.resolve(null); return lbCall("POST", "", lbPayload()).then(function (j) { if (j.ok) { LBS.d = j; LBS.t = Date.now(); } return j; }); }
function weekLabel(w) { return new Date((w * 7 - 3) * 864e5).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "UTC" }); }
function lbRow(r, i, tab, me, mx) {
  var mine = !!(me && r.xp === me.xp && r.streak === me.streak && r.cards === me.cards && r.mins === me.mins && r.wxp === me.wxp);
  var v = { xpT: r.xp, wk: r.wxp, streak: r.streak, cards: r.cards }[tab];
  var main = { xpT: nf(r.xp) + " XP", wk: "+" + nf(r.wxp) + " esta semana", streak: r.streak + (r.streak === 1 ? " día" : " días"), cards: r.cards + " cromos" }[tab];
  var sub = { xpT: "racha " + r.streak + " · " + r.cards + " cromos", wk: nf(r.xp) + " XP en total", streak: nf(r.xp) + " XP", cards: nf(r.xp) + " XP" }[tab];
  return '<li class="lbr' + (mine ? " me" : "") + (i < 3 ? " top" : "") + '"><span class="lbn">' + (i + 1) + '</span><span class="lba"><span class="jg-bar" aria-hidden="true"><i style="width:' + (mx ? Math.max(3, Math.round(100 * v / mx)) : 3) + '%"></i></span><small>' + (mine ? "<b>Tú</b> · " : "") + sub + '</small></span><span class="lbv">' + main + "</span></li>";
}
function renderClasif() {
  var V = $("v-clasif"); if (!V) return;
  var on = !!G.lb.on, d = LBS.d, tab = LBS.tab, me = d && d.me, list = (d && d[tab]) || [];
  var tabs = [["xpT", "Total"], ["wk", "Esta semana"], ["streak", "Racha"], ["cards", "Cromos"]];
  var rk = { xpT: me && me.rank, wk: me && me.rankW, streak: me && me.rankS, cards: me && me.rankC }[tab];
  var val = function (x) { return { xpT: x.xp, wk: x.wxp, streak: x.streak, cards: x.cards }[tab]; };
  var mx = Math.max.apply(null, [1].concat(list.map(val)));
  V.innerHTML = '<h2 id="h-cl">Clasificación</h2><div id="pulso"></div>' +
    (on ? '<div class="jg-card cl-me"><div><small>Estás en el ranking</small><h3>' + (me ? "Puesto " + me.rank : "…") + "</h3><p>" + (me ? "De " + d.n + " participantes · " + nf(me.xp) + " XP · +" + nf(me.wxp) + " esta semana" : (LBS.busy ? "Sincronizando…" : "Aún sin sincronizar")) + '</p></div><div class="row"><button class="btn" id="lbup" type="button">Actualizar mis puntos</button><button class="btn ghost" id="lbout" type="button">Salir del ranking</button></div></div>'
      : '<div class="jg-card cl-join"><h3>Ranking opcional</h3><p>Las cifras de la clase y tu posición se cuentan solas. El ranking con puestos es opcional: si entras, se publican tus puntos (XP), tu racha y tus cromos con un identificador aleatorio, sin nombre ni alias. Puedes salir cuando quieras y tu fila se borra.</p><div class="row"><button class="btn" id="lbjoin" type="button">Entrar en el ranking</button><span class="jg-note" id="lbmsg" role="alert"></span></div></div>') +
    (LBS.err && !d ? '<p class="jg-warn">' + esc(LBS.err) + ' <button class="btn ghost jg-sm" id="lbretry" type="button">Reintentar</button></p>' : "") +
    (d ? '<div class="jg-s4" style="margin-top:16px"><div><b>' + d.n + "</b><span>participantes</span></div><div><b>" + nf(d.xp) + "</b><span>XP entre todos</span></div><div><b>" + Math.round(d.mins / 60) + " h</b><span>de estudio sumadas</span></div><div><b>" + weekLabel(d.week) + "</b><span>inicio de la semana</span></div></div>" : "") +
    '<div class="cl-f"><div class="jg-seg" role="tablist" aria-label="Clasificación">' + tabs.map(function (t) { return '<button type="button" role="tab" data-lt="' + t[0] + '" aria-current="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("") + '</div><button class="btn ghost jg-sm" id="lbrf" type="button">' + (LBS.busy ? "Cargando…" : "↻ Refrescar") + "</button></div>" +
    (me && rk ? '<p class="jg-note">Tu puesto en esta lista: <b>' + rk + "</b>.</p>" : "") +
    (list.length ? '<ol class="lbk">' + list.map(function (r, i) { return lbRow(r, i, tab, me, mx); }).join("") + "</ol>" : '<p class="jg-note" style="margin-top:18px">' + (LBS.busy ? "Cargando…" : (d ? "Todavía no hay nadie en esta lista." : "")) + "</p>") +
    '<p class="jg-note">Los puntos se calculan en tu dispositivo; el servidor limita las subidas anormales y el profesor puede retirar filas con cifras imposibles. Se actualiza cuando estudias y cuando pulsas «Actualizar».</p>' +
    '<details class="cl-mod"><summary>Moderación (profesor)</summary><div class="row" style="align-items:flex-end"><label>Clave<input id="mdt" type="password" autocomplete="off"></label><button class="btn ghost jg-sm" id="mdgo" type="button">Cargar filas</button><button class="btn ghost jg-sm" id="mdall" type="button">Vaciar clasificación</button></div><div id="mdl"></div></details>';
  if (window.PULSO) PULSO.render($("pulso"));
  [].slice.call(V.querySelectorAll("[data-lt]")).forEach(function (b) { b.onclick = function () { LBS.tab = b.dataset.lt; renderClasif(); }; });
  $("lbrf").onclick = function () { lbLoad(); };
  var rt = $("lbretry"); if (rt) rt.onclick = function () { lbLoad(); };
  var up = $("lbup"); if (up) up.onclick = function () { up.disabled = true; lbPush().then(function (j) { toast(j && !j.ok ? (j.error || "No se pudo actualizar.") : "Puntos actualizados"); lbLoad(); }); };
  var out = $("lbout"); if (out) out.onclick = function () {
    if (!out.dataset.sure) { out.dataset.sure = "1"; out.textContent = "¿Seguro? Pulsa otra vez"; return; }
    lbCall("DELETE", "&id=" + lbId()).then(function (j) { if (j.ok) { G.lb.on = 0; save(); LBS.d = null; toast("Has salido del ranking"); lbLoad(); } else toast(j.error || "No se pudo salir."); });
  };
  var jn = $("lbjoin"); if (jn) jn.onclick = function () {
    jn.disabled = true; $("lbmsg").textContent = "Entrando…"; lbId(); G.lb.on = 1;
    lbCall("POST", "", lbPayload()).then(function (j) {
      if (j.ok) { save(); LBS.d = j; LBS.t = Date.now(); toast("Estás en el ranking"); lbLoad(); }
      else { G.lb.on = 0; jn.disabled = false; $("lbmsg").textContent = j.error || "No se pudo entrar."; }
    });
  };
  modInit();
}
function modInit() {
  var t = $("mdt"), L = $("mdl"); if (!t) return;
  try { t.value = sessionStorage.getItem("arte_mod") || ""; } catch (e) {}
  var hd = function () { return { "x-admin": t.value }; };
  $("mdgo").onclick = function () {
    try { sessionStorage.setItem("arte_mod", t.value); } catch (e) {}
    lbCall("GET", "", null, hd()).then(function (j) {
      if (!j.ok) { L.textContent = j.error; return; }
      if (!j.xpT.length || !j.xpT[0].id) { L.textContent = j.xpT.length ? "Clave incorrecta." : "No hay filas."; return; }
      L.innerHTML = '<table class="jg-tbl"><thead><tr><th>Puesto</th><th>XP</th><th>Racha</th><th>Cromos</th><th>Estudio</th><th></th></tr></thead><tbody>' + j.xpT.map(function (r, i) { return "<tr><td>" + (i + 1) + "</td><td>" + nf(r.xp) + "</td><td>" + r.streak + "</td><td>" + r.cards + "</td><td>" + fmtMin(r.mins) + '</td><td><button class="btn ghost jg-sm" data-x="' + esc(r.id) + '" type="button">Retirar</button></td></tr>'; }).join("") + "</tbody></table>";
      [].slice.call(L.querySelectorAll("[data-x]")).forEach(function (b) {
        b.onclick = function () {
          if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "¿Seguro?"; return; }
          lbCall("DELETE", "&id=" + encodeURIComponent(b.dataset.x), null, hd()).then(function (k) { if (k.ok) { b.closest("tr").remove(); toast("Fila retirada"); } else toast(k.error || "No autorizado"); });
        };
      });
    });
  };
  $("mdall").onclick = function () {
    var b = this; if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "¿Seguro? Pulsa otra vez"; return; }
    lbCall("DELETE", "&all=1", null, hd()).then(function (k) { b.dataset.sure = ""; b.textContent = "Vaciar clasificación"; toast(k.ok ? "Clasificación vaciada" : (k.error || "No autorizado")); });
  };
}
A.hooks.clasif = function () { if (!LBS.d || Date.now() - LBS.t > 20000) lbLoad(); else renderClasif(); };

/* ---------- aviso ---------- */
function toast(m) {
  var t = $("jgToast"); if (!t) { t = document.createElement("div"); t.id = "jgToast"; t.className = "jg-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 2800);
}
A.jg = { G: G, toast: toast, renderHoy: renderHoy, hoyState: hoyState, rankInfo: rankInfo, streak: streak };
A.inits.push(function () { save(); });
})();
