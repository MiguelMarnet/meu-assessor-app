/* ============================================================
   ASSESSOR.IA — Motor de Insights (resgatado de app/js/data.js)
   Regra de ouro nº3: medir, não adivinhar.
   Nenhum número aqui é literal — tudo sai das chaves reais do
   Store. Se o dado não sustenta a afirmação, o insight NÃO sai
   (e o Cérebro diz "ainda não sei", como já faz no radar).
   Cada item carrega a sua "conta": fórmula + tamanho da amostra.
   Expõe: window.Insights.correlacoes() / .hipoteses() / .conta(id)
   ============================================================ */
'use strict';
(function () {
  const S = () => window.Store;
  const money = v => (window.brl ? window.brl(v) : 'R$ ' + Math.round(v));
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const num = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  /* cores das seis áreas — as mesmas do radar, pra leitura consistente */
  const COR = { corpo: '#607452', mente: '#C07868', capital: '#c2913a', relacoes: '#8087B5', proposito: '#9C7FB3', foco: '#d07a3c' };

  /* limiares de honestidade: abaixo disso, não afirmamos nada */
  const MIN_DIAS_GRUPO = 15;   // dias mínimos em cada lado da comparação
  const MIN_LIFT = 12;         // % mínimo de diferença pra virar correlação
  const JANELA = 120;          // dias olhados pra trás

  const _contas = {};
  const reg = (id, conta) => { _contas[id] = conta; return id; };

  /* ---------------- helpers de série diária ---------------- */

  /* universo de dias: da data mais antiga vista até hoje, limitado à JANELA */
  function universo(hists) {
    const todas = [];
    hists.forEach(h => Object.keys(h || {}).forEach(d => todas.push(d)));
    if (!todas.length) return [];
    todas.sort();
    const fim = hojeISO();
    const ini = todas[0] < addDias(fim, -JANELA) ? addDias(fim, -JANELA) : todas[0];
    const out = [];
    for (let d = ini; d <= fim; d = addDias(d, 1)) out.push(d);
    return out;
  }

  /* lift = quanto a taxa de B sobe nos dias em que A aconteceu */
  function lift(histA, histB) {
    const dias = universo([histA, histB]);
    if (dias.length < MIN_DIAS_GRUPO * 2) return null;
    let comA = 0, comAB = 0, semA = 0, semAB = 0;
    dias.forEach(d => {
      const a = histA && histA[d], b = histB && histB[d];
      if (a) { comA++; if (b) comAB++; } else { semA++; if (b) semAB++; }
    });
    if (comA < MIN_DIAS_GRUPO || semA < MIN_DIAS_GRUPO) return null;
    const taxaCom = comAB / comA, taxaSem = semAB / semA;
    if (taxaSem === 0) return null;
    const delta = Math.round((taxaCom / taxaSem - 1) * 100);
    return { delta, comA, semA, taxaCom, taxaSem, dias: dias.length };
  }

  const habitos = () => S().get('r_habitos', []);
  const praticas = () => S().get('es_praticas', []);

  /* ---------------- CORRELAÇÕES (cruzamentos entre módulos) ---------------- */
  function correlacoes() {
    const out = [];

    /* 1. Espiritual × Rotina — prática espiritual puxa hábitos? */
    praticas().forEach(p => {
      habitos().forEach(h => {
        const L = lift(p.hist, h.hist);
        if (!L || Math.abs(L.delta) < MIN_LIFT) return;
        out.push({
          _peso: Math.abs(L.delta),
          a: 'Propósito', b: 'Corpo', ca: COR.proposito, cb: COR.corpo,
          txt: `Nos dias de <b>${p.nome}</b>, você cumpre <b>${h.nome}</b> <b>${Math.abs(L.delta)}%</b> ${L.delta > 0 ? 'mais' : 'menos'}.`,
          str: (L.delta > 0 ? '+' : '') + L.delta + '%',
          conta: reg('cor_' + p.id + '_' + h.id, {
            t: `${p.nome} × ${h.nome}`,
            l: [
              ['Dias com a prática', `${L.comA} dias`],
              ['— desses, com o hábito', `${Math.round(L.taxaCom * 100)}%`],
              ['Dias sem a prática', `${L.semA} dias`],
              ['— desses, com o hábito', `${Math.round(L.taxaSem * 100)}%`],
              ['Diferença', (L.delta > 0 ? '+' : '') + L.delta + '%'],
            ],
            nota: `Conta: taxa de conclusão de "${h.nome}" nos dias em que "${p.nome}" foi registrada, comparada aos demais dias. Janela de ${L.dias} dias. Dados: Módulo 09 (Espiritual) × Módulo 01 (Rotina). É coincidência observada, não causa provada.`
          })
        });
      });
    });

    /* 2. Rotina × Rotina — qual hábito é a âncora dos outros */
    const hs = habitos();
    for (let i = 0; i < hs.length; i++) {
      for (let j = 0; j < hs.length; j++) {
        if (i === j) continue;
        const L = lift(hs[i].hist, hs[j].hist);
        if (!L || L.delta < MIN_LIFT) continue;
        out.push({
          _peso: L.delta,
          a: 'Corpo', b: 'Mente', ca: COR.corpo, cb: COR.mente,
          txt: `Quando você faz <b>${hs[i].nome}</b>, <b>${hs[j].nome}</b> vem junto <b>+${L.delta}%</b> das vezes.`,
          str: '+' + L.delta + '%',
          conta: reg('cor_' + hs[i].id + '_' + hs[j].id, {
            t: `${hs[i].nome} × ${hs[j].nome}`,
            l: [
              ['Dias com o primeiro', `${L.comA} dias`],
              ['— desses, com o segundo', `${Math.round(L.taxaCom * 100)}%`],
              ['Dias sem o primeiro', `${L.semA} dias`],
              ['— desses, com o segundo', `${Math.round(L.taxaSem * 100)}%`],
              ['Diferença', '+' + L.delta + '%'],
            ],
            nota: `Conta: comparação das duas séries diárias de hábitos numa janela de ${L.dias} dias. Dados: Módulo 01 (Rotina). Hábitos que andam juntos costumam compartilhar gatilho — mexer num pode mexer no outro.`
          })
        });
      }
    }

    /* mantém só os 3 cruzamentos mais fortes, sem repetir o mesmo par */
    out.sort((a, b) => b._peso - a._peso);
    const vistos = new Set(), top = [];
    out.forEach(c => { if (top.length < 3 && !vistos.has(c.conta)) { vistos.add(c.conta); top.push(c); } });
    return top;
  }

  /* ---------------- HIPÓTESES (o que o Assessor observou) ---------------- */
  function hipoteses() {
    const out = [];

    /* 1. Exames que entraram na faixa de referência */
    const ex = S().get('sa_exames', []).filter(e => e.serie && e.serie.length >= 2);
    if (ex.length) {
      const entraram = ex.filter(e => {
        const p = e.serie[0], u = e.serie[e.serie.length - 1];
        const dentro = n => n >= e.ref[0] && n <= e.ref[1];
        return !dentro(p) && dentro(u);
      });
      if (entraram.length) {
        const nomes = entraram.map(e => `<b>${e.nome}</b>`).join(', ');
        out.push({
          _peso: 100 + entraram.length,
          q: `Desde o primeiro exame, ${entraram.length === 1 ? 'um marcador entrou' : entraram.length + ' marcadores entraram'} na faixa de referência: ${nomes}. ${entraram.map(e => `${e.nome} ${e.serie[0]}→${e.serie[e.serie.length - 1]} ${e.un || ''}`).join(' · ')}. A rotina está mudando o seu sangue — faz sentido pra você?`,
          src: `Saúde · ${ex[0].serie.length} coletas · ${entraram.length}/${ex.length} marcadores`,
          conta: reg('hip_exames', {
            t: 'Exames que entraram na faixa',
            l: entraram.map(e => [e.nome, `${e.serie[0]} → ${e.serie[e.serie.length - 1]} ${e.un || ''} (ref ${e.ref[0]}–${e.ref[1]})`]),
            nota: `Conta: comparação direta entre a primeira e a última coleta de cada marcador, contra a faixa de referência cadastrada. Dados: Módulo 02 (Saúde · Exames de sangue).`
          })
        });
      }
    }

    /* 2. App acima do limite que você mesmo definiu */
    const apps = S().get('fo_apps', []).filter(a => a.lim > 0 && a.min > a.lim);
    if (apps.length) {
      const pior = apps.sort((a, b) => (b.min / b.lim) - (a.min / a.lim))[0];
      const excesso = pior.min - pior.lim, pctAcima = Math.round((pior.min / pior.lim - 1) * 100);
      out.push({
        _peso: 60 + pctAcima,
        q: `<b>${pior.nome}</b> passou do limite que você definiu: ${pior.min} min contra ${pior.lim} min (<b>+${pctAcima}%</b>). São <b>${excesso} min</b> por dia — ~${num(excesso * 30 / 60)}h por mês. Quer que eu aperte a janela de proteção?`,
        src: `Foco Digital · limite definido por você`,
        conta: reg('hip_foco', {
          t: `${pior.nome} acima do limite`,
          l: [['Uso hoje', pior.min + ' min'], ['Limite que você definiu', pior.lim + ' min'], ['Excesso', excesso + ' min/dia'], ['Projeção mensal', num(excesso * 30 / 60) + ' h']],
          nota: `Conta: uso registrado menos o limite cadastrado por você no próprio módulo. Projeção mensal = excesso × 30. Dados: Módulo 05 (Foco Digital).`
        })
      });
    }

    /* 3. Meta cujo ritmo não fecha o prazo */
    const metas = S().get('mt_metas', []).filter(m => m.prazo && m.tarefas && m.tarefas.length);
    const risco = [];
    metas.forEach(m => {
      const tot = m.tarefas.length, ok = m.tarefas.filter(t => t.ok).length;
      const faltam = tot - ok; if (!faltam) return;
      const diasRest = diasEntre(hojeISO(), m.prazo); if (diasRest <= 0) return;
      const semanasRest = diasRest / 7;
      const ritmoNec = faltam / semanasRest;           // tarefas por semana necessárias
      if (ritmoNec > 0.5) risco.push({ m, faltam, diasRest, ritmoNec, ok, tot });
    });
    if (risco.length) {
      const p = risco.sort((a, b) => b.ritmoNec - a.ritmoNec)[0];
      out.push({
        _peso: 50 + Math.round(p.ritmoNec * 10),
        q: `<b>${p.m.nome}</b> tem ${p.faltam} ${p.faltam === 1 ? 'etapa' : 'etapas'} em ${p.diasRest} dias. Pra fechar no prazo você precisa de <b>${num(p.ritmoNec)} por semana</b> — hoje estão ${p.ok} de ${p.tot}. Quer que eu reserve um bloco na rotina?`,
        src: `Projetos · prazo ${p.m.prazo.split('-').reverse().join('/')}`,
        conta: reg('hip_meta', {
          t: `Ritmo de "${p.m.nome}"`,
          l: [['Etapas concluídas', `${p.ok} de ${p.tot}`], ['Faltam', `${p.faltam}`], ['Dias até o prazo', `${p.diasRest}`], ['Ritmo necessário', `${num(p.ritmoNec)} etapas/semana`]],
          nota: `Conta: etapas restantes ÷ semanas restantes até o prazo cadastrado. Dados: Módulo 06 (Projetos & Sonhos). É aritmética de prazo, não julgamento — o prazo é seu e pode mudar.`
        })
      });
    }

    /* 4. Sobra do mês e o que ela financia */
    const tx = S().get('tx', []);
    const mes = hojeISO().slice(0, 7);
    const doMes = tx.filter(t => (t.data || '').slice(0, 7) === mes);
    const rec = doMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
    const desp = doMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
    if (rec > 0 && doMes.length >= 5) {
      const sobra = rec - desp, taxa = Math.round((sobra / rec) * 100);
      out.push({
        _peso: 40,
        q: `Este mês entrou ${money(rec)} e saiu ${money(desp)} — sobra de <b>${money(sobra)}</b> (<b>${taxa}%</b> do que entrou), em ${doMes.length} lançamentos. ${sobra > 0 ? 'Mantendo esse ritmo, são ' + money(sobra * 12) + ' em um ano.' : 'O mês fechou no vermelho — quer olhar as categorias comigo?'}`,
        src: `Financeiro · ${doMes.length} lançamentos de ${mes.split('-').reverse().join('/')}`,
        conta: reg('hip_sobra', {
          t: 'Sobra do mês',
          l: [['Receitas', money(rec)], ['Despesas', money(desp)], ['Sobra', money(sobra)], ['Taxa de poupança', taxa + '%'], ['Lançamentos', String(doMes.length)]],
          nota: `Conta: soma das receitas menos a soma das despesas com data dentro de ${mes}. Dados: Módulo 03 (Financeiro · Transações). Só o mês corrente — ainda não há histórico suficiente pra comparar com meses anteriores.`
        })
      });
    }

    /* 5. Sequência viva mais longa */
    let melhor = null;
    habitos().concat(praticas()).forEach(h => {
      const hist = h.hist || {};
      let streak = 0, d = hojeISO();
      if (!hist[d]) d = addDias(d, -1);           // o dia de hoje ainda pode não ter sido marcado
      while (hist[d]) { streak++; d = addDias(d, -1); }
      if (streak >= 5 && (!melhor || streak > melhor.streak)) melhor = { nome: h.nome, streak, total: Object.keys(hist).length };
    });
    if (melhor) {
      out.push({
        _peso: 30 + melhor.streak,
        q: `<b>${melhor.nome}</b> está com <b>${melhor.streak} dias seguidos</b> — ${melhor.total} registros no total. É a sua sequência viva mais longa agora. Quer proteger ela na agenda?`,
        src: `Rotina · sequência corrente`,
        conta: reg('hip_streak', {
          t: `Sequência de "${melhor.nome}"`,
          l: [['Dias seguidos agora', String(melhor.streak)], ['Registros no total', String(melhor.total)]],
          nota: `Conta: contagem regressiva a partir de hoje enquanto houver registro em dias consecutivos. Dados: Módulo 01 (Rotina) / Módulo 09 (Espiritual).`
        })
      });
    }

    out.sort((a, b) => b._peso - a._peso);
    return out.slice(0, 4);
  }

  function conta(id) { return _contas[id] || null; }

  window.Insights = { correlacoes, hipoteses, conta };
})();
