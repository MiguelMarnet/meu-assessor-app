/* Espelha o estado do painel no banco, por usuário.
 *
 * O PROBLEMA: metas, notas, hábitos e foco viviam só em localStorage. Sumiam ao
 * trocar de aparelho e o Assessor não enxergava nada disso — o que você escreve
 * na tela nunca chegava ao bot.
 *
 * A ESCOLHA: em vez de reescrever as três telas (grandes, cheias de lógica, e
 * cada reescrita é uma chance de quebrar o que funciona), espelhamos as chaves
 * que elas já usam. As telas continuam local-first; o banco vira a cópia
 * durável. Quando uma delas merecer modelo próprio, migra-se aquela chave.
 *
 * ORDEM IMPORTA: puxar do servidor acontece ANTES de as telas montarem, senão
 * elas renderizam com o estado velho do aparelho e só depois seriam
 * atualizadas — a pessoa veria os dados "pularem".
 */
window.Espelho = (function () {
  /* As chaves que valem espelhar. Deliberadamente uma lista, não "tudo":
     coisas efêmeras (rascunho de campo, aba aberta) não devem viajar entre
     aparelhos, e `modo_pessoal` é decisão de mão única que não se sincroniza. */
  const CHAVES = [
    'mt_metas',     // projetos e metas
    'nt_notas',     // notas
    'r_tasks',      // tarefas da rotina
    'r_habitos',    // hábitos
    'fo_meta', 'fo_janelas', 'fo_apps', 'fo_rigor'   // foco
  ];

  let ligado = false;
  let uid = null;
  const pendentes = new Map();
  let timer = null;

  async function puxar(userId) {
    uid = userId;
    if (!window.Supa || !uid) return { ok: false, motivo: 'sem sessão' };
    let r;
    try {
      r = await Promise.resolve(
        window.Supa.from('painel_estado').select('chave,valor').eq('user_id', uid)
      );
    } catch (e) { return { ok: false, motivo: e.message }; }
    if (!r || r.error) return { ok: false, motivo: (r && r.error && r.error.message) || 'erro' };

    let aplicadas = 0;
    for (const linha of (r.data || [])) {
      if (!CHAVES.includes(linha.chave)) continue;
      try {
        localStorage.setItem('ma1:' + linha.chave, JSON.stringify(linha.valor));
        aplicadas++;
      } catch (e) {}
    }
    return { ok: true, aplicadas };
  }

  /* Empurra com atraso: quem digita uma nota dispara Store.set a cada tecla.
     Sem isso seria uma escrita por caractere. */
  function agendar(chave, valor) {
    if (!ligado || !uid || !CHAVES.includes(chave)) return;
    pendentes.set(chave, valor);
    clearTimeout(timer);
    timer = setTimeout(empurrar, 900);
  }

  async function empurrar() {
    if (!pendentes.size || !window.Supa || !uid) return;
    const lote = [...pendentes.entries()].map(([chave, valor]) => ({
      user_id: uid, chave, valor: valor == null ? {} : valor, updated_at: new Date().toISOString()
    }));
    pendentes.clear();
    try {
      await Promise.resolve(
        window.Supa.from('painel_estado').upsert(lote, { onConflict: 'user_id,chave' })
      );
    } catch (e) { /* offline: o local segue valendo, sobe na próxima mudança */ }
  }

  /* Intercepta o Store.set já existente, sem mexer nas telas. */
  function ligar(userId) {
    uid = userId;
    if (ligado || !window.Store) return;
    const originalSet = window.Store.set.bind(window.Store);
    window.Store.set = function (k, v) {
      const r = originalSet(k, v);
      try { agendar(k, v); } catch (e) {}
      return r;
    };
    ligado = true;
  }

  return { puxar, ligar, CHAVES };
})();
