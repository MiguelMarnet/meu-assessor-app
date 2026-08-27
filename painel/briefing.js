/* O briefing do dia — o que faz o painel deixar de ser um caderno.
 *
 * A visão (design/visao-vida-completa.md, ditada em 01/07/2026) chama isso de
 * "companheiro matinal": a primeira interação do dia é o Assessor, com agenda,
 * o que fazer e um insight — no lugar de abrir o feed.
 *
 * Duas decisões de arquitetura:
 *
 * 1. O briefing é montado AO ABRIR o painel, não por um cron. Cron dependeria
 *    do PC do Miguel estar ligado às 7h; assim ele existe sempre que a pessoa
 *    abre. O cron entra depois, só para EMPURRAR no WhatsApp.
 *
 * 2. Tarefa sem prazo não pode virar tarefa invisível. Nove das nove tarefas
 *    reais estavam sem prazo, e a primeira versão dizia "nada para hoje" com
 *    nove paradas. Assessor escolhe e pergunta; caderno só lista.
 *
 * O texto fica todo em FRASES, no topo, para trocar sem mexer na lógica.
 */
window.Briefing = (function () {
  const S = () => window.Supa;
  const brl = n => 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---- FRASES: mexa aqui, não na lógica ------------------------------- */
  const FRASES = {
    saudacao: (nome, hora) => {
      const parte = hora < 5 ? 'Boa madrugada' : hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
      return parte + (nome ? ', ' + nome : '');
    },
    // Miguel está escrevendo as frases motivacionais em outro lugar.
    // Quando chegarem, é só preencher esta lista — o resto já está pronto.
    motivacional: [],
    agendaVazia: 'Agenda livre hoje.',
    semTarefas: 'Nenhuma tarefa em aberto. Dia limpo.',
    convite: 'O que você quer resolver hoje?'
  };

  function frasedoDia() {
    if (!FRASES.motivacional.length) return null;
    /* Mesma frase o dia inteiro, muda no dia seguinte: o dia tem uma cara só. */
    const dia = Math.floor(Date.now() / 86400000);
    return FRASES.motivacional[dia % FRASES.motivacional.length];
  }

  /* ---- Coleta ---------------------------------------------------------- */
  async function coletar(uid) {
    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    const nada = { data: [] };
    const [tarefas, financas, eventos] = await Promise.all([
      S().from('tasks').select('title,due,status,project').eq('user_id', uid).catch(() => nada),
      S().from('finance_transactions').select('type,value,category,occurred_at').eq('user_id', uid).gte('occurred_at', inicioMes).catch(() => nada),
      S().from('events').select('type,payload,occurred_at').eq('user_id', uid).order('occurred_at', { ascending: false }).limit(50).catch(() => nada)
    ]);

    const abertas = (tarefas.data || []).filter(t => t.status !== 'done' && t.status !== 'completed');
    const gastos = (financas.data || []).filter(t => t.type === 'expense');
    const total = gastos.reduce((s, t) => s + Number(t.value || 0), 0);

    const porCat = {};
    gastos.forEach(t => { const c = t.category || 'sem categoria'; porCat[c] = (porCat[c] || 0) + Number(t.value || 0); });

    /* Agenda: por enquanto, só o que o Assessor registrou. A agenda completa do
       Google exige o segredo do OAuth, que não pode viver no navegador — vem de
       um webhook do n8n num passo seguinte. */
    const agenda = (eventos.data || [])
      .filter(e => e.type === 'calendar' && e.payload && e.payload.start_time)
      .filter(e => String(e.payload.start_time).slice(0, 10) === hojeISO)
      .map(e => ({ hora: String(e.payload.start_time).slice(11, 16), titulo: e.payload.title || '(sem título)' }));

    return {
      abertas,
      vencidas: abertas.filter(t => t.due && t.due.slice(0, 10) < hojeISO),
      paraHoje: abertas.filter(t => t.due && t.due.slice(0, 10) === hojeISO),
      semPrazo: abertas.filter(t => !t.due),
      total, porCat, agenda,
      nGastos: gastos.length,
      eventos: eventos.data || []
    };
  }

  /* ---- O insight: o que separa briefing de resumo ---------------------- */
  function insight(d) {
    /* Regra deliberada: não arrisca cruzamento com base pequena. Com 3
       lançamentos, "94% em Alimentação" é verdade matemática e conselho ruim.
       Assessor que erra cedo perde a confiança que precisa depois. */
    const MIN = 8;
    const cats = Object.entries(d.porCat).sort((a, b) => b[1] - a[1]);
    if (d.nGastos >= MIN && cats.length && d.total > 0) {
      const [cat, val] = cats[0];
      return cat + ' já é ' + Math.round(val / d.total * 100) + '% do seu mês (' + brl(val) + ').';
    }
    const praticas = d.eventos.filter(e => e.type === 'spiritual');
    if (praticas.length) {
      const dias = Math.floor((Date.now() - new Date(praticas[0].occurred_at)) / 86400000);
      if (dias >= 2) return 'Faz ' + dias + ' dias desde sua última prática. Cinco minutos hoje já quebram a sequência.';
    }
    if (d.nGastos && d.nGastos < MIN) return 'Ainda tenho pouco histórico para cruzar — ' + d.nGastos + ' lançamento(s) este mês. Quanto mais você me conta, mais eu enxergo.';
    return null;
  }

  /* ---- Render ---------------------------------------------------------- */
  async function montar(uid, nome) {
    let d;
    try { d = await coletar(uid); } catch (e) { return null; }

    const hora = new Date().getHours();
    const partes = [];

    partes.push('<h2 class="bf-ola">' + esc(FRASES.saudacao(nome, hora)) + '</h2>');
    const frase = frasedoDia();
    if (frase) partes.push('<p class="bf-frase">' + esc(frase) + '</p>');

    if (d.agenda.length) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">📅 Hoje</span><ul>' +
        d.agenda.map(a => '<li><b>' + esc(a.hora) + '</b> ' + esc(a.titulo) + '</li>').join('') + '</ul></div>');
    }

    if (d.vencidas.length) {
      partes.push('<div class="bf-bloco bf-alerta"><span class="bf-rot">⚠️ ' + d.vencidas.length + ' atrasada(s)</span><ul>' +
        d.vencidas.slice(0, 3).map(t => '<li>' + esc(t.title) + '</li>').join('') + '</ul></div>');
    } else if (d.paraHoje.length) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">✅ Para hoje</span><ul>' +
        d.paraHoje.slice(0, 3).map(t => '<li>' + esc(t.title) + '</li>').join('') + '</ul></div>');
    } else if (d.semPrazo.length) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">✅ ' + d.semPrazo.length + ' tarefas esperando</span><ul>' +
        d.semPrazo.slice(-3).map(t => '<li>' + esc(String(t.title).replace(/\.$/, '')) + '</li>').join('') +
        '</ul><span class="bf-pergunta">Quer puxar alguma pra hoje?</span></div>');
    } else {
      partes.push('<div class="bf-bloco"><span class="bf-rot">✅ ' + esc(FRASES.semTarefas) + '</span></div>');
    }

    if (d.total > 0) partes.push('<div class="bf-bloco"><span class="bf-rot">💰 ' + brl(d.total) + ' no mês</span></div>');

    const ins = insight(d);
    if (ins) partes.push('<p class="bf-insight">💡 ' + esc(ins) + '</p>');

    return partes.join('');
  }

  return { montar, FRASES };
})();
