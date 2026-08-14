/* ============================================================
   ASSESSOR.IA — Modo pessoal: troca a persona Marina pelos
   dados reais do Miguel.

   Ação de mão única, disparada só pelo botão em Ajustes:
     1. Store.wipe() — apaga a Marina (e qualquer teste).
     2. Grava modo_pessoal=1 — a partir daqui a persona NUNCA
        MAIS semeia, nem que "Apagar tudo" seja clicado de novo
        (persona.js e Store.wipe checam essa flag).
     3. Semeia o roadmap de carreira REAL (v4.1, repo
        projeto-de-vida) — os mesmos 45 marcos, 4 gates e a tese
        que já existiam em app/js/data.js. Reaproveita a MESMA
        função MK() e os MESMOS registros, só traduz pro formato
        que a v2 usa (mt_metas / pj_career).
     4. Todos os outros módulos ficam vazios — Rotina, Saúde,
        Financeiro, Anotações, Foco, Espiritual eram exemplo
        ilustrativo no app antigo, não histórico real. O Miguel
        entra com dado de verdade aos poucos (WhatsApp, mini-app,
        ou direto na tela).

   Expõe: window.ModoPessoal.iniciar()
   ============================================================ */
'use strict';
(function () {
  /* ---------------- os mesmos 45 marcos, mesma função, sem retocar ----------------
     Copiado de app/js/data.js (Seeds.apply) — não reescrito à mão,
     pra não arriscar erro de transcrição num array deste tamanho. */
  const MK = (id, titulo, trilho, fase, prazo, metrica, pri, dep, gate, status, marcos, porque) => ({
    id, titulo, trilho, fase, prazo, metrica, prioridade: pri, dependeDe: dep || [], gate: gate || null,
    status, marcos: marcos || [], porque: porque || ''
  });

  const OLD_GOALS = [
    // FASE 1 · 2026 — Fundação & primeiro agente
    MK('assessor-v1', 'Enviar o Assessor.IA v1', 'produto', 1, '2026-09-30', 'v1 respondendo no WhatsApp com planilha funcionando', 'obrigatoria', [], 'G1', 'em_andamento',
      [{ t: 'Workflows n8n importados', done: true }, { t: 'Credenciais Google + Gemini', done: true }, { t: 'Teste ponta a ponta na planilha', done: true }, { t: 'WhatsApp conectado (Meta + túnel)', done: false }],
      'O laboratório da tese: agentes que transacionam. Tudo começa aqui.'),
    MK('planilha-modelo', 'Fechar modelo da planilha no workflow n8n', 'produto', 1, '2026-07-31', 'Workflow lê/escreve nas tabelas paralelas sem erro', 'obrigatoria', [], 'G1', 'em_andamento'),
    MK('build-in-public', 'Devlog público (build in public)', 'distribuicao', 1, 'continua', '≥ 3 posts/mês (10 linhas + print + aprendizado)', 'obrigatoria', [], null, 'pendente'),
    MK('cert-az900', 'Certificação AZ-900 (Azure)', 'capital', 1, '2026-10-31', 'Aprovado no exame', 'obrigatoria', [], null, 'pendente', [], 'A alavanca salarial: cada real a mais no CLT é seed money do plano de fundador.'),
    MK('cert-aws-cp', 'Certificação AWS Cloud Practitioner', 'capital', 1, '2026-12-20', 'Aprovado no exame', 'obrigatoria', ['cert-az900'], null, 'pendente'),
    MK('landing-assessor', 'Landing page do Assessor.IA', 'produto', 1, '2026-11-30', 'Página no ar captando interesse', 'recomendada', ['assessor-v1'], null, 'pendente'),
    MK('guardrails-agente', 'Documentar guardrails do agente (embrião do Sting)', 'sting', 1, '2026-12-31', 'Doc público: limites de gasto, allowlist, confirmação humana', 'recomendada', ['assessor-v1'], null, 'pendente'),
    MK('faculdades-em-dia', 'Manter as 3 graduações em dia', 'academico', 1, 'continua', 'Semestre sem reprovação (IA, Gestão, Eng. Software)', 'obrigatoria', [], null, 'em_andamento'),
    MK('saude-dia-off', '1 dia/semana totalmente off', 'saude', 1, 'continua', '4 dias off/mês', 'obrigatoria', [], null, 'pendente', [], 'Saúde é restrição dura do roadmap — gate próprio, não bullet decorativo.'),
    MK('saude-exercicio', 'Exercício 3×/semana', 'saude', 1, 'continua', '≥ 12 treinos/mês', 'obrigatoria', [], null, 'pendente'),
    MK('emf-12k', 'EMF Planners: R$ 12k/mês de vendas', 'capital', 2, '2027-12-31', 'Fechamento ≥ R$ 12k por 3 meses', 'recomendada', [], null, 'em_andamento',
      [{ t: 'Guia da marca fechado', done: true }, { t: 'Linha 2026 no Canva', done: true }, { t: 'Funil orgânico rodando', done: false }, { t: '3 canais de venda ativos', done: false }]),
    // FASE 2 · 2027 — Salto de renda & 1ª receita
    MK('salto-clt', 'Salto CLT: N1 → N2/analista (≥ R$ 4k)', 'capital', 2, '2027-06-30', 'Nova vaga/promoção com salário ≥ R$ 4.000', 'obrigatoria', ['cert-az900', 'cert-aws-cp'], null, 'pendente'),
    MK('cert-google-it', 'Google IT Support (só se sobrar folga)', 'capital', 2, '2027-03-31', 'Aprovado', 'avaliar', ['cert-aws-cp'], null, 'pendente'),
    MK('carteira-testnet', 'Carteira testnet no Assessor (Base Sepolia)', 'produto', 2, '2027-03-31', 'Assessor consulta saldo e prepara tx em testnet', 'obrigatoria', ['assessor-v1'], null, 'pendente'),
    MK('pagamento-autonomo', '1º pagamento autônomo (USDC/Base, ERC-4337)', 'produto', 2, '2027-09-30', 'Tx real executada pelo agente + artigo público', 'obrigatoria', ['carteira-testnet'], 'G2', 'pendente', [], 'O degrau que prova a tese: IA que paga com guardrails.'),
    MK('consultoria-cliente-1', '1º cliente de consultoria (automação IA)', 'capital', 2, '2027-08-31', 'Contrato fechado e pago (setup + retainer)', 'obrigatoria', ['assessor-v1'], 'G2', 'pendente'),
    MK('consultoria-cliente-2', '2º cliente de consultoria (teto: 2)', 'capital', 2, '2027-12-31', 'Receita paralela total ≥ R$ 1k/mês', 'obrigatoria', ['consultoria-cliente-1'], 'G2', 'pendente'),
    MK('bee-feedback', 'Bee-commerce com 3–5 usuários de feedback', 'produto', 2, '2027-12-31', '3+ negócios usando com feedback registrado', 'obrigatoria', [], null, 'pendente'),
    MK('graduacao-ia', 'Concluir graduação em IA', 'academico', 2, '2027-12-31', 'Diploma (TCC vira conteúdo público)', 'obrigatoria', [], null, 'em_andamento'),
    MK('graduacao-gestao', 'Concluir graduação em Gestão', 'academico', 2, '2027-12-31', 'Diploma', 'obrigatoria', [], null, 'em_andamento'),
    MK('cryptozombies', 'CryptoZombies (Solidity básico)', 'sting', 2, '2027-12-31', 'Curso concluído', 'recomendada', ['pagamento-autonomo'], null, 'pendente'),
    MK('artigo-guardrails', 'Artigo: "como limitei meu agente que paga"', 'sting', 2, '2027-11-30', 'Publicado (PT + EN)', 'recomendada', ['guardrails-agente', 'pagamento-autonomo'], null, 'pendente'),
    MK('ingles-tecnico', 'Inglês técnico fluente + posts em EN', 'distribuicao', 2, '2027-12-31', 'Posts em EN desde jul/2027', 'recomendada', [], null, 'pendente'),
    MK('reserva-15k', 'Reserva ≥ R$ 15k', 'capital', 2, '2027-12-31', 'Saldo de reserva ≥ R$ 15.000', 'obrigatoria', ['salto-clt'], null, 'pendente'),
    // FASE 3 · 2028 — Produto que fatura
    MK('bee-10-pagantes', 'Bee-commerce ≥ 10 clientes pagantes', 'produto', 3, '2028-06-30', 'MRR de 10+ assinaturas (R$ 97–297)', 'obrigatoria', ['bee-feedback'], 'G3', 'pendente'),
    MK('sting-l0', 'AI Auditor (Sting L0) no ar com assinantes', 'sting', 3, '2028-12-31', 'Micro-SaaS com primeiros assinantes pagos', 'obrigatoria', ['cyfrin-solidity'], null, 'pendente', [], 'A cunha da 3ª startup — a camada de confiança da economia agêntica.'),
    MK('cyfrin-solidity', 'Cyfrin Updraft Solidity (cert)', 'sting', 3, '2028-06-30', 'Certificado emitido', 'obrigatoria', ['cryptozombies'], null, 'pendente'),
    MK('cyfrin-security', 'Cyfrin Smart Contract Security & Auditing', 'sting', 3, '2028-12-31', 'Curso concluído (70h)', 'obrigatoria', ['cyfrin-solidity'], null, 'pendente'),
    MK('wargames-defi', 'DVDeFi + Ethernaut documentados', 'sting', 3, '2028-12-31', 'Soluções publicadas como conteúdo', 'obrigatoria', ['cyfrin-solidity'], null, 'pendente'),
    MK('bee-modulo-web3', 'Módulo Web3 no Bee-commerce', 'produto', 3, '2028-12-31', 'Módulo ativo em 1+ cliente real', 'recomendada', ['bee-10-pagantes'], null, 'pendente'),
    MK('reserva-30k', 'Reserva ≥ R$ 30k (arma o G-CLT)', 'capital', 3, '2028-12-31', 'Saldo ≥ R$ 30.000 (~10 meses de custo)', 'obrigatoria', ['reserva-15k'], 'G-CLT', 'pendente'),
    MK('maratona', 'Correr uma maratona (42km)', 'saude', 3, '2028-12-31', 'Prova concluída', 'recomendada', [], null, 'pendente',
      [{ t: '5km confortável', done: true }, { t: '10km', done: false }, { t: 'Meia maratona', done: false }]),
    // FASE 4 · 2029 — Tração & saída do CLT
    MK('saida-clt', 'Sair do Suporte TI (quando G-CLT bater)', 'capital', 4, 'condicional', 'Condição G-CLT satisfeita + desligamento', 'obrigatoria', ['reserva-30k'], 'G-CLT', 'pendente', [], 'Condição, não data: sem heroísmo sem colchão.'),
    MK('graduacao-eng-software', 'Concluir Engenharia de Software', 'academico', 4, '2029-12-31', 'Diploma (TCC = o produto)', 'obrigatoria', [], null, 'em_andamento'),
    MK('liberdade-1', 'Liberdade 1.0: ≥ R$ 3,5k/mês líquido × 6 meses', 'capital', 4, '2029-12-31', '6 meses consecutivos ≥ R$ 3.500 líquido', 'obrigatoria', [], null, 'pendente'),
    MK('escala-decisao', 'Escalar produto: bootstrap vs captação', 'produto', 4, '2029-12-31', 'Decisão documentada com dados de tração', 'obrigatoria', ['bee-10-pagantes'], null, 'pendente'),
    MK('contests-marketing', 'Contests (Code4rena/Sherlock) como marketing', 'sting', 4, '2029-12-31', '2+ participações com write-ups públicos', 'recomendada', ['cyfrin-security'], null, 'pendente'),
    MK('sair-aluguel', 'Sair do aluguel', 'vida', 4, '2030-12-31', 'Entrada paga + financiamento saudável', 'recomendada', ['reserva-30k'], null, 'pendente',
      [{ t: 'Reserva de 6 meses', done: false }, { t: 'Entrada de 20%', done: false }]),
    // FASE 5 · 2030–31 — Founding do Sting
    MK('sting-founding', 'Fundar a empresa (Sting) — L1 firewall de agente', 'sting', 5, '2030-12-31', 'Empresa constituída + L1 protótipo com usuários', 'obrigatoria', ['saida-clt', 'sting-l0'], null, 'pendente', [], 'A Era 2 da economia agêntica (primeiros desastres) cria o mercado exatamente nessa janela.'),
    MK('mestrado-decisao', 'Mestrado — só se tese = pesquisa do Sting', 'academico', 5, '2030-12-31', 'Decisão go/no-go documentada', 'avaliar', ['graduacao-eng-software'], null, 'pendente'),
    MK('liberdade-2', 'Liberdade 2.0: ≥ R$ 7k/mês líquido', 'capital', 5, '2031-12-31', '6 meses consecutivos ≥ R$ 7.000', 'recomendada', ['liberdade-1'], null, 'pendente'),
    MK('talks-internacionais', 'Talks internacionais (DEF CON / EthCC)', 'distribuicao', 5, '2031-12-31', '1+ talk aceita', 'recomendada', ['contests-marketing'], null, 'pendente'),
    // FASE 6 · 2032+ — Nortes (revisão trimestral, não cobrança)
    MK('norte-sting-plataforma', 'Norte: Sting plataforma (bps sobre TPV protegido)', 'sting', 6, '2035-12-31', 'Pricing por transação ativo; TPV crescendo', 'recomendada', ['sting-founding'], null, 'pendente'),
    MK('norte-liberdade-3', 'Norte: Liberdade 3.0 (≥ R$ 15k/mês)', 'capital', 6, '2032-12-31', 'Líquido ≥ R$ 15.000/mês sustentado — apostas assimétricas', 'recomendada', ['liberdade-2'], null, 'pendente'),
    MK('norte-endgame-2040', 'Norte 2040–45: categoria própria / aquisição / nicho premium', 'sting', 6, '2040-12-31', 'Touro: patrimônio US$ 1–10M · Base: R$ 2–5M', 'recomendada', ['norte-sting-plataforma'], null, 'pendente'),
  ];

  const OLD_CAREER = {
    versao: '4.1', atualizado: '2026-07-02', faseAtual: 1, wip: 2, capacidade: '15–25h/semana',
    tese: 'Construir e ser dono de produtos no espaço dos agentes que transacionam — IA + segurança on-chain + faro de produto. A Trindade: Assessor.IA (o agente que paga) → Bee-commerce (as lojas que recebem) → Sting (a camada de confiança).',
    gates: [
      { id: 'G1', nome: 'Assessor v1 no ar', criterio: 'v1 rodando (n8n + Gemini + WhatsApp + Google)', prazo: '2026-09-30', seFalhar: 'Cortar escopo do v1 — não estender prazo' },
      { id: 'G2', nome: '1ª receita AI×Web3', criterio: 'Paralela ≥ R$ 1k/mês + pagamento on-chain público', prazo: '2027-12-31', seFalhar: 'Revisar oferta de consultoria antes de Solidity avançado' },
      { id: 'G3', nome: 'Bee-commerce com tração', criterio: '≥ 10 clientes pagantes', prazo: '2028-06-30', seFalhar: 'Pivot p/ consultoria/AI-tooling, sem drama' },
      { id: 'G-CLT', nome: 'Saída do CLT', criterio: 'Reserva ≥ R$ 30k + paralela ≥ R$ 2,5k/mês × 3 meses', prazo: '2029-12-31', seFalhar: 'Continua no CLT — sem heroísmo sem colchão' },
    ],
  };

  /* trilho → capa de cartão (screens-metas.js só tem 4 cores) */
  const COVER_POR_TRILHO = { produto: 'azul', sting: 'roxo', capital: 'ambar', academico: 'roxo', distribuicao: 'verde', saude: 'verde', vida: 'ambar' };
  const EMOJI_POR_TRILHO = { produto: '🚀', sting: '🛡️', capital: '💼', academico: '🎓', distribuicao: '📣', saude: '💪', vida: '🏡' };

  function traduzirMeta(o) {
    const prazoValido = /^\d{4}-\d{2}-\d{2}$/.test(o.prazo || '');
    return {
      id: o.id,
      nome: o.titulo,
      desc: o.porque || o.metrica,
      criterio: o.metrica,
      tipo: 'Projeto',
      medir: 'tarefas',
      emoji: EMOJI_POR_TRILHO[o.trilho] || '🎯',
      cover: COVER_POR_TRILHO[o.trilho] || 'ambar',
      /* 'continua' e 'condicional' não são datas — sem prazo real,
         fica sem prazo (nenhum badge de contagem regressiva falso). */
      prazo: prazoValido ? o.prazo : '',
      tarefas: (o.marcos || []).map(m => ({ t: m.t, ok: m.done ? 1 : 0 })),
      movs: [],
      trilho: o.trilho,
      gate: o.gate || null,
      dependeDe: o.dependeDe || [],
      st: o.status === 'em_andamento' ? 'ativa' : o.status === 'concluida' ? 'concluida' : 'pendente',
    };
  }

  function iniciar() {
    const S = window.Store;
    if (!S) return;
    S.wipe();
    S.set('modo_pessoal', 1);
    S.set('mt_metas', OLD_GOALS.map(traduzirMeta));
    S.set('pj_career', {
      wip: OLD_CAREER.wip,
      tese: OLD_CAREER.tese,
      fase: OLD_CAREER.faseAtual,
      gates: OLD_CAREER.gates.map(g => ({ id: g.id, nome: g.nome, criterio: g.criterio, seFalhar: g.seFalhar, prazo: g.prazo })),
    });
    S.set('pj_ideias', []);
  }

  window.ModoPessoal = { iniciar, totalMetas: OLD_GOALS.length };
})();
