/* ============================================================
   ASSESSOR.IA — Camada de publicação (v2 → n8n)

   O que veio do setup-app.html e do rotina-app.html: SÓ o
   transporte. A interface deles não foi trazida de propósito — a
   v2 já edita rotina (aba Agenda, blocos arrastáveis) e orçamento
   (aba Categorias) com mais recurso, e o mini-app já cobre a
   primeira configuração. Trazer as telas seria a terceira versão
   da mesma coisa.

   Contratos (lidos dos workflows em n8n/, não supostos):

   · workflow-setup-config → { token, telefone, saldoInicial,
       despesas[{categoria,planejado}] máx 14, rendas[...] máx 6,
       formasPagamento[string] máx 7 }
     `telefone` vira o user_id (número de WhatsApp normalizado) que
     identifica de quem são os dados no Supabase — sem ele o n8n não
     sabe em qual `users` gravar. O workflow atualiza `users.preferences`
     (categorias, formas_pagamento, orçamento, saldo_inicial) — não
     escreve mais em planilha (migrado de Sheets pro Supabase, 2026-08).

   · workflow-rotina → { token, telefone, diaUtil[...], fimDeSemana[...] }
     onde cada bloco é { titulo, inicio:"HH:MM", fim:"HH:MM",
     colorId, recurrence:["RRULE:..."] }. O workflow ancora diaUtil
     na próxima SEGUNDA e fimDeSemana no próximo SÁBADO. Continua
     criando no Google Calendar (é o destino real) e AGORA também
     espelha cada bloco em `events` (Supabase, type:'routine') pro
     Cérebro conseguir cruzar rotina com o resto.

   ⚠️ Publicar finanças SOBRESCREVE `users.preferences` no Supabase.
   Por isso enviar() exige confirmação explícita — nunca dispara sozinho.

   Expõe: window.Publicar
   ============================================================ */
'use strict';
(function () {
  const S = () => window.Store;

  /* ---------------- configuração ----------------
     Mesmo padrão de URL do setup-app.html/rotina-app.html
     (?webhook=&token=), mas persistido, senão se perde na
     primeira navegação. A URL, quando vem, tem precedência. */
  const CHAVE = 'n8n';
  /* Caminhos fixos dos webhooks, lidos dos workflows em n8n/. O que
     varia entre máquinas é só o host, então basta a base. */
  const PATHS = { financeiro: 'meu-assessor-setup', rotina: 'meu-assessor-rotina' };

  /* aceita "https://x.ngrok.app", ".../webhook" ou a URL completa */
  function montarUrl(base, tipo) {
    if (!base) return '';
    let b = base.trim().replace(/\/+$/, '');
    if (new RegExp(PATHS[tipo] + '$').test(b)) return b;      // já é a URL final
    if (!/\/webhook(-test)?$/.test(b)) b += '/webhook';
    return b + '/' + PATHS[tipo];
  }

  function config() {
    const q = new URLSearchParams(location.search);
    const salvo = S().get(CHAVE, {}) || {};
    const base = q.get('n8n') || salvo.base || '';
    const c = {
      base,
      webhookFinanceiro: q.get('webhook') || salvo.webhookFinanceiro || montarUrl(base, 'financeiro'),
      webhookRotina: q.get('webhookRotina') || salvo.webhookRotina || montarUrl(base, 'rotina'),
      token: q.get('token') || salvo.token || ''
    };
    /* se veio algo pela URL, guarda pra próxima */
    if (q.get('n8n') || q.get('webhook') || q.get('webhookRotina') || q.get('token')) S().set(CHAVE, c);
    return c;
  }
  /* atalho: Publicar.conectar('https://xxx.ngrok-free.app') resolve os
     dois webhooks de uma vez, já que só o host varia entre máquinas. */
  function conectar(base) {
    return setConfig({ base, webhookFinanceiro: montarUrl(base, 'financeiro'), webhookRotina: montarUrl(base, 'rotina') });
  }
  function setConfig(parcial) {
    const c = Object.assign({}, config(), parcial || {});
    S().set(CHAVE, c); return c;
  }
  const configurado = tipo => {
    const c = config();
    return !!(tipo === 'rotina' ? c.webhookRotina : c.webhookFinanceiro);
  };

  /* ---------------- financeiro ---------------- */
  function payloadFinanceiro() {
    const c = config(), avisos = [];
    const budgets = S().get('fin_budgets', {}) || {};
    const contas = S().get('fin_contas', []) || [];
    const tx = S().get('tx', []) || [];
    const saldo = S().get('saldo', null);

    const despesas = Object.keys(budgets).map(k => ({ categoria: k, planejado: +budgets[k] || 0 }));
    if (despesas.length > 14) avisos.push(`A planilha aceita 14 categorias de despesa; você tem ${despesas.length}. As ${despesas.length - 14} últimas não vão.`);

    /* rendas: agrupa as receitas já lançadas por categoria */
    const porCat = {};
    tx.filter(t => t.tipo === 'receita').forEach(t => { porCat[t.cat] = (porCat[t.cat] || 0) + (+t.valor || 0); });
    const rendas = Object.keys(porCat).map(k => ({ categoria: k, planejado: Math.round(porCat[k]) }));
    if (!rendas.length) avisos.push('Nenhuma receita lançada ainda — a planilha vai receber a lista de rendas vazia.');
    if (rendas.length > 6) avisos.push(`A planilha aceita 6 categorias de renda; você tem ${rendas.length}.`);

    /* Formas de pagamento ≠ lista de contas. Duas correções que só
       apareceram olhando o dado real:
       · uma conta do tipo "Meta" (ex.: Reserva de emergência) é um
         objetivo, não um meio de pagar — fica de fora;
       · a mesma instituição pode ser conta E cartão. O app antigo já
         resolvia isso com "Banco 1 (Débito)" / "Banco 1 (Crédito)";
         sem o sufixo, a planilha receberia "Nubank" duas vezes. */
    const metas = contas.filter(x => x.tipo === 'Meta').length;
    if (metas) avisos.push(`${metas} ${metas === 1 ? 'conta é do tipo Meta e não entrou' : 'contas são do tipo Meta e não entraram'} nas formas de pagamento.`);
    const sufixo = t => t === 'Cartão de crédito' ? ' (Crédito)' : t === 'Conta bancária' ? ' (Débito)' : '';
    const formasPagamento = [...new Set(
      contas.filter(x => x.tipo !== 'Meta').map(x => x.nome + sufixo(x.tipo))
    )];
    if (formasPagamento.length > 7) avisos.push(`A planilha aceita 7 formas de pagamento; você tem ${formasPagamento.length}.`);
    if (saldo == null) avisos.push('Sem saldo registrado — vai como 0.');

    const telefone = (S().get('profile', {}) || {}).whats || '';
    if (!telefone) avisos.push('Sem WhatsApp configurado em Ajustes — o n8n não vai saber de quem são esses dados.');

    return {
      avisos,
      json: {
        token: c.token, telefone,
        saldoInicial: Math.round(saldo || 0),
        despesas: despesas.slice(0, 14),
        rendas: rendas.slice(0, 6),
        formasPagamento: formasPagamento.slice(0, 7)
      }
    };
  }

  /* ---------------- rotina ---------------- */
  const DOW = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  /* colorId por palavra-chave — as mesmas cores do rotina-app.html.
     É palpite a partir do nome do hábito; por isso vai marcado como
     tal nos avisos, nunca apresentado como classificação certa. */
  const COR = [
    [/corr|trein|academ|caminh|yoga|pilates/i, '10'],
    [/med|orac|gratid|contempl|silenc/i, '10'],
    [/estud|ingl|ler|leitura|curso|aula/i, '3'],
    [/deep|foco|trabalh|projeto/i, '3'],
    [/agua|refei|comer|almoc|jantar|caf/i, '5'],
    [/dorm|sono|acordar/i, '8'],
  ];
  const corDe = nome => (COR.find(([re]) => re.test(nome)) || [null, '9'])[1];

  const somaMin = (hhmm, min) => {
    const [h, m] = String(hhmm || '07:00').split(':').map(Number);
    const t = ((h * 60 + m + min) % 1440 + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };

  function payloadRotina() {
    const c = config(), avisos = [], ignorados = [];
    const habitos = (S().get('r_habitos', []) || []).filter(h => h.hr);
    const semHora = (S().get('r_habitos', []) || []).length - habitos.length;
    if (semHora) avisos.push(`${semHora} ${semHora === 1 ? 'hábito não tem horário' : 'hábitos não têm horário'} e ${semHora === 1 ? 'ficou' : 'ficaram'} de fora.`);

    const diaUtil = [], fimDeSemana = [];
    habitos.forEach(h => {
      const dias = h.dias === 'todo' ? [0, 1, 2, 3, 4, 5, 6] : (Array.isArray(h.dias) ? h.dias : []);
      if (!dias.length) { ignorados.push({ nome: h.nome, porque: 'sem dias definidos' }); return; }
      const byday = dias.map(d => DOW[d]).join(',');
      const bloco = {
        titulo: h.nome, inicio: h.hr, fim: somaMin(h.hr, h.dur || 30),
        colorId: corDe(h.nome), recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byday}`]
      };
      /* O workflow ancora diaUtil na SEGUNDA e fimDeSemana no SÁBADO.
         Se a âncora não estiver entre os dias do hábito, o Google cria
         uma ocorrência extra no dia da âncora — evento errado no seu
         calendário. Preferimos não enviar a enviar torto. */
      if (dias.includes(1)) diaUtil.push(bloco);
      else if (dias.includes(6)) fimDeSemana.push(bloco);
      else ignorados.push({ nome: h.nome, porque: `cai em ${byday} — o fluxo atual só ancora em segunda ou sábado` });
    });

    if (ignorados.length) avisos.push(`${ignorados.length} ${ignorados.length === 1 ? 'hábito ficou' : 'hábitos ficaram'} de fora (ver detalhe) — enviar assim criaria evento em dia errado.`);
    if (habitos.length) avisos.push('A duração de cada bloco é estimada em 30 min: os hábitos da v2 guardam horário, não duração.');
    if (COR.length) avisos.push('A cor de cada evento é palpitada pelo nome do hábito.');

    const telefone = (S().get('profile', {}) || {}).whats || '';
    if (!telefone) avisos.push('Sem WhatsApp configurado em Ajustes — o n8n não vai saber de quem são esses dados.');

    return { avisos, ignorados, json: { tipo: 'rotina', token: c.token, telefone, diaUtil, fimDeSemana } };
  }

  /* ---------------- envio ----------------
     confirmado:true é obrigatório. Publicar finanças sobrescreve
     faixas da planilha; nada aqui dispara sem o usuário mandar. */
  async function enviar(tipo, { confirmado } = {}) {
    if (!confirmado) return { ok: false, erro: 'Falta confirmação explícita — publicar altera dados fora do aparelho.' };
    const c = config();
    const url = tipo === 'rotina' ? c.webhookRotina : c.webhookFinanceiro;
    if (!url) return { ok: false, erro: 'Webhook não configurado. Passe ?webhook= (ou ?webhookRotina=) na URL, ou use Publicar.setConfig().' };
    const { json } = tipo === 'rotina' ? payloadRotina() : payloadFinanceiro();
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
      const txt = await r.text().catch(() => '');
      if (!r.ok) { enfileirar(tipo, json); return { ok: false, status: r.status, erro: txt.slice(0, 200) || ('HTTP ' + r.status) }; }
      S().set('n8n_ultimo_envio', { tipo, em: new Date().toISOString() });
      return { ok: true, status: r.status, resposta: txt.slice(0, 200) };
    } catch (e) {
      enfileirar(tipo, json);
      return { ok: false, erro: 'Sem resposta do n8n (offline ou túnel fora do ar). Guardei na fila.' };
    }
  }

  /* fila: nada se perde se o n8n estiver fora do ar */
  function enfileirar(tipo, json) {
    const f = S().get('n8n_fila', []) || [];
    f.push({ id: Date.now().toString(36), tipo, json, em: new Date().toISOString() });
    S().set('n8n_fila', f.slice(-20));
  }
  const fila = () => S().get('n8n_fila', []) || [];
  function limparFila() { S().set('n8n_fila', []); }

  window.Publicar = {
    config, setConfig, configurado, conectar, montarUrl, PATHS,
    payloadFinanceiro, payloadRotina,
    enviar, fila, limparFila
  };
})();
