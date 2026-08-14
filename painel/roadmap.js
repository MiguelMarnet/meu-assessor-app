/* ============================================================
   ASSESSOR.IA — Camada de Roadmap (resgatada de
   app/js/modules/projetos.js, 515 linhas)

   O que volta: trilhos, fases, gates com contagem regressiva,
   limite de WIP, dependências entre metas, inbox de ideias com
   "estudar com o Assessor" (impacto × esforço × momento →
   veredito) e as sugestões dinâmicas.

   Princípio anti-redundância: NÃO cria uma segunda lista de
   metas. A fonte continua sendo `mt_metas`. Esta camada só
   ACRESCENTA campos opcionais (trilho, gate, dependeDe, st) nos
   itens que já existem, e guarda o andaime de carreira em
   `pj_career` / `pj_ideias`. Nenhum campo existente é tocado.

   Visual: usa as mesmas variáveis e o mesmo idioma de CSS da
   experience-v2 (--gold, --panel, --line, --mono), pra ficar
   100% igual ao resto da versão 3D.

   Expõe: window.Roadmap
   ============================================================ */
'use strict';
(function () {
  const css = `
  .rm-hero{border:1px solid var(--line);border-radius:14px;padding:18px;background:var(--panel);margin-top:6px}
  .rm-hero .fase{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft)}
  .rm-hero .tese{font-size:15px;line-height:1.5;margin-top:8px}
  .rm-gate{margin-top:14px;border:1px solid color-mix(in srgb,var(--gold) 42%,var(--line));background:color-mix(in srgb,var(--gold) 8%,var(--panel));border-radius:12px;padding:14px}
  .rm-gate .g{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);font-weight:700}
  .rm-gate .crit{font-size:12.5px;margin-top:6px;line-height:1.45}
  .rm-gate .falha{font-size:11.5px;color:var(--ink-soft);margin-top:5px;font-style:italic}
  .rm-gate .cd{font-family:var(--mono);font-size:22px;font-weight:700;float:right;line-height:1}
  .rm-gate .cd span{display:block;font-size:8px;letter-spacing:.1em;color:var(--ink-soft);text-align:right;font-weight:400}
  .rm-wip{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:12px;color:var(--ink-soft)}
  .rm-wip .bolas{display:flex;gap:5px}
  .rm-wip .bolas i{width:9px;height:9px;border-radius:50%;border:1px solid var(--line);background:none}
  .rm-wip .bolas i.on{background:var(--gold);border-color:var(--gold)}
  .rm-trilho{margin-top:16px}
  .rm-trilho .th{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);padding-bottom:7px;border-bottom:1px solid var(--line)}
  .rm-trilho .th i{width:8px;height:8px;border-radius:50%}
  .rm-trilho .th .n{margin-left:auto;font-size:9px}
  .rm-item{display:flex;align-items:center;gap:11px;padding:11px 2px;border-bottom:1px solid var(--line);cursor:pointer;transition:.15s}
  .rm-item:hover{background:color-mix(in srgb,var(--gold) 5%,transparent)}
  .rm-item .st{width:15px;height:15px;border-radius:50%;border:1.5px solid var(--line);flex-shrink:0;display:grid;place-items:center;font-size:9px}
  .rm-item .st.ativa{border-color:var(--gold);background:var(--gold);color:var(--bg)}
  .rm-item .st.concluida{border-color:#607452;background:#607452;color:#fff}
  .rm-item .nm{font-size:13.5px}
  .rm-item .nm span{display:block;font-family:var(--mono);font-size:9px;color:var(--ink-soft);margin-top:2px}
  .rm-item .pz{margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-soft);text-align:right;flex-shrink:0}
  .rm-item .pz.perto{color:var(--gold)}
  .rm-item .dep{font-family:var(--mono);font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:9px;border:1px solid var(--line);color:var(--ink-soft);flex-shrink:0}
  .rm-sug{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--panel);margin-top:16px}
  .rm-sug .sh{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:9px}
  .rm-sug .s{font-size:12.5px;padding:7px 0;border-top:1px solid var(--line);line-height:1.45}
  .rm-sug .s:first-of-type{border-top:0}
  /* ideias */
  .rm-cap{display:flex;gap:8px;margin-top:6px}
  .rm-cap input{flex:1;padding:12px 14px;border:1px solid var(--line);border-radius:11px;background:var(--panel);color:var(--ink);font-family:inherit;font-size:13.5px}
  .rm-cap input:focus{outline:none;border-color:var(--gold)}
  .rm-ideia{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--panel);margin-top:10px}
  .rm-ideia .tx{font-size:13.5px;line-height:1.45}
  .rm-ideia .mt{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin-top:7px}
  .rm-ideia .ver{border-left:2px solid var(--gold);padding:9px 12px;margin-top:10px;font-size:12.5px;line-height:1.5;background:color-mix(in srgb,var(--gold) 6%,transparent)}
  .rm-acts{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}
  .rm-acts button{padding:8px 13px;border:1px solid var(--line);border-radius:9px;font-family:var(--mono);font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;background:none;color:var(--ink);cursor:pointer;transition:.2s}
  .rm-acts button:hover{border-color:var(--gold)}
  .rm-acts button.pri{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const S = () => window.Store;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const diasAte = iso => Math.round((new Date(iso + 'T12:00:00') - new Date()) / 864e5);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dataBR = iso => iso ? iso.split('-').reverse().join('/') : '';

  /* Trilhos reais do roadmap de carreira do Miguel (v4.1, repo
     projeto-de-vida) — mesmos nome/cor/emoji que já existiam em
     app/js/modules/projetos.js, trazidos sem reinventar. Substituem
     os 6 genéricos que serviam só de placeholder pra persona. */
  const TRILHOS = {
    produto: { nome: 'Produto', cor: '#6D8FA7', em: '🚀' },
    sting: { nome: 'Segurança · Sting', cor: '#8087B5', em: '🛡️' },
    capital: { nome: 'Capital & Carreira', cor: '#C79A5E', em: '💼' },
    academico: { nome: 'Acadêmico', cor: '#9C7FB3', em: '🎓' },
    distribuicao: { nome: 'Distribuição', cor: '#649488', em: '📣' },
    saude: { nome: 'Saúde', cor: '#789267', em: '💪' },
    vida: { nome: 'Vida & Conquistas', cor: '#C07868', em: '🏡' },
  };

  /* ---------------- estado (só o que é novo) ---------------- */
  const career = () => S().get('pj_career', { wip: 2, tese: '', fase: 1, gates: [] });
  const setCareer = c => S().set('pj_career', c);
  const ideias = () => S().get('pj_ideias', []);
  const setIdeias = v => S().set('pj_ideias', v);

  /* ---------------- ponte com as metas que já existem ---------------- */
  const M = () => S().get('mt_metas', []);
  const setM = v => S().set('mt_metas', v);

  function prog(m) {
    if (m.medir === 'valor') return Math.min(100, Math.round((m.atual || 0) / (m.alvo || 1) * 100));
    const t = m.tarefas || []; return t.length ? Math.round(t.filter(x => x.ok).length / t.length * 100) : 0;
  }
  /* status: explícito se houver, senão derivado do progresso */
  function statusDe(m) { return prog(m) >= 100 ? 'concluida' : (m.st || 'pendente'); }

  /* trilho: explícito se o usuário atribuiu, senão inferido do texto.
     Inferir é palpite — por isso fica marcado como tal na interface. */
  const PISTAS = {
    capital: ['reserva', 'dinheiro', 'poupar', 'investir', 'renda', 'dívida', 'emergência', 'salário', 'promoção', 'clt'],
    saude: ['correr', 'treino', 'academia', 'peso', 'km', 'saúde', 'exame', 'dormir', 'maratona'],
    produto: ['curso', 'cliente', 'vender', 'lançar', 'produto', 'loja', 'marca', 'faturamento', 'assessor', 'bee-commerce', 'app'],
    academico: ['faculdade', 'graduação', 'certificação', 'diploma', 'tcc', 'exame'],
    distribuicao: ['devlog', 'post', 'talk', 'artigo', 'blog', 'conteúdo', 'inglês'],
    sting: ['sting', 'solidity', 'auditoria', 'smart contract', 'segurança', 'blockchain', 'web3', 'cripto'],
  };
  function trilhoDe(m) {
    if (m.trilho && TRILHOS[m.trilho]) return { id: m.trilho, inferido: false };
    const t = (m.nome + ' ' + (m.desc || '')).toLowerCase();
    for (const k in PISTAS) if (PISTAS[k].some(p => t.includes(p))) return { id: k, inferido: true };
    return { id: 'vida', inferido: true };
  }

  function wipCount() { return M().filter(m => statusDe(m) === 'ativa').length; }

  /* ---------------- ações ---------------- */
  function setStatus(id, novo) {
    const ms = M(); const m = ms.find(x => x.id === id); if (!m) return;
    const c = career();
    if (novo === 'ativa' && statusDe(m) !== 'ativa' && wipCount() >= (c.wip || 2)) {
      window.toast(`⚠️ Limite de WIP: ${c.wip || 2} frentes ativas. Conclua ou pause uma antes de puxar outra.`);
      return;
    }
    /* trava de dependência: não ativa o que depende de coisa não concluída */
    if (novo === 'ativa' && (m.dependeDe || []).length) {
      const presos = (m.dependeDe || []).map(d => ms.find(x => x.id === d)).filter(d => d && statusDe(d) !== 'concluida');
      if (presos.length) { window.toast(`Depende de: ${presos.map(p => p.nome).join(', ')}`); return; }
    }
    m.st = novo;
    if (novo === 'ativa') { m.movs = m.movs || []; m.movs.unshift('frente ativada · ' + dataBR(hojeISO())); }
    setM(ms);
    window.Bus && window.Bus.emit('goal', { meta: m.nome, status: novo }, 1);
    window.toast(novo === 'ativa' ? `▶ Frente ativada (${wipCount()}/${c.wip || 2} WIP)` : novo === 'concluida' ? '🏆 Concluída!' : 'Meta pausada');
  }

  function editarTrilho(id) {
    const ms = M(); const m = ms.find(x => x.id === id); if (!m) return;
    const atual = trilhoDe(m);
    const outras = ms.filter(x => x.id !== id);
    window.Modal.open(`<h3>${esc(m.nome)}</h3><p class="msub">Trilho, gate e dependências — a estrutura que o roadmap usa pra saber a ordem das coisas.</p>
      <label class="f">Trilho</label><select id="rt_t">${Object.entries(TRILHOS).map(([k, v]) => `<option value="${k}"${k === atual.id ? ' selected' : ''}>${v.em} ${v.nome}</option>`).join('')}</select>
      <label class="f">Gate (marco que destrava a próxima fase)</label><select id="rt_g"><option value="">— nenhum —</option>${(career().gates || []).map(g => `<option value="${esc(g.id)}"${m.gate === g.id ? ' selected' : ''}>${esc(g.id)} — ${esc(g.nome)}</option>`).join('')}</select>
      <label class="f">Depende de concluir antes</label><select id="rt_d"><option value="">— nada —</option>${outras.map(o => `<option value="${o.id}"${(m.dependeDe || [])[0] === o.id ? ' selected' : ''}>${esc(o.nome)}</option>`).join('')}</select>
      <div class="mactions"><button class="btn2 clickable" id="rt_c">Cancelar</button><button class="btn2 primary clickable" id="rt_s">Salvar</button></div>`);
    document.getElementById('rt_c').onclick = window.Modal.close;
    document.getElementById('rt_s').onclick = () => {
      m.trilho = document.getElementById('rt_t').value;
      m.gate = document.getElementById('rt_g').value || null;
      const d = document.getElementById('rt_d').value;
      m.dependeDe = d ? [d] : [];
      setM(ms); window.Modal.close(); window.Roadmap._render(); window.toast('Estrutura salva ✔');
    };
  }

  /* ---------------- IDEIAS: capturar → estudar → veredito ---------------- */
  const STOP = ['para', 'como', 'quero', 'fazer', 'criar', 'novo', 'nova', 'meu', 'minha', 'com', 'uma', 'que', 'dos', 'das', 'the'];
  function relacionadas(texto) {
    const pal = texto.toLowerCase().split(/[^a-zà-ú0-9]+/).filter(w => w.length > 3 && !STOP.includes(w));
    return M().filter(m => { const t = (m.nome + ' ' + (m.desc || '')).toLowerCase(); return pal.some(p => t.includes(p)); });
  }

  function guardarIdeia(txt) {
    if (!txt.trim()) return;
    const is = ideias(); is.unshift({ id: uid(), texto: txt.trim(), status: 'inbox', em: hojeISO() });
    setIdeias(is); window.Roadmap._render();
    window.toast('💡 Guardada na inbox — estude com o Assessor quando quiser.');
  }

  function estudar(id) {
    const i = ideias().find(x => x.id === id); if (!i) return;
    const rel = relacionadas(i.texto);
    const e = i.estudo || {};
    const sel = (idv, opts, cur) => `<select id="${idv}">${opts.map(o => `<option value="${o[0]}"${o[0] === cur ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>`;
    window.Modal.open(`<h3>Estudar a ideia</h3><p class="msub">${esc(i.texto)}</p>
      ${rel.length ? `<p class="msub" style="color:var(--gold)">Conversa com: ${rel.map(r => esc(r.nome)).join(', ')}.</p>`
        : `<p class="msub">Não achei ligação com as metas atuais — pode ser frente nova (cuidado com o WIP).</p>`}
      <label class="f">Se der certo, o impacto é…</label>${sel('es_i', [['alto', 'Alto — muda o jogo'], ['medio', 'Médio — ajuda, não muda'], ['baixo', 'Baixo — é um desvio gostoso']], e.impacto || 'medio')}
      <label class="f">Esforço até a primeira entrega</label>${sel('es_e', [['dias', 'Dias — cabe num fim de semana'], ['semanas', 'Semanas — precisa de bloco'], ['meses', 'Meses — é uma frente inteira']], e.esforco || 'semanas')}
      <label class="f">O momento é agora?</label>${sel('es_m', [['agora', 'Sim — encaixa na fase atual'], ['depois', 'Não — briga com as frentes ativas']], e.momento || 'agora')}
      <div class="mactions"><button class="btn2 clickable" id="es_c">Cancelar</button><button class="btn2 primary clickable" id="es_s">Ver o veredito</button></div>`);
    document.getElementById('es_c').onclick = window.Modal.close;
    document.getElementById('es_s').onclick = () => {
      const imp = document.getElementById('es_i').value, esf = document.getElementById('es_e').value, mom = document.getElementById('es_m').value;
      const is = ideias(); const it = is.find(x => x.id === id);
      const cheio = wipCount() >= (career().wip || 2);
      let veredito;
      if (imp === 'alto' && mom === 'agora' && !cheio) veredito = 'Vira projeto: impacto alto, momento certo e há espaço no WIP. Quebre em 3 marcos e ative a frente.';
      else if (imp === 'alto' && mom === 'agora' && cheio) veredito = `Vale muito — mas suas ${career().wip || 2} frentes estão ocupadas. Deixe engatilhada: assim que uma fechar, esta entra primeiro.`;
      else if (imp === 'alto' && mom === 'depois') veredito = 'Guarde com carinho. Impacto alto, momento errado — revisite quando a fase virar.';
      else if (esf === 'dias' && imp !== 'baixo') veredito = 'Cabe num fim de semana e não é desvio: faça como experimento pequeno, sem virar frente.';
      else if (imp === 'baixo') veredito = 'É um desvio gostoso. Anote no diário e siga — o custo não é o tempo, é a atenção.';
      else veredito = 'Meio-termo: fatie até caber em dias. Se não couber, não é hora.';
      it.estudo = { impacto: imp, esforco: esf, momento: mom }; it.veredito = veredito; it.status = 'estudada';
      setIdeias(is); window.Modal.close(); window.Roadmap._render();
    };
  }

  function promover(id) {
    const is = ideias(); const i = is.find(x => x.id === id); if (!i) return;
    const ms = M();
    ms.push({
      id: uid(), nome: i.texto.slice(0, 60), desc: 'Nasceu de uma ideia estudada com o Assessor.',
      tipo: 'Projeto', medir: 'tarefas', emoji: '💡', cover: 'ambar',
      prazo: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
      tarefas: [], movs: ['veio da inbox de ideias · ' + dataBR(hojeISO())], st: 'pendente'
    });
    setM(ms);
    i.status = 'promovida'; setIdeias(is);
    window.Bus && window.Bus.emit('goal', { origem: 'ideia' }, 1);
    window.Roadmap._render(); window.toast('🚀 Virou meta no roadmap');
  }

  function descartar(id) { const is = ideias().filter(x => x.id !== id); setIdeias(is); window.Roadmap._render(); window.toast('Ideia descartada'); }

  /* ---------------- sugestões dinâmicas ---------------- */
  /* o gate mais relevante agora: o pendente mais próximo do prazo; se
     nenhum estiver pendente, o mais recém-vencido. Usado nas sugestões
     — o hero mostra TODOS, isto é só pra saber de qual falar primeiro. */
  function gateEmFoco(c) {
    const gs = (c.gates || []).filter(g => g.prazo);
    if (!gs.length) return null;
    const abertos = gs.filter(g => (g.status || 'pendente') !== 'concluido').map(g => ({ g, d: diasAte(g.prazo) }));
    if (!abertos.length) return null;
    const futuros = abertos.filter(x => x.d >= 0).sort((a, b) => a.d - b.d);
    if (futuros.length) return futuros[0].g;
    return abertos.sort((a, b) => b.d - a.d)[0].g; // o mais recém-vencido
  }

  function sugestoes() {
    const out = [];
    const c = career(), ms = M();
    const g = gateEmFoco(c);
    if (g && g.prazo) {
      const d = diasAte(g.prazo);
      const chave = ms.find(m => m.gate === g.id && statusDe(m) === 'ativa');
      out.push(d < 0
        ? `O gate <b>${esc(g.id)}</b> venceu há ${Math.abs(d)} dias. Vale remarcar o prazo ou revisar o critério — gate que não se cobra não é gate.`
        : `Faltam <b>${d} dias</b> para o gate <b>${esc(g.id)}</b>.${chave ? ` A frente <b>${esc(chave.nome)}</b> está puxando.` : ' <b>Nenhuma frente ativa aponta pra ele</b> — quer ativar uma?'}`);
    }
    const w = wipCount(), lim = c.wip || 2;
    if (w > lim) out.push(`Você tem <b>${w} frentes ativas</b> e o seu limite é ${lim}. Foco disperso rende menos — considere pausar uma.`);
    else if (w === 0 && ms.length) out.push('Nenhuma frente ativa agora. Escolha <b>uma</b> meta pra puxar — o roadmap só anda com alguém empurrando.');
    else if (w < lim) out.push(`${w} de ${lim} frentes ocupadas — há espaço para mais uma, se o momento pedir.`);
    const inbox = ideias().filter(i => i.status === 'inbox').length;
    if (inbox) out.push(`<b>${inbox}</b> ${inbox === 1 ? 'ideia esperando' : 'ideias esperando'} estudo na inbox.`);
    const semEstrutura = ms.filter(m => !m.trilho).length;
    if (semEstrutura) out.push(`<b>${semEstrutura}</b> ${semEstrutura === 1 ? 'meta ainda tem trilho' : 'metas ainda têm trilho'} só palpitado por mim. Toque numa pra confirmar o trilho de verdade.`);
    return out;
  }

  /* ---------------- vistas ---------------- */
  function vRoadmap() {
    const c = career(), ms = M();
    const gates = c.gates || [];
    const lim = c.wip || 2, w = wipCount();
    const porTrilho = {};
    ms.forEach(m => { const t = trilhoDe(m); (porTrilho[t.id] = porTrilho[t.id] || []).push({ m, inferido: t.inferido }); });

    const hero = `<div class="rm-hero">
      <div class="fase">Fase ${c.fase || 1}${c.tese ? ' · sua tese' : ''}</div>
      ${c.tese ? `<div class="tese">${esc(c.tese)}</div>` : `<div class="tese" style="color:var(--ink-soft)">Sem tese escrita ainda. A tese é a frase que explica por que estas metas, e não outras — toque em "Definir fase e gates".</div>`}
      ${gates.map(g => `<div class="rm-gate"><div class="cd">${diasAte(g.prazo)}<span>dias</span></div>
        <div class="g">⛩️ GATE ${esc(g.id)} — ${esc(g.nome)}</div>
        <div class="crit">Condição: ${esc(g.criterio || '—')}</div>
        ${g.seFalhar ? `<div class="falha">Se falhar: ${esc(g.seFalhar)}</div>` : ''}</div>`).join('')}
      <div class="rm-wip"><span>WIP</span><div class="bolas">${Array.from({ length: Math.max(lim, w) }, (_, i) => `<i class="${i < w ? 'on' : ''}"></i>`).join('')}</div>
        <span>${w} de ${lim} ${w === 1 ? 'frente ativa' : 'frentes ativas'}</span>
        <button class="msbtn clickable" id="rm_cfg" style="margin-left:auto">Definir fase e gates</button></div></div>`;

    const trilhos = Object.keys(TRILHOS).filter(k => porTrilho[k]).map(k => {
      const T = TRILHOS[k], itens = porTrilho[k];
      return `<div class="rm-trilho"><div class="th"><i style="background:${T.cor}"></i>${T.em} ${T.nome}<span class="n">${itens.length}</span></div>
        ${itens.map(({ m, inferido }) => {
        const s = statusDe(m), d = m.prazo ? diasAte(m.prazo) : null;
        const bloq = (m.dependeDe || []).some(id => { const dd = ms.find(x => x.id === id); return dd && statusDe(dd) !== 'concluida'; });
        return `<div class="rm-item" data-est="${m.id}">
          <div class="st ${s}">${s === 'concluida' ? '✓' : s === 'ativa' ? '▶' : ''}</div>
          <div class="nm">${esc(m.nome)}<span>${prog(m)}% ${inferido ? '· trilho palpitado' : ''}${m.gate ? ' · gate ' + esc(m.gate) : ''}</span></div>
          ${bloq ? '<div class="dep">bloqueada</div>' : ''}
          ${d != null ? `<div class="pz ${d < 30 ? 'perto' : ''}">${d < 0 ? 'venceu' : d + 'd'}<br>${dataBR(m.prazo)}</div>` : ''}
        </div>`;
      }).join('')}</div>`;
    }).join('');

    const sug = sugestoes();
    return hero + trilhos + (sug.length ? `<div class="rm-sug"><div class="sh">O que eu observo</div>${sug.map(s => `<div class="s">${s}</div>`).join('')}</div>` : '');
  }

  function vIdeias() {
    const is = ideias();
    const inbox = is.filter(i => i.status !== 'promovida');
    return `<div class="rm-cap"><input type="text" id="rm_nova" placeholder="Uma ideia solta… (o Assessor te ajuda a decidir depois)">
      <button class="msbtn primary clickable" id="rm_add">Guardar</button></div>
      <p class="ms-sub" style="margin-top:10px">Ideia guardada não vira dívida. Ela espera aqui até você ter tempo de estudar com calma — impacto, esforço e momento.</p>
      ${inbox.length ? inbox.map(i => `<div class="rm-ideia">
        <div class="tx">${esc(i.texto)}</div>
        <div class="mt">${dataBR(i.em)} · ${i.status === 'estudada' ? 'estudada' : 'na inbox'}</div>
        ${i.veredito ? `<div class="ver">${esc(i.veredito)}</div>` : ''}
        <div class="rm-acts">
          <button class="clickable" data-est-id="${i.id}">${i.veredito ? 'Reestudar' : 'Estudar com o Assessor'}</button>
          ${i.veredito ? `<button class="pri clickable" data-prom="${i.id}">Virar meta</button>` : ''}
          <button class="clickable" data-desc="${i.id}">Descartar</button>
        </div></div>`).join('')
        : `<div class="fempty" style="padding:40px">Nenhuma ideia guardada. Quando bater uma, joga aqui — depois a gente estuda.</div>`}`;
  }

  /* Nota de porte: o app/ antigo tinha uma aba "Conquistas" aqui.
     Não foi trazida de propósito — a v2 já tem a aba "Concluídas"
     neste mesmo módulo e o Módulo 07 (Linha do Tempo) inteiro para
     marcos. Trazê-la seria duplicar duas telas que já existem. */

  /* ---------------- configuração de fase e gates ---------------- */
  function config() {
    const c = career();
    /* A tela só edita o PRIMEIRO gate (limitação conhecida — o
       roadmap real do Miguel tem 4). Os demais (c.gates.slice(1))
       são preservados intactos: sem isso, salvar aqui só pra ajustar
       WIP ou tese apagaria os outros 3 silenciosamente. */
    const g = (c.gates || [])[0] || {};
    const outros = (c.gates || []).slice(1);
    window.Modal.open(`<h3>Fase e gates</h3><p class="msub">O gate é um marco falsificável: uma condição com prazo que, se não for cumprida, muda o plano. É o que impede o roadmap de virar lista de desejos.</p>
      <label class="f">Sua tese (por que estas metas, e não outras)</label><input type="text" id="cf_t" value="${esc(c.tese || '')}" placeholder="ex.: este ano é de construir base, não de escalar">
      <label class="f">Fase atual</label><input type="number" id="cf_f" min="1" max="9" value="${c.fase || 1}">
      <label class="f">Limite de WIP (frentes ativas ao mesmo tempo)</label><input type="number" id="cf_w" min="1" max="6" value="${c.wip || 2}">
      <label class="f">Gate — código e nome</label><input type="text" id="cf_gi" value="${esc(g.id || '')}" placeholder="G1"><input type="text" id="cf_gn" value="${esc(g.nome || '')}" placeholder="Nome do gate" style="margin-top:8px">
      <label class="f">Critério (o que precisa ser verdade)</label><input type="text" id="cf_gc" value="${esc(g.criterio || '')}" placeholder="ex.: 10 alunos pagantes">
      <label class="f">Se falhar…</label><input type="text" id="cf_gf" value="${esc(g.seFalhar || '')}" placeholder="ex.: volto pro plano B e adio o lançamento">
      <label class="f">Prazo do gate</label><input type="date" id="cf_gp" value="${esc(g.prazo || '')}">
      ${outros.length ? `<p class="msub">+ ${outros.length} ${outros.length === 1 ? 'gate preservado' : 'gates preservados'} (${outros.map(x => esc(x.id)).join(', ')}) — esta tela edita só o primeiro por enquanto.</p>` : ''}
      <div class="mactions"><button class="btn2 clickable" id="cf_c">Cancelar</button><button class="btn2 primary clickable" id="cf_s">Salvar</button></div>`);
    document.getElementById('cf_c').onclick = window.Modal.close;
    document.getElementById('cf_s').onclick = () => {
      const nc = career();
      nc.tese = document.getElementById('cf_t').value.trim();
      nc.fase = +document.getElementById('cf_f').value || 1;
      nc.wip = +document.getElementById('cf_w').value || 2;
      const gi = document.getElementById('cf_gi').value.trim();
      const primeiro = gi ? [{
        id: gi, nome: document.getElementById('cf_gn').value.trim(),
        criterio: document.getElementById('cf_gc').value.trim(),
        seFalhar: document.getElementById('cf_gf').value.trim(),
        prazo: document.getElementById('cf_gp').value
      }] : [];
      nc.gates = primeiro.concat(outros);
      setCareer(nc); window.Modal.close(); window.Roadmap._render(); window.toast('Roadmap atualizado ✔');
    };
  }

  /* ---------------- gaveta de uma meta (estrutura + status) ---------------- */
  function abrirEstrutura(id) {
    const m = M().find(x => x.id === id); if (!m) return;
    const s = statusDe(m), t = trilhoDe(m);
    window.Modal.open(`<h3>${esc(m.nome)}</h3>
      <p class="msub">${TRILHOS[t.id].em} ${TRILHOS[t.id].nome}${t.inferido ? ' (palpitado por mim — confirme abaixo)' : ''} · ${prog(m)}% · prazo ${dataBR(m.prazo)}</p>
      <div class="mactions" style="flex-wrap:wrap">
        ${s !== 'ativa' ? `<button class="btn2 primary clickable" id="rm_at">▶ Ativar frente</button>` : `<button class="btn2 clickable" id="rm_pa">⏸ Pausar</button>`}
        ${s !== 'concluida' ? `<button class="btn2 clickable" id="rm_ok">✓ Concluir</button>` : ''}
        <button class="btn2 clickable" id="rm_ed">Trilho e dependências</button>
      </div>`);
    const b = (i, f) => { const e = document.getElementById(i); if (e) e.onclick = f; };
    b('rm_at', () => { window.Modal.close(); setStatus(id, 'ativa'); window.Roadmap._render(); });
    b('rm_pa', () => { window.Modal.close(); setStatus(id, 'pendente'); window.Roadmap._render(); });
    b('rm_ok', () => { window.Modal.close(); setStatus(id, 'concluida'); window.Roadmap._render(); });
    b('rm_ed', () => { window.Modal.close(); editarTrilho(id); });
  }

  /* ---------------- liga os eventos da vista renderizada ---------------- */
  function bind(el, rerender) {
    window.Roadmap._render = rerender;
    const q = (s, f) => el.querySelectorAll(s).forEach(f);
    const one = (i, f) => { const e = document.getElementById(i); if (e) e.onclick = f; };
    one('rm_cfg', config);
    q('[data-est]', b => b.onclick = () => abrirEstrutura(b.dataset.est));
    one('rm_add', () => { const i = document.getElementById('rm_nova'); guardarIdeia(i.value); });
    const inp = document.getElementById('rm_nova');
    if (inp) inp.onkeydown = e => { if (e.key === 'Enter') guardarIdeia(inp.value); };
    q('[data-est-id]', b => b.onclick = () => estudar(b.dataset.estId));
    q('[data-prom]', b => b.onclick = () => promover(b.dataset.prom));
    q('[data-desc]', b => b.onclick = () => descartar(b.dataset.desc));
  }

  window.Roadmap = {
    TRILHOS, vRoadmap, vIdeias, bind,
    wipCount, statusDe, trilhoDe, setStatus,
    career, setCareer, sugestoes,
    _render() { }
  };
})();
