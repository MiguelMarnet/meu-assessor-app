/* ============================================================
   ASSESSOR.IA — Simulador do WhatsApp (adaptação Foccum, fase 6)
   Registra por mensagem, responde "agenda", grava nos MESMOS dados
   (tx, r_tasks, r_habitos) → reflete nos módulos. FAB + overlay.
   ============================================================ */
'use strict';
(function () {
  const css = `
  .wa-fab{position:fixed;right:24px;bottom:24px;z-index:64;width:54px;height:54px;border-radius:50%;
    background:#25D366;color:#fff;border:none;cursor:pointer;font-size:24px;display:grid;place-items:center;
    box-shadow:0 10px 30px rgba(37,211,102,.45);transition:transform .2s}
  .wa-fab:hover{transform:scale(1.08)}
  .wa-scrim{position:fixed;inset:0;z-index:88;background:rgba(0,0,0,.55);display:grid;place-items:center;
    opacity:0;pointer-events:none;transition:.35s}
  .wa-scrim.on{opacity:1;pointer-events:auto}
  .wa-phone{width:min(390px,94vw);height:min(760px,92vh);background:#0b0b10;border-radius:38px;padding:11px;
    box-shadow:0 40px 90px rgba(0,0,0,.5);position:relative;transform:translateY(20px) scale(.98);transition:.35s}
  .wa-scrim.on .wa-phone{transform:none}
  .wa-screen{background:#e5 ddd5;background:#ded3c7;height:100%;border-radius:30px;overflow:hidden;display:flex;flex-direction:column;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='none' stroke='%23c9bcab' stroke-width='1' opacity='.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Cpath d='M12 12h6M44 46h6'/%3E%3C/g%3E%3C/svg%3E")}
  .wa-top{background:#075e54;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}
  .wa-top .av{width:38px;height:38px;border-radius:50%;background:#128c7e;display:grid;place-items:center;font-size:18px}
  .wa-top .nm{font-weight:600;font-size:15px}.wa-top .nm span{display:block;font-weight:400;font-size:11px;opacity:.8}
  .wa-top .x{margin-left:auto;background:none;border:none;color:#fff;font-size:20px;cursor:pointer}
  .wa-body{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:8px}
  .wa-msg{max-width:82%;padding:8px 11px;border-radius:9px;font-size:13.5px;line-height:1.4;color:#111;position:relative;box-shadow:0 1px 1px rgba(0,0,0,.1);white-space:pre-line}
  .wa-msg.me{align-self:flex-end;background:#dcf8c6;border-top-right-radius:2px}
  .wa-msg.bot{align-self:flex-start;background:#fff;border-top-left-radius:2px}
  .wa-msg .tm{font-size:9px;color:#667;text-align:right;margin-top:3px}
  .wa-card{align-self:flex-start;background:#fff;border-radius:9px;padding:11px 13px;font-size:13px;line-height:1.55;max-width:86%;box-shadow:0 1px 1px rgba(0,0,0,.1)}
  .wa-card .h{font-weight:600;margin-bottom:5px}
  .wa-card .row{color:#333}
  .wa-card .acts{display:flex;gap:14px;border-top:1px solid #eee;margin-top:8px;padding-top:7px}
  .wa-card .acts button{background:none;border:none;color:#128c7e;font-size:12.5px;cursor:pointer;font-weight:500}
  .wa-chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;flex-shrink:0}
  .wa-chips button{background:rgba(255,255,255,.85);border:1px solid #cbb;border-radius:16px;padding:6px 11px;font-size:12px;cursor:pointer;color:#333}
  .wa-input{display:flex;gap:8px;padding:9px 10px;flex-shrink:0;background:transparent}
  .wa-input input{flex:1;border:none;border-radius:22px;padding:10px 15px;font-size:14px;outline:none;background:#fff}
  .wa-input button{width:42px;height:42px;border-radius:50%;background:#075e54;color:#fff;border:none;font-size:17px;cursor:pointer}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus, brl = window.brl || (v => 'R$ ' + Math.round(v).toLocaleString('pt-BR'));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, '0');
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const agora = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

  const fab = document.createElement('button'); fab.className = 'wa-fab'; fab.innerHTML = '💬'; fab.title = 'Assessor no WhatsApp';
  const scrim = document.createElement('div'); scrim.className = 'wa-scrim';
  scrim.innerHTML = `<div class="wa-phone"><div class="wa-screen">
    <div class="wa-top"><div class="av">🐝</div><div class="nm">Assessor.IA<span>online · responde na hora</span></div><button class="x" id="wa_x">✕</button></div>
    <div class="wa-body" id="wa_body"></div>
    <div class="wa-chips" id="wa_chips"></div>
    <div class="wa-input"><input id="wa_in" placeholder="Mensagem…" autocomplete="off"><button id="wa_send">➤</button></div>
  </div></div>`;
  document.body.appendChild(fab); document.body.appendChild(scrim);

  const body = () => scrim.querySelector('#wa_body');
  function scroll() { const b = body(); b.scrollTop = b.scrollHeight; }
  // o texto digitado nunca entra como HTML (esc): a bolha e montada com dado do usuario
  function me(t) { const d = document.createElement('div'); d.className = 'wa-msg me'; d.innerHTML = esc(t) + `<div class="tm">${agora()} ✓✓</div>`; body().appendChild(d); scroll(); }
  function bot(t) { const d = document.createElement('div'); d.className = 'wa-msg bot'; d.innerHTML = t + `<div class="tm">${agora()}</div>`; body().appendChild(d); scroll(); }
  function card(html) { const d = document.createElement('div'); d.className = 'wa-card'; d.innerHTML = html; body().appendChild(d); scroll(); return d; }

  /* ---------- parser: registra nos MESMOS dados dos módulos ---------- */
  const CATS_KW = { uber: 'Transporte', táxi: 'Transporte', taxi: 'Transporte', almoço: 'Alimentação', almoco: 'Alimentação', jantar: 'Alimentação', café: 'Alimentação', cafe: 'Alimentação', mercado: 'Alimentação', lanche: 'Alimentação', cinema: 'Lazer', farmácia: 'Saúde', farmacia: 'Saúde', academia: 'Saúde' };
  function processar(txt) {
    const t = txt.trim(); const low = t.toLowerCase();
    // comando agenda
    if (/^agenda$/i.test(t)) { return respostaAgenda(); }
    if (/^ajuda$|^\?$/i.test(t)) { return bot('Você pode:\n💸 registrar gasto: "almoço 32"\n😊 humor: "humor 8"\n🏋️ treino: "treino 45"\n🧠 foco: "foco 90"\n✅ tarefa: "ligar pro cliente amanhã 9h"\n📋 ver o dia: "agenda"'); }
    let m;
    if ((m = low.match(/^humor\s+(\d{1,2})/))) { S().set('lastMood', +m[1]); B().emit('mood', {}, +m[1]); window.__bumpLive && window.__bumpLive(); return card(`<div class="h">😊 Humor registrado</div><div class="row">📅 ${dataBR()}<br>😊 Nota: ${m[1]}/10<br>🧠 Guardado no seu diário</div>`); }
    if ((m = low.match(/^treino\s*(\d+)?/))) { B().emit('workout', {}, +(m[1] || 45)); return card(`<div class="h">🏋️ Treino registrado</div><div class="row">📅 ${dataBR()}<br>⏱️ Duração: ${m[1] || 45} min<br>🔥 Sequência em dia</div>`); }
    if ((m = low.match(/^foco\s+(\d+)/))) { B().emit('deep_work', {}, +m[1]); return card(`<div class="h">🧠 Deep work registrado</div><div class="row">📅 ${dataBR()}<br>⏱️ ${m[1]} min de foco<br>📈 Somado ao seu dia</div>`); }
    // gasto: "descrição valor"
    if ((m = t.match(/^(.+?)\s+(\d+[.,]?\d*)$/))) {
      const desc = m[1].trim(), valor = parseFloat(m[2].replace(',', '.'));
      const cat = CATS_KW[desc.toLowerCase()] || 'Outros';
      const tx = S().get('tx', []); tx.push({ id: uid(), data: hojeISO(), desc: desc[0].toUpperCase() + desc.slice(1), cat, valor, tipo: 'despesa', conta: 'Inter', natureza: 'À vista', status: 'Concluída' });
      S().set('tx', tx); S().set('saldo', S().get('saldo', 4820) - valor); B().emit('expense', { cat }, valor); window.__bumpLive && window.__bumpLive();
      const c = card(`<div class="h">✅ Gasto registrado</div><div class="row">📅 Data: ${dataBR()}<br>📝 Descrição: ${desc}<br>🏷️ Categoria: ${cat}<br>💰 Valor: ${brl(valor)}<br>🏦 Conta: Inter</div><div class="acts"><button data-edit>↩ ✏️ Editar</button></div>`);
      c.querySelector('[data-edit]').onclick = () => bot('Sem problema — abra o módulo Financeiro pra ajustar a categoria ou o valor. 👍');
      return;
    }
    // tarefa (frase com verbo / data)
    const tasks = S().get('r_tasks', []); let dia = hojeISO(), hora = '';
    if (/amanh[ãa]/i.test(t)) { const d = new Date(); d.setDate(d.getDate() + 1); dia = d.toISOString().slice(0, 10); }
    const mh = t.match(/(\d{1,2})h(\d{2})?/); if (mh) hora = pad(+mh[1]) + ':' + (mh[2] || '00');
    const titulo = t.replace(/amanh[ãa]/i, '').replace(/\d{1,2}h\d{0,2}/, '').replace(/\s+/g, ' ').trim();
    tasks.push({ id: 'wa' + uid(), t: titulo[0].toUpperCase() + titulo.slice(1), lista: 'Pessoal', dia, hora, urg: 0, imp: 0, per: hora && +hora.slice(0, 2) < 12 ? 'Manhã' : 'Dia', st: 'afazer', feita: 0 });
    S().set('r_tasks', tasks);
    return card(`<div class="h">✅ Tarefa criada</div><div class="row">📝 ${titulo}<br>📅 ${dia === hojeISO() ? 'Hoje' : 'Amanhã'}${hora ? ' às ' + hora : ''}<br>📋 Está na sua Rotina</div>`);
  }
  function dataBR() { const d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }

  function respostaAgenda() {
    const h = hojeISO();
    const tasks = S().get('r_tasks', []), habs = S().get('r_habitos', []), contas = S().get('fin_agendadas', []).concat(S().get('r_contas', []) || []);
    const atras = tasks.filter(x => x.dia && x.dia < h && !x.feita);
    const hojeT = tasks.filter(x => x.dia === h);
    const habDone = habs.filter(x => x.hist && x.hist[h]).length;
    let s = `📋 *Hoje, ${dataBR()}*\n\n`;
    if (atras.length) s += `⚠️ *Atrasadas*\n${atras.slice(0, 3).map(x => '○ ' + x.t).join('\n')}\n\n`;
    if (contas.length) s += `💸 *Contas a pagar*\n${contas.slice(0, 2).map(c => '○ ' + brl(c.valor || c.v) + ' — ' + (c.desc || c.d)).join('\n')}\n\n`;
    s += `🔥 *Hábitos ${habDone}/${habs.length || 4}*\n${(habs.length ? habs : [{ nome: 'Meditar', hr: '07:00' }, { nome: 'Ler 20 páginas', hr: '22:30' }]).slice(0, 4).map(x => (x.hist && x.hist[h] ? '✓ ' : '○ ') + (x.hr ? x.hr + ' ' : '') + x.nome).join('\n')}\n\n`;
    s += `✅ *Tarefas ${hojeT.filter(x => x.feita).length}/${hojeT.length || 3}*\n${(hojeT.length ? hojeT : [{ t: 'Planejar a semana' }, { t: 'Pagar o boleto' }]).slice(0, 4).map(x => (x.feita ? '✓ ' : '○ ') + (x.hora ? x.hora.slice(0, 5) + ' ' : '') + x.t).join('\n')}`;
    const c = card(`<div style="white-space:pre-line">${s}</div><div class="acts"><button data-feita>↩ ✓ Marcar feita</button><button data-nova>↩ + Nova tarefa</button></div>`);
    c.querySelector('[data-feita]').onclick = () => { const ts = S().get('r_tasks', []); const f = ts.find(x => x.dia === h && !x.feita); if (f) { f.feita = 1; f.st = 'feito'; S().set('r_tasks', ts); B().emit('task_done', { tarefa: f.t }, 1); bot('✓ Marquei "' + f.t + '" como feita. Mandou bem! 🎯'); } else bot('Tudo do dia já está feito. 👏'); };
    c.querySelector('[data-nova]').onclick = () => { me('Ligar pro contador amanhã 10h'); setTimeout(() => processar('Ligar pro contador amanhã 10h'), 300); };
  }

  const CHIPS = ['almoço 32', 'humor 8', 'treino 45', 'agenda', 'ajuda'];
  function renderChips() { scrim.querySelector('#wa_chips').innerHTML = CHIPS.map(c => `<button data-chip="${c}">${c}</button>`).join(''); scrim.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => enviar(b.dataset.chip)); }
  function enviar(txt) { const v = (txt != null ? txt : scrim.querySelector('#wa_in').value).trim(); if (!v) return; me(v); scrim.querySelector('#wa_in').value = ''; setTimeout(() => processar(v), 350); }

  let aberto = false;
  function abrir() {
    scrim.classList.add('on');
    if (!aberto) { aberto = true; renderChips();
      bot('Oi! 👋 Eu sou o seu Assessor. Me manda as coisas do dia como você fala num amigo — eu organizo tudo.');
      setTimeout(() => bot('Experimenta: *"almoço 32"* pra registrar um gasto, ou *"agenda"* pra ver o seu dia. 📋'), 500);
    }
  }
  function fechar() { scrim.classList.remove('on'); }
  /* Com sessao, este botao abre a conversa DE VERDADE — o mesmo cerebro do
     WhatsApp. O simulador abaixo continua existindo para quem ainda nao
     entrou: e a demonstracao da vitrine, nao a conversa do dono. */
  fab.onclick = () => {
    if (window.__chatReal && window.abrirChat) { window.abrirChat(); return; }
    abrir();
  };
  scrim.querySelector('#wa_x').onclick = fechar;
  scrim.querySelector('#wa_send').onclick = () => enviar();
  scrim.querySelector('#wa_in').addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
  scrim.addEventListener('click', e => { if (e.target === scrim) fechar(); });

  window.openWhatsApp = abrir;
})();
