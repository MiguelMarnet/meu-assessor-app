/* ============================================================
   ASSESSOR.IA — Tela cheia FOCO DIGITAL (fase 8)
   Hoje (tela × foco) · Limites por app (flexível⇄rígido) · Janelas de proteção
   ============================================================ */
'use strict';
(function () {
  const css = `
  .fo-apps{margin-top:4px}
  .fo-app{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
  .fo-app .ic{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:var(--bg);border:1px solid var(--line);font-size:15px}
  .fo-app .nm{flex:1}.fo-app .nm b{font-size:14px;font-weight:500}.fo-app .nm .bar{height:5px;border-radius:3px;background:var(--line);margin-top:6px;overflow:hidden}.fo-app .nm .bar i{display:block;height:100%;border-radius:3px;background:var(--bc,#d07a3c)}
  .fo-app .tm{font-family:var(--mono);font-weight:700;font-size:13px;white-space:nowrap}
  .fo-app .tm small{display:block;font-weight:400;font-size:9px;color:var(--ink-soft);text-align:right}
  .fo-lim{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--line)}
  .fo-lim .nm{flex:1;font-size:14px;font-weight:500}
  .fo-seg{display:flex;border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .fo-seg button{font-family:var(--mono);font-size:9px;letter-spacing:.06em;padding:6px 11px;background:none;border:none;color:var(--ink-soft);cursor:pointer}
  .fo-seg button.on{background:var(--dc);color:#fff}
  .fo-lim .lv{font-family:var(--mono);font-size:11px;color:var(--ink-soft);width:70px;text-align:right}
  .fo-jan{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
  .fo-jan .hr{font-family:var(--mono);font-size:13px;font-weight:700;width:104px}
  .fo-jan .nm{flex:1;font-size:13.5px}
  .fo-toggle{width:42px;height:24px;border-radius:14px;background:var(--line);position:relative;cursor:pointer;transition:.2s;border:none}
  .fo-toggle.on{background:#607452}
  .fo-toggle::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}
  .fo-toggle.on::after{left:21px}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const S = () => window.Store, B = () => window.Bus;
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const fmtMin = m => m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + 'min';
  const DC = '#d07a3c';

  function seed() {
    if (S().get('fo_apps')) return;
    S().set('fo_apps', [
      { nome: 'Instagram', ic: '📸', min: 68, lim: 45, cat: 'social' },
      { nome: 'YouTube', ic: '▶️', min: 52, lim: 60, cat: 'social' },
      { nome: 'WhatsApp', ic: '💬', min: 41, lim: 0, cat: 'comunicação' },
      { nome: 'Notion / estudos', ic: '📚', min: 95, lim: 0, cat: 'produtivo' },
      { nome: 'TikTok', ic: '🎵', min: 34, lim: 30, cat: 'social' },
    ]);
    S().set('fo_rigor', { Instagram: 'medio', YouTube: 'flex', TikTok: 'rigido' });
    S().set('fo_janelas', [
      { hr: '06:00–07:00', nm: 'Ritual da manhã — sem telas', on: 1 },
      { hr: '09:00–11:00', nm: 'Deep work — bloqueio de social', on: 1 },
      { hr: '22:30–06:00', nm: 'Sono — modo noturno', on: 1 },
      { hr: '14:00–15:00', nm: 'Almoço — livre', on: 0 },
    ]);
    S().set('fo_meta', 120); // teto de tela recreativa (min)
  }

  let tab = 'hoje', el = null, fecharFn = null;

  function vHoje() {
    const apps = S().get('fo_apps', []), meta = S().get('fo_meta', 120);
    const recr = apps.filter(a => a.cat === 'social').reduce((s, a) => s + a.min, 0);
    const prod = apps.filter(a => a.cat === 'produtivo').reduce((s, a) => s + a.min, 0);
    const focoHoje = S().get('r_tasks') ? 220 : 220; // min de deep work (correlaciona)
    return `<div class="fx-kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi" style="--kc:#d07a3c"><div class="k">Tela recreativa</div><div class="v">${fmtMin(recr)}</div><div class="d ${recr > meta ? 'down' : 'up'}">teto ${fmtMin(meta)}</div></div>
      <div class="kpi" style="--kc:#6D8FA7"><div class="k">Uso produtivo</div><div class="v">${fmtMin(prod)}</div><div class="d up">Notion / estudos</div></div>
      <div class="kpi" style="--kc:#607452"><div class="k">Deep work hoje</div><div class="v">${fmtMin(focoHoje)}</div><div class="d up">sessões de foco</div></div>
    </div>
    <div class="fcard" style="margin-top:14px"><div class="fct">📱 Tempo por aplicativo</div>
      <div class="fo-apps">${apps.slice().sort((a, b) => b.min - a.min).map(a => `<div class="fo-app"><div class="ic">${a.ic}</div><div class="nm"><b>${a.nome}</b><div class="bar"><i style="--bc:${a.cat === 'produtivo' ? '#607452' : a.lim && a.min > a.lim ? '#A2402A' : '#d07a3c'};width:${Math.min(100, a.lim ? a.min / a.lim * 100 : a.min / 120 * 100)}%"></i></div></div><div class="tm">${fmtMin(a.min)}${a.lim ? `<small>teto ${fmtMin(a.lim)}</small>` : '<small>livre</small>'}</div></div>`).join('')}</div></div>
    <div class="fcard" style="margin-top:14px"><div class="fct">🔗 A correlação que importa</div>
      <div class="insight" style="border-left:2px solid var(--gold);padding:10px 16px;font-size:13.5px;line-height:1.5">Nos dias de <b>deep work</b>, seu tempo de tela recreativa cai <b>−26 min</b> em média.<div style="font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-top:6px">Foco × Tela · 30 dias · o foco empurra a distração pra fora</div></div></div>`;
  }
  function vLimites() {
    const apps = S().get('fo_apps', []).filter(a => a.cat === 'social'), rigor = S().get('fo_rigor', {});
    return `<div class="fcard"><div class="fct">🎯 Rigor por app <span style="text-transform:none">de lembrete gentil a bloqueio firme</span></div>
      ${apps.map(a => `<div class="fo-lim"><div class="nm">${a.ic} ${a.nome}</div>
        <div class="fo-seg" data-app="${a.nome}">${[['flex', 'Flexível'], ['medio', 'Equilibrado'], ['rigido', 'Rígido']].map(([v, n]) => `<button class="${(rigor[a.nome] || 'medio') === v ? 'on' : ''}" data-rig="${v}" style="--dc:${DC}">${n}</button>`).join('')}</div>
        <div class="lv">teto ${fmtMin(a.lim || 30)}</div></div>`).join('')}
      <p class="ms-sub" style="margin-top:14px"><b>Flexível</b>: só um lembrete quando passar. <b>Equilibrado</b>: avisa e sugere pausa. <b>Rígido</b>: bloqueia nas janelas de proteção. No app nativo, o bloqueio real usa o Tempo de Uso do seu celular.</p></div>`;
  }
  function vProtecao() {
    const jan = S().get('fo_janelas', []);
    return `<div class="fcard"><div class="fct">🚧 Janelas de proteção</div>
      ${jan.map((j, i) => `<div class="fo-jan"><div class="hr">${j.hr}</div><div class="nm">${j.nm}</div><button class="fo-toggle ${j.on ? 'on' : ''} clickable" data-jan="${i}"></button></div>`).join('')}
      <p class="ms-sub" style="margin-top:14px">Blocos em que a distração fica trancada — proteja suas manhãs e o sono. Foco e Projetos conversam: o tempo protegido vira avanço nas metas.</p></div>`;
  }

  /* A ponte com o bloqueio REAL do aparelho. O app web não bloqueia nada —
     quem bloqueia é o Tempo de Uso (iPhone) ou o Bem-estar Digital (Android).
     Aqui a gente decide QUANDO, dispara onde dá, e registra pra cobrar depois. */
  function vAparelho() {
    const P = window.FocoPonte;
    if (!P) return `<div class="fcard"><div class="fct">📱 No celular</div><p class="ms-sub">Indisponível agora.</p></div>`;
    const sis = P.sistema();
    const cfg = P.comoConfigurar();
    const podeDisparar = sis === "ios";
    return `<div class="fcard"><div class="fct">📱 Bloqueio no aparelho <span style="text-transform:none">quem tranca é o seu celular</span></div>
      <p class="ms-sub" style="margin-bottom:14px">Nenhum site consegue bloquear app — nem este. O bloqueio de verdade é do seu celular; eu decido a hora e cobro depois.</p>
      <div style="border-left:2px solid var(--line);padding-left:12px;margin-bottom:14px">
        <b style="font-size:13.5px">${cfg.titulo}</b>
        <ol style="margin:8px 0 0 16px;font-size:13px;line-height:1.7;color:var(--ink-soft)">${cfg.passos.map(x => `<li>${x}</li>`).join("")}</ol>
        <p class="ms-sub" style="margin-top:10px;font-size:12px">${cfg.nota}</p>
      </div>
      ${podeDisparar ? `<button class="btn2 primary clickable" id="fo_ligar" style="width:100%;min-height:48px">Ligar o foco agora</button>` : ""}
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <input id="fo_min" type="number" inputmode="numeric" value="50" style="width:82px;padding:11px;border-radius:10px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);font-family:inherit">
        <span class="ms-sub" style="font-size:12.5px">minutos</span>
        <button class="btn2 clickable" id="fo_reg" style="margin-left:auto">Registrar sessão</button>
      </div>
      <p class="ms-sub" style="margin-top:8px;font-size:12px">Registrar é o que faz o Assessor lembrar: amanhã ele sabe se você cumpriu.</p></div>`;
  }
  const TABS = [['hoje', 'Hoje'], ['limites', 'Limites'], ['protecao', 'Proteção'], ['aparelho', 'No celular']];
  function render() {
    if (!el) return;
    const body = tab === 'limites' ? vLimites() : tab === 'protecao' ? vProtecao() : tab === 'aparelho' ? vAparelho() : vHoje();
    el.innerHTML = `<div class="ms-wrap">
      <div class="ms-top"><span class="ms-num" style="color:#d07a3c">◦ MÓDULO 05 · FOCO DIGITAL</span><button class="ms-close clickable" id="fo_close">✕ Voltar ao índice</button></div>
      <h1 class="ms-h1">Foco Digital</h1>
      <p class="ms-sub">Sua atenção é sua. Veja o tempo de tela, proteja blocos de foco — e veja como isso empurra suas metas.</p>
      <div class="ms-tabs">${TABS.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
      ${body}</div>`;
    document.getElementById('fo_close').onclick = () => fecharFn && fecharFn();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    el.querySelectorAll('[data-rig]').forEach(b => b.onclick = () => { const app = b.closest('[data-app]').dataset.app; const r = S().get('fo_rigor', {}); r[app] = b.dataset.rig; S().set('fo_rigor', r); render(); window.toast('Rigor de ' + app + ': ' + b.textContent); });
    const bLigar = document.getElementById("fo_ligar");
    if (bLigar) bLigar.onclick = () => { window.FocoPonte.ligarNoAparelho(); window.toast("Abrindo o Atalho…"); };
    const bReg = document.getElementById("fo_reg");
    if (bReg) bReg.onclick = async () => {
      const min = Math.max(1, parseInt(document.getElementById("fo_min").value, 10) || 0);
      const r = await window.FocoPonte.registrar(min, "Foco Digital");
      window.toast(r.ok ? ("Sessão de " + min + " min registrada 🎯") : "Não consegui registrar agora.");
      if (r.ok) B().emit("focus", { minutos: min }, min);
    };
    el.querySelectorAll('[data-jan]').forEach(b => b.onclick = () => { const jan = S().get('fo_janelas', []); jan[+b.dataset.jan].on = jan[+b.dataset.jan].on ? 0 : 1; S().set('fo_janelas', jan); render(); B().emit('focus', {}, 1); });
  }
  window.Screens = window.Screens || {};
  window.Screens.foco = { render(container, closeFn) { seed(); el = container; fecharFn = closeFn; tab = 'hoje'; render(); } };
})();
