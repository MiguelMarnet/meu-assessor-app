/* Falar com o Assessor de dentro do painel.
 *
 * O texto (digitado ou ditado) vai para o MESMO cérebro que atende o WhatsApp:
 * um sub-fluxo no n8n chamado pelos dois canais. Não existe uma segunda IA —
 * duas cópias divergem em silêncio, que foi a dor de 2026-08-26.
 *
 * A voz aqui só ESCUTA. A fala de saída foi removida: usava a voz do sistema,
 * que varia de aparelho pra aparelho (nesta máquina só havia vozes em inglês).
 * Ele transcreve e responde por escrito.
 */
window.Conversa = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let URL_CHAT = '';
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, ouvindo = false;


  /* Prazo para fetch: sem ele, um servidor que aceita a conexão e nunca
     responde trava a espera para sempre (02/10, o painel na porta). */
  const comPrazo = (ms, fn) => {
    const corta = new AbortController();
    const t = setTimeout(() => corta.abort(), ms);
    return fn(corta.signal).finally(() => clearTimeout(t));
  };

  async function carregarConfig() {
    try {
      const c = await comPrazo(4000, s => fetch('../config.json', { cache: 'no-store', signal: s }).then(r => r.json()));
      URL_CHAT = c.chatWebhook || '';
    } catch (e) { URL_CHAT = ''; }
  }

  function bolha(quem, texto, classe) {
    const c = document.getElementById('cvLog');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'cv-bolha ' + classe;
    d.innerHTML = '<span class="cv-quem">' + esc(quem) + '</span>' + esc(texto);
    c.appendChild(d);
    d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto) return;
    bolha('Você', texto, 'eu');
    document.getElementById('cvTexto').value = '';

    if (!URL_CHAT) { bolha('Assessor', 'A conversa ainda não está configurada aqui.', 'ela'); return; }

    /* A sessão vai junto: o n8n confere com o Supabase e descobre QUEM é pelo
       banco. O número nunca vem do navegador — senão bastaria mandar o de
       outra pessoa para falar como ela. */
    let token = '';
    try {
      const { data: { session } } = await window.Supa.auth.getSession();
      token = session ? session.access_token : '';
    } catch (e) {}
    if (!token) { bolha('Assessor', 'Sua sessão expirou. Entra de novo.', 'ela'); return; }

    const pensando = document.createElement('div');
    pensando.className = 'cv-bolha ela cv-pensando';
    pensando.textContent = 'pensando…';
    document.getElementById('cvLog').appendChild(pensando);

    try {
      /* 90s: medido em 08/10, o chat do painel levou até 27s e o cérebro por
         trás dele até 70s (Gemini, às vezes Google). Cortar antes disso faria a
         pessoa achar que falhou algo que ia dar certo. Abortar NÃO quer dizer que não foi feito: o pedido pode ter
         chegado e o gasto ter sido gravado. Por isso o aviso abaixo é outro. */
      const r = await comPrazo(90000, s => fetch(URL_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ access_token: token, texto }),
        signal: s
      }));
      pensando.remove();
      if (!r.ok) { bolha('Assessor', 'Não consegui responder agora (erro ' + r.status + ').', 'ela'); return; }
      const txt = await r.text();
      let j = null; try { j = JSON.parse(txt); } catch (e) {}
      bolha('Assessor', (j && j.resposta) || 'Recebi, mas não veio resposta.', 'ela');
    } catch (e) {
      pensando.remove();
      /* Prazo estourado ≠ servidor fora. Mandar de novo um "gastei 50" que já
         foi gravado duplicaria o gasto — a regra é nunca criar dado falso. */
      bolha('Assessor', e && e.name === 'AbortError'
        ? 'Demorei demais para responder. Se era um registro, confira antes de mandar de novo — pode já ter sido salvo.'
        : 'Não consegui falar com o servidor agora.', 'ela');
    }
  }

  /* ---- Ditar ----------------------------------------------------------- */
  function pararDeOuvir() {
    ouvindo = false;
    const b = document.getElementById('cvMic');
    if (b) { b.classList.remove('gravando'); b.textContent = '🎙️'; }
    if (rec) { try { rec.stop(); } catch (e) {} }
  }

  function ouvir() {
    if (!Rec) return;
    rec = new Rec();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;
    let ultimo = '';
    rec.onresult = ev => {
      ultimo = [...ev.results].map(x => x[0].transcript).join('');
      document.getElementById('cvTexto').value = ultimo;
    };
    rec.onerror = () => pararDeOuvir();
    rec.onend = () => { pararDeOuvir(); if (ultimo.trim()) enviar(ultimo); };
    ouvindo = true;
    const b = document.getElementById('cvMic');
    b.classList.add('gravando'); b.textContent = '●';
    rec.start();
  }

  async function ligar() {
    await carregarConfig();
    const campo = document.getElementById('cvTexto');
    const mic = document.getElementById('cvMic');
    const env = document.getElementById('cvEnviar');
    if (!campo) return;

    env.onclick = () => enviar(campo.value);
    campo.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(campo.value); });

    if (!Rec) { mic.style.display = 'none'; }   // Firefox: some o microfone, o campo continua
    else {
      ['mousedown', 'touchstart'].forEach(ev => mic.addEventListener(ev, e => { e.preventDefault(); if (!ouvindo) ouvir(); }));
      ['mouseup', 'mouseleave', 'touchend'].forEach(ev => mic.addEventListener(ev, () => { if (ouvindo) pararDeOuvir(); }));
    }
  }

  return { ligar, enviar };
})();
