/* ============================================================
   ASSESSOR.IA — Tela cheia PROJETOS & METAS (adaptação Foccum, fase 4)
   Cards c/ capa · Pulso · Linha do tempo · ritmo pro prazo · gaveta
   ============================================================ */
'use strict';
(function () {
  const css = `
  .mt-layout{display:grid;grid-template-columns:1fr 280px;gap:16px;margin-top:6px}
  .mt-feat{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);display:grid;grid-template-columns:200px 1fr}
  .mt-cover{background:var(--cv);min-height:150px;display:grid;place-items:center;font-size:46px;position:relative}
  .mt-cover .badge{position:absolute;top:10px;left:10px;font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:12px;background:rgba(0,0,0,.5);color:#B8A96B}
  .mt-feat .body{padding:18px}
  .mt-feat .crumb{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft)}
  .mt-feat h3{font-size:24px;font-weight:400;letter-spacing:-.02em;margin:6px 0 4px}
  .mt-feat p{font-size:12.5px;color:var(--ink-soft);line-height:1.4}
  .mt-prog{display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 6px}
  .mt-prog b{font-family:var(--mono);font-size:22px;font-weight:700}
  .mt-bar{height:7px;border-radius:5px;background:var(--line);overflow:hidden}.mt-bar i{display:block;height:100%;border-radius:5px;background:var(--cv2,var(--gold))}
  .mt-feat .ft{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11px;color:var(--ink-soft)}
  .mt-feat .ft b{color:#607452}
  .mt-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
  .mt-card{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel);cursor:pointer;transition:.2s}
  .mt-card:hover{border-color:var(--gold);transform:translateY(-3px)}
  .mt-card .cv{background:var(--cv);height:110px;display:grid;place-items:center;font-size:36px;position:relative}
  .mt-card .cv .badge{position:absolute;top:8px;right:8px;font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:10px;background:rgba(0,0,0,.5);color:#B8A96B}
  .mt-card .bd{padding:13px}.mt-card .bd .nm{font-size:14.5px;font-weight:500}
  .mt-card .bd .mn{font-family:var(--mono);font-size:9.5px;color:var(--ink-soft);margin:5px 0 8px}
  .mt-panel{border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--panel);margin-bottom:14px}
  .mt-panel .ph{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:4px}
  .mt-panel .ps{font-size:11.5px;color:var(--ink-soft);margin-bottom:12px}
  .mt-pulse{padding:11px 0;border-top:1px solid var(--line)}
  .mt-pulse .t{display:flex;justify-content:space-between;font-size:12.5px;align-items:center}
  .mt-pulse .t .tag{font-family:var(--mono);font-size:8px;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:9px;border:1px solid var(--line);color:var(--ink-soft)}
  .mt-pulse .dots{display:flex;gap:2px;margin-top:7px}
  .mt-pulse .dots i{flex:1;height:3px;border-radius:2px;background:var(--line)}
  .mt-pulse .dots i.on{background:var(--gold)}
  .mt-pulse .lst{font-size:10.5px;color:var(--ink-soft);margin-top:5px}
  .mt-tl{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line);align-items:center}
  .mt-tl .dt{text-align:center;font-family:var(--mono);flex-shrink:0;width:34px}
  .mt-tl .dt .d{font-size:17px;font-weight:700;line-height:1}.mt-tl .dt .m{font-size:8px;color:var(--ink-soft)}
  .mt-tl .nm{font-size:13px}.mt-tl .nm span{display:block;font-family:var(--mono);font-size:9px;color:var(--ink-soft)}
  /* gaveta de meta */
  .mt-drawer{position:fixed;top:0;right:0;bottom:0;width:min(460px,94vw);z-index:78;background:var(--panel);border-left:1px solid var(--line);transform:translateX(100%);transition:transform .4s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding:26px 26px 20px;overflow:auto}
  .mt-drawer.open{transform:none}
  .mt-drawer .dh{display:flex;justify-content:space-between;align-items:flex-start}
  .mt-drawer .dh h3{font-size:22px;font-weight:400}
  .mt-drawer .dh .crumb{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#607452}
  .mt-drawer .x{background:none;border:1px solid var(--line);border-radius:50%;width:30px;height:30px;color:var(--ink);cursor:pointer}
  .mt-ritmo{background:color-mix(in srgb,var(--gold) 8%,var(--panel));border:1px solid color-mix(in srgb,var(--gold) 40%,var(--line));border-radius:12px;padding:14px;margin:16px 0;font-size:13px;line-height:1.5}
  .mt-ritmo b{color:var(--gold)}
  .mt-det{display:flex;justify-content:space-between;padding:13px 0;border-top:1px solid var(--line);font-size:13.5px;cursor:pointer}
  .mt-det .v{font-family:var(--mono);color:var(--ink-soft)}
  .mt-acts{display:flex;gap:8px;margin-top:auto;padding-top:16px;flex-wrap:wrap}
  .mt-acts button{flex:1;min-width:80px;padding:11px;border:1px solid var(--line);border-radius:10px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:none;color:var(--ink);cursor:pointer;transition:.2s}
  .mt-acts button:hover{border-color:var(--gold)}
  .mt-acts button.pri{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .mt-acts button.dng{color:#A2402A;border-color:#A2402A55}
  .mt-scrim{position:fixed;inset:0;z-index:77;background:rgba(0,0,0,.34);opacity:0;pointer-events:none;transition:.35s}
  .mt-scrim.open{opacity:1;pointer-events:auto}
  @media(max-width:900px){.mt-layout{grid-template-columns:1fr}.mt-feat{grid-template-columns:1fr}.mt-cards{grid-template-columns:1fr}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, brl = window.brl || (v => 'R$ ' + Math.round(v).toLocaleString('pt-BR'));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const hoje = () => new Date();
  const diasAte = iso => Math.round((new Date(iso + 'T12:00:00') - hoje()) / 864e5);
  const COVERS = { verde: 'linear-gradient(135deg,#2A3323,#607452)', roxo: 'linear-gradient(135deg,#2E2537,#835E9F)', ambar: 'linear-gradient(135deg,#3a2e1b,#D97F5A)', azul: 'linear-gradient(135deg,#222E38,#527288)' };

  function seed() {
    if (S().get('mt_metas')) return;
    const ano = hoje().getFullYear();
    S().set('mt_metas', [
      { id: uid(), nome: 'Aprender inglês fluente', desc: 'Estudar todo dia e destravar a conversação até o fim do ano.', tipo: 'Meta', medir: 'tarefas', emoji: '🗣️', cover: 'azul', prazo: `${ano}-12-24`, tarefas: [{ t: 'Assistir série legendada', ok: 1 }, { t: 'Aula de conversação', ok: 1 }, { t: 'Ler artigo técnico', ok: 1 }, { t: 'Gravar áudio de 2min', ok: 1 }, { t: 'Prova de nível', ok: 0 }], movs: ['+1 aula · hoje'] },
      { id: uid(), nome: 'Ler 10 livros', desc: 'Puxar a meta de 10 livros no ano — 1 por mês, sem pressa.', tipo: 'Meta', medir: 'tarefas', emoji: '📚', cover: 'verde', prazo: `${ano + 1}-02-02`, tarefas: [{ t: 'Hábitos Atômicos', ok: 1 }, { t: 'O Poder do Agora', ok: 1 }, { t: 'Essencialismo', ok: 1 }, ...Array.from({ length: 7 }, (_, i) => ({ t: 'Livro ' + (i + 4), ok: 0 }))], movs: ['+1 livro · 11 jul'] },
      { id: uid(), nome: 'Reserva de emergência', desc: 'Juntar o equivalente a 6 meses de despesas.', tipo: 'Projeto', medir: 'valor', alvo: 30000, atual: 12500, aporte: 1750, emoji: '🛟', cover: 'ambar', prazo: `${ano + 1}-05-13`, tarefas: [], movs: [] },
    ]);
  }

  const M = () => S().get('mt_metas', []);
  const setM = v => S().set('mt_metas', v);
  function prog(m) {
    if (m.medir === 'valor') return Math.min(100, Math.round(m.atual / m.alvo * 100));
    const done = m.tarefas.filter(t => t.ok).length; return m.tarefas.length ? Math.round(done / m.tarefas.length * 100) : 0;
  }
  function ritmoPontos(m) {
    const total = diasAte(m.prazo) + 90; // janela aproximada de vida da meta
    const decorrido = 90; const espTempo = Math.min(100, Math.round(decorrido / Math.max(total, 1) * 100));
    return prog(m) - espTempo;
  }
  function badge(m) { const p = ritmoPontos(m); return p > 5 ? 'Adiantada' : p < -5 ? 'Atrasada' : 'No ritmo'; }

  let tab = 'todos', el = null, fecharFn = null;

  function coverCSS(m) { return `--cv:${COVERS[m.cover] || COVERS.verde};--cv2:${m.cover === 'ambar' ? '#E39C7A' : m.cover === 'roxo' ? '#9C7FB3' : m.cover === 'azul' ? '#6D8FA7' : '#607452'}`; }

  function vLista() {
    const metas = M().filter(m => tab === 'todos' || (tab === 'metas' && m.tipo === 'Meta') || (tab === 'projetos' && m.tipo === 'Projeto') || (tab === 'concluidas' && prog(m) >= 100));
    if (!metas.length) return `<div class="fempty" style="padding:50px">Nenhuma meta aqui ainda. Crie a primeira com "+ Nova meta".</div>`;
    const feat = metas[0];
    const resto = metas.slice(1);
    const pontos = ritmoPontos(feat);
    return `<div class="mt-layout"><div>
      <div class="mt-feat" style="${coverCSS(feat)}">
        <div class="mt-cover"><span class="badge">${badge(feat)}</span>${feat.emoji}</div>
        <div class="body"><div class="crumb">Em destaque · ${feat.tipo} · ${diasAte(feat.prazo)} dias</div>
          <h3>${feat.nome}</h3><p>${feat.desc}</p>
          <div class="mt-prog"><span style="font-size:12px;color:var(--ink-soft)">${feat.medir === 'valor' ? brl(feat.atual) + ' de ' + brl(feat.alvo) : feat.tarefas.filter(t => t.ok).length + '/' + feat.tarefas.length + ' tarefas'}</span><b>${prog(feat)}%</b></div>
          <div class="mt-bar"><i style="width:${prog(feat)}%"></i></div>
          <div class="ft"><span>${pontos >= 0 ? '<b>' + pontos + ' pontos à frente</b> do ritmo pro prazo' : Math.abs(pontos) + ' pontos atrás do ritmo'}</span><button class="msbtn clickable" data-open="${feat.id}">Detalhes</button></div>
        </div>
      </div>
      ${resto.length ? `<div class="mt-cards">${resto.map(m => `<div class="mt-card clickable" data-open="${m.id}" style="${coverCSS(m)}">
        <div class="cv"><span class="badge">${badge(m)}</span>${m.emoji}</div>
        <div class="bd"><div class="nm">${m.nome}</div><div class="mn">${diasAte(m.prazo)} dias · ${m.medir === 'valor' ? brl(m.atual) + '/' + brl(m.alvo) : m.tarefas.filter(t => t.ok).length + '/' + m.tarefas.length}</div>
          <div class="mt-bar"><i style="width:${prog(m)}%"></i></div></div></div>`).join('')}</div>` : ''}
    </div>
    <div>
      <div class="mt-panel"><div class="ph">Pulso</div><div class="ps">Atividade dos últimos 30 dias, meta a meta.</div>
        ${metas.map(m => { const p = prog(m); const dots = Array.from({ length: 14 }, (_, i) => `<i class="${(m.movs.length && i > 9) || Math.random() < p / 200 ? 'on' : ''}"></i>`).join('');
          return `<div class="mt-pulse"><div class="t"><span>${m.nome}</span><span class="tag">${m.movs.length ? 'Em movimento' : 'Nova'}</span></div><div class="dots">${dots}</div><div class="lst">${m.movs[0] || 'Sem atividade ainda.'}</div></div>`; }).join('')}
      </div>
      <div class="mt-panel"><div class="ph">Linha do tempo</div><div class="ps">Os prazos na ordem em que chegam.</div>
        ${metas.slice().sort((a, b) => a.prazo.localeCompare(b.prazo)).map(m => { const d = new Date(m.prazo + 'T12:00:00'); const MM = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
          return `<div class="mt-tl"><div class="dt"><div class="d">${d.getDate()}</div><div class="m">${MM[d.getMonth()]}</div></div><div class="nm">${m.nome}<span>${diasAte(m.prazo)} dias · ${prog(m)}%</span></div></div>`; }).join('')}
      </div>
    </div></div>`;
  }

  /* ---------- gaveta de detalhe ---------- */
  function abrir(id) {
    const m = M().find(x => x.id === id); if (!m) return;
    const p = prog(m);
    let ritmo = '';
    if (m.medir === 'valor') {
      const falta = m.alvo - m.atual, meses = Math.max(1, Math.round(diasAte(m.prazo) / 30)), porMes = Math.round(falta / meses);
      const noRitmo = m.aporte >= porMes;
      ritmo = `Faltam <b>${brl(falta)}</b> · guardando <b>${brl(m.aporte)}/mês</b> ${noRitmo ? 'você fecha no prazo ✔' : '— precisaria de ' + brl(porMes) + '/mês pra fechar no prazo'}`;
    } else {
      const pontos = ritmoPontos(m);
      ritmo = pontos >= 0 ? `Você está <b>${pontos} pontos à frente</b> do ritmo. Mantendo, conclui antes do prazo.` : `Você está <b>${Math.abs(pontos)} pontos atrás</b>. Um bloco a mais por semana recupera.`;
    }
    document.getElementById('mtDrawer').innerHTML = `
      <div class="dh"><div><div class="crumb">${badge(m)} · ${m.tipo} · ${diasAte(m.prazo)} dias</div><h3>${m.nome}</h3></div><button class="x clickable" id="mt_x">✕</button></div>
      <p style="font-size:13px;color:var(--ink-soft);margin-top:8px">${m.desc}</p>
      <div class="mt-prog"><span style="font-size:12px;color:var(--ink-soft)">Progresso geral</span><b>${p}%</b></div>
      <div class="mt-bar"><i style="width:${p}%;background:var(--gold)"></i></div>
      <div class="mt-ritmo">${ritmo}</div>
      <div class="mt-det" data-sub="tarefas"><span>📋 Tarefas</span><span class="v">${m.tarefas.filter(t => t.ok).length}/${m.tarefas.length} ›</span></div>
      ${m.medir === 'valor' ? `<div class="mt-det" data-sub="fin"><span>💰 Financeiro</span><span class="v">${brl(m.atual)} ›</span></div>` : ''}
      <div style="font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin:18px 0 8px">Movimentos</div>
      ${m.movs.length ? m.movs.map(mv => `<div style="font-size:13px;padding:8px 0;border-top:1px solid var(--line)">${mv}</div>`).join('') : '<div style="font-size:13px;color:var(--ink-soft)">Sem movimentos ainda.</div>'}
      <div class="mt-acts">
        <button class="dng clickable" id="mt_del">Remover</button>
        <button class="clickable" id="mt_tar">+ Tarefa</button>
        ${m.medir === 'valor' ? '<button class="clickable" id="mt_guardar">Guardar</button>' : ''}
        <button class="pri clickable" id="mt_concluir">Concluir</button>
      </div>`;
    document.getElementById('mtScrim').classList.add('open');
    document.getElementById('mtDrawer').classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    document.getElementById('mt_x').onclick = fechar;
    document.getElementById('mt_del').onclick = () => { setM(M().filter(x => x.id !== id)); fechar(); render(); window.toast('Meta removida'); };
    document.getElementById('mt_concluir').onclick = () => { const ms = M(); const mm = ms.find(x => x.id === id); if (mm.medir === 'valor') mm.atual = mm.alvo; else mm.tarefas.forEach(t => t.ok = 1); mm.movs.unshift('✔ concluída · hoje'); setM(ms); window.Bus.emit('goal', { meta: mm.nome }, 1); fechar(); render(); window.toast('🎉 Meta concluída!'); };
    const tar = document.getElementById('mt_tar'); if (tar) tar.onclick = () => {
      window.Modal.open(`<h3>Nova tarefa da meta</h3><label class="f">O quê?</label><input type="text" id="mt_tt" placeholder="ex.: Ler capítulo 3"><div class="mactions"><button class="btn2 clickable" id="mt_tc">Cancelar</button><button class="btn2 primary clickable" id="mt_ts">Adicionar</button></div>`);
      document.getElementById('mt_tc').onclick = window.Modal.close;
      document.getElementById('mt_ts').onclick = () => { const v = document.getElementById('mt_tt').value.trim(); if (!v) return; const ms = M(); ms.find(x => x.id === id).tarefas.push({ t: v, ok: 0 }); setM(ms); window.Modal.close(); abrir(id); render(); window.toast('Tarefa adicionada ✔'); };
    };
    const gd = document.getElementById('mt_guardar'); if (gd) gd.onclick = () => {
      window.Modal.open(`<h3>Guardar na meta</h3><label class="f">Valor (R$)</label><input type="number" id="mt_gv" placeholder="${m.aporte}"><div class="mactions"><button class="btn2 clickable" id="mt_gc">Cancelar</button><button class="btn2 primary clickable" id="mt_gs">Guardar</button></div>`);
      document.getElementById('mt_gc').onclick = window.Modal.close;
      document.getElementById('mt_gs').onclick = () => { const v = parseFloat(document.getElementById('mt_gv').value) || m.aporte; const ms = M(); const mm = ms.find(x => x.id === id); mm.atual = Math.min(mm.alvo, mm.atual + v); mm.movs.unshift('+ ' + brl(v) + ' · hoje'); setM(ms); window.Bus.emit('goal', { meta: mm.nome, guardado: v }, v); window.Modal.close(); abrir(id); render(); window.toast('💰 ' + brl(v) + ' guardado ✔'); };
    };
    document.querySelectorAll('.mt-det').forEach(d => d.onclick = () => window.toast(d.dataset.sub === 'fin' ? 'Ligado ao módulo Financeiro' : m.tarefas.map(t => (t.ok ? '✓ ' : '○ ') + t.t).join(' · ') || 'Sem tarefas'));
  }
  function fechar() { document.getElementById('mtScrim').classList.remove('open'); document.getElementById('mtDrawer').classList.remove('open'); document.documentElement.style.overflow = 'hidden'; }

  function novaMeta() {
    window.Modal.open(`<h3>Novo objetivo</h3><p class="msub">Um alvo com prazo e um jeito de medir — o resto o assessor acompanha.</p>
      <label class="f">Nome</label><input type="text" id="nm_n" placeholder="Nome da meta">
      <label class="f">Descrição</label><input type="text" id="nm_d" placeholder="Opcional">
      <label class="f">Tipo</label><select id="nm_t"><option>Meta</option><option>Projeto</option></select>
      <label class="f">Prazo</label><input type="date" id="nm_p" value="${new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10)}">
      <label class="f">Medir por</label><select id="nm_m"><option value="tarefas">Tarefas</option><option value="valor">Valor (R$)</option></select>
      <div class="mactions"><button class="btn2 clickable" id="nm_c">Cancelar</button><button class="btn2 primary clickable" id="nm_s">Criar</button></div>`);
    document.getElementById('nm_c').onclick = window.Modal.close;
    document.getElementById('nm_s').onclick = () => {
      const n = document.getElementById('nm_n').value.trim(); if (!n) { window.toast('Dá um nome pra meta 🙂'); return; }
      const medir = document.getElementById('nm_m').value;
      const m = { id: uid(), nome: n, desc: document.getElementById('nm_d').value || '', tipo: document.getElementById('nm_t').value, medir, emoji: '🎯', cover: ['verde', 'roxo', 'ambar', 'azul'][Math.floor(Math.random() * 4)], prazo: document.getElementById('nm_p').value, tarefas: [], movs: [] };
      if (medir === 'valor') { m.alvo = 10000; m.atual = 0; m.aporte = 500; }
      const ms = M(); ms.push(m); setM(ms); window.Modal.close(); render(); window.toast('Objetivo criado ✔');
    };
  }

  /* Roadmap e Ideias vêm da camada resgatada (roadmap.js). Se o
     arquivo não estiver carregado, as abas somem e o módulo segue
     funcionando exatamente como antes. */
  const RM = () => window.Roadmap;
  const TABS = [['todos', 'Todos'], ['metas', 'Metas'], ['projetos', 'Projetos'], ['concluidas', 'Concluídas'], ['roadmap', 'Roadmap'], ['ideias', 'Ideias']];
  const abas = () => TABS.filter(([k]) => (k !== 'roadmap' && k !== 'ideias') || RM());

  function corpo() {
    if (tab === 'roadmap' && RM()) return RM().vRoadmap();
    if (tab === 'ideias' && RM()) return RM().vIdeias();
    return vLista();
  }

  function render() {
    if (!el) return;
    const naLista = tab !== 'roadmap' && tab !== 'ideias';
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#9C7FB3">◦ MÓDULO 06 · PROJETOS & SONHOS</span>
        <button class="ms-close clickable" id="mt_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Projetos & Sonhos</h1>
      <p class="ms-sub">Cada sonho vira um alvo com prazo e ritmo. O assessor mostra se você está adiantado — e quanto falta.</p>
      <div class="ms-tabs">${abas().map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n} ${k === 'todos' ? M().length : ''}</button>`).join('')}
        ${naLista ? `<button class="msbtn primary clickable" id="mt_nova" style="margin-left:auto">+ Nova meta</button>` : ''}</div>
      ${corpo()}</div>
      <div class="mt-scrim" id="mtScrim"></div><aside class="mt-drawer" id="mtDrawer"></aside>`;
    document.getElementById('mt_close').onclick = () => fecharFn && fecharFn();
    const nova = document.getElementById('mt_nova'); if (nova) nova.onclick = novaMeta;
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-open]').forEach(b => b.onclick = e => { e.stopPropagation(); abrir(b.dataset.open); });
    document.getElementById('mtScrim').onclick = fechar;
    if (!naLista && RM()) RM().bind(el, render);
  }

  window.Screens = window.Screens || {};
  window.Screens.projetos = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'todos'; render(); } };
})();
