// Dati dal CMS: window.TV (numero WhatsApp, sedi, servizi)
const TV = window.TV || { wa: '', tel: '', sedi: [], S: {} };
const WA = 'https://wa.me/' + TV.wa + '?text=';
const S = TV.S; // chiave -> [nome, descrizione, online?, immagine]
const Q = [
  { q: 'Cosa cerchi in questo momento?', k: 'goal', o: [['self','Conoscermi meglio'],['calm','Ritrovare calma nel corpo'],['change','Attraversare un cambiamento'],['rel','Capire una relazione']] },
  { q: 'Come ti piace lavorare?', k: 'way', o: [['word','Con la parola'],['touch','Con il tocco'],['any','Non lo so ancora']] },
  { q: 'Dove ti è più comodo?', k: 'place', o: TV.sedi.map(x => [x.online ? 'Online, solo consulenze' : x.citta, x.citta]) }
];
const MAP = {
  self: { word: ['tema'], touch: ['riflesso'], any: ['naturopatica','tema'] },
  calm: { word: ['bach'], touch: ['ayurveda','kerala'], any: ['naturopatica','bach'] },
  change: { word: ['transiti','rivoluzione'], touch: ['metamorfico'], any: ['transiti','metamorfico'] },
  rel: { word: ['sinastria'], touch: ['sinastria','bach'], any: ['sinastria'] }
};
const box = document.querySelector('[data-quiz]');
if (box) {
  const a = {}; let i = 0;
  const bar = () => '<div class="quiz__bar" aria-hidden="true">' + [0,1,2,3].map(n => `<i class="${n <= i ? 'is-on' : ''}"></i>`).join('') + '</div>';
  const render = () => {
    if (i < Q.length) {
      const s = Q[i];
      box.innerHTML = bar() + `<div class="quiz__panel"><p class="quiz__step">Domanda ${i + 1} di 3</p><h3 class="quiz__q">${s.q}</h3><div class="quiz__opts">` +
        s.o.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('') + '</div></div>' +
        (i ? '<button type="button" class="quiz__back" data-back>Torna indietro</button>' : '');
    } else {
      const all = Object.keys(S);
      let keys = (MAP[a.goal][a.way] || []).filter(k => S[k]);
      if (!keys.length) keys = all.slice(0, 1);
      const online = a.place.startsWith('Online');
      let note = '';
      if (online && keys.some(k => !S[k][2])) { keys = keys.filter(k => S[k][2]); if (!keys.length) keys = all.filter(k => S[k][2]).slice(0, 1); note = '<p class="quiz__note">I trattamenti si fanno solo in sede: online ti propongo una consulenza.</p>'; }
      const names = keys.map(k => S[k][0]);
      const msg = `Ciao Teresa, ho fatto il questionario sul sito: mi interessa ${names.join(' e ')}${online ? ', online' : ', a ' + a.place.split(',')[0]}.`;
      box.innerHTML = bar() + '<div class="quiz__panel"><p class="quiz__step">Il mio suggerimento</p><div class="quiz__res">' +
        keys.map(k => `<div class="quiz__item"><img src="${S[k][3]}" alt=""><div><h4>${S[k][0]}</h4><p>${S[k][1]}</p></div></div>`).join('') + '</div>' + note +
        `<div class="btn-row"><a class="btn btn--primary" href="#contatti" data-prefill>Chiedi informazioni</a><a class="btn btn--secondary" href="${WA + encodeURIComponent(msg)}">Scrivimi su WhatsApp</a></div></div>` +
        '<button type="button" class="quiz__back" data-restart>Ricomincia</button>';
      box.querySelector('[data-prefill]').addEventListener('click', () => prefill(names[0], a.place, msg.replace('Ciao Teresa, ho fatto il questionario sul sito: ', 'Dal questionario: ')));
    }
  };
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v) { a[Q[i].k] = b.dataset.v; i++; render(); box.querySelector('button')?.focus({ preventScroll: true }); }
    else if (b.hasAttribute('data-back')) { i--; render(); }
    else if (b.hasAttribute('data-restart')) { i = 0; render(); }
  });
  render();
}
function prefill(topic, place, message) {
  const t = document.getElementById('f-topic'), p = document.getElementById('f-place'), m = document.getElementById('f-msg');
  if (t && topic) [...t.options].forEach(o => { if (o.text === topic) t.value = o.value || o.text; });
  if (p && place) [...p.options].forEach(o => { if (o.text === place) p.value = o.value || o.text; });
  if (m && message && !m.value) m.value = message;
}


// events: status from the date, arrows on desktop
(() => {
  const now = Date.now(), cards = [...document.querySelectorAll('.ev-card')];
  // order again in the browser: upcoming first (nearest first), then past (most recent first)
  const t = c => +new Date(c.dataset.date), list = cards[0]?.parentElement;
  if (list) [...cards].sort((a, b) => { const pa = t(a) < now, pb = t(b) < now; return pa !== pb ? (pa ? 1 : -1) : pa ? t(b) - t(a) : t(a) - t(b); }).forEach(c => list.appendChild(c));
  let next = cards.filter(c => +new Date(c.dataset.date) > now).sort((a, b) => new Date(a.dataset.date) - new Date(b.dataset.date))[0];
  cards.forEach(c => { const st = c.querySelector('[data-status]'); if (+new Date(c.dataset.date) < now) { c.classList.add('is-past'); st.textContent = 'Concluso'; st.className = 'ev-status is-past'; } else if (c === next) { st.textContent = 'Prossimo evento'; st.className = 'ev-status is-next'; } });
  const track = document.querySelector('[data-ev-track]'), btns = [...document.querySelectorAll('[data-ev]')];
  if (!track) return;
  const upd = () => { btns[0].disabled = track.scrollLeft < 8; btns[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8; };
  btns.forEach(b => b.addEventListener('click', () => track.scrollBy({ left: +b.dataset.ev * (track.querySelector('.ev-card').offsetWidth + 24), behavior: 'smooth' })));
  track.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
})();
// gift card: live voucher on a canvas, PNG download, request by WhatsApp
(() => {
  const form = document.querySelector('[data-gift]'); if (!form) return;
  const cv = document.querySelector('.gc-canvas'), ctx = cv.getContext('2d');
  const W = 1600, H = 900, SC = 2; cv.width = W * SC; cv.height = H * SC; ctx.scale(SC, SC);
  const T = {
    generico: { bg: '#f7f1e8', bg2: '#efe5d4', ink: '#2b1d17', soft: '#6e6157', accent: '#8f5606', gold: '#c9952e', hi: 'Un regalo per te', deco: 'wheel' },
    natale: { bg: '#1f3a2e', bg2: '#183026', ink: '#f7f1e8', soft: '#c9c3b6', accent: '#f5c24a', gold: '#d9a83a', hi: 'Buon Natale', deco: 'stars' },
    compleanno: { bg: '#f3e1d4', bg2: '#ecd2c2', ink: '#3a2219', soft: '#6f5249', accent: '#a5492f', gold: '#c9952e', hi: 'Buon compleanno', deco: 'confetti' }
  };
  const logo = new Image(); logo.src = '/logo.svg';
  const code = () => 'TV-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('').replace(/(.{3})/, '$1-');
  let CODE = code(), issued = null;
  const F = (w, size, it) => `${it ? 'italic ' : ''}${w} ${size}px ${w === 400 && it !== null ? '"Instrument Serif"' : '"Instrument Sans"'}`;
  const serif = (size, it) => `${it ? 'italic ' : ''}400 ${size}px "Instrument Serif", Georgia, serif`;
  const sans = (size, w = 400) => `${w} ${size}px "Instrument Sans", system-ui, sans-serif`;
  const spaced = (txt, x, y, sp) => { if ('letterSpacing' in ctx) { ctx.letterSpacing = sp + 'px'; ctx.fillText(txt, x, y); ctx.letterSpacing = '0px'; } else ctx.fillText(txt.split('').join(' '), x, y); };
  const wrap = (txt, maxW, maxLines) => { const words = txt.split(/\s+/).filter(Boolean), lines = []; let l = '';
    for (const w of words) { const t = l ? l + ' ' + w : w; if (ctx.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; } return lines; };
  const fit = (txt, font, maxW, start, min) => { let s = start; do { ctx.font = font(s); if (ctx.measureText(txt).width <= maxW) break; s -= 2; } while (s > min); return s; };
  function deco(t) {
    ctx.save(); ctx.beginPath(); ctx.rect(46, 46, W - 92, H - 92); ctx.clip();
    if (t.deco === 'wheel') {
      const cx = 1330, cy = 330, R = 300; ctx.strokeStyle = t.gold; ctx.globalAlpha = .55;
      [[R, 1.6], [R - 52, 1.2], [R - 120, 1], [70, 1]].forEach(([r, w]) => { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });
      for (let i = 0; i < 12; i++) { const a = Math.PI * i / 6; ctx.lineWidth = i % 3 ? .9 : 1.6; ctx.beginPath(); ctx.moveTo(cx + (R - 120) * Math.cos(a), cy + (R - 120) * Math.sin(a)); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke(); }
      for (let i = 0; i < 72; i++) { if (i % 6 === 0) continue; const a = Math.PI * i / 36; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(cx + (R - 52) * Math.cos(a), cy + (R - 52) * Math.sin(a)); ctx.lineTo(cx + (R - 60) * Math.cos(a), cy + (R - 60) * Math.sin(a)); ctx.stroke(); }
      const pts = [20, 95, 140, 200, 262, 318].map(d => d * Math.PI / 180); ctx.lineWidth = .8;
      [[0, 3], [1, 4], [2, 5], [0, 2], [3, 5]].forEach(([p, q]) => { ctx.beginPath(); ctx.moveTo(cx + 180 * Math.cos(pts[p]), cy + 180 * Math.sin(pts[p])); ctx.lineTo(cx + 180 * Math.cos(pts[q]), cy + 180 * Math.sin(pts[q])); ctx.stroke(); });
      ctx.fillStyle = t.gold; pts.forEach(a => { ctx.beginPath(); ctx.arc(cx + 210 * Math.cos(a), cy + 210 * Math.sin(a), 4, 0, Math.PI * 2); ctx.fill(); });
    } else if (t.deco === 'stars') {
      const star = (x, y, r, a) => { ctx.globalAlpha = a; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = Math.PI * i / 4 - Math.PI / 2, rr = i % 2 ? r * .28 : r; ctx.lineTo(x + rr * Math.cos(ang), y + rr * Math.sin(ang)); } ctx.closePath(); ctx.fill(); };
      const flake = (x, y, r, a) => { ctx.globalAlpha = a; ctx.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const ang = Math.PI * i / 3; const ex = x + r * Math.cos(ang), ey = y + r * Math.sin(ang); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        const mx = x + r * .6 * Math.cos(ang), my = y + r * .6 * Math.sin(ang); [-1, 1].forEach(sg => { const b = ang + sg * .6; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + r * .3 * Math.cos(b), my + r * .3 * Math.sin(b)); ctx.stroke(); }); } };
      ctx.fillStyle = t.gold; ctx.strokeStyle = t.gold;
      [[1250, 170, 34, .9], [1420, 300, 18, .7], [1120, 330, 14, .6], [1500, 150, 12, .5], [1330, 470, 22, .65], [1080, 120, 10, .5], [1470, 560, 14, .45]].forEach(p => star(...p));
      [[1360, 220, 46, .55], [1180, 520, 30, .4], [1520, 400, 26, .4]].forEach(p => flake(...p));
      ctx.globalAlpha = .35; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1040, 60); ctx.bezierCurveTo(1200, 260, 1420, 160, 1560, 380); ctx.stroke();
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = .25 + (i % 5) * .08; ctx.beginPath(); ctx.arc(1000 + (i * 137) % 560, 70 + (i * 89) % 560, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    } else {
      const cols = [t.accent, t.gold, '#e7a77f', '#7b8f74'];
      for (let i = 0; i < 46; i++) { const x = 1000 + (i * 151) % 560, y = 60 + (i * 97) % 600, c = cols[i % 4]; ctx.fillStyle = c; ctx.globalAlpha = .75; ctx.save(); ctx.translate(x, y); ctx.rotate(i * .7);
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-9, -4, 18, 8); ctx.restore(); }
      ctx.globalAlpha = .6; ctx.lineWidth = 2; [[t.accent, 1040, 520], [t.gold, 1260, 120]].forEach(([c, x, y]) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) ctx.bezierCurveTo(x + 40 + k * 70, y - 60, x + 70 + k * 70, y + 60, x + 100 + k * 70, y); ctx.stroke(); });
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function draw() {
    const d = Object.fromEntries(new FormData(form)); const t = T[d.tema] || T.generico;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, t.bg); g.addColorStop(1, t.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    deco(t);
    ctx.strokeStyle = t.gold; ctx.lineWidth = 2; ctx.strokeRect(30, 30, W - 60, H - 60); ctx.lineWidth = 1; ctx.strokeRect(42, 42, W - 84, H - 84);
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, 92, 92, 96, 96);
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = t.ink; ctx.font = serif(34); ctx.fillText('Teresa Venturi', 208, 136);
    ctx.fillStyle = t.soft; ctx.font = sans(15, 500); spaced('NATUROPATA', 210, 166, 4);
    let y = 290;
    ctx.fillStyle = t.accent; ctx.font = serif(46, true); ctx.fillText(t.hi, 92, y);
    ctx.fillStyle = t.soft; ctx.font = sans(17, 500); spaced('GIFT CARD PER', 94, y += 58, 3);
    const name = (d.destinatario || '').trim() || 'Il suo nome';
    const ns = fit(name, s => serif(s), 860, 104, 52); ctx.fillStyle = t.ink; ctx.font = serif(ns); ctx.fillText(name, 90, y += ns * .95);
    ctx.fillStyle = t.soft; ctx.font = sans(17, 500); spaced('VALIDA PER', 94, y += 62, 3);
    ctx.fillStyle = t.ink; ctx.font = serif(40); const wl = wrap(d.regalo, 840, 2); wl.forEach(l => ctx.fillText(l, 92, y += 46));
    const msg = (d.messaggio || '').trim();
    if (msg) { ctx.fillStyle = t.ink; ctx.globalAlpha = .9; ctx.font = serif(28, true); wrap('«' + msg + '»', 840, 3).forEach((l, i) => ctx.fillText(l, 92, (i ? y += 36 : y += 62))); ctx.globalAlpha = 1; }
    const from = (d.mittente || '').trim(); if (from) { ctx.fillStyle = t.soft; ctx.font = sans(22); ctx.fillText('Con affetto, ' + from, 92, Math.max(y + 56, 790)); }
    // right column: code and details
    const bx = 1110, by = 640, bw = 400, bh = 168;
    ctx.fillStyle = t.bg; ctx.globalAlpha = .82; ctx.fillRect(bx, by, bw, bh); ctx.globalAlpha = 1; ctx.strokeStyle = t.gold; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = t.soft; ctx.font = sans(13, 500); spaced('CODICE', bx + 28, by + 40, 3);
    ctx.fillStyle = t.ink; ctx.font = serif(40); ctx.fillText(CODE, bx + 28, by + 86);
    ctx.fillStyle = t.soft; ctx.font = sans(15);
    ctx.fillText(issued ? 'Emessa il ' + issued : 'Anteprima', bx + 28, by + 120);
    ctx.fillText('Prenota al ' + TV.tel, bx + 28, by + 145);
  }
  const upd = () => { form.querySelector('[data-count]').textContent = form.querySelector('#g-msg').value.length; draw(); };
  form.addEventListener('input', upd); form.addEventListener('change', upd);
  logo.onload = draw; (document.fonts ? document.fonts.load('400 40px "Instrument Serif"').then(() => document.fonts.load('italic 400 40px "Instrument Serif"')).then(() => document.fonts.load('500 16px "Instrument Sans"')) : Promise.resolve()).then(draw, draw); draw();
  const done = document.querySelector('[data-gift-done]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    [['#g-to', v => v.trim().length > 0], ['#g-mail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())]].forEach(([sel, test]) => {
      const el = form.querySelector(sel), err = form.querySelector(sel + '-err'), bad = !test(el.value); err.hidden = !bad; el.setAttribute('aria-invalid', String(bad)); if (bad && ok) { el.focus(); ok = false; } });
    if (!ok) return;
    CODE = code(); issued = new Date().toLocaleDateString('it-IT'); draw();
    cv.classList.remove('is-pop'); void cv.offsetWidth; cv.classList.add('is-pop');
    const d = Object.fromEntries(new FormData(form));
    done.hidden = false; done.querySelector('[data-gift-mail]').textContent = d.email;
    const msg = `Ciao Teresa, vorrei regalare una gift card.\nCodice: ${CODE}\nTema: ${d.tema}\nRegalo: ${d.regalo}\nPer: ${d.destinatario}${d.mittente ? '\nDa parte di: ' + d.mittente : ''}${d.messaggio ? '\nMessaggio: ' + d.messaggio : ''}\nEmail a cui inviarla: ${d.email}`;
    done.querySelector('[data-gift-send]').href = WA + encodeURIComponent(msg);
    cv.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
  document.querySelector('[data-gift-dl]').addEventListener('click', () => {
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `gift-card-${CODE}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  });
})();
// the path below 1024: the section holds and the steps open in turn as you scroll (tap still works)
const pc = document.getElementById('percorso');
if (pc) {
  const mq = matchMedia('(max-width: 1023px)'), rm = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [...pc.querySelectorAll('.mo-pc__step')], dots = [...pc.querySelectorAll('.pc-dots i')];
  let cur = -1;
  const open = (st) => { const n = steps.indexOf(st); if (n === cur) return; cur = n;
    steps.forEach((x, k) => { const on = k === n; x.classList.toggle('is-open', on); x.setAttribute('aria-expanded', String(on)); });
    dots.forEach((d, k) => d.classList.toggle('is-on', k <= n)); };
  const range = () => { const r = pc.getBoundingClientRect(); return { top: r.top + scrollY, len: Math.max(1, pc.offsetHeight - innerHeight) }; };
  let ticking = false;
  const onScroll = () => { if (ticking || !pc.classList.contains('pc-scroll')) return; ticking = true; requestAnimationFrame(() => {
    ticking = false; const { top, len } = range(); const p = Math.min(1, Math.max(0, (scrollY - top) / len));
    open(steps[Math.min(steps.length - 1, Math.floor(p * steps.length))]); }); };
  steps.forEach((st, k) => {
    const go = () => { if (!pc.classList.contains('pc-tap')) return;
      if (pc.classList.contains('pc-scroll')) { const { top, len } = range(); window.scrollTo({ top: top + len * (k + 0.5) / steps.length, behavior: rm.matches ? 'auto' : 'smooth' }); }
      else open(st); };
    st.addEventListener('click', go);
    st.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { if (!pc.classList.contains('pc-tap')) return; e.preventDefault(); go(); } });
  });
  const set = () => {
    const tap = mq.matches; pc.classList.toggle('pc-tap', tap); pc.classList.toggle('pc-scroll', tap && !rm.matches);
    steps.forEach(st => { if (tap) { st.tabIndex = 0; st.setAttribute('role', 'button'); } else { st.removeAttribute('tabindex'); st.removeAttribute('role'); st.removeAttribute('aria-expanded'); } });
    cur = -1; if (tap) { open(steps[0]); onScroll(); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  mq.addEventListener('change', set); rm.addEventListener('change', set); set();
}
// archetype wheel: Aries in house 1 (left), signs counter-clockwise; the needle points to the sign
const SIGNS = [['Ariete',3,21],['Toro',4,20],['Gemelli',5,21],['Cancro',6,21],['Leone',7,23],['Vergine',8,23],['Bilancia',9,23],['Scorpione',10,23],['Sagittario',11,22],['Capricorno',12,22],['Acquario',1,20],['Pesci',2,19]];
const ARCH = {"Ariete": ["Il Guerriero", "La Chiamata all'Avventura", "Rappresenta la scintilla iniziale della vita, il coraggio di lanciarsi verso l'ignoto e l'impulso all'azione pura senza timore del rischio."], "Toro": ["Il Costruttore", "Il Radicamento", "Incarna la necessità di consolidare quanto iniziato, cercando stabilità, sicurezza materiale e un legame profondo con i sensi e la terra."], "Gemelli": ["Il Messaggero", "L'Esplorazione", "Simboleggia la curiosità intellettuale, il bisogno di comunicare, fare domande e raccogliere informazioni per comprendere l'ambiente circostante."], "Cancro": ["Il Protettore", "Il Rifugio", "Rappresenta le radici emotive, la memoria e la creazione di uno spazio sicuro dove nutrire se stessi e gli altri prima di affrontare le prove esterne."], "Leone": ["Il Sovrano", "La Prova del Coraggio", "Incarna l'espressione creativa del sé, la generosità del cuore e il desiderio di brillare dimostrando il proprio valore unico nel mondo."], "Vergine": ["L'Artigiano", "Il Servizio e il Perfezionamento", "Simboleggia l'analisi critica, l'umiltà e il lavoro quotidiano necessario per mettere ordine nel caos e rendersi utili alla comunità."], "Bilancia": ["Il Diplomatico", "L'Incontro con l'Altro", "Rappresenta la ricerca dell'armonia, della giustizia e del compromesso, insegnando all'eroe a relazionarsi alla pari con il prossimo."], "Scorpione": ["L'Alchimista", "La Morte e Rinascita", "Incarna la discesa negli abissi dell'anima, il confronto con le paure più profonde e il potere di trasformare le crisi in nuova forza vitale."], "Sagittario": ["Il Saggio", "La Ricerca di Senso", "Simboleggia l'espansione degli orizzonti, il viaggio filosofico e l'entusiasmo nel condividere una visione superiore della verità."], "Capricorno": ["Il Maestro", "La Vetta", "Rappresenta la responsabilità, la disciplina e la costruzione di strutture durature che lasciano un'eredità concreta nel mondo."], "Acquario": ["Il Visionario", "La Liberazione", "Incarna l'innovazione, l'amicizia universale e il coraggio di rompere gli schemi passati per guidare l'umanità verso il futuro."], "Pesci": ["Il Mistico", "Il Ritorno all'Uno", "Simboleggia la compassione infinita, l'empatia e la capacità di dissolvere i confini dell'ego per ricongiungersi con il tutto."]};
const ACTS = ['Atto I · La Partenza','Atto II · L\'Iniziazione','Atto III · Il Ritorno'];
const signOf = (d, m) => { for (let k = 0; k < 12; k++) { const [, sm, sd] = SIGNS[k]; if (m === sm && d >= sd) return k; } for (let k = 0; k < 12; k++) { const [, sm, sd] = SIGNS[k]; if (m === sm && d < sd) return (k + 11) % 12; } return 0; };
const form = document.querySelector('[data-sign]'), out = document.querySelector('[data-sign-out]'), wheel = document.querySelector('#segno .zwheel');
let turn = null;
if (form) {
  const today = new Date(); form.querySelector('#s-month').value = String(today.getMonth() + 1);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = +form.querySelector('#s-day').value, m = +form.querySelector('#s-month').value;
    const max = new Date(2024, m, 0).getDate();
    if (d > max) { out.innerHTML = `<p>Il mese scelto ha ${max} giorni: scegli un altro giorno.</p>`; return; }
    const k = signOf(d, m), name = SIGNS[k][0], [who, stage, text] = ARCH[name];
    let target = 165 - 30 * k + 90;
    if (turn !== null) { while (target - turn > 180) target -= 360; while (turn - target > 180) target += 360; }
    turn = target;
    wheel.style.setProperty('--needle', turn + 'deg'); wheel.classList.add('has-sign');
    wheel.querySelectorAll('.is-on').forEach(n => n.classList.remove('is-on'));
    wheel.querySelector('#zs' + k)?.classList.add('is-on'); wheel.querySelector('#zt' + k)?.classList.add('is-on');
    out.innerHTML = `<p class="arch-act">${ACTS[Math.floor(k / 4)]}</p><h3>${name} · ${who}</h3><p class="arch-stage">${stage}</p><p>${text}</p><a class="link" href="#contatti" data-prefill-tema>Chiedi il tuo Tema Natale</a>`;
    out.querySelector('[data-prefill-tema]').addEventListener('click', () => prefill('Tema Natale', '', `Vorrei il mio Tema Natale (segno: ${name}).`));
  });
}
