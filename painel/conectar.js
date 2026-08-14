/* ============================================================
   ASSESSOR.IA — Tela de conexão com o n8n

   Interface pro que o publicar.js já sabe fazer. Fica no Ajustes
   (⚙), não no índice: conectar é coisa de configuração, não de uso
   diário — e o índice não muda.

   Nada aqui envia sozinho. Publicar finanças SOBRESCREVE as
   preferências do usuário no Supabase; por isso a tela mostra
   exatamente o que vai ser escrito e exige confirmação em duas etapas.

   Expõe: window.Conectar.abrir()
   ============================================================ */
'use strict';
(function () {
  const css = `
  .cn-campo{margin-top:14px}
  .cn-campo label{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);display:block;margin-bottom:6px}
  .cn-campo input{width:100%;padding:12px 13px;border:1px solid var(--line);border-radius:10px;background:var(--bg-2);color:var(--ink);font-family:var(--mono);font-size:13px;outline:none;transition:.2s}
  .cn-campo input:focus{border-color:var(--gold)}
  .cn-campo .dica{font-size:11.5px;color:var(--ink-soft);margin-top:5px;line-height:1.45}
  .cn-status{display:flex;align-items:center;gap:9px;padding:11px 13px;border:1px solid var(--line);border-radius:10px;margin-top:14px;font-size:12.5px;background:var(--bg-2)}
  .cn-status i{width:8px;height:8px;border-radius:50%;background:var(--ink-soft);flex-shrink:0}
  .cn-status.ok i{background:#607452}.cn-status.erro i{background:#A2402A}.cn-status.talvez i{background:var(--gold)}
  .cn-status .txt{line-height:1.45}
  .cn-prev{border:1px solid var(--line);border-radius:10px;padding:12px 13px;margin-top:12px;background:var(--bg-2);max-height:180px;overflow:auto}
  .cn-prev .lin{display:flex;justify-content:space-between;gap:12px;padding:5px 0;font-size:12.5px;border-top:1px solid var(--line)}
  .cn-prev .lin:first-child{border-top:0}
  .cn-prev .lin b{font-family:var(--mono);color:var(--ink-soft);font-weight:400;text-align:right}
  .cn-aviso{border-left:2px solid var(--gold);padding:8px 11px;margin-top:10px;font-size:12px;line-height:1.5;background:var(--gold-soft)}
  .cn-perigo{border:1px solid #A2402A55;background:color-mix(in srgb,#A2402A 7%,transparent);border-radius:10px;padding:12px 13px;margin-top:14px;font-size:12.5px;line-height:1.5}
  .cn-perigo b{color:#A2402A}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const P = () => window.Publicar;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Sonda os dois webhooks. GET não dispara nada (eles são POST),
     e a resposta do n8n já diz se o workflow está ativo. */
  async function sondar() {
    const c = P().config();
    const out = {};

    /* O navegador não distingue "servidor fora do ar" de "404 sem
       cabeçalho de CORS" — os dois viram "Failed to fetch". Uma sonda
       no-cors ao /healthz separa os casos: se o servidor responde, o
       problema é o workflow, não a rede. Sem isso o usuário caça o
       problema errado. */
    let servidorVivo = false;
    if (c.base) {
      try { await fetch(c.base.replace(/\/+$/, '') + '/healthz', { mode: 'no-cors' }); servidorVivo = true; } catch (e) { }
    }
    out._servidor = servidorVivo;

    for (const [tipo, url] of [['financeiro', c.webhookFinanceiro], ['rotina', c.webhookRotina]]) {
      if (!url) { out[tipo] = { ok: false, msg: 'sem URL' }; continue; }
      try {
        const r = await fetch(url, { method: 'GET' });
        const t = await r.text().catch(() => '');
        /* O n8n devolve "not registered" em DUAS mensagens diferentes:
           · workflow inativo: 'is not registered.'
           · workflow ATIVO, só não aceita GET: 'is not registered for
             GET requests. Did you mean to make a POST request?'
           A sonda usa GET de propósito (não dispara nada), então cair
           na segunda mensagem é o resultado ESPERADO de um workflow
           saudável — checar essa forma primeiro, senão as duas
           colidem no mesmo regex genérico e o diagnóstico mente. */
        if (r.status === 404 && /not registered for \w+ requests/i.test(t)) out[tipo] = { ok: true, msg: 'ativo (aceita só POST, como esperado)' };
        else if (r.status === 404 && /not registered/i.test(t)) out[tipo] = { ok: false, msg: 'workflow inativo no n8n' };
        else out[tipo] = { ok: true, msg: 'registrado (HTTP ' + r.status + ')' };
      } catch (e) {
        /* O n8n não manda cabeçalho de CORS nas páginas de erro do
           roteador central — só nas respostas que o próprio workflow
           monta. Por isso "workflow inativo" e "workflow ativo, só
           recusa GET" chegam aqui do MESMO jeito (CORS bloqueado) e
           não dá pra distinguir por fetch. Não afirmamos o que não
           sabemos: dizemos que a leitura é inconclusiva, e sugerimos
           publicar de verdade — a resposta real ao POST desfaz a
           dúvida (e enviar() sempre pede confirmação antes). */
        out[tipo] = servidorVivo
          ? { ok: 'talvez', msg: 'n8n responde, mas não dá pra confirmar por aqui (bloqueio de CORS na leitura) — pode estar ativo. Publicar de verdade confirma.' }
          : { ok: false, msg: 'não alcancei o n8n neste endereço' };
      }
    }
    return out;
  }

  function linhasPreview(tipo) {
    const p = tipo === 'rotina' ? P().payloadRotina() : P().payloadFinanceiro();
    const l = [];
    if (tipo === 'rotina') {
      l.push(['Blocos em dia de semana', (p.json.diaUtil || []).length]);
      l.push(['Blocos no fim de semana', (p.json.fimDeSemana || []).length]);
      (p.ignorados || []).forEach(i => l.push(['⚠ fora: ' + i.nome, i.porque]));
    } else {
      l.push(['Saldo inicial', 'R$ ' + (p.json.saldoInicial || 0).toLocaleString('pt-BR')]);
      l.push(['Categorias de despesa', (p.json.despesas || []).length]);
      l.push(['Categorias de renda', (p.json.rendas || []).length]);
      l.push(['Formas de pagamento', (p.json.formasPagamento || []).join(', ') || '—']);
    }
    return { linhas: l, avisos: p.avisos || [] };
  }

  function abrir(tipo) {
    tipo = tipo || 'financeiro';
    const c = P().config();
    const { linhas, avisos } = linhasPreview(tipo);
    const outro = tipo === 'financeiro' ? 'rotina' : 'financeiro';

    window.Modal.open(`<h3>Conectar ao n8n</h3>
      <p class="msub">O app é local-first: publicar é opcional e sempre manual. Nada sai daqui sem você mandar.</p>

      <div class="cn-campo"><label>Endereço do seu n8n</label>
        <input type="text" id="cn_base" value="${esc(c.base || 'http://localhost:5678')}" placeholder="http://localhost:5678">
        <div class="dica">Só o endereço. Eu monto <code>/webhook/${esc(P().PATHS[tipo])}</code> sozinho.</div></div>

      <div class="cn-campo"><label>Token (opcional)</label>
        <input type="text" id="cn_token" value="${esc(c.token)}" placeholder="vazio = sem validação">
        <div class="dica">Precisa bater com o TOKEN do nó "Validar token".</div></div>

      <div class="cn-status" id="cn_status"><i></i><span class="txt">Ainda não testei a conexão.</span></div>

      <div class="cn-campo" style="margin-top:18px"><label>O que vai ser enviado — ${tipo}</label>
        <div class="cn-prev">${linhas.map(l => `<div class="lin"><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('')}</div>
        ${avisos.map(a => `<div class="cn-aviso">${esc(a)}</div>`).join('')}</div>

      ${tipo === 'financeiro' ? `<div class="cn-perigo"><b>Atenção:</b> publicar finanças <b>sobrescreve</b> as suas
        preferências (categorias, formas de pagamento e orçamento) no Supabase.
        O que estiver lá hoje é substituído.</div>` : ''}

      <div class="mactions" style="flex-wrap:wrap;margin-top:16px">
        <button class="btn2 clickable" id="cn_salvar">Salvar</button>
        <button class="btn2 clickable" id="cn_testar">Testar conexão</button>
        <button class="btn2 clickable" id="cn_troca">Ver ${outro}</button>
        <button class="btn2 primary clickable" id="cn_pub">Publicar ${tipo}</button>
      </div>`);

    const $ = i => document.getElementById(i);
    const lerCampos = () => P().setConfig({
      base: $('cn_base').value.trim(),
      webhookFinanceiro: P().montarUrl($('cn_base').value.trim(), 'financeiro'),
      webhookRotina: P().montarUrl($('cn_base').value.trim(), 'rotina'),
      token: $('cn_token').value.trim()
    });

    $('cn_salvar').onclick = () => { lerCampos(); window.toast('Conexão salva neste aparelho'); };
    $('cn_troca').onclick = () => { lerCampos(); abrir(outro); };

    $('cn_testar').onclick = async () => {
      lerCampos();
      const el = $('cn_status'); el.className = 'cn-status';
      el.querySelector('.txt').textContent = 'Testando…';
      const r = await sondar();
      /* .ok tem 3 estados: true (confirmado), false (confirmado que
         não), 'talvez' (CORS bloqueia a leitura — pode estar tudo
         certo, só não dá pra confirmar por aqui; ver nota em sondar()). */
      const st = (r[tipo] || {}).ok;
      el.className = 'cn-status ' + (st === true ? 'ok' : st === 'talvez' ? 'talvez' : 'erro');
      el.querySelector('.txt').innerHTML =
        `<b>financeiro:</b> ${esc(r.financeiro.msg)}<br><b>rotina:</b> ${esc(r.rotina.msg)}`
        + (st === true ? '' : st === 'talvez' ? ''
          : (r._servidor
            ? '<br><span style="color:var(--ink-soft)">O n8n está de pé — falta abrir o workflow e clicar em <b>Active</b>.</span>'
            : '<br><span style="color:var(--ink-soft)">Confira se o n8n está rodando e se o endereço está certo.</span>'));
    };

    $('cn_pub').onclick = () => {
      lerCampos();
      const { linhas: ls } = linhasPreview(tipo);
      window.Modal.open(`<h3>Publicar ${tipo}?</h3>
        <p class="msub">Última conferida antes de sair do aparelho.</p>
        <div class="cn-prev">${ls.map(l => `<div class="lin"><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('')}</div>
        ${tipo === 'financeiro' ? '<div class="cn-perigo"><b>Isso sobrescreve</b> suas preferências financeiras no Supabase.</div>' : ''}
        <div class="mactions"><button class="btn2 clickable" id="cp_no">Voltar</button>
          <button class="btn2 primary clickable" id="cp_sim">Publicar agora</button></div>`);
      $('cp_no').onclick = () => abrir(tipo);
      $('cp_sim').onclick = async () => {
        $('cp_sim').textContent = 'Enviando…'; $('cp_sim').disabled = true;
        const r = await P().enviar(tipo, { confirmado: true });
        window.Modal.open(`<h3>${r.ok ? 'Publicado ✔' : 'Não deu'}</h3>
          <p class="msub">${esc(r.ok ? ('O n8n respondeu ' + (r.status || 200) + '.') : r.erro)}</p>
          ${!r.ok ? '<p class="msub">Guardei na fila — nada se perdeu. Corrija e tente de novo.</p>' : ''}
          <div class="mactions"><button class="btn2 primary clickable" onclick="window.Modal.close()">Entendi</button></div>`);
      };
    };
  }

  window.Conectar = { abrir, sondar };
})();
