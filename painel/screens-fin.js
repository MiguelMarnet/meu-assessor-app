/* ============================================================
   ASSESSOR.IA — Tela cheia FINANCEIRO (adaptação Foccum, fase 2)
   Abas: Visão geral · Transações · Categorias · Agendadas · Contas
   Depende de window.Store/Bus/Modal/toast/brl (index.html).
   ============================================================ */
'use strict';
(function () {
  const css = `
  .fx-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  /* No celular 4 colunas dão 76px cada e o número não cabe — medido:
     conteúdo de 104px numa caixa de 42px, estourando a tela para 489px
     de largura. min-width:0 é obrigatório: item de grid não encolhe
     abaixo do próprio conteúdo sem isso. */
  @media(max-width:720px){
    .fx-kpis{grid-template-columns:1fr 1fr;gap:8px}
    .fx-kpis>*{min-width:0}
    .fx-kpi{padding:12px}
    .fx-kpi .v{font-size:17px}
  }
  .fx-kpi{border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--panel);position:relative;overflow:hidden}
  .fx-kpi .k{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft)}
  .fx-kpi .v{font-family:var(--mono);font-size:22px;font-weight:700;letter-spacing:-.02em;margin-top:6px}
  .fx-kpi .d{font-size:11px;margin-top:2px;color:var(--ink-soft)}
  .fx-kpi .d.up{color:#607452}.fx-kpi .d.down{color:#A2402A}
  .fx-kpi svg{position:absolute;right:0;bottom:0;left:0;width:100%;height:34px;opacity:.5}
  .fx-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-top:14px}
  .fx-grid.eq{grid-template-columns:1fr 1fr}
  .fx-card{border:1px solid var(--line);border-radius:12px;padding:18px;background:var(--panel)}
  .fx-ct{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:14px}
  .fx-seg{display:flex;gap:4px}
  .fx-seg button{font-family:var(--mono);font-size:9px;letter-spacing:.08em;padding:4px 9px;border-radius:12px;border:1px solid var(--line);background:none;color:var(--ink-soft)}
  .fx-seg button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .fx-cat{display:flex;align-items:center;gap:8px;padding:7px 0;font-size:12.5px;border-top:1px solid var(--line)}
  .fx-cat i{width:8px;height:8px;border-radius:50%}
  .fx-cat .p{margin-left:auto;font-family:var(--mono);color:var(--ink-soft)}
  .fx-bars{display:flex;align-items:flex-end;gap:5px;height:70px;margin-bottom:6px}
  .fx-bars .b{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
  .fx-bars .b i{width:100%;background:var(--line);border-radius:3px 3px 0 0;transition:.2s}
  .fx-bars .b.on i{background:var(--gold)}
  .fx-bars .b small{font-family:var(--mono);font-size:8px;color:var(--ink-soft)}
  .fx-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:13px}
  .fx-row .av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;background:var(--bg);border:1px solid var(--line);flex-shrink:0;color:var(--ink)}
  .fx-row .desc{flex:1;min-width:0}.fx-row .desc b{font-weight:500}.fx-row .desc span{display:block;font-family:var(--mono);font-size:9.5px;color:var(--ink-soft);margin-top:1px}
  .fx-row .val{font-family:var(--mono);font-weight:700;white-space:nowrap}
  .fx-table{width:100%;border-collapse:collapse;font-size:12.5px}
  .fx-table th{font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);text-align:left;font-weight:400;padding:8px 10px;border-bottom:1px solid var(--line)}
  .fx-table td{padding:11px 10px;border-bottom:1px solid var(--line)}
  .fx-table tr:hover td{background:color-mix(in srgb,var(--gold) 5%,transparent)}
  .fx-chip{font-family:var(--mono);font-size:9px;padding:2px 8px;border-radius:10px;border:1px solid var(--line)}
  .fx-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px}
  .fx-status i{width:6px;height:6px;border-radius:50%;background:#607452}
  .fx-acc{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
  .fx-acc .ic{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:13px;background:var(--bg);border:1px solid var(--line)}
  .fx-acc .nm{flex:1}.fx-acc .nm b{font-size:14px;font-weight:500}.fx-acc .nm span{display:block;font-family:var(--mono);font-size:9px;color:var(--ink-soft)}
  .fx-acc .s{font-family:var(--mono);font-weight:700;font-size:14px;text-align:right}
  .fx-acc .s small{display:block;font-weight:400;font-size:9px;color:var(--ink-soft)}
  .fx-budget{padding:11px 0;border-top:1px solid var(--line)}
  .fx-budget .top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
  .fx-budget .top .pc{font-family:var(--mono);font-size:11px}
  .fx-bar{height:6px;border-radius:4px;background:var(--line);overflow:hidden}.fx-bar i{display:block;height:100%;border-radius:4px}
  .fx-toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
  .fx-search{flex:1;min-width:160px;padding:9px 14px;border:1px solid var(--line);border-radius:20px;background:var(--panel);color:var(--ink);font-size:13px;outline:none}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const S = () => window.Store, B = () => window.Bus, brl = window.brl || (v => 'R$ ' + Math.round(v).toLocaleString('pt-BR'));
  const brl2 = v => 'R$ ' + (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mesAtual = () => new Date().toISOString().slice(0, 7);
  const pad = n => String(n).padStart(2, '0');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const CATS = {
    Moradia: '#B3654F', Educação: '#9C7FB3', Alimentação: '#C07868', Saúde: '#789267',
    Lazer: '#E39C7A', Transporte: '#6D8FA7', Assinaturas: '#8087B5', Salário: '#607452', Venda: '#607452', Outros: '#9A8A4A'
  };
  const cor = c => CATS[c] || '#9A8A4A';

  /* Etiqueta de lancamento ficticio: sem ela, um salario inventado parece
     dado real de outra pessoa -- o pior susto possivel num app financeiro. */
  const tagDemo = () => "<span style=\"font-family:var(--mono);font-size:9px;letter-spacing:.1em;color:var(--ink-soft);border:1px solid var(--line);border-radius:99px;padding:1px 6px;margin-left:7px;vertical-align:middle;font-weight:400\">EXEMPLO</span>";

  function seed() {
    if (S().get('fin_seed')) return;
    // Quem entrou com a propria conta NUNCA ve dado inventado. Antes a
    // semeadura rodava para todo mundo, e a ultima transacao falsa subia
    // para o Supabase como se fosse lancamento de verdade -- dado fantasma
    // permanente na conta da pessoa, sem etiqueta nenhuma.
    if (window.__uid) { S().set('fin_seed', 1); return; }
    S().set('fin_seed', 1);
    const m = mesAtual();
    const T = [
      ['Salário / EMF', 'Salário', 5200, 'receita', 'Inter', 'À vista', 1],
      ['Venda de planners', 'Venda', 940, 'receita', 'Inter', 'À vista', 5],
      ['Aluguel', 'Moradia', 1350, 'despesa', 'Nubank', 'À vista', 5],
      ['Mercado do mês', 'Alimentação', 682.99, 'despesa', 'Nubank', 'À vista', 3],
      ['Uber', 'Transporte', 35, 'despesa', 'Inter', 'À vista', 18],
      ['Esfiha', 'Alimentação', 70, 'despesa', 'Nubank', 'À vista', 18],
      ['Mensalidade Faculdade', 'Educação', 689, 'despesa', 'Nubank', 'À vista', 18],
      ['Curso de inglês', 'Educação', 180, 'despesa', 'Nubank', 'Parcela 2/5', 16],
      ['Assinatura iFood Club', 'Assinaturas', 20, 'despesa', 'Nubank', 'Parcela 2/10', 16],
      ['Conta de Luz', 'Moradia', 187.4, 'despesa', 'Nubank', 'À vista', 17],
      ['Internet Vivo Fibra', 'Moradia', 119.9, 'despesa', 'Nubank', 'À vista', 17],
      ['Plano de Saúde', 'Saúde', 512, 'despesa', 'Nubank', 'À vista', 17],
      ['Academia', 'Saúde', 109.9, 'despesa', 'Inter', 'À vista', 10],
      ['Cinema', 'Lazer', 90, 'despesa', 'Inter', 'À vista', 12],
      ['Presente da mãe', 'Lazer', 250, 'despesa', 'Sicredi', 'Parcela 1/2', 8],
    ];
    S().set('tx', T.map(x => ({ id: uid(), data: `${m}-${pad(x[6])}`, desc: x[0], cat: x[1], valor: x[2], tipo: x[3], conta: x[4], natureza: x[5], status: 'Concluída', _demo: 1 })));
    S().set('fin_contas', [
      { nome: 'Nubank', tipo: 'Cartão de crédito', saldo: -1833.75, limite: 5000, ic: '💳' },
      { nome: 'Sicredi', tipo: 'Cartão de crédito', saldo: -1040, limite: 25000, ic: '💳', fecha: 22 },
      { nome: 'Reserva de emergência', tipo: 'Meta', saldo: 12500, ic: '🎯' },
      { nome: 'Inter', tipo: 'Conta bancária', saldo: 465, ic: '🟠' },
      { nome: 'C6 Bank', tipo: 'Conta bancária', saldo: -2999, ic: '⬛' },
    ]);
    S().set('fin_budgets', { Moradia: 3200, Educação: 800, Alimentação: 1500, Saúde: 1000, Lazer: 700, Transporte: 700 });
    S().set('fin_agendadas', [
      { desc: 'Fatura Nubank', conta: 'Nubank', tipo: 'Fatura', valor: 423.63, venc: 4, tag: 'faturas' },
      { desc: 'Celular Claro', conta: 'Nubank', tipo: 'À vista', valor: 69.99, venc: 20, tag: 'recorrencia' },
      { desc: 'Curso de inglês', conta: 'Nubank', tipo: 'Parcela 2/5', valor: 180, venc: 16, tag: 'parcelas' },
      { desc: 'Assinatura iFood Club', conta: 'Nubank', tipo: 'Parcela 2/10', valor: 20, venc: 16, tag: 'parcelas' },
    ]);
  }

  const txMes = () => S().get('tx', []).filter(t => t.data.slice(0, 7) === mesAtual());

  /* ---------- gráficos ---------- */
  function spark(arr, up) {
    const w = 120, h = 34, min = Math.min(...arr), max = Math.max(...arr), p = 2;
    const x = i => p + (i / (arr.length - 1)) * (w - p * 2), y = v => h - p - ((v - min) / ((max - min) || 1)) * (h - p * 2);
    let d = ''; arr.forEach((v, i) => d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${up ? '#607452' : '#A2402A'}" stroke-width="1.5"/></svg>`;
  }
  function resultadoChart() {
    const tx = txMes(), dias = 31, W = 620, H = 250, P = 30;
    const entradas = [], saidas = [], acc = []; let a = 0;
    for (let d = 1; d <= dias; d++) {
      const iso = `${mesAtual()}-${pad(d)}`;
      const e = tx.filter(t => t.data === iso && t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
      const sa = tx.filter(t => t.data === iso && t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
      entradas.push(e); saidas.push(sa); a += e - sa; acc.push(a);
    }
    const all = acc.concat([0]); const min = Math.min(...all) * 1.1, max = Math.max(...all, 1000) * 1.1;
    const x = i => P + (i / (dias - 1)) * (W - P * 2), y = v => H - P - ((v - min) / ((max - min) || 1)) * (H - P * 2);
    const path = s => { let d = ''; s.forEach((v, i) => d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '); return d; };
    // projeção: reta do acumulado atual até o fim
    const hojeD = Math.min(new Date().getDate(), dias);
    const proj = acc.slice(0, hojeD); const ult = proj[proj.length - 1] || 0; const passo = ult / hojeD;
    for (let d = hojeD; d < dias; d++) proj.push(ult + passo * (d - hojeD + 1) * 0.4);
    return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <line x1="${P}" y1="${y(0)}" x2="${W - P}" y2="${y(0)}" stroke="var(--line)" stroke-width="1"/>
      <path d="${path(proj)}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.6"/>
      <path d="${path(acc)}L${x(dias - 1)} ${y(0)}L${x(0)} ${y(0)}Z" fill="url(#fg)" opacity="0.15"/>
      <path d="${path(acc)}" fill="none" stroke="${acc[hojeD - 1] >= 0 ? '#607452' : '#A2402A'}" stroke-width="2"/>
      <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#607452"/><stop offset="1" stop-color="transparent"/></linearGradient></defs>
    </svg>`;
  }
  function donut(segs, size, big, small) {
    const total = segs.reduce((a, s) => a + s.value, 0) || 1, r = size / 2 - 13, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
    let off = 0, arcs = '';
    segs.forEach(s => { const len = s.value / total * C; arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`; off += len; });
    return `<svg width="${size}" height="${size}" style="display:block;margin:0 auto">${arcs}<text x="${cx}" y="${cy - 2}" text-anchor="middle" style="fill:var(--ink);font-weight:700;font-size:15px;font-family:var(--mono)">${big}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" style="fill:var(--ink-soft);font-size:9px;font-family:var(--mono)">${small}</text></svg>`;
  }

  /* ---------- transação (novo/editar) ---------- */
  function addTx(tipo) {
    const cats = tipo === 'receita' ? ['Salário', 'Venda', 'Outros'] : Object.keys(CATS).filter(c => !['Salário', 'Venda'].includes(c));
    const contas = S().get('fin_contas', []).map(c => c.nome);
    window.Modal.open(`<h3>${tipo === 'receita' ? '💵 Nova receita' : '💸 Novo gasto'}</h3>
      <p class="msub">Na versão conectada é só mandar "almoço 30" no WhatsApp — cai aqui sozinho.</p>
      <label class="f">Descrição</label><input type="text" id="fx_d" placeholder="${tipo === 'receita' ? 'ex.: Venda planner' : 'ex.: Almoço'}">
      <label class="f">Valor (R$)</label><input type="number" id="fx_v" placeholder="0">
      <label class="f">Categoria</label><select id="fx_c">${cats.map(c => `<option>${c}</option>`).join('')}</select>
      <label class="f">Conta</label><select id="fx_a">${contas.map(c => `<option>${c}</option>`).join('')}</select>
      <div class="mactions"><button class="btn2 clickable" id="fx_cancel">Cancelar</button><button class="btn2 primary clickable" id="fx_save">Lançar</button></div>`);
    document.getElementById('fx_cancel').onclick = window.Modal.close;
    document.getElementById('fx_save').onclick = () => {
      const v = parseFloat(document.getElementById('fx_v').value); if (!v || v <= 0) { window.toast('Informe o valor 🙂'); return; }
      const tx = S().get('tx', []);
      tx.push({ id: uid(), data: new Date().toISOString().slice(0, 10), desc: document.getElementById('fx_d').value || (tipo === 'receita' ? 'Receita' : 'Gasto'), cat: document.getElementById('fx_c').value, valor: v, tipo, conta: document.getElementById('fx_a').value, natureza: 'À vista', status: 'Concluída' });
      S().set('tx', tx);
      if (tipo === 'despesa') S().set('saldo', S().get('saldo', 4820) - v);
      B().emit(tipo === 'receita' ? 'income' : 'expense', { cat: document.getElementById('fx_c').value }, v);
      window.Modal.close(); render(); window.__bumpLive && window.__bumpLive();
      window.toast((tipo === 'receita' ? '💵 ' : '💸 ') + brl(v) + ' lançado ✔');
    };
  }
  function delTx(id) { S().set('tx', S().get('tx', []).filter(t => t.id !== id)); render(); window.toast('Lançamento removido'); }

  /* ---------- abas ---------- */
  let tab = 'visao', segDespesa = true, mesBar = 3, el = null, fecharFn = null;

  function vVisao() {
    const tx = txMes();
    const rec = tx.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
    const desp = tx.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
    const saldo = rec - desp;
    const porCat = {}; tx.filter(t => t.tipo === (segDespesa ? 'despesa' : 'receita')).forEach(t => porCat[t.cat] = (porCat[t.cat] || 0) + t.valor);
    const segs = Object.keys(porCat).sort((a, b) => porCat[b] - porCat[a]).map(c => ({ label: c, value: porCat[c], color: cor(c) }));
    const totalSeg = segs.reduce((a, s) => a + s.value, 0);
    const meses = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out']; const vals = [9820.07, 3921.61, 6778.54, desp || 493.62, 5417.97, 4663.17, 4053.64];
    const contas = S().get('fin_contas', []);
    const agd = S().get('fin_agendadas', []);
    const recent = S().get('tx', []).slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
    const sparkE = [0, 0, 0, 0, 0, 0, rec], sparkS = [200, 800, 1200, 400, 900, 1400, desp];
    return `
    <div class="fx-kpis">
      <div class="fx-kpi"><div class="k">Saldo atual</div><div class="v">${brl2(saldo)}</div><div class="d ${saldo >= 0 ? 'up' : 'down'}">${saldo >= 0 ? 'no azul' : 'atenção'} vs anterior</div>${spark([5, 6, 6, 7, 6, 7, saldo > 0 ? 8 : 3], saldo >= 0)}</div>
      <div class="fx-kpi"><div class="k">Entradas</div><div class="v" style="color:#607452">${brl2(rec)}</div><div class="d up">receitas do mês</div>${spark(sparkE, true)}</div>
      <div class="fx-kpi"><div class="k">Saídas</div><div class="v" style="color:#A2402A">${brl2(desp)}</div><div class="d down">despesas do mês</div>${spark(sparkS, false)}</div>
      <div class="fx-kpi"><div class="k">Resultado</div><div class="v">${brl2(saldo)}</div><div class="d ${saldo >= 0 ? 'up' : 'down'}">entradas − saídas</div>${spark([4, 5, 3, 6, 5, 7, saldo > 0 ? 8 : 2], saldo >= 0)}</div>
    </div>
    <div class="fx-grid">
      <div class="fx-card"><div class="fx-ct"><span>📈 Resultado do mês</span><span style="text-transform:none">entradas · saídas · acumulado + projeção</span></div>${resultadoChart()}</div>
      <div class="fx-card"><div class="fx-ct"><span>🍩 ${segDespesa ? 'Despesas' : 'Entradas'} por categoria</span><span class="fx-seg"><button class="${segDespesa ? 'on' : ''}" data-seg="d">Saídas</button><button class="${!segDespesa ? 'on' : ''}" data-seg="e">Entradas</button></span></div>
        ${segs.length ? donut(segs, 170, brl(totalSeg), 'total') + segs.slice(0, 6).map(s => `<div class="fx-cat"><i style="background:${s.color}"></i>${s.label}<span class="p">${Math.round(s.value / totalSeg * 100)}%</span></div>`).join('') : '<div class="fempty">Sem dados ainda.</div>'}
      </div>
    </div>
    <div class="fx-grid eq">
      <div class="fx-card"><div class="fx-ct"><span>🗓️ Próximos pagamentos</span><button class="msbtn primary clickable" data-add="despesa">+ transação</button></div>
        <div class="fx-bars">${meses.map((mo, i) => `<div class="b ${i === mesBar ? 'on' : ''}" data-bar="${i}"><i style="height:${Math.round(vals[i] / Math.max(...vals) * 60)}px"></i><small>${mo}</small></div>`).join('')}</div>
        ${agd.map(a => `<div class="fx-row"><div class="av">${a.tipo === 'Fatura' ? '🧾' : '📄'}</div><div class="desc"><b>${esc(a.desc)}</b><span>vence dia ${a.venc} · ${esc(a.tipo)} · ${esc(a.conta)}</span></div><div class="val" style="color:#A2402A">− ${brl(a.valor)}</div></div>`).join('')}
        <div class="fx-row" style="border-top:2px solid var(--line)"><div class="desc"><b>Total previsto</b></div><div class="val" style="color:#A2402A">− ${brl(agd.reduce((s, a) => s + a.valor, 0))}</div></div>
      </div>
      <div class="fx-card"><div class="fx-ct"><span>🏦 Saldos por conta</span></div>
        ${contas.map(c => `<div class="fx-acc"><div class="ic">${c.ic}</div><div class="nm"><b>${c.nome}</b><span>${c.tipo}${c.fecha ? ' · fecha dia ' + c.fecha : ''}</span></div><div class="s" style="color:${c.saldo < 0 ? '#A2402A' : 'var(--ink)'}">${brl2(c.saldo)}${c.limite ? `<small>limite ${brl(c.limite)}</small>` : ''}</div></div>`).join('')}
      </div>
    </div>
    <div class="fx-card" style="margin-top:14px"><div class="fx-ct"><span>🕘 Transações recentes</span><button class="msbtn clickable" data-tab="transacoes">ver todas →</button></div>
      ${recent.map(x => `<div class="fx-row"><div class="av">${x.tipo === 'receita' ? '💵' : '💸'}</div><div class="desc"><b>${esc(x.desc)}${x._demo ? tagDemo() : String()}</b><span>${x.data.slice(8)}/${x.data.slice(5, 7)} · ${esc(x.conta)} · ${esc(x.cat)}</span></div><div class="val" style="color:${x.tipo === 'receita' ? '#607452' : 'var(--ink)'}">${x.tipo === 'receita' ? '+' : '−'} ${brl(x.valor)}</div></div>`).join('')}
    </div>`;
  }

  function vTransacoes() {
    const tx = S().get('tx', []).slice().sort((a, b) => b.data.localeCompare(a.data));
    return `<div class="fx-toolbar"><input class="fx-search" id="fx_busca" placeholder="Buscar transação…"><button class="msbtn clickable" data-add="receita">+ receita</button><button class="msbtn primary clickable" data-add="despesa">+ gasto</button></div>
      <div class="fx-card" style="padding:6px 14px"><table class="fx-table"><thead><tr><th>Descrição</th><th>Natureza</th><th>Status</th><th>Conta</th><th>Categoria</th><th>Data</th><th style="text-align:right">Valor</th><th></th></tr></thead><tbody id="fx_tbody">
      ${tx.map(x => rowTx(x)).join('')}
      </tbody></table></div>`;
  }
  function rowTx(x) {
    return `<tr data-id="${x.id}"><td><b>${x.tipo === 'receita' ? '↙ ' : '↗ '}${esc(x.desc)}${x._demo ? tagDemo() : String()}</b></td><td>${esc(x.natureza || 'À vista')}</td><td><span class="fx-status"><i></i>${esc(x.status || 'Concluída')}</span></td><td>${esc(x.conta || '—')}</td><td><span class="fx-chip" style="color:${cor(x.cat)};border-color:${cor(x.cat)}55">${esc(x.cat)}</span></td><td>${x.data.slice(8)}/${x.data.slice(5, 7)}</td><td style="text-align:right;color:${x.tipo === 'receita' ? '#607452' : 'var(--ink)'};font-family:var(--mono);font-weight:700">${x.tipo === 'receita' ? '+' : '−'} ${brl(x.valor)}</td><td><button class="del clickable" data-del="${x.id}" style="background:none;border:none;color:var(--ink-soft);cursor:pointer">✕</button></td></tr>`;
  }

  function vCategorias() {
    const b = S().get('fin_budgets', {}), tx = txMes();
    const gasto = {}; tx.filter(t => t.tipo === 'despesa').forEach(t => gasto[t.cat] = (gasto[t.cat] || 0) + t.valor);
    const rec = {}; tx.filter(t => t.tipo === 'receita').forEach(t => rec[t.cat] = (rec[t.cat] || 0) + t.valor);
    return `<div class="fx-card" style="padding:6px 14px"><table class="fx-table"><thead><tr><th>Categoria</th><th style="text-align:right">Limite</th><th style="text-align:right">Gasto no mês</th><th>Orçamento</th><th style="text-align:right">Movs.</th></tr></thead><tbody>
      ${Object.keys(b).map(c => { const g = gasto[c] || 0, teto = b[c], pc = Math.round(g / teto * 100), over = g > teto, mv = tx.filter(t => t.cat === c).length;
        return `<tr><td><span class="fx-chip" style="color:${cor(c)};border-color:${cor(c)}55">● ${c}</span></td><td style="text-align:right;font-family:var(--mono)">${brl(teto)}</td><td style="text-align:right;font-family:var(--mono)">${brl(g)}</td><td style="min-width:180px"><div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;margin-bottom:4px"><span style="color:${over ? '#A2402A' : 'var(--ink-soft)'}">${pc}%</span><span style="color:${over ? '#A2402A' : 'var(--ink-soft)'}">${over ? brl(0) : brl(teto - g)} restante</span></div><div class="fx-bar"><i style="width:${Math.min(100, pc)}%;background:${over ? '#A2402A' : cor(c)}"></i></div></td><td style="text-align:right;font-family:var(--mono)">${mv}</td></tr>`; }).join('')}
      ${Object.keys(rec).map(c => `<tr><td><span class="fx-chip" style="color:#607452;border-color:#60745255">↙ ${c}</span></td><td style="text-align:right;color:var(--ink-soft)">Sem limite</td><td style="text-align:right;font-family:var(--mono);color:#607452">${brl(rec[c])}</td><td style="color:var(--ink-soft);font-size:11px">Sem limite</td><td style="text-align:right;font-family:var(--mono)">${tx.filter(t => t.cat === c).length}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function vAgendadas() {
    const agd = S().get('fin_agendadas', []);
    return `<div class="fx-card" style="padding:6px 14px"><div class="fx-ct" style="padding:12px 6px 0"><span>Agendadas · faturas, parcelas e recorrências</span></div><table class="fx-table"><thead><tr><th>Descrição</th><th>Tipo</th><th>Conta</th><th>Vencimento</th><th style="text-align:right">Valor</th></tr></thead><tbody>
      ${agd.map(a => `<tr><td><b>${esc(a.desc)}</b></td><td><span class="fx-chip">${esc(a.tipo)}</span></td><td>${esc(a.conta)}</td><td>dia ${a.venc}</td><td style="text-align:right;font-family:var(--mono);font-weight:700;color:#A2402A">− ${brl(a.valor)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function vContas() {
    const contas = S().get('fin_contas', []);
    const totalBanco = contas.filter(c => c.tipo === 'Conta bancária').reduce((s, c) => s + c.saldo, 0);
    const totalCred = contas.filter(c => c.tipo === 'Cartão de crédito').reduce((s, c) => s + c.saldo, 0);
    return `<div class="fx-grid eq">
      <div class="fx-card"><div class="fx-ct"><span>🏦 Contas bancárias</span><b style="color:${totalBanco < 0 ? '#A2402A' : 'var(--ink)'}">${brl2(totalBanco)}</b></div>${contas.filter(c => c.tipo === 'Conta bancária').map(c => `<div class="fx-acc"><div class="ic">${c.ic}</div><div class="nm"><b>${c.nome}</b><span>${c.tipo}</span></div><div class="s" style="color:${c.saldo < 0 ? '#A2402A' : 'var(--ink)'}">${brl2(c.saldo)}</div></div>`).join('')}</div>
      <div class="fx-card"><div class="fx-ct"><span>💳 Cartões de crédito</span><b style="color:#A2402A">${brl2(totalCred)}</b></div>${contas.filter(c => c.tipo === 'Cartão de crédito').map(c => `<div class="fx-acc"><div class="ic">${c.ic}</div><div class="nm"><b>${c.nome}</b><span>fatura${c.fecha ? ' · fecha dia ' + c.fecha : ''}</span></div><div class="s" style="color:#A2402A">${brl2(c.saldo)}<small>limite ${brl(c.limite)}</small></div></div>`).join('')}
        <div class="fx-acc" style="border-top:2px solid var(--line)"><div class="ic">🎯</div><div class="nm"><b>Reserva de emergência</b><span>Meta</span></div><div class="s" style="color:#607452">${brl2(12500)}</div></div></div>
    </div>`;
  }

  const TABS = [['visao', 'Visão geral'], ['transacoes', 'Transações'], ['agendadas', 'Agendadas'], ['categorias', 'Categorias'], ['contas', 'Contas']];
  function render() {
    if (!el) return;
    const body = tab === 'transacoes' ? vTransacoes() : tab === 'categorias' ? vCategorias() : tab === 'agendadas' ? vAgendadas() : tab === 'contas' ? vContas() : vVisao();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#B2803E">◦ MÓDULO 03 · FINANCEIRO</span>
        <button class="ms-close clickable" id="fx_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Financeiro</h1>
      <p class="ms-sub">${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} · o dinheiro tratado como o caixa da sua empresa-vida. Registre pelo WhatsApp, analise aqui.</p>
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    bind();
  }
  function bind() {
    document.getElementById('fx_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addTx(b.dataset.add));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => delTx(b.dataset.del));
    el.querySelectorAll('[data-seg]').forEach(b => b.onclick = () => { segDespesa = b.dataset.seg === 'd'; render(); });
    el.querySelectorAll('[data-bar]').forEach(b => b.onclick = () => { mesBar = +b.dataset.bar; render(); });
    const busca = document.getElementById('fx_busca');
    if (busca) busca.oninput = () => {
      const q = busca.value.toLowerCase();
      const tx = S().get('tx', []).slice().sort((a, b) => b.data.localeCompare(a.data)).filter(x => x.desc.toLowerCase().includes(q) || x.cat.toLowerCase().includes(q));
      document.getElementById('fx_tbody').innerHTML = tx.map(x => rowTx(x)).join('');
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => delTx(b.dataset.del));
    };
  }

  window.Screens = window.Screens || {};
  window.Screens.financeiro = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'visao'; render(); } };
})();
