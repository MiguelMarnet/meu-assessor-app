/* ============================================================
   ASSESSOR.IA — Telas cheias dos módulos (adaptação Foccum)
   Fase 1: ROTINA (Listas · Semana · Kanban · Eisenhower · Hábitos)
   Depende de window.Store/Bus/Modal/toast (index.html).
   ============================================================ */
'use strict';

(function () {

  /* ---------- CSS próprio das telas ---------- */
  const css = `
  .sc-layout{display:grid;grid-template-columns:210px 1fr 250px;gap:18px;margin-top:8px}
  .sc-side .cnt2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .sc-count{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel);cursor:pointer;transition:.2s;text-align:left}
  .sc-count.on,.sc-count:hover{border-color:var(--gold)}
  .sc-count .n{font-family:var(--mono);font-size:19px;font-weight:700}
  .sc-count .l{font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft)}
  .sc-count.wide{grid-column:1/3;display:flex;justify-content:space-between;align-items:center}
  .sc-h{font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft);margin:18px 0 8px}
  .sc-lista{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:9px 12px;border:1px solid transparent;border-radius:9px;font-size:13px;color:var(--ink);transition:.2s;background:none}
  .sc-lista:hover{background:var(--panel)}
  .sc-lista.on{border-color:var(--line);background:var(--panel)}
  .sc-lista i{width:8px;height:8px;border-radius:50%;background:var(--lc)}
  .sc-lista .c{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .sc-grupo{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);margin:16px 0 8px}
  .sc-task{display:flex;gap:12px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:8px;transition:.2s;cursor:grab}
  .sc-task:hover{border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}
  .sc-task.feita{opacity:.55}.sc-task.feita .t{text-decoration:line-through}
  .sc-task.drag{opacity:.4}
  .sc-check{width:19px;height:19px;border-radius:50%;border:1.6px solid var(--ink-soft);flex-shrink:0;margin-top:1px;display:grid;place-items:center;font-size:11px;color:var(--bg);transition:.2s;cursor:pointer;background:none}
  .sc-task.feita .sc-check{background:var(--gold);border-color:var(--gold)}
  .sc-task .t{font-size:14px;font-weight:500}
  .sc-task .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}
  .sc-tag{font-family:var(--mono);font-size:9px;letter-spacing:.06em;padding:2px 8px;border-radius:10px;border:1px solid var(--line);color:var(--ink-soft)}
  .sc-tag.urg{color:#A2402A;border-color:#A2402A55}
  .sc-tag.imp{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 45%,transparent)}
  .sc-task .hora{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:var(--ink-soft);white-space:nowrap}
  .sc-add{width:100%;text-align:left;border:1px dashed var(--line);border-radius:10px;padding:11px 14px;color:var(--ink-soft);font-size:13px;background:none;transition:.2s}
  .sc-add:hover{border-color:var(--gold);color:var(--ink)}
  .sc-conta{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-top:1px solid var(--line);font-size:12.5px}
  .sc-conta.venc{color:#A2402A}
  .sc-conta b{font-family:var(--mono);font-size:12px}
  .sc-hab{padding:10px 0;border-top:1px solid var(--line)}
  .sc-hab .top{display:flex;align-items:center;gap:8px;font-size:13px}
  .sc-hab .top .hr{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .sc-hab .seq{font-family:var(--mono);font-size:9px;color:var(--ink-soft)}
  .sc-hab .bars{display:flex;gap:3px;margin-top:6px}
  .sc-hab .bars i{height:4px;flex:1;border-radius:2px;background:var(--line)}
  .sc-hab .bars i.ok{background:var(--gold)}
  .sc-hab .hcheck{width:17px;height:17px;border-radius:50%;border:1.5px solid var(--ink-soft);display:grid;place-items:center;font-size:9px;cursor:pointer;background:none;color:var(--bg)}
  .sc-hab.done .hcheck{background:var(--gold);border-color:var(--gold)}
  .sc-hab.done .top .nm{text-decoration:line-through;opacity:.6}
  .sc-nl{position:sticky;bottom:14px;margin-top:22px;display:flex;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:6px 6px 6px 18px;box-shadow:0 10px 34px rgba(0,0,0,.16)}
  .sc-nl input{flex:1;background:none;border:none;outline:none;font-size:14px;color:var(--ink);font-family:var(--sans)}
  .sc-nl input::placeholder{color:var(--ink-soft);font-style:italic}
  .sc-nl button{width:34px;height:34px;border-radius:50%;background:var(--ink);color:var(--bg);border:none;font-size:14px}
  .sc-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:10px}
  .sc-col{background:color-mix(in srgb,var(--panel) 70%,transparent);border:1px solid var(--line);border-radius:12px;padding:12px;min-height:280px;display:flex;flex-direction:column}
  .sc-col.dropover{border-color:var(--gold)}
  .sc-col .ch{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
  .sc-col .ch .d{font-size:13.5px;font-weight:600}
  .sc-col .ch .d small{font-family:var(--mono);font-size:9px;color:var(--gold);margin-left:6px}
  .sc-col .ch .n{font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .sc-col .ft{margin-top:auto;padding-top:10px;font-family:var(--mono);font-size:9px;letter-spacing:.1em;color:var(--ink-soft);display:flex;justify-content:space-between}
  .sc-eis{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
  .sc-quad{border:1px solid var(--line);border-radius:12px;padding:14px;min-height:190px;background:color-mix(in srgb,var(--panel) 70%,transparent)}
  .sc-quad .qh{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
  .sc-quad.q1 .qh{color:#A2402A}.sc-quad.q2 .qh{color:var(--gold)}.sc-quad.q3 .qh{color:#6D8FA7}.sc-quad.q4 .qh{color:var(--ink-soft)}
  .sc-habgrid{margin-top:10px;overflow-x:auto}
  .sc-habgrid table{border-collapse:collapse;min-width:760px}
  .sc-habgrid th{font-family:var(--mono);font-size:8.5px;color:var(--ink-soft);font-weight:400;padding:3px 2px;text-align:center}
  .sc-habgrid th.sem{border-bottom:1px solid var(--line);letter-spacing:.12em}
  .sc-habgrid td{padding:5px 2px;text-align:center}
  .sc-habgrid td.nome{text-align:left;font-size:12.5px;padding-right:14px;white-space:nowrap}
  .sc-dot{width:15px;height:15px;border-radius:50%;border:1.4px solid var(--line);background:none;cursor:pointer;transition:.15s;display:inline-block}
  .sc-dot.ok{background:var(--gold);border-color:var(--gold)}
  .sc-dot.hoje{box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 35%,transparent)}
  .sc-dot:hover{transform:scale(1.2)}
  .sc-wsem{display:flex;gap:14px;margin:6px 0 2px}
  .sc-wsem .w{font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .sc-wsem .w b{color:var(--ink)}
  @media(max-width:900px){.sc-layout{grid-template-columns:1fr}.sc-cols{grid-template-columns:1fr 1fr}.sc-eis{grid-template-columns:1fr}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const stAg = document.createElement('style'); stAg.textContent = `
  .ag-sub{display:flex;align-items:center;gap:6px;margin:6px 0 12px}
  .ag-sub button{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:6px 12px;border-radius:16px;border:1px solid var(--line);background:none;color:var(--ink-soft)}
  .ag-sub button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .ag-grid{display:grid;grid-template-columns:52px repeat(7,1fr);border:1px solid var(--line);border-radius:12px;overflow:auto;background:var(--panel);max-height:60vh}
  .ag-hrs .ag-hr{font-family:var(--mono);font-size:9px;color:var(--ink-soft);text-align:right;padding:2px 6px 0 0;border-top:1px solid var(--line)}
  .ag-colh{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);padding:9px 6px;text-align:center;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--panel);z-index:2}
  .ag-colh.on{color:var(--gold)}.ag-colh small{display:block;font-size:12px;color:var(--ink)}
  .ag-col{border-left:1px solid var(--line);min-width:88px}
  .ag-slots{position:relative}
  .ag-slots::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(var(--panel) 0 41px,var(--line) 41px 42px)}
  .ag-col.dropover .ag-slots{background:color-mix(in srgb,var(--gold) 8%,transparent)}
  .ag-block{position:absolute;left:3px;right:3px;background:color-mix(in srgb,var(--bc) 22%,var(--panel));border-left:3px solid var(--bc);border-radius:6px;padding:4px 6px;overflow:hidden;cursor:grab;font-size:10.5px;line-height:1.2}
  .ag-block b{font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-block span{font-family:var(--mono);font-size:8px;color:var(--ink-soft)}
  .ag-block.drag{opacity:.4}
  .ag-month{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)}
  .ag-mhead{display:grid;grid-template-columns:repeat(7,1fr)}.ag-mhead span{font-family:var(--mono);font-size:9px;text-transform:uppercase;color:var(--ink-soft);text-align:center;padding:8px 0;border-bottom:1px solid var(--line)}
  .ag-mgrid{display:grid;grid-template-columns:repeat(7,1fr)}
  .ag-mcell{min-height:92px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:5px}
  .ag-mcell.empty{background:color-mix(in srgb,var(--ink) 3%,transparent)}
  .ag-mcell .dn{font-family:var(--mono);font-size:10px;color:var(--ink-soft)}
  .ag-mcell.hoje .dn{background:var(--gold);color:#171008;border-radius:50%;padding:1px 5px}
  .ag-chip{font-size:8.5px;padding:2px 5px;border-radius:5px;margin-top:3px;background:color-mix(in srgb,var(--bc) 22%,var(--panel));border-left:2px solid var(--bc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-more{font-family:var(--mono);font-size:8px;color:var(--ink-soft);margin-top:2px}
  `; document.head.appendChild(stAg);

  /* ---------- helpers ---------- */
  const S = () => window.Store, B = () => window.Bus;
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const pad = n => String(n).padStart(2, '0');
  const DIAS_N = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  const DIAS_C = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  /* ---------- seeds (demo adaptada ao Miguel) ---------- */
  function seed() {
    if (S().get('r_tasks')) return;
    const h = hojeISO();
    S().set('r_listas', ['Trabalho', 'Pessoal', 'Casa', 'Saúde']);
    S().set('r_tasks', [
      { id: 't1', t: 'Planejar a semana da EMF', lista: 'Trabalho', dia: h, hora: '06:30–07:45', urg: 1, imp: 1, per: 'Manhã', st: 'afazer', feita: 0 },
      { id: 't2', t: 'Pagar o boleto da luz', lista: 'Casa', dia: h, hora: '07:30–09:15', urg: 1, imp: 0, per: 'Manhã', st: 'afazer', feita: 0 },
      { id: 't3', t: 'Responder clientes do planner', lista: 'Trabalho', dia: h, hora: '14:00–15:00', urg: 0, imp: 1, per: 'Tarde', st: 'andamento', feita: 0 },
      { id: 't4', t: 'Aula de inglês', lista: 'Pessoal', dia: h, hora: '09:45–10:45', urg: 0, imp: 0, per: 'Manhã', st: 'feito', feita: 1 },
      { id: 't5', t: 'Marcar consulta de rotina', lista: 'Saúde', dia: addDias(h, 1), hora: '', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
      { id: 't6', t: 'Comprar pão', lista: 'Pessoal', dia: addDias(h, 1), hora: '09:00', urg: 0, imp: 0, per: '', st: 'afazer', feita: 0 },
      { id: 't7', t: 'Gravar conteúdo da Mibee', lista: 'Trabalho', dia: addDias(h, 2), hora: '09:00–11:00', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
      { id: 't8', t: 'Entregar trabalho da faculdade', lista: 'Pessoal', dia: addDias(h, 3), hora: '23:59', urg: 1, imp: 1, per: '', st: 'afazer', feita: 0 },
      { id: 't9', t: 'Revisar precificação dos planners', lista: 'Trabalho', dia: null, hora: '', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
    ]);
    S().set('r_habitos', [
      { id: 'h1', nome: 'Correr 5km', hr: '06:00', dias: [2, 4, 6], hist: marca([0, 2, 3, 5, 6]) },
      { id: 'h2', nome: 'Meditar 10 minutos', hr: '07:00', dias: 'todo', hist: marca([1, 2, 4, 5, 8, 9, 10]) },
      { id: 'h3', nome: 'Ler 20 páginas', hr: '22:30', dias: 'todo', hist: marca([0, 1, 2, 3, 4, 5, 6, 7]) },
      { id: 'h4', nome: 'Beber 2L de água', hr: '', dias: 'todo', hist: marca([1, 3, 4, 6, 8]) },
    ]);
    S().set('r_contas', [
      { id: 'c1', d: 'Fatura Nubank', v: 423.63, venc: addDias(h, -17), pago: 0 },
      { id: 'c2', d: 'Celular Claro', v: 69.99, venc: addDias(h, 2), pago: 0 },
    ]);
    function marca(diasAtras) { const o = {}; diasAtras.forEach(n => o[addDias(h, -n)] = 1); return o; }
  }

  /* ---------- estado ---------- */
  let tab = 'listas', filtro = 'hoje', lista = null, el = null, fecharFn = null;

  const T = () => S().get('r_tasks', []);
  const setT = v => S().set('r_tasks', v);
  const H = () => S().get('r_habitos', []);
  const setH = v => S().set('r_habitos', v);

  function contadores() {
    const h = hojeISO(), t = T();
    return {
      hoje: t.filter(x => x.dia === h && !x.feita).length,
      prog: t.filter(x => x.dia && x.dia > h && !x.feita).length,
      inbox: t.filter(x => !x.dia && !x.feita).length,
      atras: t.filter(x => x.dia && x.dia < h && !x.feita).length,
      todas: t.length
    };
  }
  function filtrar() {
    const h = hojeISO(); let t = T();
    if (lista) t = t.filter(x => x.lista === lista);
    else if (filtro === 'hoje') t = t.filter(x => x.dia === h);
    else if (filtro === 'prog') t = t.filter(x => x.dia && x.dia > h);
    else if (filtro === 'inbox') t = t.filter(x => !x.dia);
    else if (filtro === 'atras') t = t.filter(x => x.dia && x.dia < h && !x.feita);
    return t;
  }

  /* ---------- parser de linguagem natural ---------- */
  function parseNL(txt) {
    let t = txt.trim(); if (!t) return null;
    const h = hojeISO();
    const tarefa = { id: 'n' + Date.now(), t: '', lista: 'Pessoal', dia: h, hora: '', urg: 0, imp: 0, per: '', st: 'afazer', feita: 0 };
    const dSem = { domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6 };
    if (/\bamanh[ãa]\b/i.test(t)) { tarefa.dia = addDias(h, 1); t = t.replace(/\bamanh[ãa]\b/i, ''); }
    else if (/\bhoje\b/i.test(t)) { t = t.replace(/\bhoje\b/i, ''); }
    else {
      for (const k in dSem) {
        const re = new RegExp('\\b' + k + '\\b', 'i');
        if (re.test(t)) { const alvo = dSem[k]; const dnow = new Date().getDay(); tarefa.dia = addDias(h, ((alvo - dnow) + 7) % 7 || 7); t = t.replace(re, ''); break; }
      }
    }
    const mh = t.match(/\b(\d{1,2})h(\d{2})?\b/);
    if (mh) { tarefa.hora = pad(+mh[1]) + ':' + (mh[2] || '00'); t = t.replace(mh[0], ''); }
    if (/\btodo dia\b/i.test(t)) { // vira hábito
      t = t.replace(/\btodo dia\b/i, '').trim();
      const hs = H(); hs.push({ id: 'h' + Date.now(), nome: t[0] ? t[0].toUpperCase() + t.slice(1) : 'Novo hábito', hr: tarefa.hora, dias: 'todo', hist: {} });
      setH(hs); return { habito: true, nome: t };
    }
    tarefa.t = t.replace(/\s+/g, ' ').trim();
    if (!tarefa.t) return null;
    tarefa.t = tarefa.t[0].toUpperCase() + tarefa.t.slice(1);
    const hNum = tarefa.hora ? +tarefa.hora.slice(0, 2) : 12;
    tarefa.per = hNum < 12 ? 'Manhã' : hNum < 18 ? 'Tarde' : 'Noite';
    return { tarefa };
  }

  /* ---------- ações ---------- */
  function toggleTask(id) {
    const t = T(); const x = t.find(y => y.id === id); if (!x) return;
    x.feita = x.feita ? 0 : 1; x.st = x.feita ? 'feito' : 'afazer';
    setT(t); if (x.feita) B().emit('task_done', { tarefa: x.t }, 1);
    render(); window.toast(x.feita ? '✓ ' + x.t : 'Reaberta: ' + x.t);
  }
  function toggleHabito(id, iso) {
    const hs = H(); const hb = hs.find(x => x.id === id); if (!hb) return;
    iso = iso || hojeISO();
    if (hb.hist[iso]) delete hb.hist[iso]; else { hb.hist[iso] = 1; B().emit('task_done', { habito: hb.nome }, 1); }
    setH(hs); render(); if (hb.hist[iso]) window.toast('✓ Hábito concluído');
  }
  function editTask(id) {
    const t = T(); const x = t.find(y => y.id === id); if (!x) return;
    const listas = S().get('r_listas', []);
    window.Modal.open(`<h3>${x.id ? 'Editar tarefa' : 'Nova tarefa'}</h3>
      <label class="f">Título</label><input type="text" id="et_t" value="${x.t.replace(/"/g, '&quot;')}">
      <label class="f">Lista</label><select id="et_l">${listas.map(l => `<option${l === x.lista ? ' selected' : ''}>${l}</option>`).join('')}</select>
      <label class="f">Dia (vazio = inbox)</label><input type="date" id="et_d" value="${x.dia || ''}">
      <label class="f">Hora</label><input type="text" id="et_h" value="${x.hora}" placeholder="06:30–07:45">
      <div class="mactions" style="flex-wrap:wrap">
        <button class="btn2 clickable" id="et_urg" style="${x.urg ? 'border-color:#A2402A;color:#A2402A' : ''}">🔥 Urgente</button>
        <button class="btn2 clickable" id="et_imp" style="${x.imp ? 'border-color:var(--gold);color:var(--gold)' : ''}">⭐ Importante</button>
        <button class="btn2 clickable" id="et_del">🗑</button>
      </div>
      <div class="mactions"><button class="btn2 clickable" id="et_cancel">Cancelar</button><button class="btn2 primary clickable" id="et_save">Salvar</button></div>`);
    let urg = x.urg, imp = x.imp;
    document.getElementById('et_urg').onclick = e => { urg = urg ? 0 : 1; e.target.style.cssText = urg ? 'border-color:#A2402A;color:#A2402A' : ''; };
    document.getElementById('et_imp').onclick = e => { imp = imp ? 0 : 1; e.target.style.cssText = imp ? 'border-color:var(--gold);color:var(--gold)' : ''; };
    document.getElementById('et_del').onclick = () => { setT(T().filter(y => y.id !== id)); window.Modal.close(); render(); window.toast('Tarefa removida'); };
    document.getElementById('et_cancel').onclick = window.Modal.close;
    document.getElementById('et_save').onclick = () => {
      x.t = document.getElementById('et_t').value || x.t;
      x.lista = document.getElementById('et_l').value;
      x.dia = document.getElementById('et_d').value || null;
      x.hora = document.getElementById('et_h').value;
      x.urg = urg; x.imp = imp;
      setT(t); window.Modal.close(); render(); window.toast('Tarefa salva ✔');
    };
  }
  function novaTask(dia) {
    const t = T();
    const x = { id: 'n' + Date.now(), t: 'Nova tarefa', lista: 'Pessoal', dia: dia || hojeISO(), hora: '', urg: 0, imp: 0, per: '', st: 'afazer', feita: 0 };
    t.push(x); setT(t); editTask(x.id);
  }

  /* ---------- componentes ---------- */
  function taskHTML(x, drag) {
    return `<div class="sc-task${x.feita ? ' feita' : ''}" data-id="${x.id}" ${drag ? 'draggable="true"' : ''}>
      <button class="sc-check clickable" data-tg="${x.id}">${x.feita ? '✓' : ''}</button>
      <div style="flex:1;min-width:0">
        <div class="t">${x.t}</div>
        <div class="meta">
          ${x.urg ? '<span class="sc-tag urg">🔥 urgente</span>' : ''}
          ${x.imp ? '<span class="sc-tag imp">⭐ importante</span>' : ''}
          <span class="sc-tag">${x.lista}</span>
        </div>
      </div>
      ${x.hora ? `<span class="hora">🕐 ${x.hora}</span>` : ''}
    </div>`;
  }
  function barsSemana(hb) {
    const h = hojeISO();
    let out = '';
    for (let i = 6; i >= 0; i--) out += `<i class="${hb.hist[addDias(h, -i)] ? 'ok' : ''}"></i>`;
    return `<div class="bars">${out}</div>`;
  }
  function streak(hb) {
    let n = 0, h = hojeISO();
    for (let i = 0; i < 60; i++) { if (hb.hist[addDias(h, -i)]) n++; else if (i > 0) break; }
    return n;
  }

  /* ---------- vistas ---------- */
  function vListas() {
    const c = contadores();
    const listas = S().get('r_listas', []);
    const ts = filtrar();
    const grupos = {};
    ts.filter(x => !x.feita).forEach(x => { const g = x.per || (x.dia ? 'Dia' : 'Inbox'); (grupos[g] = grupos[g] || []).push(x); });
    const feitas = ts.filter(x => x.feita);
    const contas = S().get('r_contas', []).filter(x => !x.pago);
    const totalC = contas.reduce((a, x) => a + x.v, 0);
    const hs = H(); const hFeitos = hs.filter(hb => hb.hist[hojeISO()]).length;

    return `<div class="sc-layout">
      <div class="sc-side">
        <div class="cnt2">
          <button class="sc-count clickable${filtro === 'hoje' && !lista ? ' on' : ''}" data-f="hoje"><div class="n">${c.hoje}</div><div class="l">Hoje</div></button>
          <button class="sc-count clickable${filtro === 'prog' && !lista ? ' on' : ''}" data-f="prog"><div class="n">${c.prog}</div><div class="l">Programadas</div></button>
          <button class="sc-count clickable${filtro === 'inbox' && !lista ? ' on' : ''}" data-f="inbox"><div class="n">${c.inbox}</div><div class="l">Inbox</div></button>
          <button class="sc-count clickable${filtro === 'atras' && !lista ? ' on' : ''}" data-f="atras"><div class="n">${c.atras}</div><div class="l">Atrasadas</div></button>
          <button class="sc-count wide clickable${filtro === 'todas' && !lista ? ' on' : ''}" data-f="todas"><span class="l">Todas</span><span class="n" style="font-size:14px">${c.todas}</span></button>
        </div>
        <div class="sc-h">Minhas listas</div>
        ${listas.map((l, i) => `<button class="sc-lista clickable${lista === l ? ' on' : ''}" data-lista="${l}" style="--lc:${['#6D8FA7', '#C07868', '#d07a3c', '#607452'][i % 4]}"><i></i>${l}<span class="c">${T().filter(x => x.lista === l).length}</span></button>`).join('')}
      </div>
      <div>
        ${Object.keys(grupos).map(g => `<div class="sc-grupo">${g} · ${grupos[g].length}</div>` + grupos[g].map(x => taskHTML(x)).join('')).join('')}
        <button class="sc-add clickable" id="sc_add">＋ Adicionar tarefa</button>
        ${feitas.length ? `<div class="sc-grupo">Concluídas · ${feitas.length}</div>` + feitas.map(x => taskHTML(x)).join('') : ''}
      </div>
      <div>
        <div class="sc-h" style="margin-top:0;display:flex;justify-content:space-between">Contas a pagar <b style="color:var(--ink)">${window.brl(totalC)}</b></div>
        ${contas.map(x => `<div class="sc-conta${x.venc < hojeISO() ? ' venc' : ''}"><span>${x.d}<br><small style="font-family:var(--mono);font-size:9px">${x.venc < hojeISO() ? 'VENCEU' : 'vence'} ${x.venc.slice(8, 10)}/${x.venc.slice(5, 7)}</small></span><b>${window.brl(x.v)}</b></div>`).join('')}
        <div class="sc-h" style="display:flex;justify-content:space-between">Hábitos <b style="color:var(--ink)">${hFeitos} de ${hs.length}</b></div>
        ${hs.map(hb => { const done = hb.hist[hojeISO()]; return `<div class="sc-hab${done ? ' done' : ''}">
          <div class="top"><button class="hcheck clickable" data-hb="${hb.id}">${done ? '✓' : ''}</button><span class="nm">${hb.nome}</span><span class="hr">${hb.hr}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="seq">🔥 ${streak(hb)} dias</span></div>
          ${barsSemana(hb)}</div>`; }).join('')}
      </div>
    </div>
    <div class="sc-nl"><input id="sc_nl" placeholder='captura rápida… "reunião sexta 14h" · "comprar pão amanhã 9h" · "meditar todo dia 7h"'><button class="clickable" id="sc_nlgo">↑</button></div>`;
  }

  function vSemana() {
    const h = hojeISO();
    const cols = [0, 1, 2, 3].map(n => {
      const dia = addDias(h, n);
      const dt = new Date(dia + 'T12:00:00');
      const ts = T().filter(x => x.dia === dia);
      const hs = H().filter(hb => hb.dias === 'todo' || hb.dias.includes(dt.getDay()));
      const contas = S().get('r_contas', []).filter(x => !x.pago && (x.venc === dia || (n === 0 && x.venc < h)));
      const feitas = ts.filter(x => x.feita).length + hs.filter(hb => hb.hist[dia]).length;
      const restam = ts.length + hs.length - feitas;
      return `<div class="sc-col" data-dia="${dia}">
        <div class="ch"><span class="d">${DIAS_C[dt.getDay()]}<small>${n === 0 ? 'HOJE' : ''}</small></span><span class="n">${dia.slice(8, 10)}/${dia.slice(5, 7)}</span></div>
        ${contas.map(x => `<div class="sc-conta${x.venc < h ? ' venc' : ''}" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:8px"><span>${x.d}</span><b>${window.brl(x.v)}</b></div>`).join('')}
        ${ts.map(x => taskHTML(x, true)).join('')}
        ${hs.map(hb => { const done = hb.hist[dia]; return `<div class="sc-hab${done ? ' done' : ''}" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div class="top"><button class="hcheck clickable" data-hb="${hb.id}" data-dia="${dia}">${done ? '✓' : ''}</button><span class="nm" style="font-size:12.5px">${hb.nome}</span><span class="hr">${hb.hr}</span></div></div>`; }).join('')}
        <button class="sc-add clickable" data-add-dia="${dia}" style="padding:8px 10px;font-size:12px">＋ Adicionar</button>
        <div class="ft"><span>${feitas} feitas</span><span>${restam} restam</span></div>
      </div>`;
    }).join('');
    return `<div class="sc-cols">${cols}</div>
    <div class="sc-nl"><input id="sc_nl" placeholder='arraste tarefas entre os dias · ou capture: "estudar quinta 18h"'><button class="clickable" id="sc_nlgo">↑</button></div>`;
  }

  function vKanban() {
    const cols = [['afazer', 'A fazer'], ['andamento', 'Em andamento'], ['feito', 'Concluído']];
    return `<div class="sc-cols" style="grid-template-columns:repeat(3,1fr)">` + cols.map(([k, nome]) => {
      const ts = T().filter(x => (x.st || 'afazer') === k);
      return `<div class="sc-col" data-st="${k}">
        <div class="ch"><span class="d">${nome}</span><span class="n">${ts.length}</span></div>
        ${ts.length ? ts.map(x => taskHTML(x, true)).join('') : '<div style="text-align:center;color:var(--ink-soft);font-size:12px;padding:20px 0">Vazio</div>'}
        <div class="ft"><span></span><span></span></div>
      </div>`;
    }).join('') + `</div>`;
  }

  function vEis() {
    const q = [
      ['q1', 'Urgente e importante — faça agora', x => x.urg && x.imp],
      ['q2', 'Importante, não urgente — agende', x => !x.urg && x.imp],
      ['q3', 'Urgente, não importante — delegue/simplifique', x => x.urg && !x.imp],
      ['q4', 'Nem urgente nem importante — questione', x => !x.urg && !x.imp],
    ];
    return `<div class="sc-eis">` + q.map(([cls, titulo, f]) => {
      const ts = T().filter(x => !x.feita && f(x));
      return `<div class="sc-quad ${cls}"><div class="qh">${titulo} · ${ts.length}</div>${ts.map(x => taskHTML(x)).join('') || '<div style="color:var(--ink-soft);font-size:12px">—</div>'}</div>`;
    }).join('') + `</div>`;
  }

  function vHabitos() {
    const h = hojeISO();
    const ano = +h.slice(0, 4), mes = +h.slice(5, 7);
    const nDias = new Date(ano, mes, 0).getDate();
    const hs = H();
    /* % por semana (S1..S5) */
    const sems = [[1, 7], [8, 14], [15, 21], [22, 28], [29, nDias]];
    const wstats = sems.map(([a, b]) => {
      let tot = 0, ok = 0;
      hs.forEach(hb => { for (let d = a; d <= b; d++) {
        const iso = `${ano}-${pad(mes)}-${pad(d)}`;
        if (iso > h) continue;
        const dt = new Date(iso + 'T12:00:00');
        if (hb.dias === 'todo' || hb.dias.includes(dt.getDay())) { tot++; if (hb.hist[iso]) ok++; }
      } });
      return tot ? `<span class="w"><b>${ok}/${tot}</b> ${Math.round(ok / tot * 100)}%</span>` : `<span class="w">—</span>`;
    }).join('');
    let head1 = '', head2 = '';
    sems.forEach(([a, b], i) => { head1 += `<th class="sem" colspan="${b - a + 1}">S${i + 1}</th>`; });
    for (let d = 1; d <= nDias; d++) head2 += `<th>${d}</th>`;
    const rows = hs.map(hb => {
      let tds = '';
      for (let d = 1; d <= nDias; d++) {
        const iso = `${ano}-${pad(mes)}-${pad(d)}`;
        tds += `<td><button class="sc-dot clickable ${hb.hist[iso] ? 'ok' : ''} ${iso === h ? 'hoje' : ''}" data-hb="${hb.id}" data-dia="${iso}" ${iso > h ? 'disabled style="opacity:.25;cursor:default"' : ''}></button></td>`;
      }
      return `<tr><td class="nome">● ${hb.nome} <small style="color:var(--ink-soft);font-family:var(--mono);font-size:9px">🔥${streak(hb)}d</small></td>${tds}</tr>`;
    }).join('');
    return `<div class="sc-wsem">Semanas: ${wstats}</div>
      <div class="sc-habgrid"><table>
        <tr><th></th>${head1}</tr><tr><th style="text-align:left;letter-spacing:.12em">HÁBITO</th>${head2}</tr>${rows}
      </table></div>
      <button class="sc-add clickable" id="sc_novohab" style="margin-top:16px;max-width:300px">＋ Novo hábito</button>`;
  }

  /* ---------- render principal ---------- */
  /* ---------- AGENDA (calendário Semana/Mês, blocos arrastáveis) ---------- */
  let agendaView = 'semana';
  const LISTA_COR = { Trabalho: '#6D8FA7', Pessoal: '#C07868', Casa: '#d07a3c', Saúde: '#607452' };
  function parseHora(h) { if (!h) return null; const m = h.match(/(\d{1,2}):(\d{2})/g); if (!m) return null; const [sh, sm] = m[0].split(':').map(Number); let start = sh + sm / 60, end = start + 1; if (m[1]) { const [eh, em] = m[1].split(':').map(Number); end = eh + em / 60; } return { start, end: Math.max(end, start + 0.5) }; }
  function vAgenda() {
    const h = hojeISO();
    if (agendaView === 'mes') return vAgendaMes(h);
    const H0 = 5, H1 = 23, rowH = 42;
    const dias = [0, 1, 2, 3, 4, 5, 6].map(n => addDias(h, n));
    let horas = ''; for (let hr = H0; hr <= H1; hr++) horas += `<div class="ag-hr" style="height:${rowH}px">${pad(hr)}:00</div>`;
    const cols = dias.map(dia => {
      const dt = new Date(dia + 'T12:00:00');
      const blocos = T().filter(x => x.dia === dia && parseHora(x.hora)).map(x => {
        const p = parseHora(x.hora), top = (p.start - H0) * rowH, hgt = Math.max((p.end - p.start) * rowH - 3, 22);
        return `<div class="ag-block" draggable="true" data-id="${x.id}" style="top:${top}px;height:${hgt}px;--bc:${LISTA_COR[x.lista] || '#8a8'}"><b>${x.t}</b><span>${x.hora}</span></div>`;
      }).join('');
      return `<div class="ag-col" data-dia="${dia}"><div class="ag-colh${dia === h ? ' on' : ''}">${DIAS_C[dt.getDay()]}<small>${dia.slice(8)}</small></div><div class="ag-slots" style="height:${(H1 - H0 + 1) * rowH}px">${blocos}</div></div>`;
    }).join('');
    return `<div class="ag-sub">${['semana', 'mes'].map(v => `<button class="${agendaView === v ? 'on' : ''}" data-av="${v}">${v === 'semana' ? 'Semana' : 'Mês'}</button>`).join('')}<span style="margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-soft)">arraste os blocos entre os dias</span></div>
      <div class="ag-grid"><div class="ag-hrs"><div class="ag-colh" style="visibility:hidden">.</div>${horas}</div>${cols}</div>`;
  }
  function vAgendaMes(h) {
    const ano = +h.slice(0, 4), mes = +h.slice(5, 7);
    const first = new Date(ano, mes - 1, 1), startDow = first.getDay(), nDias = new Date(ano, mes, 0).getDate();
    let cells = '';
    for (let i = 0; i < startDow; i++) cells += '<div class="ag-mcell empty"></div>';
    for (let d = 1; d <= nDias; d++) {
      const iso = `${ano}-${pad(mes)}-${pad(d)}`;
      const ts = T().filter(x => x.dia === iso);
      cells += `<div class="ag-mcell${iso === h ? ' hoje' : ''}"><span class="dn">${d}</span>${ts.slice(0, 3).map(x => `<div class="ag-chip" style="--bc:${LISTA_COR[x.lista] || '#8a8'}">${x.t}</div>`).join('')}${ts.length > 3 ? `<div class="ag-more">+${ts.length - 3}</div>` : ''}</div>`;
    }
    return `<div class="ag-sub">${['semana', 'mes'].map(v => `<button class="${agendaView === v ? 'on' : ''}" data-av="${v}">${v === 'semana' ? 'Semana' : 'Mês'}</button>`).join('')}<span style="margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--ink-soft)">${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mes - 1]} ${ano}</span></div>
      <div class="ag-month"><div class="ag-mhead">${DIAS_C.map(d => `<span>${d}</span>`).join('')}</div><div class="ag-mgrid">${cells}</div></div>`;
  }

  const TABS = [['listas', 'Listas'], ['semana', 'Semana'], ['agenda', 'Agenda'], ['kanban', 'Kanban'], ['eis', 'Eisenhower'], ['habitos', 'Hábitos']];
  function render() {
    if (!el) return;
    const hoje = new Date();
    const body = tab === 'listas' ? vListas() : tab === 'semana' ? vSemana() : tab === 'agenda' ? vAgenda() : tab === 'kanban' ? vKanban() : tab === 'eis' ? vEis() : vHabitos();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#9A8A4A">◦ MÓDULO 01 · ROTINA</span>
        <button class="ms-close clickable" id="sc_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Rotina</h1>
      <p class="ms-sub">${DIAS_N[hoje.getDay()][0].toUpperCase() + DIAS_N[hoje.getDay()].slice(1)}, ${hoje.getDate()} · o seu dia em blocos — registre aqui ou mande no WhatsApp.</p>
      ${window.__briefingHTML ? '<div class="bf bf-mod">' + window.__briefingHTML + '</div>' : ''}
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    bind();
  }

  function bind() {
    document.getElementById('sc_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filtro = b.dataset.f; lista = null; render(); });
    el.querySelectorAll('[data-lista]').forEach(b => b.onclick = () => { lista = lista === b.dataset.lista ? null : b.dataset.lista; render(); });
    el.querySelectorAll('[data-tg]').forEach(b => b.onclick = e => { e.stopPropagation(); toggleTask(b.dataset.tg); });
    el.querySelectorAll('[data-hb]').forEach(b => b.onclick = e => { e.stopPropagation(); toggleHabito(b.dataset.hb, b.dataset.dia); });
    el.querySelectorAll('.sc-task').forEach(t => {
      t.addEventListener('click', () => editTask(t.dataset.id));
      t.addEventListener('dragstart', e => { t.classList.add('drag'); e.dataTransfer.setData('text', t.dataset.id); });
      t.addEventListener('dragend', () => t.classList.remove('drag'));
    });
    el.querySelectorAll('.sc-col').forEach(c => {
      c.addEventListener('dragover', e => { e.preventDefault(); c.classList.add('dropover'); });
      c.addEventListener('dragleave', () => c.classList.remove('dropover'));
      c.addEventListener('drop', e => {
        e.preventDefault(); c.classList.remove('dropover');
        const id = e.dataTransfer.getData('text');
        const t = T(); const x = t.find(y => y.id === id); if (!x) return;
        if (c.dataset.dia) { x.dia = c.dataset.dia; window.toast('✓ Movida para ' + c.dataset.dia.slice(8, 10) + '/' + c.dataset.dia.slice(5, 7)); }
        if (c.dataset.st) { x.st = c.dataset.st; x.feita = c.dataset.st === 'feito' ? 1 : 0; if (x.feita) B().emit('task_done', { tarefa: x.t }, 1); window.toast('✓ Movida'); }
        setT(t); render();
      });
    });
    // AGENDA: subtabs + blocos arrastáveis + clique p/ editar
    el.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { agendaView = b.dataset.av; render(); });
    el.querySelectorAll('.ag-block').forEach(b => {
      b.addEventListener('click', () => editTask(b.dataset.id));
      b.addEventListener('dragstart', e => { b.classList.add('drag'); e.dataTransfer.setData('text', b.dataset.id); });
      b.addEventListener('dragend', () => b.classList.remove('drag'));
    });
    el.querySelectorAll('.ag-col').forEach(c => {
      c.addEventListener('dragover', e => { e.preventDefault(); c.classList.add('dropover'); });
      c.addEventListener('dragleave', () => c.classList.remove('dropover'));
      c.addEventListener('drop', e => {
        e.preventDefault(); c.classList.remove('dropover');
        const id = e.dataTransfer.getData('text'); const t = T(); const x = t.find(y => y.id === id);
        if (x && c.dataset.dia) { x.dia = c.dataset.dia; setT(t); window.toast('✓ Movida para ' + c.dataset.dia.slice(8, 10) + '/' + c.dataset.dia.slice(5, 7)); render(); }
      });
    });
    const add = document.getElementById('sc_add'); if (add) add.onclick = () => novaTask();
    el.querySelectorAll('[data-add-dia]').forEach(b => b.onclick = () => novaTask(b.dataset.addDia));
    const nh = document.getElementById('sc_novohab'); if (nh) nh.onclick = () => {
      window.Modal.open(`<h3>Novo hábito</h3>
        <label class="f">Nome</label><input type="text" id="nh_n" placeholder="ex.: Meditar 10 minutos">
        <label class="f">Hora (opcional)</label><input type="text" id="nh_h" placeholder="07:00">
        <div class="mactions"><button class="btn2 clickable" id="nh_c">Cancelar</button><button class="btn2 primary clickable" id="nh_s">Criar</button></div>`);
      document.getElementById('nh_c').onclick = window.Modal.close;
      document.getElementById('nh_s').onclick = () => {
        const n = document.getElementById('nh_n').value.trim(); if (!n) { window.toast('Dá um nome pro hábito 🙂'); return; }
        const hs = H(); hs.push({ id: 'h' + Date.now(), nome: n, hr: document.getElementById('nh_h').value, dias: 'todo', hist: {} });
        setH(hs); window.Modal.close(); render(); window.toast('Hábito criado ✔');
      };
    };
    const nl = document.getElementById('sc_nl');
    if (nl) {
      const go = () => {
        const r = parseNL(nl.value); if (!r) return;
        if (r.habito) { window.toast('↻ entendi: hábito diário criado'); }
        else { const t = T(); t.push(r.tarefa); setT(t); B().emit('task_done', {}, 0); window.toast(`✓ entendi: "${r.tarefa.t}" — ${r.tarefa.dia === hojeISO() ? 'hoje' : r.tarefa.dia.slice(8, 10) + '/' + r.tarefa.dia.slice(5, 7)}${r.tarefa.hora ? ' às ' + r.tarefa.hora : ''}`); }
        nl.value = ''; render();
      };
      document.getElementById('sc_nlgo').onclick = go;
      nl.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    }
  }

  /* ---------- registro ---------- */
  window.Screens = window.Screens || {};
  window.Screens.rotina = {
    render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'listas'; filtro = 'hoje'; lista = null; render(); }
  };
})();
