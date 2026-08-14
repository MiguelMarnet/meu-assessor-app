/* ============================================================
   ASSESSOR.IA — Persona de demonstração: MARINA (1 ano planejado)
   Popula TODOS os módulos com um ano coerente, para ver o app rodando
   um ano inteiro sem falhar. Roda 1x (flag). Depende de window.Store.
   ============================================================ */
'use strict';
(function () {
  if (!window.Store) return;
  const S = window.Store;
  /* Trava definitiva: uma vez em modo pessoal (dados reais do Miguel),
     a persona de demonstração NUNCA MAIS pode voltar — nem depois de
     "Apagar tudo". Checada ANTES da flag de persona, e de propósito
     não é removida pelo Store.wipe() (ver index.html). */
  if (S.get('modo_pessoal')) return;
  if (S.get('persona_v1')) return;   // já carregada
  S.set('persona_v1', 1);

  const now = new Date(), Y = now.getFullYear();
  const iso = d => d.toISOString().slice(0, 10);
  const hoje = iso(now);
  const pad = n => String(n).padStart(2, '0');
  const uid = () => Math.random().toString(36).slice(2, 9);
  const add = (base, n) => { const d = new Date(base + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const dISO = (m, d) => `${Y}-${pad(m)}-${pad(d)}`;
  // histórico de hábito: marca uma fração dos últimos N dias (com leve tendência de melhora)
  const hist = (dias, base) => { const o = {}; for (let i = 0; i < dias; i++) { const p = base + (1 - i / dias) * 0.15; if (Math.random() < p) o[add(hoje, -i)] = 1; } return o; };

  /* ---------- PERFIL ---------- */
  S.set('profile', { nome: 'Marina', whats: '', intensidade: 'medio' });

  /* ---------- 01 ROTINA ---------- */
  S.set('r_listas', ['Doce Marina', 'Design', 'Pessoal', 'Estudos']);
  S.set('r_tasks', [
    { id: uid(), t: 'Postar bolo do dia no Instagram', lista: 'Doce Marina', dia: hoje, hora: '08:00', urg: 0, imp: 1, per: 'Manhã', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Deep work — módulo 3 do curso', lista: 'Doce Marina', dia: hoje, hora: '09:00–11:00', urg: 0, imp: 1, per: 'Manhã', st: 'andamento', feita: 0 },
    { id: uid(), t: 'Entregar identidade visual — cliente Paula', lista: 'Design', dia: hoje, hora: '14:00–16:00', urg: 1, imp: 1, per: 'Tarde', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Comprar ingredientes (encomenda casamento)', lista: 'Doce Marina', dia: hoje, hora: '17:00', urg: 1, imp: 0, per: 'Tarde', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Aula de inglês', lista: 'Estudos', dia: hoje, hora: '19:00–20:00', urg: 0, imp: 1, per: 'Noite', st: 'feito', feita: 1 },
    { id: uid(), t: 'Responder orçamento — 15 anos', lista: 'Doce Marina', dia: add(hoje, 1), hora: '10:00', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Gravar reels da receita nova', lista: 'Doce Marina', dia: add(hoje, 2), hora: '15:00', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Feira + meal prep da semana', lista: 'Pessoal', dia: add(hoje, 3), hora: '09:00', urg: 0, imp: 0, per: '', st: 'afazer', feita: 0 },
    { id: uid(), t: 'Revisar precificação dos bolos', lista: 'Doce Marina', dia: null, hora: '', urg: 0, imp: 1, per: '', st: 'afazer', feita: 0 },
  ]);
  S.set('r_habitos', [
    { id: uid(), nome: 'Correr / treinar', hr: '06:30', dias: [1, 3, 5, 6], hist: hist(120, 0.62) },
    { id: uid(), nome: 'Meditar 10 minutos', hr: '07:00', dias: 'todo', hist: hist(120, 0.7) },
    { id: uid(), nome: 'Estudar inglês', hr: '19:00', dias: 'todo', hist: hist(120, 0.66) },
    { id: uid(), nome: 'Ler 20 páginas', hr: '22:30', dias: 'todo', hist: hist(120, 0.6) },
    { id: uid(), nome: 'Beber 2L de água', hr: '', dias: 'todo', hist: hist(90, 0.75) },
  ]);
  S.set('r_contas', [
    { id: uid(), d: 'Fatura Nubank', v: 1240.5, venc: dISO(now.getMonth() + 1, 12), pago: 0 },
    { id: uid(), d: 'Aluguel do ateliê', v: 900, venc: dISO(now.getMonth() + 1, 5), pago: 0 },
  ]);

  /* ---------- 02 SAÚDE (exames trimestrais = 1 ano de evolução) ---------- */
  S.set('sa_meta', { kcal: 2000, prot: 130, carb: 210, gord: 62 });
  S.set('sa_meals', [
    { id: uid(), nome: 'Iogurte + granola + fruta', ref: 'Café', kcal: 380, p: 22, c: 48, g: 10, dia: hoje },
    { id: uid(), nome: 'Salmão + batata doce + brócolis', ref: 'Almoço', kcal: 620, p: 42, c: 55, g: 22, dia: hoje },
    { id: uid(), nome: 'Café + castanhas', ref: 'Lanche', kcal: 210, p: 6, c: 8, g: 18, dia: hoje },
  ]);
  S.set('sa_treinos', [
    { id: uid(), tipo: 'Corrida 6km', dia: hoje, dur: 38, vol: 0 },
    { id: uid(), tipo: 'Funcional', dia: add(hoje, -2), dur: 50, vol: 3200 },
    { id: uid(), tipo: 'Corrida 5km', dia: add(hoje, -4), dur: 32, vol: 0 },
    { id: uid(), tipo: 'Musculação — inferiores', dia: add(hoje, -5), dur: 55, vol: 6100 },
  ]);
  S.set('sa_exames', [
    { nome: 'Glicose', un: 'mg/dL', ref: [70, 99], serie: [98, 95, 91, 88] },
    { nome: 'Colesterol total', un: 'mg/dL', ref: [0, 190], serie: [214, 206, 196, 185] },
    { nome: 'HDL', un: 'mg/dL', ref: [40, 200], serie: [41, 45, 49, 54] },
    { nome: 'LDL', un: 'mg/dL', ref: [0, 130], serie: [145, 134, 124, 114] },
    { nome: 'Triglicerídeos', un: 'mg/dL', ref: [0, 150], serie: [172, 158, 140, 121] },
    { nome: 'Vitamina D', un: 'ng/mL', ref: [30, 100], serie: [19, 24, 30, 37] },
    { nome: 'Ferritina', un: 'ng/mL', ref: [30, 400], serie: [38, 52, 68, 84] },
    { nome: 'TSH', un: 'µUI/mL', ref: [0.4, 4.0], serie: [3.1, 2.7, 2.4, 2.2] },
  ]);

  /* ---------- 03 FINANCEIRO ---------- */
  const m = pad(now.getMonth() + 1);
  S.set('fin_seed', 1);
  S.set('tx', [
    ['Design — cliente Paula (identidade)', 'Salário', 2400, 'receita', 'Nubank', 'À vista', 4],
    ['Doce Marina — encomendas', 'Venda', 1850, 'receita', 'Nubank', 'À vista', 8],
    ['Doce Marina — bolo de casamento', 'Venda', 950, 'receita', 'Nubank', 'À vista', 15],
    ['Aluguel do ateliê', 'Moradia', 900, 'despesa', 'Nubank', 'À vista', 5],
    ['Ingredientes (mês)', 'Alimentação', 640, 'despesa', 'Nubank', 'À vista', 3],
    ['Mercado', 'Alimentação', 420, 'despesa', 'Nubank', 'À vista', 6],
    ['Curso de inglês', 'Educação', 220, 'despesa', 'Nubank', 'Parcela 4/12', 10],
    ['Academia', 'Saúde', 99.9, 'despesa', 'Nubank', 'À vista', 10],
    ['Gasolina', 'Transporte', 180, 'despesa', 'Inter', 'À vista', 12],
    ['Embalagens Doce Marina', 'Outros', 210, 'despesa', 'Nubank', 'À vista', 9],
    ['Aporte reserva', 'Outros', 700, 'despesa', 'Inter', 'À vista', 16],
    ['Netflix + Spotify', 'Assinaturas', 55, 'despesa', 'Nubank', 'À vista', 2],
    ['Jantar aniversário', 'Lazer', 160, 'despesa', 'Nubank', 'À vista', 14],
  ].map(x => ({ id: uid(), data: `${Y}-${m}-${pad(x[6])}`, desc: x[0], cat: x[1], valor: x[2], tipo: x[3], conta: x[4], natureza: x[5], status: 'Concluída' })));
  S.set('fin_contas', [
    { nome: 'Nubank', tipo: 'Cartão de crédito', saldo: -1240.5, limite: 4000, ic: '💳', fecha: 12 },
    { nome: 'Reserva de emergência', tipo: 'Meta', saldo: 9800, ic: '🎯' },
    { nome: 'Inter', tipo: 'Conta bancária', saldo: 2340, ic: '🟠' },
    { nome: 'Nubank', tipo: 'Conta bancária', saldo: 1180, ic: '🟣' },
  ]);
  S.set('fin_budgets', { Moradia: 900, Alimentação: 1200, Educação: 250, Saúde: 200, Lazer: 300, Transporte: 300 });
  S.set('fin_agendadas', [
    { desc: 'Fatura Nubank', conta: 'Nubank', tipo: 'Fatura', valor: 1240.5, venc: 12, tag: 'faturas' },
    { desc: 'Curso de inglês', conta: 'Nubank', tipo: 'Parcela 4/12', valor: 220, venc: 10, tag: 'parcelas' },
    { desc: 'Aluguel do ateliê', conta: 'Inter', tipo: 'Recorrência', valor: 900, venc: 5, tag: 'recorrencia' },
  ]);
  S.set('saldo', 4920);

  /* ---------- 04 ANOTAÇÕES ---------- */
  S.set('nt_notas', [
    { id: uid(), titulo: 'Curso "Confeitaria Autoral" — roteiro', pasta: 'Doce Marina', data: hoje, link: 'Lançar o curso online', linhas: [
      { t: 'Módulo 1 — Fundamentos e mise en place', check: 1, done: 1 }, { t: 'Módulo 2 — Massas e recheios', check: 1, done: 1 },
      { t: 'Módulo 3 — Montagem e acabamento', check: 1, done: 0 }, { t: 'Módulo 4 — Precificação e vendas', check: 1, done: 0 }] },
    { id: uid(), titulo: 'Ideias de sabores — outono', pasta: 'Doce Marina', data: add(hoje, -6), linhas: [{ t: 'Bolo de especiarias, doce de leite com flor de sal, cenoura com ganache.', check: 0 }] },
    { id: uid(), titulo: 'Livros pra ler em ' + Y, pasta: 'Estudos', data: add(hoje, -14), link: 'Ler 12 livros', linhas: [
      { t: 'A Coragem de Ser Imperfeito', check: 1, done: 1 }, { t: 'Essencialismo', check: 1, done: 1 }, { t: 'O Poder do Hábito', check: 1, done: 1 }, { t: 'Comece pelo Porquê', check: 1, done: 0 }] },
    { id: uid(), titulo: 'Diário — reflexões', pasta: 'Pessoal', data: hoje, linhas: [{ t: 'Semana intensa mas boa. O curso está tomando forma. Preciso lembrar de descansar.', check: 0 }] },
    { id: uid(), titulo: 'Reunião com a contadora — 12/05', pasta: 'Design', data: add(hoje, -20), linhas: [{ t: 'Separar MEI da conta pessoal. Guardar 6% pro DAS.', check: 0 }] },
  ]);
  S.set('lastMood', 8);

  /* ---------- 05 FOCO DIGITAL ---------- */
  S.set('fo_apps', [
    { nome: 'Instagram', ic: '📸', min: 52, lim: 45, cat: 'social' },
    { nome: 'Canva / trabalho', ic: '🎨', min: 110, lim: 0, cat: 'produtivo' },
    { nome: 'WhatsApp', ic: '💬', min: 48, lim: 0, cat: 'comunicação' },
    { nome: 'YouTube (receitas)', ic: '▶️', min: 40, lim: 45, cat: 'social' },
    { nome: 'TikTok', ic: '🎵', min: 28, lim: 30, cat: 'social' },
  ]);
  S.set('fo_rigor', { Instagram: 'medio', 'YouTube (receitas)': 'flex', TikTok: 'rigido' });
  S.set('fo_janelas', [
    { hr: '06:30–07:30', nm: 'Ritual + treino — sem telas', on: 1 },
    { hr: '09:00–11:00', nm: 'Deep work no curso — bloqueio de social', on: 1 },
    { hr: '22:30–06:30', nm: 'Sono — modo noturno', on: 1 },
    { hr: '17:00–18:00', nm: 'Confeitaria — foco na produção', on: 0 },
  ]);
  S.set('fo_meta', 90);

  /* ---------- 06 PROJETOS & METAS (prazos ao longo do ano) ---------- */
  S.set('mt_metas', [
    { id: uid(), nome: 'Lançar o curso online', desc: 'Confeitaria Autoral — gravar, montar e vender o primeiro turma até o fim do ano.', tipo: 'Projeto', medir: 'tarefas', emoji: '🎓', cover: 'roxo', prazo: dISO(11, 30),
      tarefas: [{ t: 'Roteiro dos 4 módulos', ok: 1 }, { t: 'Gravar módulos 1 e 2', ok: 1 }, { t: 'Gravar módulos 3 e 4', ok: 0 }, { t: 'Montar landing page', ok: 0 }, { t: 'Primeira turma (10 alunos)', ok: 0 }], movs: ['+1 módulo gravado · 12 jul'] },
    { id: uid(), nome: 'Reserva de emergência', desc: 'Juntar 6 meses de custos — R$ 18.000.', tipo: 'Projeto', medir: 'valor', emoji: '🛟', cover: 'ambar', prazo: dISO(12, 20), alvo: 18000, atual: 9800, aporte: 700, movs: ['+ R$ 700 · 16 jul'] },
    { id: uid(), nome: 'Correr 10km sem parar', desc: 'Do zero aos 10k — evoluir 1km por mês.', tipo: 'Meta', medir: 'tarefas', emoji: '🏃‍♀️', cover: 'verde', prazo: dISO(10, 15),
      tarefas: [{ t: 'Correr 3km', ok: 1 }, { t: 'Correr 5km', ok: 1 }, { t: 'Correr 7km', ok: 0 }, { t: 'Correr 10km', ok: 0 }], movs: ['5km batido · 10 jul'] },
    { id: uid(), nome: 'Inglês nível B2', desc: 'Destravar a conversa até dezembro.', tipo: 'Meta', medir: 'tarefas', emoji: '🗣️', cover: 'azul', prazo: dISO(12, 15),
      tarefas: [{ t: 'Aulas 3x/semana', ok: 1 }, { t: 'Prova de nível B1', ok: 1 }, { t: 'Manter 30min de conversa', ok: 0 }, { t: 'Prova B2', ok: 0 }], movs: [] },
    { id: uid(), nome: 'Ler 12 livros', desc: 'Um por mês.', tipo: 'Meta', medir: 'tarefas', emoji: '📚', cover: 'verde', prazo: dISO(12, 31),
      tarefas: Array.from({ length: 12 }, (_, i) => ({ t: 'Livro ' + (i + 1), ok: i < 6 ? 1 : 0 })), movs: ['+1 livro · 5 jul'] },
  ]);

  /* ---------- 07 LINHA DO TEMPO (Jan → hoje) ---------- */
  S.set('tl_marcos', [
    { id: uid(), data: dISO(1, 6), tt: 'Decidi levar a Doce Marina a sério', ar: 'Propósito', pq: 'Larguei o medo e assumi: confeitaria não é hobby, é o meu negócio.', auto: 0 },
    { id: uid(), data: dISO(1, 20), tt: 'Comecei a correr', ar: 'Corpo', pq: 'Primeiro 1km sem parar. Anos me achando incapaz ficando pra trás.', auto: 0 },
    { id: uid(), data: dISO(2, 14), tt: 'Primeira encomenda de R$ 1.000', ar: 'Capital', pq: 'Bolo de casamento. A prova de que dá pra viver disso.', auto: 0 },
    { id: uid(), data: dISO(3, 22), tt: 'Terminei "O Poder do Hábito"', ar: 'Mente', pq: 'Entendi que consistência vence intensidade. Mudou minha rotina.', auto: 1 },
    { id: uid(), data: dISO(4, 30), tt: 'Vitamina D saiu da zona crítica', ar: 'Corpo', pq: 'De 19 para 30. O sol e a suplementação funcionaram.', auto: 1 },
    { id: uid(), data: dISO(5, 12), tt: 'Reserva chegou a R$ 8.000', ar: 'Capital', pq: 'Primeira vez na vida com um colchão de verdade. Dá pra respirar.', auto: 1 },
    { id: uid(), data: dISO(6, 18), tt: 'Passei na prova de inglês B1', ar: 'Propósito', pq: 'Consegui manter 20 minutos de conversa. A vergonha diminuindo.', auto: 0 },
    { id: uid(), data: dISO(7, 10), tt: 'Corri 5km sem parar', ar: 'Corpo', pq: 'Metade do caminho pros 10k. Meu corpo me surpreende.', auto: 1 },
    { id: uid(), data: dISO(7, 12), tt: 'Gravei o 2º módulo do curso', ar: 'Propósito', pq: 'O curso está saindo do papel. Metade das gravações prontas.', auto: 0 },
  ]);

  /* ---------- 09 ESPIRITUAL ---------- */
  S.set('es_praticas', [
    { id: uid(), nome: 'Meditação', ic: '🧘', desc: '10 min de silêncio', hist: hist(120, 0.68) },
    { id: uid(), nome: 'Gratidão', ic: '🙏', desc: '3 coisas do dia', hist: hist(120, 0.62) },
    { id: uid(), nome: 'Leitura contemplativa', ic: '📖', desc: '1 página', hist: hist(90, 0.5) },
    { id: uid(), nome: 'Caminhada consciente', ic: '🌿', desc: 'sem fone, presente', hist: hist(90, 0.45) },
  ]);
  S.set('es_intencao', 'Crescer sem me atropelar.');
  S.set('es_reflexoes', [
    { id: uid(), data: hoje, tx: 'O curso, a corrida, o inglês, a reserva — tudo ao mesmo tempo. Preciso lembrar que devagar também é chegar.' },
    { id: uid(), data: add(hoje, -4), tx: 'Gratidão pela coragem de ter começado. A Marina de janeiro não reconheceria a de hoje.' },
    { id: uid(), data: add(hoje, -11), tx: 'Dia difícil na cozinha, encomenda deu errado. Mas errar faz parte de quem cria.' },
  ]);

  if (window.__bumpLive) try { window.__bumpLive(); } catch (e) {}
})();
