/* Historia del Arte — glosario: consulta, simulacro de la pregunta 1 y tests de términos */
(function () {
"use strict";
var A = window.ARTE, norm = A.norm, esc = A.esc, shuffle = A.shuffle, pick = A.pick, $ = A.$, fmt = A.fmt, num = A.num, store = A.store;
var GLOS = A.GLOS, sById = A.sById, STOP = A.STOP;

/* ---------- Reconocimiento de términos en un texto ---------- */
var STOPW = new Set(["de", "del", "la", "el", "los", "las", "y", "en", "con", "sobre", "a", "por", "un", "una", "al", "o", "e"]);
function tokens(s) { return norm(s).split(" ").filter(Boolean); }
function variants(name) {
  var out = [name.replace(/\([^)]*\)/g, " ")], m = name.match(/\(([^)]*)\)/);
  if (m) { out.push(m[1]); out.push(name.replace(/[()]/g, " ")); }
  return out;
}
function tokMatch(w, t) { return w.indexOf(t) === 0 && w.length <= t.length + 3; }
function mentions(toks, name) {
  return variants(name).some(function (v) {
    var vt = tokens(v).filter(function (t) { return !STOPW.has(t); });
    return vt.length && vt.every(function (t) { return toks.some(function (w) { return tokMatch(w, t); }); });
  });
}
function findTerm(text, cands) {
  var toks = tokens(text), best = null;
  cands.forEach(function (c) { if (mentions(toks, c.t) && (!best || c.t.length > best.t.length)) best = c; });
  return best;
}
function defKeywords(c) {
  var skip = new Set(tokens(c.t)), seen = {}, out = [];
  tokens(c.def).forEach(function (w) { if (w.length >= 6 && !STOP.has(w) && !skip.has(w) && !seen[w]) { seen[w] = 1; out.push(w); } });
  return out.slice(0, 14);
}
function defRatio(c, text) {
  var kw = defKeywords(c), toks = tokens(text);
  if (!kw.length) return 0;
  var hits = kw.filter(function (k) { return toks.some(function (w) { return w.length >= 5 && w.slice(0, 5) === k.slice(0, 5); }); });
  var need = Math.min(5, Math.max(3, Math.ceil(kw.length * 0.35)));
  return { r: Math.min(1, hits.length / need), hits: hits, kw: kw };
}
function cartelas(list) { return list.map(function (o) { return '<span class="cartela">' + esc(o) + "</span>"; }).join(""); }
function semOf(id) { var e = sById[id]; if (e && e.obra) return ""; return e ? '<a href="#semblanzas?id=' + e.id + '">' + esc(e.nombre) + "</a>" : ""; }

/* ---------- Glosario: consulta ---------- */
var gl = { n: 60, letter: "", one: null, list: [] };
var byName = {};
GLOS.forEach(function (t) { var k = norm(t.t); (byName[k] = byName[k] || []).push(t.id); });
function letterOf(t) { var c = norm(t.t).charAt(0).toUpperCase(); return /[A-ZÑ]/.test(c) ? c : "#"; }
function glBase() {
  var q = norm($("gq").value), tm = $("gTema").value;
  var items = GLOS.filter(function (t) { return A.inFilter(t.tema, tm); }).map(function (t) {
    var n = norm(t.t), sc = 9;
    if (!q) sc = 0; else if (n.indexOf(q) === 0) sc = 0; else if (n.indexOf(q) >= 0) sc = 1;
    else if (norm(t.def + " " + t.obras.join(" ")).indexOf(q) >= 0) sc = 2;
    return { t: t, sc: sc, n: n };
  }).filter(function (x) { return x.sc < 9; });
  items.sort(function (a, b) { return a.sc - b.sc || (a.n < b.n ? -1 : a.n > b.n ? 1 : a.t.tema - b.t.tema); });
  return items.map(function (x) { return x.t; });
}
function glEntry(t) {
  var thumbs = t.img.slice(0, 3).map(function (id) {
    var e = sById[id];
    if (e.obra) return '<span class="thumb" title="' + esc(e.pie) + '">' + A.img(e, true) + "</span>";
    return '<a href="#semblanzas?id=' + id + '" title="' + esc(e.pie + " — " + e.nombre) + '"><img src="' + (e.th || e.img) + '" alt="' + esc(e.pie) + '" loading="lazy" decoding="async"></a>';
  }).join("");
  var same = (byName[norm(t.t)] || []).filter(function (i) { return i !== t.id; });
  var sems = t.semb.slice(0, 6).map(semOf).filter(Boolean).map(function (s) { return '<span class="semchip">' + s.replace("<a ", '<a style="text-decoration:none;color:inherit" ') + "</span>"; }).join("");
  return '<article class="gl' + (thumbs ? " has-img" : "") + '" id="t-' + t.id + '"><div>' +
    "<h3>" + esc(t.t) + ' <a class="tl" href="#glosario?t=' + t.tema + '">' + esc(A.temaLabel(t.tema)) + "</a></h3>" +
    '<p class="justify">' + esc(t.def) + "</p>" +
    (t.obras.length ? "<div>" + cartelas(t.obras) + "</div>" : "") +
    (sems ? '<p class="rel"><strong>Semblanzas:</strong> ' + sems + "</p>" : "") +
    (same.length ? '<p class="rel"><strong>También se define en:</strong> ' + same.map(function (i) { return '<a class="semchip" href="#glosario?id=' + i + '">T' + GLOS[i].tema + "</a>"; }).join("") + "</p>" : "") +
    "</div>" + (thumbs ? '<div class="thumbs">' + thumbs + "</div>" : "") + "</article>";
}
function glDraw() {
  var one = gl.one != null ? GLOS[gl.one] : null;
  $("glBanner").classList.toggle("hidden", !one);
  $("glFilters").classList.toggle("hidden", !!one);
  if (one) {
    $("glList").innerHTML = glEntry(one); $("glMore").classList.add("hidden"); $("glCount").textContent = ""; $("glLetters").innerHTML = ""; return;
  }
  var all = glBase(); gl.list = all;
  var lettersAvail = {}; all.forEach(function (t) { lettersAvail[letterOf(t)] = 1; });
  var L = $("glLetters"); L.innerHTML = "";
  var allb = document.createElement("button"); allb.type = "button"; allb.textContent = "Todas"; allb.setAttribute("aria-pressed", gl.letter ? "false" : "true");
  allb.onclick = function () { gl.letter = ""; gl.n = 60; glDraw(); }; L.appendChild(allb);
  "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("").forEach(function (c) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = c; b.disabled = !lettersAvail[c]; b.setAttribute("aria-pressed", gl.letter === c ? "true" : "false");
    b.onclick = function () { gl.letter = c; gl.n = 60; glDraw(); }; L.appendChild(b);
  });
  var items = gl.letter ? all.filter(function (t) { return letterOf(t) === gl.letter; }) : all;
  $("glCount").textContent = items.length + " término" + (items.length === 1 ? "" : "s");
  var shown = items.slice(0, gl.n);
  $("glList").innerHTML = shown.length ? shown.map(glEntry).join("") : '<p class="lead">No hay términos con esa búsqueda. Prueba con otra palabra o con «Todos los temas».</p>';
  var rest = items.length - shown.length;
  $("glMore").classList.toggle("hidden", rest <= 0);
  $("glMore").textContent = "Mostrar más (" + rest + " restantes)";
}
function initGlosario() {
  $("gTema").innerHTML = A.temaOptions(18);
  var rf = function () { gl.one = null; gl.letter = ""; gl.n = 60; glDraw(); };
  $("gq").addEventListener("input", rf); $("gTema").addEventListener("change", rf);
  $("glMore").onclick = function () { gl.n += 60; glDraw(); };
  $("glAll").onclick = function () { location.hash = "#glosario"; };
}
A.hooks.glosario = function (p) {
  gl.one = (p.id != null && GLOS[+p.id]) ? +p.id : null;
  if (p.q != null) $("gq").value = p.q;
  if (p.t) $("gTema").value = p.t;
  if (p.id == null && p.q == null && !p.t) { $("gq").value = ""; $("gTema").value = "all"; }
  gl.letter = ""; gl.n = 60; glDraw();
  if (gl.one != null) A.track("glosario/termino/" + gl.one, "Término consultado: " + GLOS[gl.one].t);
};

/* ---------- Simulacro de la pregunta 1 (imágenes → términos) ---------- */
var p1 = { items: [], timer: null, end: 0, picker: null };
var LET = ["a", "b", "c", "d"];
function p1pool() { return A.imgs.filter(function (e) { return p1.picker.sel.has(e.tema); }); }
function p1gen() {
  var p = shuffle(p1pool().slice()), out = [], used = {};
  p.forEach(function (e) { if (out.length < 4 && !used[e.tema]) { used[e.tema] = 1; out.push(e); } });
  p.forEach(function (e) { if (out.length < 4 && out.indexOf(e) < 0) out.push(e); });
  p1.items = out; p1stop();
  A.track("p1/generado", "Simulacro de términos generado");
  $("p1Result").classList.add("hidden");
  var f = $("p1Form"); f.innerHTML = '<div class="p1grid"></div>';
  var grid = f.firstChild;
  out.forEach(function (e, i) {
    var d = document.createElement("div"); d.className = "p1card";
    d.innerHTML = '<img src="' + e.img + '" data-zoom data-full="' + e.img + '" data-cap="" alt="Imagen ' + LET[i] + ') para identificar un término"><label for="p1t' + i + '"><span class="letter">' + LET[i] + ')</span>Término artístico</label><input type="text" id="p1t' + i + '" autocomplete="off" spellcheck="false" placeholder="Nombre del término">' +
      '<label for="p1d' + i + '">Breve definición (máximo cinco líneas)</label><textarea id="p1d' + i + '" spellcheck="true"></textarea>';
    grid.appendChild(d);
  });
  var sub = document.createElement("div"); sub.className = "row"; sub.innerHTML = '<button class="btn" type="submit">Entregar y corregir</button><span class="small">Cada imagen es una obra del currículo: busca un elemento, material, técnica o recurso que la defina.</span>'; f.appendChild(sub);
  $("p1Stage").classList.remove("hidden");
  p1.end = Date.now() + 18 * 60000; p1stop(); p1tick(); p1.timer = setInterval(p1tick, 1000);
}
function p1tick() { var left = p1.end - Date.now(), el = $("p1Timer"); el.textContent = fmt(left); el.className = "timer" + (left < 0 ? " over" : (left < 3 * 60000 ? " warn" : "")); }
function p1stop() { if (p1.timer) { clearInterval(p1.timer); p1.timer = null; } }
function gradeOne(e, tv, dv) {
  var cands = (A.termsOfImg[e.id] || []).map(function (i) { return GLOS[i]; });
  var found = tokens(tv).length ? findTerm(tv, cands) : findTerm(dv, cands);
  var other = null, words = tokens(dv).length;
  if (!found && tokens(tv).length) { other = findTerm(tv, GLOS); }
  var st = 0, sd = 0, dr = null;
  if (found) {
    st = 0.25; dr = defRatio(found, dv);
    sd = 0.25 * dr.r * (words < 8 ? 0.5 : 1);
  } else {
    var best = null; cands.forEach(function (c) { var r = defRatio(c, dv); if (!best || r.r > best.r.r) best = { c: c, r: r }; });
    if (best && best.r.r >= 0.7 && words >= 8) { sd = 0.25 * best.r.r * 0.5; dr = best.r; found = null; other = other || null; dr.maybe = best.c; }
  }
  var tot = Math.round((st + sd) * 20) / 20;
  return { found: found, other: other, st: st, sd: sd, dr: dr, tot: tot, words: words, cands: cands };
}
function p1result(ev) {
  ev.preventDefault(); p1stop();
  var res = p1.items.map(function (e, i) { var tv = $("p1t" + i).value, dv = $("p1d" + i).value; return { e: e, tv: tv, dv: dv, g: gradeOne(e, tv, dv) }; });
  var tot = res.reduce(function (s, r) { return s + r.g.tot; }, 0);
  A.track("p1/entregado", "Simulacro de términos entregado");
  A.track("p1/nota-total/" + (tot < 0.5 ? "0-0,5" : (tot < 1 ? "0,5-1" : (tot < 1.5 ? "1-1,5" : "1,5-2"))), "Nota del simulacro de términos");
  res.forEach(function (r) { A.track("p1/imagen/" + r.e.id + "/" + (r.g.found ? "termino-ok" : "termino-fallo"), "Imagen " + r.e.pie + ": " + (r.g.found ? "término identificado" : "término no identificado")); });
  var used = 18 * 60000 - (p1.end - Date.now());
  var h = '<div class="total"><div><div class="stats">Estimación de la pregunta 1</div><b>' + num(tot) + ' / 2</b></div><div class="stats">Tiempo empleado: ' + fmt(used) + " de 18:00</div>" + '<button class="btn" type="button" id="p1Again">Otro simulacro</button></div>';
  res.forEach(function (r, i) {
    var g = r.g, e = r.e;
    var termMsg = g.found ? '<span class="tag ok">término válido: ' + esc(g.found.t) + "</span>" :
      (g.other ? '<span class="tag miss">«' + esc(g.other.t) + '» existe en el glosario (T' + g.other.tema + ") pero no está vinculado a esta obra</span>" : '<span class="tag miss">no se reconoce un término del glosario para esta obra</span>');
    var defMsg = "";
    if (g.found && g.dr) defMsg = (g.dr.hits.length ? "Palabras clave de la definición modelo que has usado: " + g.dr.hits.map(function (w) { return '<span class="tag ok">' + esc(w) + "</span>"; }).join("") : '<span class="tag miss">tu definición no recoge ideas clave del modelo</span>') + (g.words < 8 ? ' <span class="small">(definición muy breve)</span>' : "");
    else if (g.dr && g.dr.maybe) defMsg = '<span class="tag miss">tu definición se parece a la de «' + esc(g.dr.maybe.t) + "», pero no escribes ese término</span>";
    var model = g.found || g.cands[0];
    h += '<article class="res"><div class="res-h">' + A.img(e, true) + '<div><h3>' + LET[i] + ") " + esc(e.pie) + '</h3><div class="stats">' + (e.obra ? esc(e.cab) : semOf(e.id)) + " · " + esc(A.temaLabel(e.tema)) + '</div><div class="stats">Tu término: ' + (esc(r.tv) || "<em>(en blanco)</em>") + "</div></div>" +
      A.ring(g.tot, 0.5, "0,5") + "</div>" +
      '<div class="notes"><p><strong>Término:</strong> ' + termMsg + "</p>" + (defMsg ? "<p><strong>Definición:</strong> " + defMsg + "</p>" : "") + "</div>" +
      '<details><summary>Definición modelo de «' + esc(model.t) + '»</summary><div class="model"><p class="justify">' + esc(model.def) + "</p>" + (model.obras.length ? "<div>" + cartelas(model.obras) + "</div>" : "") + "</div></details>" +
      '<details><summary>Otros términos que se podían identificar en esta imagen (' + g.cands.length + ')</summary><div class="model"><p>' + A.termChips(g.cands.map(function (c) { return c.id; }), 40) + '</p><p class="small">Salen de las «Obras» que indica el glosario para cada término.</p></div></details>' +
      '<details><summary>Tu definición</summary><div class="model"><p>' + (esc(r.dv).replace(/\n/g, "<br>") || "<em>(en blanco)</em>") + "</p></div></details></article>";
  });
  h += '<p class="disclaimer">La nota es orientativa: da 0,25 si el término escrito coincide con alguno del glosario vinculado a la obra y hasta 0,25 según las ideas clave de la definición modelo. No valora la redacción ni las ideas que no estén en el glosario; si propones un término válido que no aparece aquí, consúltalo con el profesor.</p>';
  var box = $("p1Result"); box.innerHTML = h; box.classList.remove("hidden"); $("p1Stage").classList.add("hidden");
  $("p1Again").onclick = p1gen;
  var hist = store("p1hist") || []; hist.unshift({ d: new Date().toLocaleDateString("es-ES"), s: tot }); store("p1hist", hist.slice(0, 10)); p1hist();
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}
function p1hist() {
  var h = store("p1hist") || [], el = $("p1Hist");
  el.innerHTML = h.length ? "<strong>Tus últimos simulacros en este navegador</strong><ul>" + h.map(function (x) { return "<li>" + esc(x.d) + " · " + num(x.s) + " / 2</li>"; }).join("") + "</ul>" : "";
}
function initP1() {
  p1.picker = A.temaPicker($("p1Chips"), 17, function () { $("p1Gen").disabled = !p1pool().length; $("p1Note").hidden = !!p1pool().length; }, A.temasImg);
  $("p1Note").textContent = "Ninguno de los temas elegidos tiene imágenes todavía. Hay imágenes en: " + A.temasImgText + ".";
  $("p1Note").hidden = true;
  $("p1Hint").textContent = "Hay imágenes en: " + A.temasImgText + ".";
  $("p1Gen").onclick = p1gen;
  $("p1Form").addEventListener("submit", p1result);
  p1hist();
}

/* ---------- Tests de términos ---------- */
var tst = { mode: "img2term", cur: null, last: null };
function tdone(key, id, ok) { A.stat(tst.mode, ok); A.setBox(key, ok); A.track("test/" + tst.mode + "/" + (ok ? "acierto" : "fallo") + "/" + id, "Test " + tst.mode + (ok ? " acertado" : " fallado")); tStat(); }
var MODES = [["img2term", "Imagen → término"], ["term2img", "Término → imagen"], ["def2term", "Definición → término"]];
function dedupeNames(list, avoid) {
  var seen = {}; (avoid || []).forEach(function (n) { seen[norm(n)] = 1; });
  return list.filter(function (t) { var k = norm(t.t); if (seen[k]) return false; seen[k] = 1; return true; });
}
function nearTerms(tema, filterFn, need, avoid) {
  for (var d = 0; d <= 17; d += (d < 2 ? 1 : 3)) {
    var c = dedupeNames(GLOS.filter(function (t) { return Math.abs(t.tema - tema) <= d && filterFn(t); }), avoid);
    if (c.length >= need) return shuffle(c).slice(0, need);
  }
  return shuffle(dedupeNames(GLOS.filter(filterFn), avoid)).slice(0, need);
}
function buildModes() {
  var box = $("tModes"); box.innerHTML = "";
  MODES.forEach(function (m) {
    var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = m[1]; b.setAttribute("aria-pressed", tst.mode === m[0] ? "true" : "false");
    b.onclick = function () { tst.mode = m[0]; buildModes(); nextQ(); }; box.appendChild(b);
  });
}
function tStat() {
  var s = A.getStat(tst.mode), el = $("tStats");
  el.innerHTML = s.n ? '<span class="ts-n"><b>' + s.ok + "</b>/" + s.n + '</span><i class="ts-bar"><u style="width:' + Math.round(100 * s.ok / s.n) + '%"></u></i>' : "";
  el.setAttribute("aria-label", s.ok + " aciertos de " + s.n);
}
function blank(def, name) {
  var out = def;
  variants(name).forEach(function (v) {
    v = v.trim(); if (v.length < 3) return;
    var re = new RegExp("(?<![\\p{L}])" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\p{L}]*", "giu");
    out = out.replace(re, "_____");
  });
  return out;
}
function caption(e) { return esc(e.pie) + (e.nombre ? " · " + esc(e.nombre) : ""); }
function nextQ() {
  var v = $("tTema").value, box = $("tArea"); tst.cur = null;
  if (tst.mode === "img2term") {
    var imgs = A.imgs.filter(function (e) { return A.inFilter(e.tema, v); });
    if (!imgs.length) { box.innerHTML = A.noImgMsg; return; }
    var e = A.weightedPick(imgs, function (x) { return "m1:" + x.id; }, tst.last); tst.last = e;
    var ok = A.termsOfImg[e.id], corr = GLOS[pick(ok)];
    var avoid = ok.map(function (i) { return GLOS[i].t; });
    var dis = nearTerms(e.tema, function (t) { return t.img.length >= 1 && t.img.length <= 4 && ok.indexOf(t.id) < 0; }, 3, avoid);
    var opts = shuffle(dis.concat([corr]));
    box.innerHTML = '<div class="card"><div class="frame"><img id="qImg" src="' + e.img + '" data-zoom data-full="' + e.img + '" data-cap="" alt="Obra: elige el término que se aplica"></div><div><p class="q-ask">¿Qué término se aplica a esta obra?</p><div class="opts" id="qOpts"></div><div id="qFb"></div></div></div>';
    var oc = $("qOpts");
    opts.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = t.t;
      b.onclick = function () {
        if (oc.dataset.done) return; oc.dataset.done = "1"; var good = ok.indexOf(t.id) >= 0; tdone("m1:" + e.id, e.id, good);
        oc.querySelectorAll(".opt").forEach(function (x) { if (x.textContent === corr.t) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        var others = ok.filter(function (i) { return i !== corr.id; });
        $("qFb").innerHTML = '<div class="fb' + (good ? "" : " bad") + '"><p><strong>' + esc(corr.t) + "</strong> (" + esc(A.temaLabel(corr.tema)) + "). " + esc(corr.def) + '</p><p class="small">' + caption(e) + (e.obra ? " · " + esc(e.cab) : ' · <a href="#semblanzas?id=' + e.id + '">ver semblanza</a>') + "</p>" +
          (others.length ? '<p class="rel"><strong>También en esta obra:</strong> ' + A.termChips(others, 12) + "</p>" : "") + '</div><button class="btn" type="button" id="qNext">Siguiente <kbd>↵</kbd></button>';
        $("qNext").onclick = nextQ; $("qNext").focus({ preventScroll: true });
      };
      oc.appendChild(b);
    });
  } else if (tst.mode === "term2img") {
    var terms = GLOS.filter(function (t) { return t.img.length && A.inFilter(t.tema, v); });
    if (!terms.length) { box.innerHTML = A.noImgMsg; return; }
    var t = A.weightedPick(terms, function (x) { return "m2:" + x.id; }, tst.last); tst.last = t;
    var good = sById[pick(t.img)];
    var bad = shuffle(A.imgs.filter(function (e) { return t.img.indexOf(e.id) < 0 && e.id !== good.id && Math.abs(e.tema - t.tema) <= 1; }));
    var seenAuthor = {}; seenAuthor[good.nombre || good.id] = 1;
    var dis = [];
    bad.forEach(function (e) { var k = e.nombre || e.id; if (dis.length < 3 && !seenAuthor[k]) { seenAuthor[k] = 1; dis.push(e); } });
    if (dis.length < 3) shuffle(A.imgs.filter(function (e) { return t.img.indexOf(e.id) < 0 && dis.indexOf(e) < 0; })).forEach(function (e) { var k = e.nombre || e.id; if (dis.length < 3 && !seenAuthor[k]) { seenAuthor[k] = 1; dis.push(e); } });
    var opts = shuffle(dis.concat([good]));
    box.innerHTML = '<p class="q-ask">¿En qué obra se aplica este término?</p><div class="q-term">' + esc(t.t) + ' <span class="small">' + esc(A.temaLabel(t.tema)) + '</span></div><p class="q-def">' + esc(t.def) + '</p><div class="imgopts" id="qOpts"></div><div id="qFb"></div>';
    var oc = $("qOpts");
    opts.forEach(function (e) {
      var b = document.createElement("button"); b.type = "button"; b.className = "imgopt"; b.dataset.id = e.id;
      b.innerHTML = '<img src="' + e.img + '" alt="Obra candidata"><span class="cap" aria-hidden="true">&nbsp;</span>';
      b.onclick = function () {
        if (oc.dataset.done) return; oc.dataset.done = "1"; var ok = t.img.indexOf(e.id) >= 0; tdone("m2:" + t.id, t.id, ok);
        oc.querySelectorAll(".imgopt").forEach(function (x) {
          var ee = sById[x.dataset.id]; x.querySelector(".cap").innerHTML = caption(ee); x.querySelector("img").alt = ee.pie;
          if (t.img.indexOf(ee.id) >= 0) x.classList.add("right"); else if (x === b) x.classList.add("wrong");
        });
        $("qFb").innerHTML = '<div class="fb' + (ok ? "" : " bad") + '"><p><strong>' + esc(t.t) + "</strong> se aplica a: " + t.img.map(function (i) { return esc(sById[i].pie); }).join("; ") + ".</p>" + (t.obras.length ? "<div>" + cartelas(t.obras) + "</div>" : "") + '</div><button class="btn" type="button" id="qNext">Siguiente <kbd>↵</kbd></button>';
        $("qNext").onclick = nextQ; $("qNext").focus({ preventScroll: true });
      };
      oc.appendChild(b);
    });
  } else {
    var all = GLOS.filter(function (t) { return A.inFilter(t.tema, v); });
    if (!all.length) { box.innerHTML = '<p class="lead">No hay términos en ese filtro.</p>'; return; }
    var c = A.weightedPick(all, function (x) { return "m3:" + x.id; }, tst.last); tst.last = c;
    var dis = nearTerms(c.tema, function (t) { return t.tema === c.tema && t.id !== c.id; }, 3, [c.t]);
    var opts = shuffle(dis.concat([c]));
    box.innerHTML = '<p class="q-ask">¿A qué término corresponde? <span class="small">' + esc(A.temaLabel(c.tema)) + '</span></p><p class="q-def">' + esc(blank(c.def, c.t)) + '</p><div class="opts" id="qOpts"></div><div id="qFb"></div>';
    var oc = $("qOpts");
    opts.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = t.t;
      b.onclick = function () {
        if (oc.dataset.done) return; oc.dataset.done = "1"; var ok = t.id === c.id; tdone("m3:" + c.id, c.id, ok);
        oc.querySelectorAll(".opt").forEach(function (x) { if (x.textContent === c.t) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        $("qFb").innerHTML = '<div class="fb' + (ok ? "" : " bad") + '"><p><strong>' + esc(c.t) + ".</strong> " + esc(c.def) + "</p>" + (c.obras.length ? "<div>" + cartelas(c.obras) + "</div>" : "") +
          (c.img.length ? '<p class="small">Se ve en: ' + c.img.map(function (i) { var o = sById[i]; return o.obra ? esc(o.pie) : semOf(i); }).filter(Boolean).slice(0, 6).join(", ") + ".</p>" : "") + '</div><button class="btn" type="button" id="qNext">Siguiente <kbd>↵</kbd></button>';
        $("qNext").onclick = nextQ; $("qNext").focus({ preventScroll: true });
      };
      oc.appendChild(b);
    });
  }
  tStat();
}
function initTest() {
  $("tTema").innerHTML = A.temaOptions(18);
  $("tTema").onchange = nextQ; buildModes();
}
A.hooks.test = function () { if (!tst.cur) { tst.cur = 1; nextQ(); } };

/* ---------- Inicio ---------- */
function initInicio() {
  var nT = GLOS.length, nS = A.SEMB.length, nI = A.imgs.length;
  $("counts").innerHTML = [[nT, "términos del glosario (T1‑T18)"], [nS, "semblanzas de artistas (T1‑T17)"], [nI, "obras con imagen y términos enlazados"]].map(function (x) { return "<div><b>" + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");
}
A.hooks.inicio = function () {
  var rows = [["fichas", "Fichas de obras (autor)"], ["img2term", "Imagen → término"], ["term2img", "Término → imagen"], ["def2term", "Definición → término"]];
  var any = false, h = rows.map(function (r) { var s = A.getStat(r[0]); if (!s.n) return ""; any = true; return "<li>" + r[1] + ": " + s.ok + " aciertos de " + s.n + " (" + Math.round(100 * s.ok / s.n) + " %)</li>"; }).join("");
  var h3 = store("pau3hist") || [], h1 = store("p1hist") || [];
  if (h3.length) { any = true; h += "<li>Último simulacro de semblanzas: " + num(h3[0].s) + " / 3</li>"; }
  if (h1.length) { any = true; h += "<li>Último simulacro de términos: " + num(h1[0].s) + " / 2</li>"; }
  if ($("progress")) $("progress").innerHTML = any ? "<strong>Tu progreso en este navegador</strong><ul>" + h + "</ul>" : "";
};

function initPrint() {
  var b = $("glPrint"); if (!b) return;
  b.onclick = function () {
    var guard = 0; while (!$("glMore").classList.contains("hidden") && guard++ < 40) $("glMore").click();
    document.body.classList.add("pg");
    var done = function () { document.body.classList.remove("pg"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); A.track("glosario/imprimir", "Imprimir glosario"); setTimeout(function () { window.print(); }, 150);
  };
}
A.inits.push(initGlosario, initP1, initTest, initInicio, initPrint);
})();
