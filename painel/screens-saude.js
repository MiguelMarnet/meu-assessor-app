/* ============================================================
   ASSESSOR.IA — Tela cheia SAÚDE & FITNESS (fase 7)
   Alimentação (macros/anéis) · Treino (volume/sequência) · Exames (faixas de referência)
   ============================================================ */
'use strict';
(function () {
  const css = `
  .sa-rings{display:flex;gap:20px;flex-wrap:wrap;align-items:center;justify-content:center;padding:8px 0}
  .sa-ring{text-align:center}
  .sa-ring .lbl{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-top:6px}
  .sa-ring .val{font-family:var(--mono);font-size:12px;font-weight:700;margin-top:2px}
  .sa-meal{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
  .sa-meal .ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--bg);border:1px solid var(--line);font-size:15px}
  .sa-meal .nm{flex:1}.sa-meal .nm b{font-size:14px;font-weight:500}.sa-meal .nm span{display:block;font-family:var(--mono);font-size:9.5px;color:var(--ink-soft)}
  .sa-meal .kc{font-family:var(--mono);font-weight:700;font-size:13px}
  .sa-tr{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
  .sa-tr .d{width:44px;text-align:center;font-family:var(--mono)}.sa-tr .d b{font-size:16px}.sa-tr .d span{display:block;font-size:8px;color:var(--ink-soft)}
  .sa-tr .nm{flex:1}.sa-tr .nm b{font-size:14px;font-weight:500}.sa-tr .nm span{display:block;font-family:var(--mono);font-size:9.5px;color:var(--ink-soft)}
  .sa-tr .vol{font-family:var(--mono);font-size:12px;font-weight:700;color:#607452}
  .sa-week{display:flex;gap:5px;align-items:flex-end;height:80px;margin:8px 0}
  .sa-week .b{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
  .sa-week .b i{width:100%;background:#607452;border-radius:3px 3px 0 0;min-height:2px}
  .sa-week .b i.off{background:var(--line)}
  .sa-week .b small{font-family:var(--mono);font-size:8px;color:var(--ink-soft)}
  .sa-exam{padding:14px 0;border-top:1px solid var(--line)}
  .sa-exam .top{display:flex;justify-content:space-between;align-items:baseline}
  .sa-exam .nm{font-size:14px;font-weight:500}
  .sa-exam .now{font-family:var(--mono);font-weight:700;font-size:15px}
  .sa-exam .ref{font-family:var(--mono);font-size:9.5px;color:var(--ink-soft)}
  .sa-exam .badge{font-family:var(--mono);font-size:8.5px;padding:2px 8px;border-radius:10px}
  .sa-exam .badge.ok{color:#607452;border:1px solid #60745255}
  .sa-exam .badge.alto{color:#A2402A;border:1px solid #A2402A55}
  .sa-exam .badge.baixo{color:#c2913a;border:1px solid #c2913a55}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const pad = n => String(n).padStart(2, '0');
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  function ring(pct, cor, size) {
    const r = size / 2 - 6, C = 2 * Math.PI * r, cx = size / 2;
    return `<svg width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(Math.min(pct, 100) / 100 * C).toFixed(1)} ${C}" transform="rotate(-90 ${cx} ${cx})"/><text x="${cx}" y="${cx + 4}" text-anchor="middle" style="fill:var(--ink);font-family:var(--mono);font-weight:700;font-size:13px">${Math.round(pct)}%</text></svg>`;
  }
  function evolSVG(serie, ref, w, h) {
    const min = Math.min(...serie, ref[0]) * 0.9, max = Math.max(...serie, ref[1]) * 1.1, p = 4;
    const x = i => p + (i / (serie.length - 1)) * (w - p * 2), y = v => h - p - ((v - min) / ((max - min) || 1)) * (h - p * 2);
    let d = ''; serie.forEach((v, i) => d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' ');
    const bandY1 = y(ref[1]), bandY2 = y(ref[0]);
    return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="0" y="${bandY1.toFixed(1)}" width="${w}" height="${(bandY2 - bandY1).toFixed(1)}" fill="#607452" opacity="0.12"/><path d="${d}" fill="none" stroke="var(--ink)" stroke-width="1.8"/><circle cx="${x(serie.length - 1)}" cy="${y(serie[serie.length - 1]).toFixed(1)}" r="3.5" fill="#607452" stroke="var(--panel)" stroke-width="2"/></svg>`;
  }

  function seed() {
    if (S().get('sa_meta')) return;
    S().set('sa_meta', { kcal: 2400, prot: 160, carb: 260, gord: 70 });
    const h = hojeISO();
    S().set('sa_meals', [
      { id: uid(), nome: 'Ovos + aveia', ref: 'Café', kcal: 480, p: 32, c: 45, g: 18, dia: h },
      { id: uid(), nome: 'Frango + arroz + salada', ref: 'Almoço', kcal: 720, p: 55, c: 80, g: 15, dia: h },
      { id: uid(), nome: 'Whey + banana', ref: 'Lanche', kcal: 280, p: 30, c: 35, g: 3, dia: h },
    ]);
    S().set('sa_treinos', [
      { id: uid(), tipo: 'Peito e tríceps', dia: h, dur: 58, vol: 5400 },
      { id: uid(), tipo: 'Costas e bíceps', dia: addDias(h, -2), dur: 62, vol: 5800 },
      { id: uid(), tipo: 'Pernas', dia: addDias(h, -4), dur: 70, vol: 7200 },
      { id: uid(), tipo: 'Corrida 5km', dia: addDias(h, -5), dur: 32, vol: 0 },
    ]);
    S().set('sa_exames', [
      { nome: 'Glicose', un: 'mg/dL', ref: [70, 99], serie: [96, 94, 92, 89] },
      { nome: 'Colesterol total', un: 'mg/dL', ref: [0, 190], serie: [212, 205, 198, 188] },
      { nome: 'HDL', un: 'mg/dL', ref: [40, 200], serie: [42, 44, 46, 51] },
      { nome: 'LDL', un: 'mg/dL', ref: [0, 130], serie: [140, 132, 125, 118] },
      { nome: 'Triglicerídeos', un: 'mg/dL', ref: [0, 150], serie: [180, 165, 148, 132] },
      { nome: 'Vitamina D', un: 'ng/mL', ref: [30, 100], serie: [22, 26, 31, 38] },
      { nome: 'Ferritina', un: 'ng/mL', ref: [30, 400], serie: [45, 60, 75, 92] },
      { nome: 'TSH', un: 'µUI/mL', ref: [0.4, 4.0], serie: [2.8, 2.5, 2.2, 2.1] },
    ]);
  }

  let tab = 'alim', el = null, fecharFn = null;

  function addMeal() {
    window.Modal.open(`<h3>🍽️ Registrar refeição</h3>
      <label class="f">O que você comeu?</label><input type="text" id="sm_n" placeholder="ex.: Frango grelhado">
      <label class="f">Refeição</label><select id="sm_r"><option>Café</option><option>Almoço</option><option>Lanche</option><option>Jantar</option></select>
      <label class="f">Calorias (kcal) · estimativa</label><input type="number" id="sm_k" placeholder="0">
      <label class="f">Proteína (g)</label><input type="number" id="sm_p" placeholder="0">
      <div class="mactions"><button class="btn2 clickable" id="sm_c">Cancelar</button><button class="btn2 primary clickable" id="sm_s">Registrar</button></div>`);
    document.getElementById('sm_c').onclick = window.Modal.close;
    document.getElementById('sm_s').onclick = () => {
      const k = +document.getElementById('sm_k').value || 0;
      const meals = S().get('sa_meals', []); meals.push({ id: uid(), nome: document.getElementById('sm_n').value || 'Refeição', ref: document.getElementById('sm_r').value, kcal: k, p: +document.getElementById('sm_p').value || 0, c: 0, g: 0, dia: hojeISO() });
      S().set('sa_meals', meals); B().emit('meal', { kcal: k }, k); window.Modal.close(); render(); window.toast('🍽️ ~' + k + ' kcal (estimado) ✔');
    };
  }
  function addTreino() {
    window.Modal.open(`<h3>🏋️ Registrar treino</h3>
      <label class="f">Tipo</label><input type="text" id="st_t" placeholder="ex.: Peito e tríceps">
      <label class="f">Duração (min)</label><input type="number" id="st_d" placeholder="60">
      <label class="f">Volume (kg levantados, opcional)</label><input type="number" id="st_v" placeholder="0">
      <div class="mactions"><button class="btn2 clickable" id="st_c">Cancelar</button><button class="btn2 primary clickable" id="st_s">Registrar</button></div>`);
    document.getElementById('st_c').onclick = window.Modal.close;
    document.getElementById('st_s').onclick = () => {
      const dur = +document.getElementById('st_d').value || 45;
      const tr = S().get('sa_treinos', []); tr.unshift({ id: uid(), tipo: document.getElementById('st_t').value || 'Treino', dia: hojeISO(), dur, vol: +document.getElementById('st_v').value || 0 });
      S().set('sa_treinos', tr); B().emit('workout', {}, dur); window.Modal.close(); render(); window.toast('🏋️ Treino registrado ✔');
    };
  }

  function vAlim() {
    const meta = S().get('sa_meta', {}), meals = S().get('sa_meals', []).filter(m => m.dia === hojeISO());
    const sum = meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, g: a.g + m.g }), { kcal: 0, p: 0, c: 0, g: 0 });
    return `<div class="fcard"><div class="fct">🔥 Metas de hoje <button class="msbtn primary clickable" data-add="meal">+ refeição</button></div>
      <div class="sa-rings">
        <div class="sa-ring">${ring(sum.kcal / meta.kcal * 100, '#E39C7A', 92)}<div class="lbl">Calorias</div><div class="val">${sum.kcal} / ${meta.kcal}</div></div>
        <div class="sa-ring">${ring(sum.p / meta.prot * 100, '#C07868', 84)}<div class="lbl">Proteína</div><div class="val">${sum.p}g / ${meta.prot}g</div></div>
        <div class="sa-ring">${ring(sum.c / meta.carb * 100, '#6D8FA7', 76)}<div class="lbl">Carbo</div><div class="val">${sum.c}g / ${meta.carb}g</div></div>
        <div class="sa-ring">${ring(sum.g / meta.gord * 100, '#d07a3c', 76)}<div class="lbl">Gordura</div><div class="val">${sum.g}g / ${meta.gord}g</div></div>
      </div></div>
      <div class="fcard" style="margin-top:14px"><div class="fct">🍽️ Refeições de hoje</div>
        ${meals.length ? meals.map(m => `<div class="sa-meal"><div class="ic">${({ 'Café': '☕', 'Almoço': '🍽️', 'Lanche': '🥤', 'Jantar': '🌙' })[m.ref] || '🍴'}</div><div class="nm"><b>${m.nome}</b><span>${m.ref} · ${m.p}g proteína</span></div><div class="kc">${m.kcal} kcal</div></div>`).join('') : '<div class="fempty">Nenhuma refeição hoje. Comece com "+ refeição".</div>'}
        <p class="ms-sub" style="margin-top:12px">Estimativas honestas — "~450 kcal (estimado)" nunca vira certeza falsa.</p></div>`;
  }
  function vTreino() {
    const tr = S().get('sa_treinos', []);
    const h = hojeISO();
    const semana = [6, 5, 4, 3, 2, 1, 0].map(n => { const dia = addDias(h, -n); const t = tr.find(x => x.dia === dia); return { dia, vol: t ? (t.vol || 1500) : 0 }; });
    const maxVol = Math.max(...semana.map(s => s.vol), 1);
    const semTreino = tr.filter(t => t.dia >= addDias(h, -6)).length;
    let streak = 0; for (let i = 0; i < 30; i++) { if (tr.some(t => t.dia === addDias(h, -i))) streak++; else if (i > 0 && !tr.some(t => t.dia === addDias(h, -(i)))) { if (i > 1) break; } }
    const DC = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return `<div class="fx-kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi" style="--kc:#607452"><div class="k">Treinos na semana</div><div class="v">${semTreino}</div><div class="d">meta 5</div></div>
      <div class="kpi" style="--kc:#E39C7A"><div class="k">Volume semanal</div><div class="v">${(semana.reduce((a, s) => a + s.vol, 0) / 1000).toFixed(1)}t</div><div class="d up">progressão</div></div>
      <div class="kpi" style="--kc:#C07868"><div class="k">Sequência</div><div class="v">🔥 ${Math.max(streak, semTreino)}d</div><div class="d">constância</div></div>
    </div>
    <div class="fcard" style="margin-top:14px"><div class="fct">📊 Volume da semana</div>
      <div class="sa-week">${semana.map(s => `<div class="b"><i class="${s.vol ? '' : 'off'}" style="height:${s.vol ? Math.round(s.vol / maxVol * 66) : 4}px"></i><small>${DC[new Date(s.dia + 'T12:00:00').getDay()]}</small></div>`).join('')}</div></div>
    <div class="fcard" style="margin-top:14px"><div class="fct">🏋️ Últimos treinos <button class="msbtn primary clickable" data-add="treino">+ treino</button></div>
      ${tr.slice(0, 6).map(t => { const d = new Date(t.dia + 'T12:00:00'); return `<div class="sa-tr"><div class="d"><b>${d.getDate()}</b><span>${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}</span></div><div class="nm"><b>${t.tipo}</b><span>${t.dur} min</span></div><div class="vol">${t.vol ? (t.vol / 1000).toFixed(1) + 't' : '—'}</div></div>`; }).join('')}</div>`;
  }
  function vExames() {
    const ex = S().get('sa_exames', []);
    return `<div class="fcard"><div class="fct">🩸 Exames de sangue · evolução <span style="text-transform:none">faixa verde = referência</span></div>
      ${ex.map(e => { const now = e.serie[e.serie.length - 1], status = now < e.ref[0] ? 'baixo' : now > e.ref[1] ? 'alto' : 'ok';
        return `<div class="sa-exam"><div class="top"><div><span class="nm">${e.nome}</span> <span class="badge ${status}">${status === 'ok' ? 'na faixa' : status}</span><div class="ref">ref ${e.ref[0]}–${e.ref[1]} ${e.un}</div></div><div style="text-align:right"><div class="now">${now} ${e.un}</div></div></div>
          <div style="margin-top:8px;height:44px">${evolSVG(e.serie, e.ref, 380, 44)}</div></div>`; }).join('')}
      <p class="ms-sub" style="margin-top:12px">Cada exame vira evolução visível no tempo. Registre um novo e a série continua.</p></div>`;
  }

  const TABS = [['alim', 'Alimentação'], ['treino', 'Treino'], ['exames', 'Exames']];
  function render() {
    if (!el) return;
    const body = tab === 'treino' ? vTreino() : tab === 'exames' ? vExames() : vAlim();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#607452">◦ MÓDULO 02 · SAÚDE & FITNESS</span><button class="ms-close clickable" id="sa_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Saúde & Fitness</h1>
      <p class="ms-sub">Energia é o combustível. Alimentação, treino e exames — um painel só, olhando pra frente.</p>
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    document.getElementById('sa_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => b.dataset.add === 'meal' ? addMeal() : addTreino());
  }
  window.Screens = window.Screens || {};
  window.Screens.saude = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'alim'; render(); } };
})();
