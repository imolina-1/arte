/* Historia del Arte — progreso, comparador, esquemas por tema y mapa */
(function () {
"use strict";
var A = window.ARTE, esc = A.esc, norm = A.norm, $ = A.$, store = A.store;

/* ---------- Mi progreso ---------- */
function temaOfKey(k) {
  var i = k.indexOf(":"), pre = i < 0 ? "" : k.slice(0, i), id = i < 0 ? k : k.slice(i + 1), o;
  if (pre === "rt" || pre === "rd" || pre === "m2" || pre === "m3") { o = A.GLOS[id]; return o ? { tema: o.tema, nom: o.t, href: "#glosario?id=" + o.id, term: true } : null; }
  o = A.sById[id]; return o ? { tema: +o.tema, nom: o.nombre && !o.obra ? o.nombre : (o.pie || o.nombre || id), href: o.obra ? "#test" : "#a-" + o.id, term: false } : null;
}
function progreso() {
  var box = A.boxAll(), per = {}, fails = [], n;
  for (n = 1; n <= 18; n++) per[n] = { n: 0, ok: 0, bad: 0 };
  Object.keys(box).forEach(function (k) {
    var t = temaOfKey(k); if (!t || !per[t.tema]) return; var p = per[t.tema]; p.n++;
    if (box[k] >= 3) p.ok++; if (box[k] === 0) { p.bad++; fails.push(t); }
  });
  var seenKeys = {}, uniqFails = fails.filter(function (f) { var k = f.nom; if (seenKeys[k]) return false; seenKeys[k] = 1; return true; });
  var rows = [["fichas", "Fichas de obras"], ["img2term", "Imagen → término"], ["term2img", "Término → imagen"], ["def2term", "Definición → término"]];
  var tests = rows.map(function (r) { var s = A.getStat(r[0]); return '<li><span>' + r[1] + '</span><b>' + (s.n ? Math.round(100 * s.ok / s.n) + " %" : "—") + '</b><small>' + s.ok + " de " + s.n + "</small></li>"; }).join("");
  function avg(key, max) { var h = store(key) || []; if (!h.length) return null; return { n: h.length, m: h.reduce(function (a, x) { return a + x.s; }, 0) / h.length, last: h[0].s, max: max }; }
  var sims = [["Simulacro de términos (pregunta 1)", avg("p1hist", 2)], ["Simulacro de semblanzas (pregunta 3)", avg("pau3hist", 3)], ["Una semblanza, una nota", avg("pau1hist", 1)]].map(function (r) {
    return '<li><span>' + r[0] + "</span><b>" + (r[1] ? A.num(r[1].m) + " / " + r[1].max : "—") + "</b><small>" + (r[1] ? r[1].n + " intentos · último " + A.num(r[1].last) : "sin intentos") + "</small></li>";
  }).join("");
  var any = Object.keys(box).length || rows.some(function (r) { return A.getStat(r[0]).n; });
  var temas = Object.keys(per).map(function (k) { return +k; }).map(function (n) {
    var p = per[n], pct = p.n ? Math.round(100 * p.ok / p.n) : 0;
    return '<li class="pg-row"><span class="pg-t"><a href="#esquema?t=' + n + '">' + esc(A.temaLabel(n)) + '</a></span><span class="pg-bar" role="img" aria-label="' + (p.n ? pct + " % dominado, " + p.n + " elementos practicados" : "sin empezar") + '"><i style="width:' + pct + '%"></i></span><span class="pg-n">' + (p.n ? p.ok + "/" + p.n : "—") + '</span><a class="linkbtn" href="#repaso?t=' + n + '&m=term">Repasar</a></li>';
  }).join("");
  var weak = Object.keys(per).map(function (k) { return +k; }).filter(function (n) { return per[n].n >= 3; }).sort(function (a, b) { return per[a].ok / per[a].n - per[b].ok / per[b].n; }).slice(0, 3);
  $("pgBox").innerHTML = (any ? "" : '<p class="lead">Aún no has practicado nada en este navegador. Prueba el <a href="#test">test con imágenes</a> o el <a href="#repaso">repaso con tarjetas</a> y vuelve aquí.</p>') +
    '<div class="pg-cols"><section><h3 class="fi-s">Tests</h3><ul class="pg-list">' + tests + '</ul></section><section><h3 class="fi-s">Simulacros</h3><ul class="pg-list">' + sims + "</ul></section></div>" +
    (weak.length ? '<h3 class="fi-s">Para reforzar</h3><p class="rel">' + weak.map(function (n) { return '<a class="semchip" href="#repaso?t=' + n + '&m=term">' + esc(A.temaLabel(n)) + " · " + Math.round(100 * per[n].ok / per[n].n) + " %</a>"; }).join("") + "</p>" : "") +
    (uniqFails.length ? '<h3 class="fi-s">Lo último que has fallado</h3><p class="rel">' + uniqFails.slice(-14).reverse().map(function (f) { return '<a class="semchip" href="' + f.href + '">' + esc(f.nom) + "</a>"; }).join("") + "</p>" : "") +
    '<h3 class="fi-s">Por tema</h3><p class="stats">«Dominado» = acertado varias veces seguidas. Cuenta tests, fichas y tarjetas.</p><ul class="pg-temas">' + temas + "</ul>";
}
A.hooks.progreso = progreso;

/* ---------- Comparador de dos artistas ---------- */
var PRESETS = [["Velázquez y Goya", "diego-velazquez", "francisco-de-goya"], ["Miguel Ángel y Rafael", "miguel-angel-buonarroti", "rafael-sanzio"], ["Bernini y Borromini", "gian-lorenzo-bernini", "francesco-borromini"],
  ["David y Delacroix", "jacques-louis-david", "eugene-delacroix"], ["Monet y Cézanne", "claude-monet", "paul-cezanne"], ["Gaudí y Le Corbusier", "antoni-gaudi", "le-corbusier"],
  ["Rubens y Rembrandt", "pedro-pablo-rubens", "rembrandt-van-rijn"], ["Picasso y Dalí", "pablo-picasso", "salvador-dali"], ["Fidias y Lisipo", "fidias", "lisipo"], ["Giotto y Donatello", "giotto-di-bondone", "donatello"]];
function y1of(e) { return e.y1 === null || e.y1 === undefined ? 2026 : e.y1; }
function cmpCol(e) {
  var head = e.ret ? A.face(e, false) : (e.img ? A.img(e, false) : "");
  return '<article class="cmp-col">' + head + "<h3>" + esc(e.nombre) + '</h3><p class="fi-dates">' + esc(e.yl || "") + '</p><p class="stats">' + esc(A.temaLabel(e.tema)) + "<br>" + esc(e.cab) + '</p><div class="body">' + A.sections(e.texto) + "</div></article>";
}
function cmpShow() {
  var a = A.sById[$("cmpA").value], b = A.sById[$("cmpB").value];
  if (!a || !b) { $("cmpBox").innerHTML = '<p class="lead">Elige dos artistas, o prueba una comparación clásica.</p>'; return; }
  var ta = a.terms || [], tb = b.terms || [], both = ta.filter(function (i) { return tb.indexOf(i) >= 0; });
  var onlyA = ta.filter(function (i) { return tb.indexOf(i) < 0; }), onlyB = tb.filter(function (i) { return ta.indexOf(i) < 0; });
  var ov = Math.min(y1of(a), y1of(b)) - Math.max(a.y0, b.y0), gap = Math.max(a.y0, b.y0) - Math.min(y1of(a), y1of(b));
  var rel = a === b ? "Es el mismo artista." : (ov > 0 ? "Coincidieron en el tiempo unos " + ov + " años." : "No coincidieron: les separan unos " + gap + " años.");
  var same = a.tema === b.tema ? "Ambos pertenecen al " + A.temaLabel(a.tema) + "." : "Pertenecen a temas distintos (T" + a.tema + " y T" + b.tema + ").";
  $("cmpBox").innerHTML = '<div class="cmp-sum"><p><strong>' + esc(rel) + "</strong> " + esc(same) + "</p>" +
    (both.length ? '<p class="rel"><strong>Términos en común:</strong> ' + A.termChips(both, 14) + "</p>" : '<p class="stats">No comparten términos del glosario.</p>') +
    (onlyA.length ? '<p class="rel"><strong>Solo ' + esc(a.nombre) + ":</strong> " + A.termChips(onlyA, 8) + "</p>" : "") +
    (onlyB.length ? '<p class="rel"><strong>Solo ' + esc(b.nombre) + ":</strong> " + A.termChips(onlyB, 8) + "</p>" : "") + "</div>" +
    '<div class="cmp-cols">' + cmpCol(a) + cmpCol(b) + "</div>";
  A.noScroll = true; history.replaceState(null, "", "#comparador?a=" + a.id + "&b=" + b.id); A.noScroll = false;
}
function initCmp() {
  var list = A.SEMB.slice().sort(function (x, y) { return x.tema - y.tema || (norm(x.nombre) < norm(y.nombre) ? -1 : 1); });
  var opts = '<option value="">Elige un artista…</option>' + list.map(function (e) { return '<option value="' + e.id + '">' + esc(e.nombre) + " · T" + e.tema + "</option>"; }).join("");
  $("cmpA").innerHTML = opts; $("cmpB").innerHTML = opts;
  $("cmpA").onchange = cmpShow; $("cmpB").onchange = cmpShow;
  $("cmpSwap").onclick = function () { var t = $("cmpA").value; $("cmpA").value = $("cmpB").value; $("cmpB").value = t; cmpShow(); };
  $("cmpPre").innerHTML = PRESETS.map(function (p, i) { return '<button type="button" class="chip" data-i="' + i + '">' + esc(p[0]) + "</button>"; }).join("");
  $("cmpPre").onclick = function (ev) { var b = ev.target.closest("button"); if (!b) return; var p = PRESETS[+b.dataset.i]; $("cmpA").value = p[1]; $("cmpB").value = p[2]; cmpShow(); };
}
A.hooks.comparador = function (p) { if (p.a && A.sById[p.a]) $("cmpA").value = p.a; if (p.b && A.sById[p.b]) $("cmpB").value = p.b; cmpShow(); };

/* ---------- Esquema por tema (chuleta imprimible) ---------- */
function charLine(e) {
  var seg = (e.texto.split("**Características.**")[1] || "").split("**Obras.**")[0].replace(/\*\*/g, "").replace(/\*/g, "").trim();
  var sents = seg.split(/(?<=[.!?])\s+/); return sents.slice(0, 2).join(" ");
}
function esqShow() {
  var n = +$("esqTema").value || 1, arts = A.SEMB.filter(function (e) { return e.tema === n && !e.compl; }).sort(function (a, b) { return a.y0 - b.y0; });
  var compl = A.SEMB.filter(function (e) { return e.tema === n && e.compl; });
  var terms = A.GLOS.filter(function (t) { return t.tema === n; }).sort(function (a, b) { return norm(a.t) < norm(b.t) ? -1 : 1; });
  var obras = A.OBRAS.filter(function (o) { return +o.tema === n && o.th; }).slice(0, 18);
  var rows = arts.concat(compl).map(function (e) {
    var seg = e.cab.split(" · "), place = seg.length > 2 ? seg[1] : "", style = seg[seg.length - 1];
    return '<tr><th scope="row"><a href="#a-' + e.id + '">' + esc(e.nombre) + (e.compl ? " (compl.)" : "") + "</a><small>" + esc(e.yl) + (place ? " · " + esc(place) : "") + "</small></th><td>" + esc(charLine(e)) + '</td><td><div class="esq-obras">' + e.obras.replace(/\.$/, "").split(/;|, (?=[A-ZÁÉÍÓÚÑ])| y (?=[A-ZÁÉÍÓÚÑ])/).slice(0, 4).map(function (o) { return '<span class="cartela">' + esc(o.trim()) + "</span>"; }).join("") + "</div></td></tr>";
  }).join("");
  $("esqBox").innerHTML = '<article class="esq"><h3>' + esc(A.temaLabel(n)) + "</h3>" +
    (rows ? '<h4>Artistas, características y obras</h4><table class="esq-t"><thead><tr><th>Artista</th><th>Características</th><th>Obras clave</th></tr></thead><tbody>' + rows + "</tbody></table>" : "") +
    (obras.length ? "<h4>Obras de las presentaciones</h4><div class=\"esq-gal\">" + obras.map(function (o) { return '<figure><img src="' + esc(o.th) + '" alt="' + esc(o.pie || o.nombre) + '" loading="lazy" decoding="async"><figcaption>' + esc(o.pie || o.nombre) + "</figcaption></figure>"; }).join("") + "</div>" : "") +
    '<h4>Términos del tema (' + terms.length + ')</h4><p class="esq-terms">' + terms.map(function (t) { return '<a class="termchip" href="#glosario?id=' + t.id + '">' + esc(t.t) + "</a>"; }).join("") + "</p></article>";
  document.title = "Esquema · " + A.temaLabel(n);
}
function initEsq() {
  var o = ""; for (var n = 1; n <= 18; n++) o += '<option value="' + n + '">' + esc(A.temaLabel(n)) + "</option>";
  $("esqTema").innerHTML = o; $("esqTema").onchange = esqShow;
  $("esqPrev").onclick = function () { $("esqTema").value = Math.max(1, +$("esqTema").value - 1); esqShow(); };
  $("esqNext").onclick = function () { $("esqTema").value = Math.min(18, +$("esqTema").value + 1); esqShow(); };
  $("esqPrint").onclick = function () { window.print(); };
}
A.hooks.esquema = function (p) { if (p.t) $("esqTema").value = p.t; esqShow(); };

/* ---------- Mapa de artistas ---------- */
var MP = { v: "eu", sel: null };
function mapDraw() {
  var M = window.ARTE_MAPA; if (!M) { $("mpBox").innerHTML = '<p class="lead">No se han podido cargar los datos del mapa.</p>'; return; }
  var d = M[MP.v], t = $("mpTema").value, byPlace = {}, outside = 0;
  A.SEMB.forEach(function (e) {
    if (!A.inFilter(e.tema, t) || (e.compl && !$("mpCompl").checked)) return;
    (M.art[e.id] || []).forEach(function (n) { if (!M.lug[n]) return; if (!M.lug[n][MP.v]) { outside++; return; } (byPlace[n] = byPlace[n] || []).push(e); });
  });
  var names = Object.keys(byPlace).sort(function (a, b) { return byPlace[b].length - byPlace[a].length; });
  var key = MP.v === "eu" ? "eu" : "mu";
  var svg = '<svg class="mp-svg" viewBox="0 0 ' + d.w + " " + d.h + '" role="group" aria-label="Mapa de lugares de trabajo de los artistas"><rect width="' + d.w + '" height="' + d.h + '" class="mp-sea"/><path class="mp-land" d="' + d.land + '"/><path class="mp-bord" d="' + d.borders + '"/>';
  names.slice().reverse().forEach(function (n) {
    var c = M.lug[n][key], k = byPlace[n].length, r = 4.5 + 2.2 * Math.sqrt(k), sel = MP.sel === n;
    svg += '<g class="mp-dot' + (M.lug[n].gen ? " gen" : "") + (sel ? " sel" : "") + '" data-p="' + esc(n) + '" tabindex="0" role="button" aria-label="' + esc(n + ": " + k + (k === 1 ? " artista" : " artistas")) + '" transform="translate(' + c[0] + " " + c[1] + ')"><title>' + esc(n + " · " + k) + '</title><circle r="' + r.toFixed(1) + '"/></g>';
  });
  var placed = [];
  names.slice(0, MP.v === "eu" ? 26 : 14).forEach(function (n) {
    var c = M.lug[n][key], r = 4.5 + 2.2 * Math.sqrt(byPlace[n].length);
    if (placed.some(function (q) { return Math.abs(q[0] - c[0]) < 62 && Math.abs(q[1] - c[1]) < 13; })) return; placed.push(c);
    svg += '<text class="mp-lab" x="' + (c[0] + r + 3) + '" y="' + (c[1] + 4) + '">' + esc(n) + "</text>";
  });
  svg += "</svg>";
  $("mpBox").innerHTML = svg;
  $("mpNote").textContent = names.length + " lugares" + (outside ? " · " + outside + " lugares fuera de este mapa (cambia a «Mundo»)" : "") + ". Los círculos huecos son países o regiones, no ciudades concretas.";
  MP.by = byPlace; mapPanel();
}
function mapPanel() {
  var n = MP.sel, list = (MP.by || {})[n];
  if (!n || !list) { $("mpPanel").innerHTML = '<p class="stats">Pulsa un círculo para ver los artistas de ese lugar.</p>'; return; }
  list = list.slice().sort(function (a, b) { return a.y0 - b.y0; });
  $("mpPanel").innerHTML = '<h3>' + esc(n) + " · " + list.length + (list.length === 1 ? " artista" : " artistas") + '</h3><ul class="mp-list">' + list.map(function (e) {
    return '<li><a href="#a-' + e.id + '">' + (e.rth ? '<img src="' + esc(e.rth) + '" alt="" loading="lazy" decoding="async">' : '<span class="tl-ph"></span>') + "<span><strong>" + esc(e.nombre) + "</strong><small>" + esc(e.yl) + " · T" + e.tema + "</small></span></a></li>";
  }).join("") + "</ul>";
}
function initMap() {
  $("mpTema").innerHTML = A.temaOptions(17);
  $("mpTema").onchange = mapDraw; $("mpCompl").onchange = mapDraw;
  [["eu", "mpEu"], ["mu", "mpMu"]].forEach(function (x) { $(x[1]).onclick = function () { MP.v = x[0]; $("mpEu").setAttribute("aria-pressed", x[0] === "eu"); $("mpMu").setAttribute("aria-pressed", x[0] === "mu"); mapDraw(); }; });
  function pick(ev) { var g = ev.target.closest(".mp-dot"); if (!g) return; MP.sel = g.dataset.p; mapDraw(); var f = $("mpBox").querySelector('[data-p="' + MP.sel.replace(/"/g, '\\"') + '"]'); if (f) f.focus(); }
  $("mpBox").addEventListener("click", pick);
  $("mpBox").addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(ev); } });
}
A.hooks.mapa = function (p) { if (p.t) $("mpTema").value = p.t; mapDraw(); };

/* ---------- Portada viva: cuenta atrás, artista del día y mosaico de retratos ---------- */
/* Fecha estimada: el calendario oficial de la PAU 2027 en Madrid aún no está publicado. Cambiar aquí cuando salga. */
A.PAU_DATE = { y: 2027, m: 5, d: 1, estimada: true };
var FACES = A.SEMB.filter(function (e) { return e.ret && e.rth; });
function dayCount() {
  var t = new Date(A.PAU_DATE.y, A.PAU_DATE.m, A.PAU_DATE.d), n = new Date(), a = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.round((t - a) / 86400000);
}
function homeExtra() {
  var box = $("homeExtra"); if (!box) return;
  var n = dayCount(), fecha = A.PAU_DATE.d + " de junio de " + A.PAU_DATE.y;
  var cd = n > 0 ? '<div class="hx-card hx-cd"><b>' + n + '</b><span>días para la PAU<small>' + (A.PAU_DATE.estimada ? "Fecha estimada (" + fecha + "); se ajustará cuando se publique el calendario oficial de Madrid." : fecha) + "</small></span></div>" : "";
  var d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(), e = FACES[(seed * 7919) % FACES.length];
  var ad = e ? '<a class="hx-card hx-ad" href="#a-' + e.id + '"><img src="' + esc(e.rth) + '" alt="" loading="lazy" decoding="async"><span><small>Artista del día</small><b>' + esc(e.nombre) + "</b><em>" + esc(e.yl) + " · " + esc(A.temaLabel(e.tema).split(". ")[0]) + "</em></span></a>" : "";
  var bx = A.boxAll(), ks = Object.keys(bx), dom = ks.filter(function (k) { return bx[k] >= 3; }).length;
  var pg = '<a class="hx-card hx-pg" href="#progreso"><span class="hx-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span><span><small>Mi progreso</small><b>' + (ks.length ? dom + " dominadas" : "Empieza a practicar") + "</b><em>" + (ks.length ? ks.length + " elementos practicados" : "Tests, fichas y tarjetas") + "</em></span></a>";
  box.innerHTML = cd + ad + pg;
}
var mosTimer = null;
function homeMosaic() {
  var box = $("mosaic"); if (!box || !FACES.length) return;
  var N = 6, cur = A.shuffle(FACES.slice()).slice(0, N), next = FACES.filter(function (e) { return cur.indexOf(e) < 0; });
  function tile(e) { return '<a class="mos-t" href="#a-' + e.id + '" aria-label="' + esc(e.nombre) + '"><img src="' + esc(e.rth) + '" alt="" loading="lazy" decoding="async"><span>' + esc(e.nombre) + "</span></a>"; }
  box.innerHTML = cur.map(tile).join("");
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  clearInterval(mosTimer);
  mosTimer = setInterval(function () {
    if (document.hidden || location.hash.replace("#", "").split("?")[0] !== "inicio" && location.hash !== "") return;
    var i = Math.floor(Math.random() * N), el = box.children[i]; if (!el || !next.length) return;
    var old = cur[i], ne = next.splice(Math.floor(Math.random() * next.length), 1)[0]; next.push(old); cur[i] = ne;
    el.classList.add("out");
    setTimeout(function () { var t = document.createElement("div"); t.innerHTML = tile(ne); var n2 = t.firstChild; n2.classList.add("out"); box.replaceChild(n2, el); requestAnimationFrame(function () { requestAnimationFrame(function () { n2.classList.remove("out"); }); }); }, 450);
  }, 2600);
}
var oldInicio = A.hooks.inicio;
A.hooks.inicio = function (p) { if (oldInicio) oldInicio(p); homeExtra(); };

/* ---------- Menú de la cabecera ---------- */
function initNav() {
  var nav = $("siteNav"), tg = $("navToggle"); if (!nav || !tg) return;
  var dds = [].slice.call(nav.querySelectorAll(".dd"));
  function hover() { return window.matchMedia && matchMedia("(hover:hover) and (min-width:900px)").matches; }
  function set(d, o) { d.classList.toggle("open", o); d.querySelector(".dd-b").setAttribute("aria-expanded", o ? "true" : "false"); }
  function closeAll(except) { dds.forEach(function (d) { if (d !== except) set(d, false); }); }
  dds.forEach(function (d) {
    var b = d.querySelector(".dd-b"), t;
    b.addEventListener("click", function () { var o = hover() || !d.classList.contains("open"); closeAll(d); set(d, o); });
    d.addEventListener("mouseenter", function () { if (!hover()) return; clearTimeout(t); closeAll(d); set(d, true); });
    d.addEventListener("mouseleave", function () { if (!hover()) return; t = setTimeout(function () { set(d, false); }, 180); });
    d.addEventListener("focusout", function (ev) { if (ev.relatedTarget && !d.contains(ev.relatedTarget)) set(d, false); });
    d.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { set(d, false); b.focus(); } });
  });
  document.addEventListener("click", function (ev) { if (!nav.contains(ev.target)) closeAll(); });
  function shut() { document.body.classList.remove("nav-open"); tg.setAttribute("aria-expanded", "false"); tg.setAttribute("aria-label", "Abrir el menú"); }
  tg.addEventListener("click", function () { var o = !document.body.classList.contains("nav-open"); document.body.classList.toggle("nav-open", o); tg.setAttribute("aria-expanded", o ? "true" : "false"); tg.setAttribute("aria-label", o ? "Cerrar el menú" : "Abrir el menú"); });
  nav.addEventListener("click", function (ev) { if (ev.target.closest("a")) { closeAll(); shut(); } });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") shut(); });
}

A.inits.push(initNav, initCmp, initEsq, initMap, homeMosaic);
})();
