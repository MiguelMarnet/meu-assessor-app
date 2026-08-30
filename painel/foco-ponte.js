/* Foco Digital: a ponte entre o Assessor e o bloqueio REAL do celular.
 *
 * O QUE UM APP WEB NÃO FAZ: bloquear aplicativo. Não existe API de navegador
 * para isso, em nenhum sistema. Qualquer "bloqueio" que a gente desenhasse
 * aqui seria um cronômetro bonito, ignorável em dois toques — e um bloqueio
 * que se ignora é pior que nenhum: ensina a pessoa que a ferramenta é decorativa.
 *
 * O QUE FUNCIONA: o celular já sabe bloquear (Tempo de Uso no iPhone,
 * Bem-estar Digital no Android). O Assessor vira o CÉREBRO — decide quando,
 * dispara, registra e cobra depois. Cada um faz o que sabe.
 *
 * A PONTE, por sistema:
 *   iPhone  — Atalhos aceita ser aberto por link (shortcuts://run-shortcut).
 *             Um Atalho liga o Modo de Concentração. Então um botão daqui
 *             liga o bloqueio de verdade, com a máquina da própria Apple.
 *   Android — não deixa link ligar o Modo Foco. A pessoa agenda uma vez no
 *             Bem-estar Digital, e aqui a gente registra e cobra.
 *
 * Em ambos, o valor que só o Assessor dá: ele SABE que você prometeu 9h–11h,
 * e no dia seguinte sabe se você cumpriu.
 */
window.FocoPonte = (function () {
  const NOME_ATALHO = 'Assessor Foco';   // o Atalho que a pessoa cria uma vez

  function sistema() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'computador';
  }

  /* --- Registrar a sessão: é isto que dá memória ao foco ---------------- */
  async function registrar(minutos, assunto) {
    if (!window.Supa || !window.__uid) return { ok: false, motivo: 'sem sessão' };
    try {
      const r = await Promise.resolve(window.Supa.from('events').insert({
        user_id: window.__uid,
        type: 'focus',
        payload: { minutos, assunto: assunto || 'Foco', origem: sistema() },
        value: minutos
      }));
      if (r && r.error) return { ok: false, motivo: r.error.message };
      return { ok: true };
    } catch (e) { return { ok: false, motivo: e.message }; }
  }

  /* --- Ligar o bloqueio no aparelho ------------------------------------- */
  function ligarNoAparelho() {
    const s = sistema();
    if (s === 'ios') {
      /* Se o Atalho não existir, o iPhone abre o app Atalhos e nada acontece —
         por isso a tela explica o passo único de criá-lo antes. */
      location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(NOME_ATALHO);
      return 'ios';
    }
    if (s === 'android') {
      /* Não há link que ligue o Modo Foco. Abrir o Bem-estar Digital é o mais
         perto que dá — de lá é um toque. */
      location.href = 'intent://#Intent;action=android.settings.SETTINGS;end';
      return 'android';
    }
    return 'computador';
  }

  /* --- Instruções: uma vez só, por sistema ------------------------------ */
  function comoConfigurar() {
    const s = sistema();
    if (s === 'ios') return {
      titulo: 'Uma vez só, no iPhone',
      passos: [
        'Abra o app <b>Atalhos</b> → <b>+</b> para criar um novo.',
        'Adicione a ação <b>Definir concentração</b> → escolha <b>Trabalho</b> (ou crie um modo "Foco") e deixe <b>Ativar</b>.',
        'Toque no nome do atalho e renomeie para <b>' + NOME_ATALHO + '</b> — o nome precisa ser exatamente esse.',
        'Pronto. Daqui em diante o botão abaixo liga o bloqueio de verdade.'
      ],
      nota: 'O que é bloqueado você escolhe no próprio Modo de Concentração (Ajustes → Concentração). O Assessor decide QUANDO; a Apple decide COMO.'
    };
    if (s === 'android') return {
      titulo: 'Uma vez só, no Android',
      passos: [
        'Ajustes → <b>Bem-estar digital</b> → <b>Modo Foco</b>.',
        'Marque os apps que te atrapalham (Instagram, TikTok, YouTube…).',
        'Toque em <b>Definir programação</b> e crie as suas janelas — ex.: 9h–11h.',
        'Volte aqui e registre a sessão quando terminar, para o Assessor acompanhar.'
      ],
      nota: 'O Android não deixa um site ligar o Modo Foco — por segurança, e faz sentido. Por isso aqui a programação é sua e o acompanhamento é meu.'
    };
    return {
      titulo: 'Isto é do celular',
      passos: ['Abra o painel no seu celular para configurar o bloqueio — o computador não tem esse controle.'],
      nota: 'Você pode registrar sessões manualmente por aqui, se preferir.'
    };
  }

  return { sistema, ligarNoAparelho, comoConfigurar, registrar, NOME_ATALHO };
})();
