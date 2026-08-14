/* ============================================================
   ASSESSOR.IA — Tela cheia ESPIRITUAL (fase 11, opt-in)
   Práticas + sequência · Reflexões · Intenção da semana
   ============================================================ */
'use strict';
(function () {
  const css = `
  .es-intencao{background:linear-gradient(135deg,color-mix(in srgb,#a08ec9 16%,var(--panel)),var(--panel));border:1px solid color-mix(in srgb,#a08ec9 40%,var(--line));border-radius:14px;padding:22px;text-align:center;margin-bottom:16px}
  .es-intencao .lbl{font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#a08ec9}
  .es-intencao .txt{font-family:var(--serif,Georgia,serif);font-size:22px;font-style:italic;margin:10px 0;line-height:1.35}
  .es-intencao button{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:16px;padding:7px 14px;background:none;color:var(--ink);cursor:pointer}
  .es-prat{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--line)}
  .es-prat .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--bg);border:1px solid var(--line);font-size:16px}
  .es-prat .nm{flex:1}.es-prat .nm b{font-size:14px;font-weight:500}.es-prat .nm span{display:block;font-family:var(--mono);font-size:9.5px;color:var(--ink-soft)}
  .es-prat .seq{font-family:var(--mono);font-size:11px;color:#a08ec9;margin-right:6px}
  .es-check{width:26px;height:26px;border-radius:50%;border:1.6px solid var(--ink-soft);display:grid;place-items:center;font-size:13px;cursor:pointer;background:none;color:var(--bg);transition:.2s}
  .es-prat.done .es-check{background:#a08ec9;border-color:#a08ec9}
  .es-prat.done .nm b{opacity:.6}
  .es-week{display:flex;gap:4px;margin-top:6px}
  .es-week i{width:12px;height:12px;border-radius:50%;border:1px solid var(--line)}
  .es-week i.on{background:#a08ec9;border-color:#a08ec9}
  .es-refl{padding:14px 0;border-top:1px solid var(--line)}
  .es-refl .dt{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
  .es-refl .tx{font-family:var(--serif,Georgia,serif);font-size:15px;font-style:italic;line-height:1.5;margin-top:6px}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  function seed() {
    if (S().get('es_praticas')) return;
    const h = hojeISO(); const mk = arr => { const o = {}; arr.forEach(n => o[addDias(h, -n)] = 1); return o; };
    S().set('es_praticas', [
      { id: uid(), nome: 'Meditação', ic: '🧘', desc: '10 min de silêncio', hist: mk([1, 2, 3, 4, 5, 6, 8, 9]) },
      { id: uid(), nome: 'Gratidão', ic: '🙏', desc: '3 coisas do dia', hist: mk([0, 1, 3, 4, 6]) },
      { id: uid(), nome: 'Leitura contemplativa', ic: '📖', desc: '1 página', hist: mk([2, 5, 7]) },
      { id: uid(), nome: 'Caminhada consciente', ic: '🌿', desc: 'sem fone, presente', hist: mk([1, 4, 8]) },
    ]);
    S().set('es_intencao', 'Fazer menos, com mais presença.');
    S().set('es_reflexoes', [
      { id: uid(), data: h, tx: 'Percebi que quando começo o dia devagar, tudo rende mais. A pressa é inimiga da paz.' },
      { id: uid(), data: addDias(h, -3), tx: 'Gratidão pela saúde que está voltando. O corpo é o templo, e eu estava negligenciando.' },
    ]);
  }
  let tab = 'praticas', el = null, fecharFn = null;
  const P = () => S().get('es_praticas', []); const setP = v => S().set('es_praticas', v);
  function streak(p) { let n = 0, h = hojeISO(); for (let i = 0; i < 60; i++) { if (p.hist[addDias(h, -i)]) n++; else if (i > 0) break; } return n; }
  function toggle(id) { const ps = P(); const p = ps.find(x => x.id === id); const h = hojeISO(); if (p.hist[h]) delete p.hist[h]; else { p.hist[h] = 1; B().emit('spiritual', { pratica: p.nome }, 1); } setP(ps); render(); if (p.hist[h]) window.toast('🧘 ' + p.nome + ' — presença registrada'); }

  function vPraticas() {
    const ps = P(), h = hojeISO(), feitas = ps.filter(p => p.hist[h]).length;
    return `<div class="es-intencao"><div class="lbl">Intenção da semana</div><div class="txt">"${S().get('es_intencao', '—')}"</div><button class="clickable" id="es_edit_int">editar intenção</button></div>
      <div class="fcard"><div class="fct">🌙 Práticas de hoje · ${feitas}/${ps.length}</div>
      ${ps.map(p => { const done = p.hist[h]; const wk = [6, 5, 4, 3, 2, 1, 0].map(n => p.hist[addDias(h, -n)] ? 'on' : '').map(c => `<i class="${c}"></i>`).join('');
        return `<div class="es-prat ${done ? 'done' : ''}"><div class="ic">${p.ic}</div><div class="nm"><b>${p.nome}</b><span>${p.desc}</span><div class="es-week">${wk}</div></div><span class="seq">🔥 ${streak(p)}d</span><button class="es-check clickable" data-tg="${p.id}">${done ? '✓' : ''}</button></div>`; }).join('')}
      <p class="ms-sub" style="margin-top:14px">Opcional e no seu ritmo. Nada de cobrança — só um espaço pra cuidar do que não aparece em número.</p></div>`;
  }
  function vReflexoes() {
    const refl = S().get('es_reflexoes', []);
    return `<div class="fcard"><div class="fct">✍️ Reflexões <button class="msbtn primary clickable" id="es_nova_refl">+ escrever</button></div>
      ${refl.map(r => { const d = new Date(r.data + 'T12:00:00'); return `<div class="es-refl"><div class="dt">${d.getDate()} ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}</div><div class="tx">"${r.tx}"</div></div>`; }).join('') || '<div class="fempty">Nenhuma reflexão ainda.</div>'}</div>`;
  }
  function vIntencao() {
    const ps = P(), h = hojeISO();
    const total7 = ps.reduce((a, p) => a + [0, 1, 2, 3, 4, 5, 6].filter(n => p.hist[addDias(h, -n)]).length, 0);
    return `<div class="es-intencao"><div class="lbl">Intenção da semana</div><div class="txt">"${S().get('es_intencao', '—')}"</div><button class="clickable" id="es_edit_int">editar intenção</button></div>
      <div class="fx-kpis" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi" style="--kc:#a08ec9"><div class="k">Práticas na semana</div><div class="v">${total7}</div><div class="d">presença acumulada</div></div>
        <div class="kpi" style="--kc:#a08ec9"><div class="k">Maior sequência</div><div class="v">🔥 ${Math.max(...ps.map(streak), 0)}d</div><div class="d">constância</div></div>
        <div class="kpi" style="--kc:#a08ec9"><div class="k">Reflexões</div><div class="v">${S().get('es_reflexoes', []).length}</div><div class="d">registros</div></div>
      </div>
      <div class="fcard" style="margin-top:14px"><div class="insight" style="border-left:2px solid #a08ec9;padding:10px 16px;font-size:13.5px;line-height:1.5">Semanas com <b>intenção definida</b> têm foco <b>+19%</b> maior — a clareza do começo guia o resto.<div style="font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-top:6px">Espiritual × Foco · o Cérebro percebeu isso em você</div></div></div>`;
  }
  function editIntencao() {
    window.Modal.open(`<h3>Intenção da semana</h3><p class="msub">Uma frase que guia os próximos sete dias.</p><label class="f">Sua intenção</label><input type="text" id="es_it" value="${(S().get('es_intencao', '') + '').replace(/"/g, '&quot;')}"><div class="mactions"><button class="btn2 clickable" id="es_ic">Cancelar</button><button class="btn2 primary clickable" id="es_is">Definir</button></div>`);
    document.getElementById('es_ic').onclick = window.Modal.close;
    document.getElementById('es_is').onclick = () => { S().set('es_intencao', document.getElementById('es_it').value || '—'); window.Modal.close(); render(); window.toast('Intenção definida ✔'); };
  }
  function novaReflexao() {
    window.Modal.open(`<h3>✍️ Reflexão</h3><p class="msub">Sem forma certa. Só o que veio hoje.</p><label class="f">O que você sente / percebeu?</label><input type="text" id="es_rt" placeholder="escreva livremente"><div class="mactions"><button class="btn2 clickable" id="es_rc">Cancelar</button><button class="btn2 primary clickable" id="es_rs">Guardar</button></div>`);
    document.getElementById('es_rc').onclick = window.Modal.close;
    document.getElementById('es_rs').onclick = () => { const t = document.getElementById('es_rt').value.trim(); if (!t) return; const rf = S().get('es_reflexoes', []); rf.unshift({ id: uid(), data: hojeISO(), tx: t }); S().set('es_reflexoes', rf); B().emit('spiritual', { reflexao: 1 }, 1); window.Modal.close(); render(); window.toast('Reflexão guardada ✔'); };
  }

  const TABS = [['praticas', 'Práticas'], ['reflexoes', 'Reflexões'], ['intencao', 'Intenção']];
  function render() {
    if (!el) return;
    const body = tab === 'reflexoes' ? vReflexoes() : tab === 'intencao' ? vIntencao() : vPraticas();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#a08ec9">◦ MÓDULO 09 · ESPIRITUAL</span><button class="ms-close clickable" id="es_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Espiritual</h1>
      <p class="ms-sub">Opcional, no seu ritmo. Um espaço pra práticas, reflexões e a intenção que guia a semana — o que não cabe em número.</p>
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    document.getElementById('es_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => toggle(b.dataset.tg));
    const ei = document.getElementById('es_edit_int'); if (ei) ei.onclick = editIntencao;
    const nr = document.getElementById('es_nova_refl'); if (nr) nr.onclick = novaReflexao;
  }
  window.Screens = window.Screens || {};
  window.Screens.espiritual = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'praticas'; render(); } };
})();
