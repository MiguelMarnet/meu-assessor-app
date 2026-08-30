/* ============================================================
   ASSESSOR.IA — Tela cheia ANOTAÇÕES / NOTAS (adaptação Foccum, fase 5)
   Lista por pasta · editor c/ checkboxes · "/" tarefa · "@" hábito · "[" vínculo
   Cross-link REAL: "/" cria tarefa em r_tasks (aparece na Rotina); "@" em r_habitos.
   ============================================================ */
'use strict';
(function () {
  const css = `
  .nt-layout{display:grid;grid-template-columns:280px 1fr;gap:18px;margin-top:6px;min-height:60vh}
  .nt-side .tabs{display:flex;gap:6px;margin-bottom:12px}
  .nt-search{width:100%;padding:9px 13px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font-size:13px;outline:none;margin-bottom:12px}
  .nt-grp{font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);margin:14px 0 6px}
  .nt-item{width:100%;text-align:left;padding:11px 13px;border:1px solid transparent;border-radius:10px;background:none;color:var(--ink);cursor:pointer;transition:.18s;display:block}
  .nt-item:hover{background:var(--panel)}
  .nt-item.on{background:var(--panel);border-color:var(--line)}
  .nt-item .tt{font-size:13.5px;font-weight:500;display:flex;justify-content:space-between}
  .nt-item .tt small{font-family:var(--mono);font-size:9px;color:var(--ink-soft);font-weight:400}
  .nt-item .pv{font-size:11.5px;color:var(--ink-soft);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nt-editor{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:24px 26px;display:flex;flex-direction:column}
  .nt-editor .meta{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .nt-editor .meta .cx{border:1px solid var(--line);border-radius:14px;padding:4px 11px;cursor:pointer}
  .nt-editor h2{font-size:26px;font-weight:400;letter-spacing:-.02em;margin:14px 0 16px;outline:none}
  .nt-lines{flex:1}
  .nt-line{display:flex;align-items:flex-start;gap:10px;padding:5px 0;font-size:14.5px;line-height:1.5}
  .nt-line .bx{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--ink-soft);flex-shrink:0;margin-top:2px;display:grid;place-items:center;font-size:10px;cursor:pointer;background:none;color:var(--bg)}
  .nt-line.done .bx{background:var(--gold);border-color:var(--gold)}.nt-line.done .tx{text-decoration:line-through;color:var(--ink-soft)}
  .nt-line .tx{flex:1}
  .nt-line .sys{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:9px;border:1px solid var(--line);color:var(--ink-soft);align-self:center}
  .nt-line .del{background:none;border:none;color:var(--ink-soft);cursor:pointer;opacity:0;font-size:12px}
  .nt-line:hover .del{opacity:1}
  .nt-input-wrap{position:relative;margin-top:12px}
  .nt-input{width:100%;padding:11px 14px;border:1px dashed var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font-size:14px;outline:none;font-family:var(--sans)}
  .nt-input:focus{border-color:var(--gold)}
  .nt-hint{font-family:var(--mono);font-size:9.5px;color:var(--ink-soft);margin-top:6px}
  .nt-hint b{color:var(--gold)}
  .nt-pop{position:absolute;bottom:100%;left:0;margin-bottom:6px;background:var(--panel);border:1px solid var(--gold);border-radius:10px;padding:10px 12px;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.2);z-index:5}
  .nt-pop b{color:var(--gold)}
  .nt-toggles{display:flex;gap:8px;margin-top:16px}
  .nt-toggles .tg{font-family:var(--mono);font-size:10px;letter-spacing:.08em;padding:7px 13px;border:1px solid var(--line);border-radius:20px;color:var(--ink-soft)}
  .nt-links{margin-top:12px;font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .nt-links a{color:var(--gold);text-decoration:none;border:1px solid color-mix(in srgb,var(--gold) 40%,var(--line));padding:3px 9px;border-radius:12px;margin-left:6px}
  /* Colapsar a coluna não bastava: sem min-width:0 o item de grid
     não encolhe abaixo do conteúdo, e as abas em flex sem wrap
     seguravam a largura em 497px numa tela de 375px. */
  @media(max-width:900px){
    .nt-layout{grid-template-columns:1fr}
    .nt-layout>*{min-width:0}
    .nt-side .tabs{flex-wrap:wrap}
  }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const MM = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dataCurta = iso => { const p = iso.split('-'); return +p[2] + ' ' + MM[+p[1] - 1]; };

  function seed() {
    if (S().get('nt_notas')) return;
    const h = hojeISO();
    S().set('nt_notas', [
      { id: uid(), titulo: 'Lista de livros 2026', pasta: 'Pessoal', data: h, link: 'Ler 10 livros', linhas: [
        { t: 'Hábitos Atômicos — James Clear', check: 1, done: 1 }, { t: 'O Poder do Agora — Eckhart Tolle', check: 1, done: 1 },
        { t: 'Essencialismo — Greg McKeown', check: 1, done: 1 }, { t: 'Rápido e Devagar — Daniel Kahneman', check: 1, done: 0 },
        { t: 'Mindset — Carol Dweck', check: 1, done: 0 }] },
      { id: uid(), titulo: 'Projeto Mibee — roadmap', pasta: 'Trabalho', data: h, linhas: [{ t: 'Roadmap do trimestre. Prioridades pra fechar o e-commerce.', check: 0 }] },
      { id: uid(), titulo: 'Reunião semanal — 15/07', pasta: 'Trabalho', data: h, linhas: [{ t: 'Participantes: eu, Carla e o time. Definir metas da semana.', check: 0 }] },
      { id: uid(), titulo: 'Finanças — brainstorm', pasta: 'Ideias', data: h, linhas: [{ t: 'Anotações soltas sobre organização financeira e aportes.', check: 0 }] },
      { id: uid(), titulo: 'Inglês — expressões novas', pasta: 'Estudos', data: h, linhas: [{ t: 'Vocabulário: to get the hang of it, pegar o jeito.', check: 0 }] },
    ]);
  }

  const N = () => S().get('nt_notas', []);
  const setN = v => S().set('nt_notas', v);
  let ativa = null, tab = 'notas', el = null, fecharFn = null;

  function lista() {
    const notas = N();
    const q = (document.getElementById('nt_busca') || {}).value || '';
    const filt = notas.filter(n => !q || n.titulo.toLowerCase().includes(q.toLowerCase()));
    const pastas = {};
    filt.forEach(n => (pastas[n.pasta] = pastas[n.pasta] || []).push(n));
    if (tab === 'pastas') {
      return Object.keys(pastas).map(p => `<button class="nt-item ${false ? 'on' : ''}" data-pasta="${p}"><div class="tt">📁 ${p} <small>${pastas[p].length}</small></div></button>`).join('');
    }
    return Object.keys(pastas).map(p => `<div class="nt-grp">${p} · ${pastas[p].length}</div>` + pastas[p].map(n => `<button class="nt-item ${ativa === n.id ? 'on' : ''}" data-nota="${n.id}"><div class="tt">${esc(n.titulo)}<small>${dataCurta(n.data)}</small></div><div class="pv">${(n.linhas[0] ? n.linhas[0].t : '—').replace(/<[^>]+>/g, '')}</div></button>`).join('')).join('');
  }

  function editor() {
    const n = N().find(x => x.id === ativa);
    if (!n) return `<div class="nt-editor" style="place-content:center;text-align:center;color:var(--ink-soft)">Selecione uma nota, ou crie uma nova.</div>`;
    return `<div class="nt-editor">
      <div class="meta"><span>${n.pasta} · Editada agora · <span style="color:#607452">Salva</span></span><span class="cx clickable">🔗 Conexões ${n.link ? 1 : 0}</span></div>
      <h2 contenteditable="true" id="nt_titulo">${esc(n.titulo)}</h2>
      <div class="nt-lines">${n.linhas.map((l, i) => `<div class="nt-line ${l.done ? 'done' : ''}" data-i="${i}">
        ${l.check ? `<button class="bx clickable" data-check="${i}">${l.done ? '✓' : ''}</button>` : '<span style="width:18px"></span>'}
        <span class="tx">${esc(l.t)}</span>${l.sys ? `<span class="sys">${esc(l.sys)}</span>` : ''}<button class="del clickable" data-delline="${i}">✕</button></div>`).join('')}</div>
      <div class="nt-input-wrap"><div class="nt-pop" id="nt_pop" style="display:none"></div>
        <input class="nt-input" id="nt_in" placeholder="Escreva… ou digite / tarefa · @ hábito · [ vincular"></div>
      <div class="nt-hint">Comandos: <b>/</b> cria tarefa no sistema · <b>@</b> cria hábito · <b>[</b> vincula a uma meta</div>
      <div class="nt-toggles"><span class="tg">[ ] Nota</span><span class="tg">☑ Tarefa</span><span class="tg">↻ Hábito</span></div>
      ${n.link ? `<div class="nt-links">Links <a href="#" onclick="return false">🔗 ${n.link}</a></div>` : ''}
    </div>`;
  }

  function render() {
    if (!el) return;
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#C07868">◦ MÓDULO 04 · ANOTAÇÕES</span>
        <button class="ms-close clickable" id="nt_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Anotações</h1>
      <p class="ms-sub">Diário, ideias e listas — e o pulo do gato: um item da nota vira tarefa ou hábito do sistema num toque.</p>
      <div class="nt-layout">
        <div class="nt-side">
          <div class="tabs"><button class="msbtn ${tab === 'notas' ? 'primary' : ''} clickable" data-t="notas">Notas</button><button class="msbtn ${tab === 'pastas' ? 'primary' : ''} clickable" data-t="pastas">Pastas</button><button class="msbtn clickable" id="nt_nova" style="margin-left:auto">+ Nova</button></div>
          <input class="nt-search" id="nt_busca" placeholder="Buscar notas…">
          <div id="nt_lista">${lista()}</div>
        </div>
        <div id="nt_edit">${editor()}</div>
      </div></div>`;
    bind();
  }

  function bind() {
    document.getElementById('nt_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    el.querySelectorAll('[data-nota]').forEach(b => b.onclick = () => { ativa = b.dataset.nota; render(); });
    document.getElementById('nt_nova').onclick = () => {
      const n = { id: uid(), titulo: 'Nova nota', pasta: 'Pessoal', data: hojeISO(), linhas: [] };
      const ns = N(); ns.unshift(n); setN(ns); ativa = n.id; render();
    };
    const busca = document.getElementById('nt_busca'); if (busca) busca.oninput = () => { document.getElementById('nt_lista').innerHTML = lista(); el.querySelectorAll('[data-nota]').forEach(b => b.onclick = () => { ativa = b.dataset.nota; render(); }); };
    const tit = document.getElementById('nt_titulo'); if (tit) tit.onblur = () => { const ns = N(); const n = ns.find(x => x.id === ativa); if (n) { n.titulo = tit.textContent.trim() || 'Sem título'; setN(ns); } };
    el.querySelectorAll('[data-check]').forEach(b => b.onclick = () => {
      const ns = N(); const n = ns.find(x => x.id === ativa); const l = n.linhas[+b.dataset.check]; l.done = l.done ? 0 : 1; setN(ns);
      if (l.done) B().emit('task_done', { nota: n.titulo, item: l.t }, 1);
      render();
    });
    el.querySelectorAll('[data-delline]').forEach(b => b.onclick = () => { const ns = N(); const n = ns.find(x => x.id === ativa); n.linhas.splice(+b.dataset.delline, 1); setN(ns); render(); });
    const inp = document.getElementById('nt_in'), pop = document.getElementById('nt_pop');
    if (inp) {
      inp.oninput = () => {
        const v = inp.value;
        if (v.startsWith('/') && v.length > 1) { pop.style.display = ''; pop.innerHTML = `+ Criar tarefa: <b>"${v.slice(1)}"</b> — Para hoje (Enter)`; }
        else if (v.startsWith('@') && v.length > 1) { pop.style.display = ''; pop.innerHTML = `↻ Criar hábito: <b>"${v.slice(1)}"</b> — diário (Enter)`; }
        else if (v.startsWith('[') && v.length > 1) { pop.style.display = ''; pop.innerHTML = `🔗 Vincular à meta: <b>"${v.slice(1)}"</b> (Enter)`; }
        else pop.style.display = 'none';
      };
      inp.onkeydown = e => {
        if (e.key !== 'Enter') return;
        const v = inp.value.trim(); if (!v) return;
        const ns = N(); const n = ns.find(x => x.id === ativa);
        if (v.startsWith('/')) { // vira tarefa no sistema (Rotina)
          const t = v.slice(1).trim();
          const tasks = S().get('r_tasks', []); tasks.push({ id: 'nt' + uid(), t: t[0].toUpperCase() + t.slice(1), lista: 'Pessoal', dia: hojeISO(), hora: '', urg: 0, imp: 0, per: 'Dia', st: 'afazer', feita: 0 });
          S().set('r_tasks', tasks);
          n.linhas.push({ t: t[0].toUpperCase() + t.slice(1), check: 1, done: 0, sys: '☑ tarefa' });
          window.toast('☑ virou tarefa na Rotina ✔');
        } else if (v.startsWith('@')) { // vira hábito
          const t = v.slice(1).trim();
          const habs = S().get('r_habitos', []); habs.push({ id: 'nh' + uid(), nome: t[0].toUpperCase() + t.slice(1), hr: '', dias: 'todo', hist: {} });
          S().set('r_habitos', habs);
          n.linhas.push({ t: t[0].toUpperCase() + t.slice(1), check: 0, sys: '↻ hábito' });
          window.toast('↻ virou hábito ✔');
        } else if (v.startsWith('[')) { // vincula a meta
          n.link = v.slice(1).trim(); window.toast('🔗 vinculado à meta ✔');
        } else {
          n.linhas.push({ t: v, check: 0 });
        }
        setN(ns); inp.value = ''; pop.style.display = 'none'; render();
        setTimeout(() => { const i = document.getElementById('nt_in'); if (i) i.focus(); }, 30);
      };
    }
    el.querySelectorAll('[data-pasta]').forEach(b => b.onclick = () => { tab = 'notas'; render(); });
  }

  window.Screens = window.Screens || {};
  window.Screens.anotacoes = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; if (!ativa) ativa = N()[0] && N()[0].id; render(); } };
})();
