/* O briefing do dia — o que faz o painel deixar de ser um caderno.
 *
 * A visão (design/visao-vida-completa.md, ditada em 01/07/2026) chama isso de
 * "companheiro matinal": a primeira interação do dia é o Assessor, com agenda,
 * o que fazer e um insight — no lugar de abrir o feed.
 *
 * MUDANÇA DE 2026-09-21 — de onde vêm os dados
 *
 * Antes este arquivo montava o briefing sozinho, lendo `tasks`,
 * `finance_transactions` e `events`. Funcionava, mas era METADE: ele nunca leu
 * `painel_estado`, então era cego para hábito, meta e limite de tela — tudo o
 * que a pessoa organiza nas telas do painel.
 *
 * Agora quem monta é `meu_briefing()` no Supabase (queries 22, 23 e 24), que lê
 * AS DUAS fontes: `painel_estado` (as telas) e `tasks`/`events` (o que o bot do
 * WhatsApp criou). Uma fonte só, servindo painel e WhatsApp — o mesmo texto que
 * chega às 7h no celular é o que aparece aqui. Duas cópias divergem em
 * silêncio, e foi essa a dor de 2026-08-26.
 *
 * O que ficou AQUI de propósito:
 *   - a agenda do Google, que exige o webhook do n8n (o segredo do OAuth não
 *     pode viver no navegador, então SQL não alcança isso);
 *   - as FRASES e o HTML, que são apresentação, não regra.
 *
 * Duas decisões de arquitetura que continuam valendo:
 *
 * 1. O briefing é montado AO ABRIR o painel, não por um cron. Cron dependeria
 *    do PC do Miguel estar ligado às 7h; assim ele existe sempre que a pessoa
 *    abre. O cron entra depois, só para EMPURRAR no WhatsApp.
 *
 * 2. Tarefa sem prazo não pode virar tarefa invisível. Nove das nove tarefas
 *    reais estavam sem prazo, e a primeira versão dizia "nada para hoje" com
 *    nove paradas. Assessor escolhe e pergunta; caderno só lista.
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

  /* Devolve os compromissos de hoje, ou null se não deu para saber.
     null e [] são coisas diferentes: "não consegui ler" não é "agenda livre". */
  async function agendaDoGoogle() {
    let url = '';
    try {
      const c = await (await fetch('../config.json', { cache: 'no-store' })).json();
      url = c.agendaWebhook || '';
    } catch (e) { return null; }
    if (!url) return null;

    let token = '';
    try {
      const { data: { session } } = await S().auth.getSession();
      token = session ? session.access_token : '';
    } catch (e) { return null; }
    if (!token) return null;

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ access_token: token })
      });
      if (!r.ok) return null;
      const j = JSON.parse(await r.text());
      return Array.isArray(j.eventos) ? j.eventos : null;
    } catch (e) { return null; }
  }

  /* ---- Coleta: uma chamada ao banco, que já sabe juntar tudo ----------- */
  async function coletar() {
    /* O construtor de consulta do supabase-js é um thenable, não uma Promise —
       `.catch()` nele estoura. Promise.resolve(...) transforma numa Promise de
       verdade. Falha aqui não pode calar o briefing inteiro. */
    const r = await Promise.resolve(S().rpc('meu_briefing'))
      .then(x => (x && x.error) ? null : x)
      .catch(() => null);

    const b = r && r.data ? r.data : null;
    if (!b || b.erro) return null;
    return b;
  }

  /* ---- Render ---------------------------------------------------------- */
  async function montar(uid, nome) {
    /* uid vem por compatibilidade com quem chama; o banco descobre quem é pela
       sessão (my_user_id), então não mandamos id nenhum — é o que impede pedir
       o briefing de outra pessoa. */
    const [b, agenda] = await Promise.all([coletar(), agendaDoGoogle()]);

    const hora = new Date().getHours();
    const partes = [];
    partes.push('<h2 class="bf-ola">' + esc(FRASES.saudacao(nome || (b && b.nome), hora)) + '</h2>');

    const frase = frasedoDia();
    if (frase) partes.push('<p class="bf-frase">' + esc(frase) + '</p>');

    if (!b) {
      /* Honesto: "não consegui ler" não é "você não tem nada". */
      partes.push('<div class="bf-bloco bf-alerta"><span class="bf-rot">' +
        '⚠️ Não consegui montar seu briefing agora</span></div>');
      return partes.join('');
    }

    /* A agenda do Google vem de fora do banco (webhook do n8n). */
    if (agenda && agenda.length) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">📅 Hoje</span><ul>' +
        agenda.map(a => '<li><b>' + esc(a.hora) + '</b> ' + esc(a.titulo) + '</li>').join('') +
        '</ul></div>');
    }

    /* O ponto do dia: a ÚNICA coisa que mais importa (proximo_nudge).
       É o que separa briefing de resumo. */
    if (b.nudge && b.nudge.tipo && b.nudge.tipo !== 'nada') {
      partes.push('<div class="bf-bloco bf-alerta"><span class="bf-rot">🎯 O que mais importa hoje</span>' +
        '<p>' + esc(b.nudge.titulo) + '</p>' +
        (b.nudge.detalhe ? '<p class="bf-sub">' + esc(b.nudge.detalhe) + '</p>' : '') +
        '</div>');
    }

    const hojeTelas = b.tarefas_hoje || [];
    const hojeBot = b.tarefas_do_bot_hoje || [];
    const venc = b.tarefas_do_bot_vencidas || [];

    if (hojeTelas.length || hojeBot.length) {
      const itens = hojeTelas.map(t => '<li>' + (t.hora ? '<b>' + esc(t.hora) + '</b> ' : '') + esc(t.tarefa) + '</li>')
        .concat(hojeBot.map(t => '<li>' + esc(t.tarefa) + '</li>'));
      partes.push('<div class="bf-bloco"><span class="bf-rot">✅ Para hoje</span><ul>' +
        itens.join('') + '</ul></div>');
    }

    if (b.atrasadas > 0) {
      partes.push('<div class="bf-bloco bf-alerta"><span class="bf-rot">⚠️ ' +
        b.atrasadas + ' atrasada(s)</span>' +
        (venc.length ? '<ul>' + venc.slice(0, 3).map(t =>
          '<li>' + esc(t.tarefa) + ' <small>(desde ' + esc(t.prazo) + ')</small></li>').join('') + '</ul>' : '') +
        '</div>');
    }

    /* Tarefa sem prazo não vira tarefa invisível — pergunta, não só lista. */
    if (b.tarefas_do_bot_sem_prazo > 0) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">✅ ' +
        b.tarefas_do_bot_sem_prazo + ' tarefa(s) esperando</span>' +
        '<span class="bf-pergunta">Quer puxar alguma pra hoje?</span></div>');
    }

    const hab = b.habitos_pendentes || [];
    if (hab.length) {
      partes.push('<div class="bf-bloco"><span class="bf-rot">🔥 Hábitos esperando</span><ul>' +
        hab.map(h => '<li>' + (h.hora ? '<b>' + esc(h.hora) + '</b> ' : '') + esc(h.habito) + '</li>').join('') +
        '</ul></div>');
    }

    const apps = b.apps_acima_do_limite || [];
    if (apps.length) {
      partes.push('<div class="bf-bloco bf-alerta"><span class="bf-rot">📱 Acima do seu limite</span><ul>' +
        apps.map(a => '<li>' + esc(a.app) + ': <b>' + a.min + 'min</b> de ' + a.limite + 'min</li>').join('') +
        '</ul></div>');
    }

    const sem = b.semana || {};
    partes.push('<div class="bf-bloco"><span class="bf-rot">📊 Sua semana</span>' +
      '<p>' + (sem.habitos || 0) + ' hábitos marcados · ' + (sem.tarefas || 0) +
      ' tarefas fechadas · ' + brl(sem.gasto) + ' gastos</p></div>');

    if (b.dias_sem_pratica != null && b.dias_sem_pratica >= 2) {
      partes.push('<p class="bf-insight">💡 Faz ' + b.dias_sem_pratica +
        ' dias desde sua última prática. Cinco minutos hoje já quebram a sequência.</p>');
    }

    return partes.join('');
  }

  return { montar, FRASES };
})();
