/* Historia del Arte — núcleo: utilidades, datos, rutas y estadísticas */
(function () {
"use strict";
var A = window.ARTE = {};
A.SEMB = window.ARTE_SEMB || [];
A.GLOS = window.ARTE_GLOS || [];
A.sById = {};
A.SEMB.forEach(function (e) { A.sById[e.id] = e; });
var ES_SHARED = { "juan-de-herrera": 1, "el-greco": 1, "diego-velazquez": 1, "bartolome-esteban-murillo": 1, "pablo-picasso": 1 };     // también están en Historia de España
A.esHref = function (y, id) {                       // enlace a la línea del tiempo de Historia de España
  var u = "https://historiapau.pages.dev/#linea";
  if (id && ES_SHARED[id]) return { u: u + "?k=p" + id, t: "Su ficha en Historia de España" };
  return y == null || y < -218 ? null : { u: u + "?y=" + Math.round(y), t: "La España de su época" };
};
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
A.temaName = {};
A.TEMAS = ["El arte griego", "El arte romano", "El arte paleocristiano", "El arte bizantino", "El arte prerrománico español", "El arte islámico e hispanomusulmán", "El arte románico", "El arte gótico", "El Renacimiento italiano", "El Renacimiento español", "El Barroco europeo", "El Barroco español", "El Neoclasicismo, el romanticismo y el realismo", "La Revolución Industrial: arquitectura, urbanismo y escultura", "Impresionismo, neoimpresionismo y postimpresionismo", "Las vanguardias en las artes plásticas", "La arquitectura y el urbanismo en el siglo XX", "Las artes plásticas en la segunda mitad del siglo XX"];
A.TEMAS.forEach(function (n, i) { A.temaName[i + 1] = n; });
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
  return '<a class="semchip" href="#a-' + e.id + '">' + A.esc(e.nombre) + "</a>";
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
A.boxAll = function () { return BOX; };
A.mastered = function (items, keyFn) { return items.filter(function (x) { return A.boxOf(keyFn(x)) >= 3; }).length; };

/* ---------- Estadísticas locales (solo en el navegador del alumno) ---------- */
A.stat = function (key, ok) {
  var s = A.store("arte_stats") || {}; s[key] = s[key] || { ok: 0, n: 0 };
  s[key].n++; if (ok) s[key].ok++; A.store("arte_stats", s); return s[key];
};
A.getStat = function (key) { var s = A.store("arte_stats") || {}; return s[key] || { ok: 0, n: 0 }; };

/* ---------- Rutas ---------- */
var VIEWS = ["inicio", "simulacro", "artista", "fichas", "semblanzas", "cronologia", "repaso", "ficha", "progreso", "comparador", "esquema", "mapa", "glosario", "terminos", "test", "acerca", "album", "clasif"];
var ALIAS = { consulta: "semblanzas" };
A.hooks = {};
A.params = {};
function parse() {
  var h = (location.hash || "#inicio").slice(1), q = h.indexOf("?"), view = q < 0 ? h : h.slice(0, q), p = {};
  if (q >= 0) h.slice(q + 1).split("&").forEach(function (kv) { var a = kv.split("="); if (a[0]) p[a[0]] = decodeURIComponent((a[1] || "").replace(/\+/g, " ")); });
  if (view.indexOf("a-") === 0) { p.id = view.slice(2); view = "ficha"; }   // enlaces directos #a-nombre-del-artista
  view = ALIAS[view] || view; if (VIEWS.indexOf(view) < 0) view = "inicio";
  return { view: view, p: p };
}
/* Año de la PAU: de septiembre a diciembre, el del año siguiente; de enero a agosto, el del año en curso. */
A.pauYear = function () { var d = new Date(); return d.getFullYear() + (d.getMonth() >= 8 ? 1 : 0); };
A.route = function () {
  var r = parse(); A.params = r.p;
  if (A.route.last !== r.view) { A.route.last = r.view; A.track("vista/" + r.view, "Vista: " + r.view); }
  VIEWS.forEach(function (v) { A.$("v-" + v).classList.toggle("hidden", v !== r.view); });
  document.querySelectorAll("nav a").forEach(function (a) { if (a.dataset.view === r.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  document.querySelectorAll(".dd").forEach(function (d) { d.classList.toggle("has-cur", !!d.querySelector('a[aria-current="page"]')); });
  document.body.classList.toggle("vf", r.view === "ficha"); document.body.classList.toggle("ve", r.view === "esquema");
  if (A.hooks[r.view]) A.hooks[r.view](r.p);
  document.title = (r.view === "inicio" ? "" : (r.view === "acerca" ? "Créditos y derechos" : (function (a) { return a ? (a.querySelector("b") || a).textContent : ""; })(document.querySelector('nav a[data-view="' + r.view + '"]'))) + " · ") + "Historia del Arte · PAU " + A.pauYear();
  if (!A.noScroll) window.scrollTo(0, 0);
};
window.addEventListener("hashchange", function () { A.route(); });

/* ---------- Imágenes: etiqueta con ampliación, anillo de nota, tema, portada ---------- */
A.capOf = function (e) { return (e.pie || "") + (e.nombre ? " · " + e.nombre : "") + (e.cab ? " · " + e.cab.split(" · ").slice(-2).join(" · ") : ""); };
A.img = function (e, thumb, extra) {
  return '<img src="' + A.esc(thumb && e.th ? e.th : e.img) + '" data-zoom data-full="' + A.esc(e.img) + '" data-cap="' + A.esc(A.capOf(e)) + '" data-cr="' + A.esc(A.crOf(e)) + '" alt="' + A.esc(e.pie || "Obra") + '" loading="lazy" decoding="async"' + (extra || "") + ">";
};
A.face = function (e, thumb) {
  if (!e.ret) return e.img ? A.img(e, thumb) : "";
  var cap = (e.nombre || "") + (e.cab ? " · " + e.cab.split(" · ")[0] : "");
  return '<img class="face" src="' + A.esc(thumb && e.rth ? e.rth : e.ret) + '" data-zoom data-full="' + A.esc(e.ret) + '" data-cap="' + A.esc(cap) + '" data-cr="' + A.esc(A.CRR[e.id] || "") + '" alt="Retrato de ' + A.esc(e.nombre || "") + '" loading="lazy" decoding="async">';
};
A.ring = function (score, max, label) {
  var p = Math.max(0, Math.min(1, score / max)), cls = p >= 0.7 ? "" : (p >= 0.4 ? " mid" : " low");
  return '<div class="score"><div class="ring' + cls + '" style="--p:' + Math.round(p * 100) + '" role="img" aria-label="' + A.num(score) + " de " + (label || A.num(max)) + ' puntos"><b>' + A.num(score) + "</b></div><span>de " + (label || A.num(max)) + " punto" + (max === 1 ? "" : "s") + "</span></div>";
};
A.CR = {"o-opera-sidney":["W. Bulach","CC BY-SA 4.0"],"o-guggenheim-bilbao":["Naotake Murayama","CC BY 2.0"],"o-heydar-aliyev":["Robot8A","CC BY-SA 4.0"],"o-hsbc":["WiNG","CC BY 3.0"],"o-seagram":["Max Hermus at Dutch Wikipedia","Public domain"],"o-guggenheim-nueva-york":["Jean-Christophe BENOIST","CC BY 3.0"],"o-casa-kaufmann":["Carol M. Highsmith","Public domain"],"o-pompidou":["Guilhem Vellut from Annecy, France","CC BY 2.0"],"giotto-di-bondone":["José Luiz","CC BY-SA 4.0"]};
A.CRR = {"gil-de-siloe":"Retrato ilustrativo generado con IA: no se conserva ninguno de época","maestro-mateo-complementaria":"Retrato ilustrativo generado con IA: no se conserva ninguno de época"};
A.crOf = function (e) { var c = A.CR[e.id]; return c ? "Foto: " + c[0] + " · " + c[1] + " · Wikimedia Commons" : ""; };
var PRE = {}, zTok = 0;
A.pre = function (src) { if (!src) return null; if (!PRE[src]) { var i = new Image(); i.decoding = "async"; i.src = src; PRE[src] = i; } return PRE[src]; };
A.zoom = function (src, cap, cr, ph) {
  var d = A.$("lb"); if (!d) return;
  var img = A.$("lbImg"), full = A.pre(src), tok = ++zTok;
  if (full.complete && full.naturalWidth) { img.classList.remove("ld"); img.src = src; }
  else {                                              // se muestra al instante la miniatura (ya en caché) y se cambia por la grande cuando está decodificada
    img.classList.add("ld"); if (ph && ph !== src) img.src = ph; else img.removeAttribute("src");
    (full.decode ? full.decode() : new Promise(function (r) { full.onload = r; })).then(function () { if (tok === zTok) { img.src = src; img.classList.remove("ld"); } }, function () { if (tok === zTok) { img.src = src; img.classList.remove("ld"); } });
  }
  img.alt = cap || ""; A.$("lbCap").innerHTML = A.esc(cap || "") + "<small>" + A.esc(cr || "Imagen de las presentaciones de clase · uso docente") + "</small>";
  if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute("open", "");
};
["pointerover", "touchstart"].forEach(function (n) {   // al acercar el ratón o tocar, se empieza a bajar la imagen grande
  document.addEventListener(n, function (ev) { var t = ev.target.closest && ev.target.closest("img[data-full],button[data-full]"); if (t && t.dataset.full) A.pre(t.dataset.full); }, { passive: true });
});
document.addEventListener("click", function (ev) {
  var im = ev.target.closest && ev.target.closest("img[data-zoom]");
  if (im) { ev.preventDefault(); A.zoom(im.dataset.full || im.src, im.dataset.cap || im.alt, im.dataset.cr, im.currentSrc || im.src); return; }
  var d = A.$("lb"); if (d && d.open && ev.target.closest("#lb") && ev.target.id !== "lbImg") { if (d.close) d.close(); else d.removeAttribute("open"); }
});
document.addEventListener("keydown", function (ev) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  var tg = ev.target && ev.target.tagName; if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT") return;
  var area = document.getElementById("qOpts"), view = document.getElementById("v-test");
  if (!view || view.classList.contains("hidden") || !area) return;
  if (/^[1-4]$/.test(ev.key) && !area.dataset.done) { var o = area.querySelectorAll(".opt")[+ev.key - 1]; if (o) { o.click(); ev.preventDefault(); } }
  else if (ev.key === "Enter" && area.dataset.done) { var n = document.getElementById("qNext"); if (n && n.offsetParent) { n.click(); ev.preventDefault(); } }
});
document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { var d = A.$("lb"); if (d && d.open && !d.close) d.removeAttribute("open"); } });
(function () {
  var saved = A.store("arte_theme"); if (saved) document.documentElement.dataset.theme = saved;
  A.inits = A.inits || [];
  A.inits.push(function () {
    var b = A.$("themeBtn"); if (!b) return;
    b.onclick = function () {
      var cur = document.documentElement.dataset.theme || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var nxt = cur === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = nxt; A.store("arte_theme", nxt);
      var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = "#17120f";
    };
  });
})();
A.heroInit = function () {
  var pool = A.SEMB.concat(A.OBRAS).filter(function (e) { return e.u !== false && e.img && !/origen del mundo/i.test(e.pie || ""); }); // portada apta para todos los públicos
  var last = null;
  function show() {
    var e = A.pick(pool); if (e === last && pool.length > 1) e = A.pick(pool); last = e;
    var im = A.$("heroImg"); im.src = e.img; im.alt = e.pie || "Obra"; im.dataset.full = e.img; im.dataset.cap = A.capOf(e); im.dataset.cr = A.crOf(e); im.dataset.zoom = "";
    A.$("heroCap").textContent = (e.pie || "") + (e.nombre ? " · " + e.nombre : "") + (e.cab ? " · " + e.cab.split(" · ").slice(-2).join(" · ") : "");
  }
  if (!A.$("heroImg")) return;
  A.$("heroNext").onclick = show; show();
  A.$("heroFrame").addEventListener("click", function (ev) { if (ev.target.id !== "heroImg") A.zoom(A.$("heroImg").src, A.$("heroImg").dataset.cap, A.$("heroImg").dataset.cr); });
  document.querySelectorAll(".hcard[data-art]").forEach(function (c) {
    var e = A.sById[c.dataset.art]; if (e && e.img) c.querySelector(".hc-img").style.backgroundImage = "url(" + (e.th || e.img) + ")";
  });
};
A.start = function () {
  document.querySelectorAll(".pauy").forEach(function (e) { e.textContent = A.pauYear(); });
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  ["init"].forEach(function () { (A.inits || []).forEach(function (f) { f(); }); });
  A.heroInit();
  A.route();
};
A.inits = A.inits || [];
})();

/* botón «volver arriba» */
(function () {
  var b = document.getElementById("toTop"); if (!b) return;
  window.addEventListener("scroll", function () { b.classList.toggle("on", window.scrollY > 700); }, { passive: true });
  b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
