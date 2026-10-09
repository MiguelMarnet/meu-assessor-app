/* Traz para a tela o que você falou pelo WhatsApp.
 *
 * O PROBLEMA: você mandava "anota essa ideia" e ela ia para o banco; abria a
 * tela de Notas e não estava lá, porque a tela lia só o array local. Dois
 * depósitos paralelos — parecia que o app tinha perdido sua nota.
 *
 * A SOLUÇÃO: antes de as telas montarem, os itens que o bot gravou em
 * `painel_itens` são MESCLADOS no array que elas já leem. Mescla, não
 * substitui: o que você criou pelo painel continua lá.
 *
 * A marca `_id` evita duplicar quando a mesma nota chega de novo — e é por ela
 * que a gente sabe o que veio do servidor e o que nasceu aqui.
 */
window.Colecoes = (function () {
  const MAPA = {
    notas: { chave: 'nt_notas', paraTela: d => ({
      titulo: d.titulo || (String(d.texto || '').slice(0, 40) || 'Nota'),
      txt: d.texto || d.txt || '',
      tags: d.tags || []
    }) },
    metas: { chave: 'mt_metas', paraTela: d => ({
      titulo: d.titulo || 'Meta',
      desc: d.descricao || d.desc || '',
      prazo: d.prazo || null,
      progresso: d.progresso || 0
    }) }
  };

  async function puxar(uid) {
    if (!window.Supa || !window.Store || !uid) return { ok: false, motivo: 'sem sessão' };

    let r;
    try {
      r = await Promise.resolve(
        window.Supa.from('painel_itens')
          .select('id,colecao,dados,origem,created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
      );
    } catch (e) { return { ok: false, motivo: e.message }; }
    if (!r || r.error) return { ok: false, motivo: (r && r.error && r.error.message) || 'erro' };

    const resumo = {};
    for (const [colecao, cfg] of Object.entries(MAPA)) {
      const doServidor = (r.data || []).filter(x => x.colecao === colecao);
      if (!doServidor.length) { resumo[colecao] = 0; continue; }

      const local = window.Store.get(cfg.chave, []) || [];
      const jaTem = new Set(local.map(x => x && x._id).filter(Boolean));

      /* Só o que ainda não está na tela. O painel manda no que é dele. */
      const novos = doServidor
        .filter(x => !jaTem.has(x.id))
        .map(x => Object.assign(cfg.paraTela(x.dados || {}), {
          _id: x.id,
          _origem: x.origem || 'whatsapp',
          _em: x.created_at
        }));

      if (novos.length) {
        /* Sem passar pelo Store.set: isto veio do servidor, não precisa
           voltar para lá — senão o espelho devolveria o que acabou de chegar. */
        try { localStorage.setItem('ma1:' + cfg.chave, JSON.stringify(novos.concat(local))); } catch (e) {}
      }
      resumo[colecao] = novos.length;
    }
    return { ok: true, ...resumo };
  }

  /* Cria um item PELO PAINEL e manda para o banco, para o bot também enxergar. */
  async function criar(uid, colecao, dados) {
    if (!window.Supa || !uid || !MAPA[colecao]) return null;
    try {
      const r = await Promise.resolve(
        window.Supa.from('painel_itens')
          .insert({ user_id: uid, colecao, dados, origem: 'painel' })
          .select('id')
      );
      return (r && r.data && r.data[0] && r.data[0].id) || null;
    } catch (e) { return null; }
  }

  /* ===================================================================
     TAREFAS — a tabela `tasks` (o que você pediu pelo WhatsApp) na Rotina.

     O PROBLEMA (medido 09/10): o bot grava em `tasks`, a Rotina lê e grava
     só `r_tasks`. Você mandava "lembra de ligar pro Zehar" e a tarefa não
     estava na Rotina; concluía algo na Rotina e o bot continuava cobrando.

     POR QUE NÃO É SÓ COPIAR (como as notas acima): tarefa é concluída e
     apagada. Copiar sem devolver faria três estragos -- o bot não saberia do
     que você concluiu, a tarefa apagada voltaria no próximo login, e o
     briefing contaria a mesma tarefa duas vezes (este último a query 29
     resolve no banco).

     O CONTRATO
       - item de `r_tasks` com `_id` é cópia de uma linha de `tasks`;
       - título, dia e status voltam para `tasks`; hora, lista, urgência
         ficam só na Rotina (são dela, e `tasks` não tem onde guardar);
       - apagar vira `cancelled` (nunca DELETE), e o desfazer volta a
         `pending`. Nada some do banco.
     =================================================================== */
  const Tarefas = (function () {
    const FILA = 'ma1:tarefas_fila';     // fica no aparelho: o espelho não a conhece
    const DIA = /^\d{4}-\d{2}-\d{2}$/;
    let uid = null, ligado = false;

    const lerFila = () => { try { return JSON.parse(localStorage.getItem(FILA) || '{}') || {}; } catch (e) { return {}; } };
    const gravarFila = f => { try { localStorage.setItem(FILA, JSON.stringify(f)); } catch (e) {} };
    const local = () => (window.Store.get('r_tasks', []) || []).filter(x => x && typeof x === 'object');
    /* Escrita SEM passar pelo Store.set: o que veio do servidor não precisa
       voltar para ele (é o mesmo cuidado das notas acima). */
    const gravarLocal = arr => { try { localStorage.setItem('ma1:r_tasks', JSON.stringify(arr)); } catch (e) {} };

    /* Prazo em toda ida ao banco: um servidor pendurado não pode prender a
       abertura do painel (02/10). */
    const comPrazo = (ms, consulta) => {
      const corta = new AbortController();
      const t = setTimeout(() => corta.abort(), ms);
      return Promise.resolve(consulta.abortSignal(corta.signal)).finally(() => clearTimeout(t));
    };

    function listaPadrao() {
      const L = window.Store.get('r_listas', []) || [];
      return L.includes('Pessoal') || !L.length ? 'Pessoal' : L[0];
    }

    function paraTela(k) {
      return {
        id: 'w' + k.id, t: String(k.title || 'Tarefa').slice(0, 500), lista: listaPadrao(),
        dia: (k.due && DIA.test(String(k.due).slice(0, 10))) ? String(k.due).slice(0, 10) : null,
        hora: '', urg: 0, imp: 0, per: '', st: 'afazer', feita: 0,
        _id: k.id, _origem: 'whatsapp', _em: k.created_at, _projeto: k.project || ''
      };
    }

    /* O que mudou numa cópia, em termos de `tasks`. Só campos que existem lá. */
    function diferenca(antes, depois) {
      const p = {};
      if (!depois) { p.status = 'cancelled'; return p; }
      if (!antes) { p.status = depois.feita ? 'done' : 'pending'; return p; }   // o desfazer devolveu
      if (!!antes.feita !== !!depois.feita) p.status = depois.feita ? 'done' : 'pending';
      if ((antes.t || '') !== (depois.t || '') && String(depois.t || '').trim()) p.title = String(depois.t).slice(0, 500);
      if ((antes.dia || null) !== (depois.dia || null)) p.due = (depois.dia && DIA.test(depois.dia)) ? depois.dia : null;
      return p;
    }

    function enfileirar(id, patch) {
      if (!Object.keys(patch).length) return;
      const f = lerFila();
      f[id] = Object.assign(f[id] || {}, patch);     // vale o último estado de cada campo
      gravarFila(f);
    }

    /* Lista branca na SAÍDA, não só na montagem: a fila mora no localStorage,
       e o que sai dela vira um update no banco. A RLS já impede tocar na
       linha de outra pessoa; isto impede mandar campo ou valor que não seja
       um destes três, mesmo que a fila tenha sido adulterada. */
    const STATUS = ['pending', 'done', 'cancelled'];
    function limpo(p) {
      const o = {};
      if (p && STATUS.includes(p.status)) o.status = p.status;
      if (p && typeof p.title === 'string' && p.title.trim()) o.title = p.title.slice(0, 500);
      if (p && 'due' in p) o.due = (typeof p.due === 'string' && DIA.test(p.due)) ? p.due : null;
      return o;
    }

    async function esvaziarFila() {
      if (!window.Supa || !uid) return;
      const f = lerFila();
      for (const id of Object.keys(f)) {
        const patch = limpo(f[id]);
        if (!/^\d+$/.test(id) || !Object.keys(patch).length) {   // lixo na fila: descarta, não envia
          const g = lerFila(); delete g[id]; gravarFila(g); continue;
        }
        try {
          const r = await comPrazo(8000, window.Supa.from('tasks').update(patch).eq('id', id));
          if (r && !r.error) { const g = lerFila(); delete g[id]; gravarFila(g); }
        } catch (e) { /* sem rede: fica na fila, sai na próxima */ }
      }
    }

    /* Observa a gravação de r_tasks -- o único lugar por onde marcar, editar,
       arrastar e apagar passam. Assim a Rotina não precisa saber disto. */
    function ligar() {
      if (ligado || !window.Store) return;
      const setAnterior = window.Store.set.bind(window.Store);
      window.Store.set = function (k, v) {
        if (k !== 'r_tasks' || !uid) return setAnterior(k, v);
        const antes = new Map(local().filter(x => x._id != null).map(x => [String(x._id), x]));
        const r = setAnterior(k, v);
        try {
          const depois = new Map((Array.isArray(v) ? v : []).filter(x => x && x._id != null).map(x => [String(x._id), x]));
          new Set([...antes.keys(), ...depois.keys()]).forEach(id => enfileirar(id, diferenca(antes.get(id), depois.get(id))));
          setTimeout(esvaziarFila, 900);   // junta cliques seguidos, como o espelho
        } catch (e) { /* nunca quebra a tela por causa da sincronia */ }
        return r;
      };
      ligado = true;
    }

    async function puxar(userId) {
      uid = userId;
      if (!window.Supa || !window.Store || !uid) return { ok: false, motivo: 'sem sessão' };
      ligar();
      await esvaziarFila();                  // primeiro devolve, depois traz

      let arr = local();
      const fila = lerFila();
      let mudou = false;

      /* 1. O que já está na Rotina: o bot pode ter desfeito ("desfaz"). */
      const ids = arr.filter(x => x._id != null).map(x => x._id);
      if (ids.length) {
        let r = null;
        try { r = await comPrazo(8000, window.Supa.from('tasks').select('id,status').in('id', ids)); } catch (e) {}
        if (r && !r.error && Array.isArray(r.data)) {
          const st = new Map(r.data.map(x => [String(x.id), x.status]));
          arr = arr.filter(x => {
            if (x._id == null || fila[String(x._id)]) return true;   // mudança local ainda não enviada manda
            const s = st.get(String(x._id));
            if (s === 'cancelled') { mudou = true; return false; }
            if (s === 'done' && !x.feita) { x.feita = 1; x.st = 'feito'; mudou = true; }
            return true;
          });
        }
      }

      /* 2. O que é novo no WhatsApp. */
      let novos = [];
      let r = null;
      try {
        r = await comPrazo(8000, window.Supa.from('tasks')
          .select('id,title,project,due,status,created_at')
          .eq('user_id', uid).eq('status', 'pending')
          .order('created_at', { ascending: false }));
      } catch (e) {}
      if (r && !r.error && Array.isArray(r.data)) {
        const jaTem = new Set(arr.map(x => x._id).filter(x => x != null).map(String));
        novos = r.data
          .filter(k => !jaTem.has(String(k.id)))
          .filter(k => !(fila[String(k.id)] && fila[String(k.id)].status && fila[String(k.id)].status !== 'pending'))
          .map(paraTela);
      }

      if (novos.length || mudou) gravarLocal(novos.concat(arr));
      return { ok: true, novas: novos.length, ajustadas: mudou };
    }

    return { puxar, _diferenca: diferenca, _paraTela: paraTela };
  })();

  /* A entrada pública continua uma só: quem chama não precisa saber de tarefas. */
  const puxarItens = puxar;
  async function puxarTudo(uid) {
    const itens = await puxarItens(uid).catch(e => ({ ok: false, motivo: e.message }));
    let tarefas;
    try { tarefas = await Tarefas.puxar(uid); } catch (e) { tarefas = { ok: false, motivo: e.message }; }
    return Object.assign({}, itens, { tarefas });
  }

  return { puxar: puxarTudo, criar, MAPA, Tarefas };
})();
