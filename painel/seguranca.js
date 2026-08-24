/* Verificação em duas etapas — TOTP (código do celular) e chave de segurança
   (passkey / biometria).

   Duas decisões que valem registrar:

   1. É OPCIONAL de ativar, mas OBRIGATÓRIA depois de ativada. Forçar todo mundo
      no primeiro acesso é fadiga garantida — a pessoa desiste antes de ter
      motivo pra proteger. Depois de ativada, porém, a exigência tem que valer
      no servidor também (require_aal2 no banco), senão é teatro: quem chamasse
      a API direto passaria por cima da tela.

   2. Nunca deixamos a pessoa ficar com um método só sem avisar. Um fator só =
      perdeu o aparelho, perdeu a conta. A tela avisa em destaque quando é o
      caso e empurra o segundo método.

   API do supabase-js usada aqui (conferida na versão 2.112 antes de escrever,
   lendo o bundle — não de memória):
     mfa.enroll({factorType:'totp'})   -> {id, totp:{qr_code, secret}}
     mfa.challengeAndVerify({factorId, code})
     mfa.webauthn.register({friendlyName})       (enroll+challenge+verify)
     mfa.webauthn.authenticate({factorId, webauthn:{rpId, rpOrigins}})
     mfa.listFactors() / mfa.unenroll({factorId})
     mfa.getAuthenticatorAssuranceLevel() -> {currentLevel, nextLevel}
*/
window.Seguranca = (function () {
  const S = () => window.Supa;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aviso = m => (window.toast ? window.toast(m) : alert(m));

  async function fatores() {
    const { data, error } = await S().auth.mfa.listFactors();
    if (error) return [];
    const todos = (data && (data.all || [])) || [];
    return todos.filter(f => f.status === 'verified');
  }

  function nomeMetodo(f) {
    if (f.factor_type === 'webauthn') return 'Chave de segurança / biometria';
    if (f.factor_type === 'totp') return 'App de código (6 dígitos)';
    return f.factor_type;
  }

  /* ---------- Tela principal ---------- */
  async function abrir() {
    Modal.open('<h3>Verificação em duas etapas</h3><p class="msub">Carregando…</p>');
    const fs = await fatores();
    const temPasskey = fs.some(f => f.factor_type === 'webauthn');
    const temTotp = fs.some(f => f.factor_type === 'totp');

    const lista = fs.length
      ? fs.map(f => '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)">' +
          '<span>' + esc(nomeMetodo(f)) + (f.friendly_name ? ' · ' + esc(f.friendly_name) : '') + '</span>' +
          '<button class="btn2 clickable" data-remover="' + esc(f.id) + '" style="padding:4px 10px;font-size:12px">Remover</button></div>').join('')
      : '<p class="msub">Nenhum método ativo. Hoje sua conta depende só do login do Google.</p>';

    const soUm = fs.length === 1
      ? '<p class="msub" style="color:#e0836b"><b>Você tem só um método.</b> Se perder esse aparelho, perde o acesso. Cadastre um segundo agora — leva 30 segundos.</p>'
      : '';

    Modal.open('<h3>Verificação em duas etapas</h3>' +
      '<p class="msub">Uma segunda prova de que é você, além do login do Google. Protege seu histórico mesmo que alguém consiga entrar na sua conta Google.</p>' +
      lista + soUm +
      '<div class="mactions" style="flex-wrap:wrap;margin-top:14px">' +
      (temTotp ? '' : '<button class="btn2 clickable" id="sg_totp">Usar app de código</button>') +
      (temPasskey ? '' : '<button class="btn2 clickable" id="sg_key">Usar chave de segurança ou biometria</button>') +
      '<button class="btn2 primary clickable" id="sg_voltar">Voltar</button></div>');

    document.getElementById('sg_voltar').onclick = () => (window.App && App.settings ? App.settings() : Modal.close());
    const bT = document.getElementById('sg_totp'); if (bT) bT.onclick = ativarTotp;
    const bK = document.getElementById('sg_key'); if (bK) bK.onclick = ativarPasskey;
    document.querySelectorAll('[data-remover]').forEach(b => {
      b.onclick = () => remover(b.getAttribute('data-remover'), fs.length);
    });
  }

  /* ---------- TOTP ---------- */
  async function ativarTotp() {
    Modal.open('<h3>App de código</h3><p class="msub">Preparando…</p>');
    const { data, error } = await S().auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Código do celular' });
    if (error) { aviso('Não consegui começar agora: ' + error.message); return abrir(); }
    const id = data.id, totp = data.totp;

    Modal.open('<h3>App de código</h3>' +
      '<p class="msub">Abra seu app de autenticação (Google Authenticator, Authy, 1Password…) e aponte a câmera para o código abaixo.</p>' +
      '<div style="background:#fff;padding:10px;border-radius:12px;width:200px;margin:12px auto">' + totp.qr_code + '</div>' +
      '<p class="msub" style="text-align:center">Não dá pra escanear? Digite este código no app:<br><b style="font-family:monospace;letter-spacing:.06em">' + esc(totp.secret) + '</b></p>' +
      '<label class="f">Agora digite os 6 dígitos que o app mostrar</label>' +
      '<input type="text" id="sg_code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">' +
      '<p class="msub" id="sg_erro" style="color:#e0836b;display:none"></p>' +
      '<div class="mactions"><button class="btn2 clickable" id="sg_cancel">Cancelar</button><button class="btn2 primary clickable" id="sg_ok">Ativar</button></div>');

    document.getElementById('sg_cancel').onclick = async () => {
      try { await S().auth.mfa.unenroll({ factorId: id }); } catch (e) {}
      abrir();
    };
    document.getElementById('sg_ok').onclick = async () => {
      const code = (document.getElementById('sg_code').value || '').replace(/\D/g, '');
      const err = document.getElementById('sg_erro');
      if (code.length !== 6) { err.textContent = 'São 6 dígitos.'; err.style.display = 'block'; return; }
      const r = await S().auth.mfa.challengeAndVerify({ factorId: id, code });
      if (r.error) { err.textContent = 'Código não confere. Tenta o próximo que o app mostrar.'; err.style.display = 'block'; return; }
      aviso('Verificação em duas etapas ativada ✔');
      abrir();
    };
  }

  /* ---------- Passkey / chave de segurança ---------- */
  async function ativarPasskey() {
    if (!window.PublicKeyCredential) {
      aviso('Este navegador não suporta chave de segurança. Use o app de código.');
      return abrir();
    }
    Modal.open('<h3>Chave de segurança</h3><p class="msub">Confirme no aparelho — pode pedir sua digital, seu rosto ou o PIN do computador.</p>');
    const r = await S().auth.mfa.webauthn.register({ friendlyName: 'Chave de ' + (navigator.platform || 'este aparelho') });
    if (r.error) {
      /* Passkey desligada no projeto devolve erro do servidor; cancelamento vem
         do navegador. Separar os dois evita mandar a pessoa "tentar de novo"
         num caminho que está desligado. */
      const m = String(r.error.message || '');
      if (/not enabled|disabled|unsupported/i.test(m)) aviso('Chave de segurança ainda não está habilitada neste projeto. Use o app de código.');
      else if (/abort|cancel|NotAllowed/i.test(m)) aviso('Cancelado.');
      else aviso('Não consegui cadastrar: ' + m);
      return abrir();
    }
    aviso('Chave de segurança cadastrada ✔');
    abrir();
  }

  /* ---------- Remover ---------- */
  function remover(factorId, total) {
    const ultimo = total <= 1;
    Modal.open('<h3>Remover este método?</h3>' +
      '<p class="msub">' + (ultimo
        ? 'Este é seu <b>último método</b>. Removendo, sua conta volta a depender só do login do Google.'
        : 'Você continua com os outros métodos ativos.') + '</p>' +
      '<div class="mactions"><button class="btn2 clickable" id="rm_no">Voltar</button><button class="btn2 primary clickable" id="rm_sim">Remover</button></div>');
    document.getElementById('rm_no').onclick = abrir;
    document.getElementById('rm_sim').onclick = async () => {
      const r = await S().auth.mfa.unenroll({ factorId });
      aviso(r.error ? 'Não consegui remover: ' + r.error.message : 'Método removido.');
      abrir();
    };
  }

  /* ---------- Porteiro do login ----------
     Chamado no boot. Se a conta tem 2FA e a sessão ainda é aal1, exige o
     segundo fator ANTES de o app aparecer. Devolve true quando pode seguir. */
  async function exigirSegundoFator() {
    let nivel;
    try { nivel = (await S().auth.mfa.getAuthenticatorAssuranceLevel()).data; } catch (e) { return true; }
    if (!nivel || nivel.currentLevel === nivel.nextLevel) return true;   // sem 2FA, ou já passou

    const fs = await fatores();
    if (!fs.length) return true;

    return await new Promise(resolve => {
      const passkey = fs.find(f => f.factor_type === 'webauthn');
      const totp = fs.find(f => f.factor_type === 'totp');
      Modal.open('<h3>Confirme que é você</h3>' +
        '<p class="msub">Sua conta usa verificação em duas etapas.</p>' +
        (totp ? '<label class="f">Código de 6 dígitos do seu app</label><input type="text" id="gt_code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">' : '') +
        '<p class="msub" id="gt_erro" style="color:#e0836b;display:none"></p>' +
        '<div class="mactions" style="flex-wrap:wrap">' +
        (passkey ? '<button class="btn2 clickable" id="gt_key">Usar chave de segurança</button>' : '') +
        (totp ? '<button class="btn2 primary clickable" id="gt_ok">Confirmar</button>' : '') +
        '<button class="btn2 clickable" id="gt_sair">Sair</button></div>');

      const erro = m => { const e = document.getElementById('gt_erro'); e.textContent = m; e.style.display = 'block'; };

      document.getElementById('gt_sair').onclick = async () => { await S().auth.signOut(); location.reload(); };

      const bK = document.getElementById('gt_key');
      if (bK) bK.onclick = async () => {
        const r = await S().auth.mfa.webauthn.authenticate({
          factorId: passkey.id,
          webauthn: { rpId: location.hostname, rpOrigins: [location.origin] }
        });
        if (r.error) return erro('Não deu certo: ' + r.error.message);
        Modal.close(); resolve(true);
      };

      const bOk = document.getElementById('gt_ok');
      if (bOk) bOk.onclick = async () => {
        const code = (document.getElementById('gt_code').value || '').replace(/\D/g, '');
        if (code.length !== 6) return erro('São 6 dígitos.');
        const r = await S().auth.mfa.challengeAndVerify({ factorId: totp.id, code });
        if (r.error) return erro('Código não confere.');
        Modal.close(); resolve(true);
      };
    });
  }

  return { abrir, exigirSegundoFator };
})();
