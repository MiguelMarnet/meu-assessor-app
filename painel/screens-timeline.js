/* ============================================================
   ASSESSOR.IA — Tela cheia LINHA DO TEMPO (fase 9)
   Marcos por área da vida, com o PORQUÊ guardado + marcos automáticos
   ============================================================ */
'use strict';
(function () {
  const css = `
  .tl-filtros{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
  .tl-filtros button{font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:6px 12px;border-radius:16px;border:1px solid var(--line);background:none;color:var(--ink-soft);display:flex;align-items:center;gap:6px}
  .tl-filtros button.on{border-color:var(--fc,var(--gold));color:var(--ink)}
  .tl-filtros button i{width:7px;height:7px;border-radius:50%;background:var(--fc,var(--ink-soft))}
  .tl-wrap{position:relative;padding-left:8px}
  .tl-line{position:absolute;left:70px;top:8px;bottom:8px;width:2px;background:var(--line)}
  .tl-mes{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);margin:20px 0 10px 92px}
  .tl-item{display:flex;gap:0;align-items:flex-start;position:relative;margin-bottom:4px}
  .tl-item .dt{width:62px;text-align:right;font-family:var(--mono);flex-shrink:0;padding-top:11px}
  .tl-item .dt b{font-size:16px}.tl-item .dt span{display:block;font-size:8px;color:var(--ink-soft)}
  .tl-item .no{width:18px;display:flex;justify-content:center;flex-shrink:0;padding-top:13px;z-index:2}
  .tl-item .no i{width:13px;height:13px;border-radius:50%;background:var(--panel);border:2.5px solid var(--ac);transition:.2s}
  .tl-item.auto .no i{border-style:dashed}
  .tl-card{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:13px 15px;margin:6px 0 6px 10px;transition:.2s}
  .tl-card:hover{border-color:color-mix(in srgb,var(--ac) 55%,var(--line))}
  .tl-card .tt{font-size:14.5px;font-weight:500}
  .tl-card .ar{font-family:var(--mono);font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ac);margin-top:3px}
  .tl-card .pq{font-size:12.5px;color:var(--ink-soft);margin-top:8px;line-height:1.45;border-left:2px solid var(--line);padding-left:10px;font-style:italic}
  .tl-card .autotag{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);float:right}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const AREAS = { Corpo: '#607452', Mente: '#C07868', Capital: '#c2913a', Relações: '#8087B5', Propósito: '#9C7FB3', Foco: '#d07a3c' };
  const cor = a => AREAS[a] || '#8a8';
  const MM = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MC = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function seed() {
    if (S().get('tl_marcos')) return;
    const y = new Date().getFullYear();
    S().set('tl_marcos', [
      { id: uid(), data: `${y}-01-08`, tt: 'Comecei a academia de novo', ar: 'Corpo', pq: 'Depois de 2 anos parado, decidi que a saúde vem antes de tudo. É a base de todo o resto.', auto: 0 },
      { id: uid(), data: `${y}-02-14`, tt: 'Primeira venda dos planners', ar: 'Capital', pq: 'A prova de que a EMF pode virar negócio de verdade, não só hobby.', auto: 0 },
      { id: uid(), data: `${y}-03-22`, tt: 'Terminei "Hábitos Atômicos"', ar: 'Mente', pq: 'Mudou como eu penso sobre consistência — 1% melhor por dia.', auto: 1 },
      { id: uid(), data: `${y}-05-03`, tt: 'Reserva chegou a R$ 10 mil', ar: 'Capital', pq: 'Primeira vez na vida com uma reserva de verdade. Dá pra respirar.', auto: 1 },
      { id: uid(), data: `${y}-06-18`, tt: 'Destravei conversação em inglês', ar: 'Propósito', pq: 'Consegui manter 20 min de papo sem travar. Anos de vergonha ficando pra trás.', auto: 0 },
      { id: uid(), data: `${y}-07-10`, tt: '30 dias de meditação seguidos', ar: 'Mente', pq: 'A cabeça mais quieta mudou minha paciência com todo mundo ao redor.', auto: 1 },
    ]);
  }

  let filtro = 'todos', el = null, fecharFn = null;

  function novoMarco() {
    window.Modal.open(`<h3>📍 Registrar marco</h3><p class="msub">O que aconteceu — e por que importa. O porquê fica guardado.</p>
      <label class="f">O que aconteceu?</label><input type="text" id="tm_t" placeholder="ex.: Assinei o primeiro cliente">
      <label class="f">Área da vida</label><select id="tm_a">${Object.keys(AREAS).map(a => `<option>${a}</option>`).join('')}</select>
      <label class="f">Por que importa?</label><input type="text" id="tm_p" placeholder="o porquê que você vai querer lembrar">
      <label class="f">Quando</label><input type="date" id="tm_d" value="${hojeISO()}">
      <div class="mactions"><button class="btn2 clickable" id="tm_c">Cancelar</button><button class="btn2 primary clickable" id="tm_s">Guardar marco</button></div>`);
    document.getElementById('tm_c').onclick = window.Modal.close;
    document.getElementById('tm_s').onclick = () => {
      const t = document.getElementById('tm_t').value.trim(); if (!t) { window.toast('O que aconteceu? 🙂'); return; }
      const ms = S().get('tl_marcos', []); ms.push({ id: uid(), data: document.getElementById('tm_d').value, tt: t, ar: document.getElementById('tm_a').value, pq: document.getElementById('tm_p').value, auto: 0 });
      S().set('tl_marcos', ms); window.Bus.emit('milestone', { tt: t }, 1); window.Modal.close(); render(); window.toast('📍 Marco guardado ✔');
    };
  }

  function render() {
    if (!el) return;
    let marcos = S().get('tl_marcos', []).slice().sort((a, b) => b.data.localeCompare(a.data));
    if (filtro !== 'todos') marcos = marcos.filter(m => m.ar === filtro);
    let out = '', mesAtual = '';
    marcos.forEach(m => {
      const d = new Date(m.data + 'T12:00:00'); const mesK = MM[d.getMonth()] + ' ' + d.getFullYear();
      if (mesK !== mesAtual) { mesAtual = mesK; out += `<div class="tl-mes">${mesK}</div>`; }
      out += `<div class="tl-item ${m.auto ? 'auto' : ''}" style="--ac:${cor(m.ar)}">
        <div class="dt"><b>${d.getDate()}</b><span>${MC[d.getMonth()]}</span></div>
        <div class="no"><i></i></div>
        <div class="tl-card">${m.auto ? '<span class="autotag">● automático</span>' : ''}<div class="tt">${m.tt}</div><div class="ar">${m.ar}</div>${m.pq ? `<div class="pq">"${m.pq}"</div>` : ''}</div></div>`;
    });
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#8087B5">◦ MÓDULO 07 · LINHA DO TEMPO</span><button class="ms-close clickable" id="tl_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Linha do Tempo</h1>
      <p class="ms-sub">A sua evolução, marco a marco — com o porquê guardado. Alguns marcos o assessor cria sozinho, quando você bate uma meta.</p>
      <div class="ms-tabs" style="margin-bottom:8px"><span></span><button class="msbtn primary clickable" id="tl_novo" style="margin-left:auto">+ Novo marco</button></div>
      <div class="tl-filtros">
        <button class="${filtro === 'todos' ? 'on' : ''}" data-f="todos" style="--fc:var(--gold)"><i></i>Todas as áreas</button>
        ${Object.keys(AREAS).map(a => `<button class="${filtro === a ? 'on' : ''}" data-f="${a}" style="--fc:${cor(a)}"><i></i>${a}</button>`).join('')}
      </div>
      <div class="tl-wrap"><div class="tl-line"></div>${out || '<div class="fempty">Nenhum marco nessa área ainda.</div>'}</div></div>`;
    document.getElementById('tl_close').onclick = () => fecharFn && fecharFn();
    document.getElementById('tl_novo').onclick = novoMarco;
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; render(); });
  }
  window.Screens = window.Screens || {};
  window.Screens.timeline = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; filtro = 'todos'; render(); } };
})();
