/* Os números do topo do painel, de verdade.
 *
 * Estavam fixos no HTML: "MÓDULOS 9/9", "FOCO HOJE 3h40", "SEQUÊNCIA 21 dias",
 * "VOCÊ S.A. 7.4". Número inventado num app que cuida do dinheiro da pessoa é
 * pior do que número nenhum — ensina a não confiar no que se lê ali.
 *
 * Cada um agora vem de fato registrado, pela função resumo_do_painel(). Sem
 * base, mostra "—". Preferimos o traço à invenção.
 */
window.Numeros = (function () {
  const brl = n => 'R$ ' + Number(n || 0).toFixed(0);

  async function atualizar() {
    if (!window.Supa) return;
    let r;
    try { r = await Promise.resolve(window.Supa.rpc('resumo_do_painel')); }
    catch (e) { return marcarIndisponivel(); }
    if (!r || r.error) return marcarIndisponivel();

    const d = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!d) return marcarIndisponivel();

    const linhas = document.querySelectorAll('.hero .col-meta .mrow');
    if (!linhas.length) return;

    const valores = [
      ['EVENTOS HOJE', d.eventos_hoje == null ? '—' : String(d.eventos_hoje)],
      ['GASTO NO MÊS', d.gasto_mes == null ? '—' : brl(d.gasto_mes)],
      ['TAREFAS ABERTAS', d.tarefas_abertas == null ? '—' : String(d.tarefas_abertas)],
      ['SEQUÊNCIA', d.sequencia_dias == null ? '—' : d.sequencia_dias + (d.sequencia_dias === 1 ? ' dia' : ' dias')]
    ];

    linhas.forEach((linha, i) => {
      if (!valores[i]) { linha.style.display = 'none'; return; }
      const spans = linha.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = valores[i][0];
      if (spans[1]) spans[1].textContent = valores[i][1];
    });
  }

  function marcarIndisponivel() {
    document.querySelectorAll('.hero .col-meta .mrow').forEach(linha => {
      const spans = linha.querySelectorAll('span');
      if (spans[1]) spans[1].textContent = '—';
    });
  }

  return { atualizar };
})();
