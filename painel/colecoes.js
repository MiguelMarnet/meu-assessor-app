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

  return { puxar, criar, MAPA };
})();
