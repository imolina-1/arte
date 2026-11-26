/* Historia del Arte — semblanzas: simulacro de la pregunta 3, fichas de obras y consulta */
(function () {
"use strict";
var A = window.ARTE, norm = A.norm, esc = A.esc, md = A.md, shuffle = A.shuffle, store = A.store, $ = A.$, fmt = A.fmt, num = A.num;
var DATA = A.SEMB;
A.STOP = null;
var STOP=new Set("para como sobre entre desde hasta donde cuando porque aunque tambien pero sino este esta estos estas aquel aquella otros otras otra otro todo toda todos todas cada mucho mucha muchos muchas puede pueden tiene tienen hace hacen hacia segun siglo siglos obra obras artista artistas forma formas gran grandes mayor mismo misma sobre ellos ellas cuya cuyo cuyas cuyos pintor pintora escultor escultora arquitecto arquitecta pintura escultura arquitectura tambien periodo epoca italia espana desde despues antes durante".split(" "));
A.STOP=STOP;
/* ---------- Rúbrica ---------- */
function sig(words){return words.filter(function(w){return w.length>=4&&!STOP.has(w);});}
function worksOf(e){
  var list=e.obras.replace(/\([^)]*\)/g,"").split(/;|,| y (?=[A-ZÁÉÍÓÚÑ])/).map(function(s){return s.trim().replace(/\.$/,"");}).filter(Boolean);
  var re=/\*\*(.+?)\*\*/g,m; while((m=re.exec(e.texto))){ if(!/^(Época|Características|Obras)\.$/.test(m[1])) list.push(m[1]); }
  var seen={},out=[]; list.forEach(function(t){var k=norm(t); if(k&&!seen[k]){seen[k]=1;out.push(t);}}); return out;
}
function hasWork(ansWords,ansStr,title){
  var w=sig(norm(title).split(" ")); if(!w.length) w=norm(title).split(" ");
  var hit=w.filter(function(x){return ansWords.has(x)||ansStr.indexOf(x.slice(0,Math.max(5,x.length-2)))>=0;}).length;
  return hit>=Math.max(1,Math.ceil(w.length*0.6));
}
var ROM={i:1,ii:2,iii:3,iv:4,v:5,vi:6,vii:7,viii:8,ix:9,x:10,xi:11,xii:12,xiii:13,xiv:14,xv:15,xvi:16,xvii:17,xviii:18,xix:19,xx:20,xxi:21};
function epochInfo(e){
  var c=norm(e.cab), cents=new Set(), m, re=/\b(?:siglo|siglos|s)\s+([ivx]+)/g;
  while((m=re.exec(c))){ if(ROM[m[1]]) cents.add(ROM[m[1]]); }
  var re2=/\b(?:ss|siglos)\s+([ivx]+)\s+([ivx]+)/g; while((m=re2.exec(c))){[m[1],m[2]].forEach(function(r){if(ROM[r])cents.add(ROM[r]);});}
  var yrs=(e.cab.match(/\b(1\d{3}|20\d{2}|[1-9]\d{2})\b/g)||[]).map(Number);
  var bc=/a\. ?c\./i.test(e.cab);
  yrs.forEach(function(y){ cents.add(bc?Math.ceil(y/100):Math.floor(y/100)+1); });
  var parts=e.cab.split(" · "), style=parts[parts.length-1].replace(/\(.*\)/,"");
  var stw=sig(norm(style).split(" ")).filter(function(w){return !ROM[w];});
  return {cents:cents,style:stw,styleLabel:style.trim(),bc:bc};
}
function charTerms(e){
  var seg=(e.texto.split("**Características.**")[1]||"").split("**Obras.**")[0];
  var seen={},out=[];
  norm(seg).split(" ").forEach(function(w){ if(w.length>=7&&!STOP.has(w)&&!seen[w]){seen[w]=1;out.push(w);} });
  return out.slice(0,24);
}
function grade(e,ans){
  var aN=norm(ans), aW=new Set(aN.split(" ")), words=aN?aN.split(" ").length:0;
  // Época
  var ep=epochInfo(e), centHit=false;
  ep.cents.forEach(function(n){ var r=Object.keys(ROM).find(function(k){return ROM[k]===n;}); if(r&&(aW.has(r)||new RegExp("\\b"+(n-1)+"\\d\\d\\b").test(aN))) centHit=true; });
  var styleHit=ep.style.filter(function(w){return aW.has(w)||aN.indexOf(w.slice(0,6))>=0;});
  var sEp=(centHit?0.55:0)+(styleHit.length?0.45:0);
  // Características
  var terms=charTerms(e), tHit=terms.filter(function(t){return aW.has(t)||aN.indexOf(t.slice(0,Math.max(6,t.length-3)))>=0;});
  var sCar=Math.min(1,tHit.length/4);
  // Obras
  var works=worksOf(e), wHit=works.filter(function(t){return hasWork(aW,aN,t);});
  var sOb=Math.min(1,wHit.length/2);
  var pen=words<45?0.6:(words<70?0.85:1);
  var total=Math.round(((0.3*sEp+0.35*sCar+0.35*sOb)*pen)*20)/20;
  return {words:words,sEp:sEp,centHit:centHit,styleHit:styleHit,ep:ep,sCar:sCar,tHit:tHit,terms:terms,sOb:sOb,wHit:wHit,works:works,pen:pen,total:total};
}


/* ---------- Simulacro (pregunta 3) ---------- */
var five = [], chosen = [], timerId = null, endAt = 0, picker;
function pool() { return DATA.filter(function (e) { return picker.sel.has(e.tema) && !e.compl; }); }
function generate() {
  var p = shuffle(pool().slice()), out = [], usedT = {};
  p.forEach(function (e) { if (out.length < 5 && !usedT[e.tema]) { usedT[e.tema] = 1; out.push(e); } });
  p.forEach(function (e) { if (out.length < 5 && out.indexOf(e) < 0) out.push(e); });
  five = out; chosen = []; stopTimer();
  A.track("simulacro/generado", "Simulacro generado");
  out.forEach(function (e) { A.track("propuesto/" + e.id, "Propuesto: " + e.nombre); });
  $("stageWrite").classList.add("hidden"); $("stageResult").classList.add("hidden");
  $("stagePick").classList.remove("hidden"); $("copyQ").disabled = false;
  drawFive();
}
function drawFive() {
  var g = $("five"); g.innerHTML = "";
  five.forEach(function (e) {
    var b = document.createElement("button"); b.type = "button"; b.className = "pick";
    b.setAttribute("aria-pressed", chosen.indexOf(e) >= 0 ? "true" : "false");
    b.innerHTML = '<div class="ph" aria-hidden="true">' + esc(e.nombre.charAt(0)) + '</div><div class="nm">' + esc(e.nombre) + '</div><div class="tm">' + esc(A.temaLabel(e.tema)) + "</div>";
    b.onclick = function () { var i = chosen.indexOf(e); if (i >= 0) chosen.splice(i, 1); else if (chosen.length < 3) chosen.push(e); drawFive(); };
    g.appendChild(b);
  });
  $("pickMsg").textContent = chosen.length === 3 ? "Listo: has elegido 3 artistas" : "Selecciona 3 de los 5 artistas (" + chosen.length + "/3)";
  $("start").disabled = chosen.length !== 3;
}
function tick() { var left = endAt - Date.now(), el = $("timer"); el.textContent = fmt(left); el.className = "timer" + (left < 0 ? " over" : (left < 5 * 60000 ? " warn" : "")); }
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
function barCls(v) { return v >= 0.7 ? "" : (v >= 0.4 ? "mid" : "low"); }
function cartelas(e) {
  return "<div>" + e.obras.replace(/\.$/, "").split(/;|, (?=[A-ZÁÉÍÓÚÑ])| y (?=[A-ZÁÉÍÓÚÑ])/).map(function (o) { return '<span class="cartela">' + esc(o.trim()) + "</span>"; }).join("") + "</div>";
}
function relTerms(e, max) {
  return e.terms && e.terms.length ? '<p class="rel"><strong>Términos del glosario relacionados:</strong> ' + A.termChips(e.terms, max || 12) + "</p>" : "";
}
function resultCard(r) {
  var e = r.e, g = r.g;
  var miss = g.works.filter(function (w) { return g.wHit.indexOf(w) < 0; }).slice(0, 6);
  var tMiss = g.terms.filter(function (t) { return g.tHit.indexOf(t) < 0; }).slice(0, 6);
  var epTxt = (g.centHit ? '<span class="tag ok">siglo o fecha</span>' : '<span class="tag miss">falta el siglo o una fecha</span>') +
    (g.styleHit.length ? '<span class="tag ok">estilo: ' + esc(g.styleHit.join(", ")) + "</span>" : '<span class="tag miss">nombra el estilo: ' + esc(g.ep.styleLabel) + "</span>");
  return '<article class="res"><div class="res-h">' + A.face(e, true) +
    "<div><h3>" + esc(e.nombre) + '</h3><div class="stats">' + esc(e.cab) + '</div><div class="stats">' + g.words + " palabras · ≈ " + Math.round(g.words / 11) + " líneas" + (g.pen < 1 ? ' · <span style="color:var(--ochre)">respuesta breve</span>' : "") + "</div></div>" +
    A.ring(g.total, 1, "1") + "</div>" +
    '<div class="crit">' +
    "<span>Época</span><div class=\"bar " + barCls(g.sEp) + '"><i style="width:' + Math.round(g.sEp * 100) + '%"></i></div><span class="stats">' + num(0.3 * g.sEp * g.pen) + " / 0,30</span>" +
    "<span>Características</span><div class=\"bar " + barCls(g.sCar) + '"><i style="width:' + Math.round(g.sCar * 100) + '%"></i></div><span class="stats">' + num(0.35 * g.sCar * g.pen) + " / 0,35</span>" +
    "<span>Obras</span><div class=\"bar " + barCls(g.sOb) + '"><i style="width:' + Math.round(g.sOb * 100) + '%"></i></div><span class="stats">' + num(0.35 * g.sOb * g.pen) + " / 0,35</span>" +
    '</div><p class="small" style="padding:0 18px">Reparto orientativo del punto: época 0,30 · características 0,35 · obras 0,35' + (g.pen < 1 ? " · descuento por respuesta breve (" + Math.round((1 - g.pen) * 100) + " %)" : "") + ". La nota se redondea a 0,05.</p>" + '<div class="notes">' +
    "<p><strong>Época:</strong> " + epTxt + "</p>" +
    "<p><strong>Rasgos que has usado:</strong> " + (g.tHit.length ? g.tHit.map(function (t) { return '<span class="tag ok">' + esc(t) + "</span>"; }).join("") : '<span class="stats">ninguno del modelo</span>') + (tMiss.length ? "<br><strong>Podrías añadir:</strong> " + tMiss.map(function (t) { return '<span class="tag miss">' + esc(t) + "</span>"; }).join("") : "") + "</p>" +
    "<p><strong>Obras citadas:</strong> " + (g.wHit.length ? g.wHit.map(function (t) { return '<span class="tag ok">' + esc(t) + "</span>"; }).join("") : '<span class="stats">ninguna reconocida</span>') + (miss.length ? "<br><strong>Te faltan:</strong> " + miss.map(function (t) { return '<span class="tag miss">' + esc(t) + "</span>"; }).join("") : "") + "</p>" +
    relTerms(e, 12).replace('class="rel"', 'class="rel" style="margin:6px 0"') +
    '</div><details><summary>Comparar con la semblanza modelo</summary><div class="model"><p class="cab">' + esc(e.cab) + '</p><div class="body">' + A.sections(e.texto) + "</div>" + cartelas(e) + "</div></details>" +
    '<details><summary>Tu respuesta</summary><div class="model"><p>' + (esc(r.ans).replace(/\n/g, "<br>") || "<em>(en blanco)</em>") + "</p></div></details></article>";
}
function drawHist() {
  var h = store("pau3hist") || [], el = $("hist");
  if (!h.length) { el.innerHTML = ""; return; }
  el.innerHTML = "<strong>Tus últimos simulacros en este navegador</strong><ul>" + h.map(function (x) { return "<li>" + esc(x.d) + " · " + num(x.s) + " / 3 · " + esc(x.a.join(", ")) + "</li>"; }).join("") + "</ul>";
}
function initSim() {
  picker = A.temaPicker($("temaChips"), 17, function () { $("gen").disabled = !pool().length; });
  $("gen").onclick = generate;
  $("copyQ").onclick = function () {
    var t = "3. De los 5 artistas que se proponen, elija 3, explicando su época, características y obras más significativas (se recomienda no más de diez líneas para cada uno): " + five.map(function (e) { return e.nombre; }).join(", ") + "\n(Puntuación máxima: 3 puntos; 1 por cada respuesta correcta)";
    var msg = $("copyMsg");
    try { navigator.clipboard.writeText(t).then(function () { msg.textContent = "Enunciado copiado."; }, function () { msg.textContent = t; }); } catch (e) { msg.textContent = t; }
  };
  $("start").onclick = function () {
    var f = $("writeForm"); f.innerHTML = "";
    chosen.forEach(function (e, i) {
      var d = document.createElement("div"); d.className = "answer";
      d.innerHTML = '<label for="ans' + i + '">' + (i + 1) + ". " + esc(e.nombre) + '</label><textarea id="ans' + i + '" spellcheck="true" placeholder="Época… Características… Obras…"></textarea><button type="button" class="scaffold">Insertar guion: época, características, obras</button><div class="meter" id="m' + i + '">0 palabras · ≈ 0 líneas manuscritas</div>';
      f.appendChild(d);
      d.querySelector(".scaffold").onclick = function () { var ta = $("ans" + i); if (!ta.value.trim()) ta.value = "Época: \n\nCaracterísticas: \n\nObras: "; ta.focus(); ta.setSelectionRange(8, 8); };
      d.querySelector("textarea").addEventListener("input", function (ev) {
        var n = norm(ev.target.value) ? norm(ev.target.value).split(" ").length : 0;
        $("m" + i).textContent = n + " palabras · ≈ " + Math.round(n / 11) + " líneas manuscritas";
      });
    });
    var sub = document.createElement("div"); sub.className = "row"; sub.innerHTML = '<button class="btn" type="submit">Entregar y corregir</button>'; f.appendChild(sub);
    $("stagePick").classList.add("hidden"); $("stageWrite").classList.remove("hidden");
    endAt = Date.now() + 27 * 60000; stopTimer(); tick(); timerId = setInterval(tick, 1000);
    A.track("simulacro/empezado", "Simulacro empezado");
    chosen.forEach(function (e) { A.track("elegido/" + e.id, "Elegido: " + e.nombre); });
    $("ans0").focus();
  };
  $("writeForm").addEventListener("submit", function (ev) {
    ev.preventDefault(); stopTimer();
    var used = 27 * 60000 - (endAt - Date.now());
    var res = chosen.map(function (e, i) { return { e: e, ans: $("ans" + i).value, g: grade(e, $("ans" + i).value) }; });
    var tot = res.reduce(function (s, r) { return s + r.g.total; }, 0);
    A.track("simulacro/entregado", "Simulacro entregado");
    A.track("simulacro/nota-total/" + (tot < 1 ? "0-1" : (tot < 2 ? "1-2" : "2-3")), "Nota total del simulacro: " + (tot < 1 ? "menos de 1" : (tot < 2 ? "entre 1 y 2" : "2 o más")));
    A.track("simulacro/tiempo/" + (used < 15 * 60000 ? "menos-15min" : (used <= 27 * 60000 ? "15-27min" : "mas-27min")), "Tiempo del simulacro");
    res.forEach(function (r) {
      A.track("nota/" + r.e.id + "/" + A.bucket(r.g.total), "Nota " + A.bucket(r.g.total) + ": " + r.e.nombre);
      if (r.g.sEp < 0.4) A.track("falta-epoca/" + r.e.id, "Sin época: " + r.e.nombre);
      if (r.g.sOb < 0.5) A.track("falta-obras/" + r.e.id, "Sin obras: " + r.e.nombre);
      if (r.g.words < 70) A.track("respuesta-breve/" + r.e.id, "Respuesta breve: " + r.e.nombre);
    });
    var box = $("stageResult");
    var h = '<div class="total"><div><div class="stats">Estimación de la pregunta 3</div><b>' + num(tot) + ' / 3</b></div><div class="stats">Tiempo empleado: ' + fmt(used) + ' de 27:00</div><button class="btn" type="button" id="again">Otro simulacro</button></div>';
    res.forEach(function (r) { h += resultCard(r); });
    h += '<p class="disclaimer">La nota es orientativa: el simulador comprueba si aparecen la época (siglo o fecha y estilo), los rasgos característicos del modelo y las obras del currículo, y penaliza las respuestas muy breves. No valora la redacción, la precisión de las ideas ni los errores, que debe revisar el profesor.</p>';
    box.innerHTML = h; box.classList.remove("hidden");
    $("stageWrite").classList.add("hidden"); $("again").onclick = generate;
    var hist = store("pau3hist") || []; hist.unshift({ d: new Date().toLocaleDateString("es-ES"), a: chosen.map(function (e) { return e.nombre; }), s: tot }); store("pau3hist", hist.slice(0, 10)); drawHist();
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  drawHist(); generate();
}

/* ---------- Fichas de obras ---------- */
var fic = { cur: null };
function ficPool() {
  var v = $("ficTema").value;
  return A.imgsAll.filter(function (e) { return A.inFilter(e.tema, v); });
}
var fses = { ok: 0, n: 0 };
function showStat() {
  var p = ficPool(), dom = A.mastered(p, function (x) { return x.id; });
  $("ficStats").textContent = fses.ok + " aciertos de " + fses.n + " en esta sesión · " + dom + " de " + p.length + " obras dominadas";
}
function nextFic() {
  var p = ficPool();
  if (!p.length) { fic.cur = null; $("ficImg").removeAttribute("src"); $("ficOpts").innerHTML = ""; $("ficInfo").classList.add("hidden"); $("ficEmpty").innerHTML = A.noImgMsg; document.querySelector("#v-fichas .card").classList.add("hidden"); return; }
  $("ficEmpty").innerHTML = ""; document.querySelector("#v-fichas .card").classList.remove("hidden");
  var e = A.weightedPick(p, function (x) { return x.id; }, fic.cur);
  fic.cur = e;
  var near = DATA.filter(function (x) { return x !== e && !x.compl && Math.abs(x.tema - e.tema) <= 1; });
  if (near.length < 3) near = DATA.filter(function (x) { return x !== e; });
  var opts = shuffle(shuffle(near).slice(0, 3).concat([e]));
  var img = $("ficImg"); img.src = e.img; img.alt = "Obra para identificar"; img.dataset.zoom = ""; img.dataset.full = e.img; img.dataset.cap = "";
  var box = $("ficOpts"); box.innerHTML = "";
  opts.forEach(function (o) {
    var b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = o.nombre;
    b.onclick = function () {
      if (box.dataset.done) return; box.dataset.done = "1"; A.stat("fichas", o === e); fses.n++; if (o === e) fses.ok++; A.setBox(e.id, o === e); showStat();
      A.track("ficha/" + (o === e ? "acierto" : "fallo") + "/" + e.id, "Ficha " + (o === e ? "acertada" : "fallada") + ": " + e.nombre + (o === e ? "" : " (confundido con " + o.nombre + ")"));
      box.querySelectorAll(".opt").forEach(function (x) { if (x.textContent === e.nombre) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      $("ficTxt").innerHTML = "<strong>" + esc(e.pie) + "</strong>, de " + esc(e.nombre) + ". " + esc(e.cab.split(" · ").pop());
      $("ficRel").innerHTML = e.terms && e.terms.length ? "<strong>Términos del glosario de esta obra y de su autor:</strong> " + A.termChips(e.terms, 10) : "";
      $("ficLink").href = "#a-" + e.id; img.dataset.cap = A.capOf(e); img.dataset.cr = A.crOf(e);
      $("ficInfo").classList.remove("hidden"); $("ficNext").focus();
    };
    box.appendChild(b);
  });
  delete box.dataset.done; $("ficInfo").classList.add("hidden");
}
function initFichas() {
  $("ficTema").innerHTML = A.temaOptions(17);
  $("ficNext").onclick = nextFic;
  $("ficTema").onchange = function () { fic.cur = null; nextFic(); showStat(); };
  showStat();
}
A.hooks.fichas = function () { if (!fic.cur) { nextFic(); showStat(); } };

/* ---------- Consulta de semblanzas ---------- */
function drawList() {
  var q = norm($("q").value), t = $("conTema").value, one = A.params.id && A.sById[A.params.id];
  var items = one ? [one] : DATA.filter(function (e) { return A.inFilter(e.tema, t) && (!q || norm(e.nombre + " " + e.cab + " " + e.obras + " " + e.texto).indexOf(q) >= 0); });
  $("conBanner").classList.toggle("hidden", !one);
  $("list").innerHTML = items.length ? items.map(function (e) {
    return '<article class="entry" id="s-' + e.id + '">' + (e.img || e.ret ? A.face(e, true) : '<div class="noimg" aria-hidden="true">' + A.esc(e.nombre.replace(/\([^)]*\)/g, "").split(/[ -]+/).filter(function (w) { return /^[A-ZÁÉÍÓÚÑ]/.test(w); }).slice(0, 2).map(function (w) { return w[0]; }).join("")) + '</div>') +
      '<div><div class="t">' + esc(A.temaLabel(e.tema)) + (e.compl ? " · complementaria" : "") + "</div><h3>" + esc(e.nombre) + '</h3><div class="stats">' + esc(e.cab) + "</div>" +
      '<details style="border:0"' + (one ? " open" : "") + '><summary style="padding:8px 0">Leer la semblanza</summary><div class="body">' + A.sections(e.texto) + "</div></details>" + cartelas(e) + relTerms(e, 16) +
      '<div style="margin-top:8px"><button type="button" class="linkbtn" data-link="' + e.id + '">Copiar enlace a esta semblanza</button> <span class="stats" role="status"></span> · <a class="linkbtn" href="#artista?id=' + e.id + '">Practicar esta semblanza (nota sobre 1)</a></div></div></article>';
  }).join("") : '<p class="lead">No hay semblanzas con esa búsqueda. Prueba con otro nombre u obra.</p>';
}
function initConsulta() {
  $("conTema").innerHTML = A.temaOptions(17);
  $("q").addEventListener("input", function () { A.params = {}; drawList(); });
  $("conTema").addEventListener("change", function () { A.params = {}; drawList(); });
  $("conAll").onclick = function () { location.hash = "#semblanzas"; };
  $("list").addEventListener("toggle", function (ev) {
    var d = ev.target; if (!d.open) return; var art = d.closest(".entry"); if (!art) return;
    var b = art.querySelector("[data-link]"); if (b && A.sById[b.dataset.link]) A.track("leida/" + b.dataset.link, "Semblanza leída: " + A.sById[b.dataset.link].nombre);
  }, true);
  window.addEventListener("beforeprint", function () { document.querySelectorAll("#v-semblanzas details").forEach(function (d) { d.open = true; }); });
  $("list").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-link]"); if (!b) return;
    var url = location.href.split("#")[0] + "#a-" + b.dataset.link, st = b.nextElementSibling;
    try { navigator.clipboard.writeText(url).then(function () { st.textContent = "Enlace copiado."; }, function () { st.textContent = url; }); } catch (x) { st.textContent = url; }
  });
}
A.hooks.semblanzas = function (p) { if (!p.id && p.q) $("q").value = p.q; drawList(); };


/* ---------- Una semblanza, una nota (pregunta 3: 1 punto) ---------- */
var art = { cur: null };
function artFill(sel) {
  var v = $("aTema").value, list = DATA.filter(function (e) { return A.inFilter(e.tema, v); });
  list.sort(function (a, b) { return a.tema - b.tema || (norm(a.nombre) < norm(b.nombre) ? -1 : 1); });
  $("aSel").innerHTML = '<option value="">Elige un artista…</option>' + list.map(function (e) { return '<option value="' + e.id + '">' + esc(e.nombre) + " · T" + e.tema + (e.compl ? " (compl.)" : "") + "</option>"; }).join("");
  if (sel) $("aSel").value = sel;
}
function artShow(e) {
  art.cur = e; $("aSel").value = e.id; $("aWork").classList.remove("hidden"); $("aResult").innerHTML = "";
  $("aName").textContent = e.nombre; $("aAns").value = ""; $("aMeter").textContent = "0 palabras · ≈ 0 líneas manuscritas";
  $("aHint").textContent = A.temaLabel(e.tema) + (e.compl ? " · complementaria (no entra en el examen)" : "") + ". Escribe unas diez líneas: época, características y obras más significativas.";
  A.track("artista/elegido/" + e.id, "Un artista: " + e.nombre);
}
function artHist() {
  var h = store("pau1hist") || [], el = $("aHist");
  el.innerHTML = h.length ? "<strong>Tus últimos intentos en este navegador</strong><ul>" + h.map(function (x) { return "<li>" + esc(x.d) + " · " + esc(x.a) + " · " + num(x.s) + " / 1</li>"; }).join("") + "</ul>" : "";
}
function initArtista() {
  $("aTema").innerHTML = A.temaOptions(17); artFill();
  $("aTema").onchange = function () { artFill(); };
  $("aSel").onchange = function () { var e = A.sById[$("aSel").value]; if (e) artShow(e); };
  $("aRand").onclick = function () {
    var v = $("aTema").value, p = DATA.filter(function (e) { return !e.compl && A.inFilter(e.tema, v); });
    if (p.length) artShow(A.pick(p.length > 1 ? p.filter(function (e) { return e !== art.cur; }) : p));
  };
  $("aAns").addEventListener("input", function (ev) {
    var n = norm(ev.target.value) ? norm(ev.target.value).split(" ").length : 0;
    $("aMeter").textContent = n + " palabras · ≈ " + Math.round(n / 11) + " líneas manuscritas";
  });
  $("aScaf").onclick = function () { var ta = $("aAns"); if (!ta.value.trim()) ta.value = "Época: \n\nCaracterísticas: \n\nObras: "; ta.focus(); ta.setSelectionRange(8, 8); };
  $("aForm").addEventListener("submit", function (ev) {
    ev.preventDefault(); var e = art.cur; if (!e) return;
    var ans = $("aAns").value, g = grade(e, ans);
    $("aResult").innerHTML = resultCard({ e: e, g: g, ans: ans }) + '<div class="row"><button type="button" class="btn" id="aAgain">Otro artista al azar</button><button type="button" class="btn ghost" id="aRetry">Reescribir este</button></div>';
    var h = store("pau1hist") || []; h.unshift({ d: new Date().toLocaleDateString("es-ES"), a: e.nombre, s: g.total }); store("pau1hist", h.slice(0, 10)); artHist();
    A.track("artista/nota/" + e.id + "/" + A.bucket(g.total), "Un artista · nota " + A.bucket(g.total) + ": " + e.nombre);
    $("aAgain").onclick = function () { $("aRand").click(); $("aAns").focus(); };
    $("aRetry").onclick = function () { $("aResult").innerHTML = ""; $("aAns").focus(); };
    $("aResult").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  artHist();
}
A.hooks.artista = function (p) { if (p.id && A.sById[p.id] && !A.sById[p.id].obra) { $("aTema").value = "all"; artFill(p.id); artShow(A.sById[p.id]); } };
A.inits.push(initSim, initFichas, initConsulta, initArtista);
})();
