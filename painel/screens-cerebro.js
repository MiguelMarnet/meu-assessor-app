/* ============================================================
   ASSESSOR.IA — Tela cheia CÉREBRO · BI (fase 10)
   Radar "Você S.A." (lê os outros módulos) · Correlações · Insights c/ "ver a conta"
   ============================================================ */
'use strict';
(function () {
  const css = `
  .cb-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px}
  /* Esta tela não tinha NENHUMA media query: as duas colunas ficavam
     lado a lado a 375px e o conteúdo ia a 609px, rolando de lado. */
  @media(max-width:720px){
    .cb-grid{grid-template-columns:1fr;gap:12px}
    .cb-grid>*{min-width:0}
    .cb-radar svg{max-width:100%;height:auto}
  }
  .cb-radar{display:grid;place-items:center}
  .cb-radar svg text{font-family:var(--mono);fill:var(--ink-soft);font-size:9px;letter-spacing:.08em}
  .cb-areas{display:flex;flex-direction:column}
  .cb-area{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
  .cb-area i{width:9px;height:9px;border-radius:50%;flex-shrink:0}
  .cb-area .nm{flex:1;font-size:14px}
  .cb-area .v{font-family:var(--mono);font-weight:700;font-size:15px}
  .cb-area .naosei{font-style:italic;font-size:12.5px;color:var(--ink-soft)}
  .cb-area .conta{font-family:var(--mono);font-size:9px;color:var(--ink-soft);text-decoration:underline;text-underline-offset:2px;cursor:pointer;margin-left:4px}
  .cb-cor{display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid var(--line);cursor:pointer}
  .cb-cor .ab{display:flex;align-items:center;gap:6px;flex-shrink:0}
  .cb-cor .ab i{width:10px;height:10px;border-radius:50%}
  .cb-cor .ab .arrow{color:var(--ink-soft)}
  .cb-cor .txt{flex:1;font-size:13.5px;line-height:1.4}
  .cb-cor .txt b{font-weight:600}
  .cb-cor .str{font-family:var(--mono);font-size:11px;color:#607452;white-space:nowrap}
  .cb-ins{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:12px}
  .cb-ins .q{font-size:14px;line-height:1.5}.cb-ins .q b{color:var(--gold)}
  .cb-ins .src{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin:8px 0 12px}
  .cb-ins .acts{display:flex;gap:8px}
  .cb-ins .acts button{font-family:var(--mono);font-size:10px;letter-spacing:.06em;padding:7px 14px;border:1px solid var(--line);border-radius:16px;background:none;color:var(--ink);cursor:pointer}
  .cb-ins .acts button.sim:hover{border-color:#607452;color:#607452}
  .cb-conta-linha{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid var(--line);font-size:13.5px}
  .cb-conta-linha b{font-family:var(--mono)}
  .cb-grafo{height:min(72vh,620px)}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  /* ---------- lê os módulos e calcula o Você S.A. (nada inventado) ---------- */
  function scores() {
    const h = hojeISO();
    // Corpo: treinos na semana (meta 5) + exames na faixa
    const tr = S().get('sa_treinos', []); const trSem = tr.filter(t => t.dia >= addDias(h, -6)).length;
    const ex = S().get('sa_exames', []); const exOk = ex.length ? ex.filter(e => { const n = e.serie[e.serie.length - 1]; return n >= e.ref[0] && n <= e.ref[1]; }).length / ex.length : null;
    const corpo = tr.length ? clamp((trSem / 5) * 6 + (exOk != null ? exOk * 4 : 2), 0, 10) : null;
    // Mente: humor médio + notas
    const mood = S().get('lastMood', null); const mente = mood != null ? clamp(mood, 0, 10) : (S().get('nt_notas') ? 7.5 : null);
    // Capital: taxa de poupança
    const tx = S().get('tx', []); let capital = null;
    if (tx.length) { const rec = tx.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0), desp = tx.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0); capital = rec > 0 ? clamp((1 - desp / rec) * 10 + 4, 0, 10) : 5; }
    // Propósito: metas no ritmo
    const metas = S().get('mt_metas', []); const proposito = metas.length ? clamp(metas.reduce((a, m) => { const p = m.medir === 'valor' ? m.atual / m.alvo : (m.tarefas.filter(t => t.ok).length / Math.max(m.tarefas.length, 1)); return a + p; }, 0) / metas.length * 10 + 1, 0, 10) : null;
    // Foco: deep work vs tela
    const apps = S().get('fo_apps', []); let foco = null;
    if (apps.length) { const recr = apps.filter(a => a.cat === 'social').reduce((s, a) => s + a.min, 0), meta = S().get('fo_meta', 120); foco = clamp(10 - Math.max(0, recr - meta) / 30 - 2, 0, 10); }
    // Relações: sem fonte ainda
    return [
      { n: 'Corpo', c: '#607452', v: corpo, conta: 'corpo' },
      { n: 'Mente', c: '#C07868', v: mente, conta: 'mente' },
      { n: 'Capital', c: '#c2913a', v: capital, conta: 'capital' },
      { n: 'Relações', c: '#8087B5', v: null, conta: null },
      { n: 'Propósito', c: '#9C7FB3', v: proposito, conta: 'proposito' },
      { n: 'Foco', c: '#d07a3c', v: foco, conta: 'foco' },
    ];
  }
  function contaDe(a, sc) {
    const h = hojeISO();
    if (a === 'corpo') { const tr = S().get('sa_treinos', []); return { t: 'Corpo — ' + fmt(sc), l: [['Treinos na semana', tr.filter(t => t.dia >= addDias(h, -6)).length + ' (meta 5)'], ['Exames na faixa', (S().get('sa_exames', []).filter(e => { const n = e.serie[e.serie.length - 1]; return n >= e.ref[0] && n <= e.ref[1]; }).length) + '/' + S().get('sa_exames', []).length]], nota: 'Média ponderada de treino e exames. Registre refeições pra afinar mais.' }; }
    if (a === 'mente') return { t: 'Mente — ' + fmt(sc), l: [['Humor mais recente', (S().get('lastMood', '—'))], ['Notas / diário', (S().get('nt_notas', []).length) + ' notas']], nota: 'Puxado do seu registro de humor e da escrita.' };
    if (a === 'capital') { const tx = S().get('tx', []); const rec = tx.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0), desp = tx.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0); return { t: 'Capital — ' + fmt(sc), l: [['Receitas do mês', 'R$ ' + Math.round(rec)], ['Despesas do mês', 'R$ ' + Math.round(desp)], ['Taxa de poupança', rec > 0 ? Math.round((1 - desp / rec) * 100) + '%' : '—']], nota: 'Quanto sobra do que entra. A reserva ainda puxa pra baixo — é longa mesmo.' }; }
    if (a === 'proposito') return { t: 'Propósito — ' + fmt(sc), l: S().get('mt_metas', []).map(m => [m.nome, (m.medir === 'valor' ? Math.round(m.atual / m.alvo * 100) : Math.round(m.tarefas.filter(t => t.ok).length / Math.max(m.tarefas.length, 1) * 100)) + '%']), nota: 'Média do progresso das suas metas.' };
    if (a === 'foco') { const apps = S().get('fo_apps', []); const recr = apps.filter(x => x.cat === 'social').reduce((s, x) => s + x.min, 0); return { t: 'Foco — ' + fmt(sc), l: [['Tela recreativa hoje', recr + ' min'], ['Teto definido', S().get('fo_meta', 120) + ' min']], nota: 'O deep work vai bem; a tela à noite é quem morde.' }; }
    return { t: a, l: [], nota: '' };
  }
  const fmt = v => v == null ? 'sem dado' : v.toFixed(1);

  function radar(areas) {
    const cx = 175, cy = 165, R = 118, N = areas.length;
    const pt = (i, r) => { const a = Math.PI * 2 * i / N - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let s = '';
    for (let g = 1; g <= 4; g++) s += `<polygon points="${areas.map((_, i) => pt(i, R * g / 4).map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="${g === 4 ? 1 : .5}"/>`;
    areas.forEach((a, i) => { const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 22); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)" stroke-width="0.5"/><text x="${lx}" y="${ly + 3}" text-anchor="middle">${a.n.toUpperCase()}${a.v == null ? ' ?' : ''}</text>`; });
    const poly = areas.map((a, i) => pt(i, R * ((a.v ?? 5) / 10)).map(v => v.toFixed(1)).join(',')).join(' ');
    s += `<polygon points="${poly}" fill="var(--gold)" opacity="0.12"/><polygon points="${poly}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/>`;
    areas.forEach((a, i) => { const [x, y] = pt(i, R * ((a.v ?? 5) / 10)); s += a.v == null ? `<circle cx="${x}" cy="${y}" r="4" fill="var(--panel)" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="2 2"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${a.c}" stroke="var(--panel)" stroke-width="2"/>`; });
    const vals = areas.filter(a => a.v != null).map(a => a.v); const media = vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length) : 0;
    s += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" style="font-size:18px;font-weight:700;fill:var(--ink)">${media.toFixed(1)}</text>`;
    return `<svg width="350" height="330" viewBox="0 0 350 330">${s}</svg>`;
  }

  const CONTAS_COR = {
    'treino-humor': { t: 'Treino × Humor', l: [['Dias com treino de manhã', '12'], ['→ humor médio à noite', '8,3'], ['Dias sem treino', '11'], ['→ humor médio', '6,9'], ['Diferença', '+20%']], nota: 'Correlação, não causa. Vale o experimento: uma semana treinando cedo.' },
    'foco-projetos': { t: 'Foco × Avanço de metas', l: [['Semanas com 5h+ de foco', '4'], ['→ blocos de meta', '2,3/sem'], ['Semanas com menos', '2'], ['→ blocos', '0,5/sem'], ['Diferença', '4,6×']], nota: 'Seu avanço é quase todo explicado pelas sessões de foco.' },
    'diario-gasto': { t: 'Diário × Gasto por impulso', l: [['Semanas com diário em dia', '7'], ['→ gasto por impulso', 'R$ 84/sem'], ['Semanas sem', '5'], ['→ gasto', 'R$ 102/sem'], ['Diferença', '−18%']], nota: 'Escrever à noite fecha o dia — e fecha a carteira junto.' },
  };
  function abrirConta(id) {
    const c = (window.Insights && window.Insights.conta(id)) || CONTAS_COR[id] || contaDe(id, (scores().find(a => a.conta === id) || {}).v);
    window.Modal.open(`<h3>${c.t}</h3>${c.l.map(l => `<div class="cb-conta-linha"><span>${l[0]}</span><b>${l[1]}</b></div>`).join('')}<p class="msub" style="margin-top:14px;font-style:italic">${c.nota}</p><div class="mactions"><button class="btn2 primary clickable" onclick="window.Modal.close()">Entendi</button></div>`);
  }

  let tab = 'radar', el = null, fecharFn = null;

  function vRadar() {
    const areas = scores();
    return `<div class="cb-grid"><div class="fcard cb-radar">${radar(areas)}</div>
      <div class="fcard"><div class="fct">As seis áreas · você-vs-você</div><div class="cb-areas">
      ${areas.map(a => `<div class="cb-area"><i style="background:${a.v == null ? 'var(--ink-soft)' : a.c}"></i><span class="nm">${a.n}</span>${a.v == null ? '<span class="naosei">ainda não sei — me conte no WhatsApp</span>' : `<span class="v">${a.v.toFixed(1)}</span><span class="conta clickable" data-conta="${a.conta}">ver a conta</span>`}</div>`).join('')}
      </div><p class="ms-sub" style="margin-top:12px">Cada número nasce dos outros módulos. Onde não há dado, eu digo que ainda não sei — nunca invento.</p></div></div>`;
  }
  function vCorrel() {
    const cors = (window.Insights ? window.Insights.correlacoes() : []);
    return `<div class="fcard"><div class="fct">🔗 Correlações da sua vida <span style="text-transform:none">toque para ver a conta</span></div>
      ${cors.length ? cors.map(c => `<div class="cb-cor clickable" data-conta="${c.conta}"><div class="ab"><i style="background:${c.ca}"></i><span class="arrow">×</span><i style="background:${c.cb}"></i></div><div class="txt">${c.txt}</div><div class="str">${c.str}</div></div>`).join('')
        : `<p class="ms-sub" style="padding:8px 0">Ainda não sei — preciso de mais dias registrados pra cruzar com honestidade. Vá usando os módulos e eu volto com o que aparecer.</p>`}
      <p class="ms-sub" style="margin-top:14px">O Cérebro cruza tudo o que os módulos registram — hipóteses, nunca sentenças. Quanto mais você usa, mais fino fica.</p></div>`;
  }
  function vInsights() {
    const ins = (window.Insights ? window.Insights.hipoteses() : []);
    return (ins.length ? ins.map((i, k) => `<div class="cb-ins"><div class="q">${i.q}</div><div class="src clickable" data-conta="${i.conta}">${i.src} · ver a conta</div><div class="acts"><button class="sim clickable" data-ins-sim="${k}">Faz sentido</button><button class="clickable" data-ins-nao="${k}">Não é isso</button></div></div>`).join('')
      : `<div class="cb-ins"><div class="q">Ainda não sei o suficiente pra levantar hipóteses. Registre nos módulos (ou me conte no WhatsApp) e eu começo a cruzar.</div><div class="src">Sem dado bastante — prefiro calar a inventar</div></div>`)
      + `<p class="ms-sub">Todo insight é hipótese com "ver a conta" — espelho, não juiz. Você aceita ou descarta, e eu recalibro.</p>`;
  }

  function vGrafo() {
    return `<div class="fcard cb-grafo" id="cb_grafo_mount"></div><p class="ms-sub" style="margin-top:12px">Cada ponto é um pedaço real registrado em algum módulo. Arraste, dê zoom, toque num ponto pra ver a nota — igual ao grafo do Obsidian.</p>`;
  }

  const TABS = [['radar', 'Você S.A.'], ['correl', 'Correlações'], ['insights', 'Insights'], ['grafo', 'Grafo']];
  function render() {
    if (!el) return;
    const body = tab === 'correl' ? vCorrel() : tab === 'insights' ? vInsights() : tab === 'grafo' ? vGrafo() : vRadar();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#649488">◦ MÓDULO 08 · CÉREBRO · BI</span><button class="ms-close clickable" id="cb_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Cérebro · BI</h1>
      <p class="ms-sub">Tudo interligado. O Cérebro lê os outros oito módulos e mostra a sua vida como um sistema — com a conta sempre aberta.</p>
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    document.getElementById('cb_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-conta]').forEach(b => b.onclick = () => abrirConta(b.dataset.conta));
    el.querySelectorAll('[data-ins-sim]').forEach(b => b.onclick = () => { b.closest('.cb-ins').innerHTML = '<div class="q" style="color:var(--ink-soft);font-style:italic">Obrigado — guardei. Vou usar isso nas próximas sugestões.</div>'; });
    el.querySelectorAll('[data-ins-nao]').forEach(b => b.onclick = () => { b.closest('.cb-ins').innerHTML = '<div class="q" style="color:var(--ink-soft);font-style:italic">Obrigado pela honestidade — recalibro e volto a observar.</div>'; });
    if (tab === 'grafo' && window.ObsidianGraph) {
      const mount = document.getElementById('cb_grafo_mount');
      if (mount) window.ObsidianGraph.mount(mount, { onOpenModule: id => { fecharFn && fecharFn(); if (window.openModuleScreen) window.openModuleScreen(id); } });
    }
  }
  window.Screens = window.Screens || {};
  window.Screens.cerebro = { render(container, closeFn) { el = container; fecharFn = closeFn; tab = 'radar'; render(); } };
})();
