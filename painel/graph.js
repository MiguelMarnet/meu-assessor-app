/* ============================================================
   ASSESSOR.IA — ObsidianGraph (resgatado de app/js/obsidian-graph.js)
   Grafo força-dirigida em canvas: pontos se repelem, ligações
   são molas, arrasto elástico, zoom/pan, hover acende vizinhos,
   clique abre a caixinha de contexto do ponto.
   Autossuficiente: injeta o próprio CSS. Dados = Store real da v2
   (chaves ma1:* medidas, não as antigas). Regra de ouro nº3:
   nada aqui é inventado — cada nó nasce de um dado real.
   Expõe: window.BrainData / window.ObsidianGraph
   ============================================================ */
'use strict';
(function () {
  const S = () => window.Store;
  const stripTags = s => String(s == null ? '' : s).replace(/<[^>]*>/g, '');
  const fmtBRL0 = v => window.brl ? window.brl(v) : 'R$ ' + Math.round(v);
  const AREA_MOD = { 'Corpo': 'saude', 'Mente': 'anotacoes', 'Capital': 'financeiro', 'Propósito': 'projetos', 'Foco': 'foco', 'Relações': null };
  const SRC_MOD = [['Saúde', 'saude'], ['Foco Digital', 'foco'], ['Projetos', 'projetos'], ['Financeiro', 'financeiro'], ['Rotina', 'rotina']];

  /* ---------------- construção dos dados (os pontinhos da SUA vida) ---------------- */
  const BrainData = {
    build() {
      const nodes = [], links = [], idx = {};
      const M = id => (typeof MODULES !== 'undefined' && MODULES.find(m => m.id === id)) || { c: '#97826F', n: id };
      const add = (id, label, group, ctx, opts) => {
        if (idx[id] !== undefined) return idx[id];
        opts = opts || {};
        idx[id] = nodes.length;
        nodes.push({ id, label, group, cor: opts.cor || M(group).c, ctx: ctx || '', mod: opts.mod !== undefined ? opts.mod : group, base: opts.base || 0 });
        return idx[id];
      };
      const link = (a, b) => {
        if (idx[a] === undefined || idx[b] === undefined || a === b) return;
        links.push({ s: idx[a], t: idx[b] });
      };

      /* centro */
      add('voce', 'Você', 'cerebro', 'O centro de tudo. Cada ponto ao redor é um pedaço real da sua vida — e as linhas mostram como um pedaço afeta o outro. É assim que o Assessor enxerga você: um sistema, não partes soltas.', { cor: '#649488', base: 9, mod: 'cerebro' });

      /* áreas (módulos) */
      if (typeof MODULES !== 'undefined') MODULES.forEach(m => {
        if (m.id === 'cerebro') return;
        /* KPI vivo do Store (window.liveKPI); m.kpi é só o fallback de
           design. E o texto de apoio sai do motor de Insights, calculado —
           m.ins é literal e não vem de dado nenhum, então não entra aqui. */
        const lk = (window.liveKPI && window.liveKPI(m)) || { v: m.kpi, ks: m.ks };
        const hip = (window.Insights ? window.Insights.hipoteses() : []).find(h => (h.src || '').toLowerCase().includes(m.n.split(' ')[0].toLowerCase()));
        add('mod:' + m.id, m.n.split(' ')[0].replace('&', ''), m.id,
          m.n + ' — ' + m.kl + ' atual: ' + lk.v + (lk.ks || '') + '.' + (hip ? ' ' + stripTags(hip.q) : ''),
          { cor: m.c, base: 5, mod: m.id });
        link('mod:' + m.id, 'voce');
      });

      /* rotina: hábitos */
      S().get('r_habitos', []).forEach(h => {
        const dias = Object.keys(h.hist || {}).length;
        const diasTxt = Array.isArray(h.dias) ? h.dias.join(', ') : String(h.dias || '');
        add('hab:' + h.id, h.nome, 'rotina', 'Hábito rastreado: ' + h.nome + ' (' + diasTxt + ' às ' + h.hr + ') — ' + dias + ' dias registrados. Sequências constroem o longo prazo.');
        link('hab:' + h.id, 'mod:rotina');
        if (/treino|exerc/i.test(h.nome)) link('hab:' + h.id, 'mod:saude');
        if (/foco|deep|tela|celular/i.test(h.nome)) link('hab:' + h.id, 'mod:foco');
      });

      /* saúde: treinos + exames */
      S().get('sa_treinos', []).forEach(t => {
        add('wk:' + t.id, t.tipo, 'saude', 'Treino de ' + t.dia + ': ' + t.tipo + ' — ' + t.dur + ' min, volume ' + t.vol + '.');
        link('wk:' + t.id, 'mod:saude');
      });
      const exams = S().get('sa_exames', []);
      if (exams.length) {
        add('hub:exames', 'Exames de sangue', 'saude', exams.length + ' marcadores acompanhados. Sua saúde contada em números, evoluindo no tempo.', { base: 2 });
        link('hub:exames', 'mod:saude');
        exams.forEach((e, i) => {
          const ult = e.serie[e.serie.length - 1];
          add('ex:' + i, e.nome, 'saude', e.nome + ': ' + ult + ' ' + e.un + ' no último exame (faixa ideal ' + e.ref[0] + '–' + e.ref[1] + '). ' + (e.serie.length > 1 ? 'Evolução: ' + e.serie.join(' → ') + '.' : ''));
          link('ex:' + i, 'hub:exames');
        });
      }

      /* financeiro: categorias + transações */
      const tx = S().get('tx', []);
      const cats = {};
      tx.forEach(t => { if (t.tipo === 'despesa') (cats[t.cat] = cats[t.cat] || []).push(t); });
      Object.keys(cats).forEach(c => {
        const tot = cats[c].reduce((a, t) => a + t.valor, 0);
        add('cat:' + c, c, 'financeiro', 'Categoria de gastos: ' + c + ' — ' + cats[c].length + ' lançamentos somando ' + fmtBRL0(tot) + '.', { base: 1 });
        link('cat:' + c, 'mod:financeiro');
        cats[c].slice(-5).forEach(t => {
          add('tx:' + t.id, fmtBRL0(t.valor), 'financeiro', stripTags(t.desc) + ' — ' + fmtBRL0(t.valor) + ' em ' + t.data + ' (' + c + ').');
          link('tx:' + t.id, 'cat:' + c);
        });
      });

      /* anotações: notas + humor */
      const notas = S().get('nt_notas', []);
      if (notas.length) {
        add('hub:notas', 'Notas', 'anotacoes', notas.length + ' notas guardadas. Onde os padrões aparecem.', { base: 1 });
        link('hub:notas', 'mod:anotacoes');
        notas.forEach(n => {
          add('nt:' + n.id, n.titulo, 'anotacoes', 'Nota "' + n.titulo + '" (' + n.pasta + '), ' + n.data + '.');
          link('nt:' + n.id, 'hub:notas');
        });
      }
      /* projetos: metas do roadmap real + gates + ideias */
      const car = S().get('pj_career', { gates: [] });
      (car.gates || []).forEach(gt => {
        add('gate:' + gt.id, '⛩ ' + gt.id, 'projetos', 'Gate ' + gt.id + ' — ' + gt.nome + '. Condição: ' + gt.criterio + '.', { cor: '#D97F5A', base: 2, mod: 'projetos' });
        link('gate:' + gt.id, 'mod:projetos');
      });
      S().get('mt_metas', []).forEach(m => {
        const tarefas = m.tarefas || [];
        const ok = tarefas.filter(t => t.ok).length;
        const prog = m.medir === 'valor' ? Math.round((m.atual / m.alvo) * 100) : (tarefas.length ? Math.round(ok / tarefas.length * 100) : 0);
        add('gl:' + m.id, m.nome, 'projetos', 'Meta: ' + m.nome + (m.trilho ? ' (trilho ' + m.trilho + ')' : '') + ' — ' + prog + '%.' + (m.desc ? ' ' + m.desc : ''), { base: m.st === 'ativa' ? 1 : 0 });
        link('gl:' + m.id, 'mod:projetos');
        if (m.gate) link('gl:' + m.id, 'gate:' + m.gate);
      });
      S().get('pj_ideias', []).forEach(i => {
        if (i.status === 'descartada') return;
        add('id:' + i.id, '💡 ' + i.texto.slice(0, 18), 'projetos', 'Ideia (' + i.status + '): ' + i.texto + (i.estudo ? ' — Veredito: ' + i.estudo.veredito : ' — ainda não estudada.'));
        link('id:' + i.id, 'mod:projetos');
      });

      /* foco digital */
      S().get('fo_apps', []).forEach((a, i) => {
        add('app:' + i, a.nome, 'foco', a.nome + ': ' + a.min + ' min hoje' + (a.lim ? ' (limite ' + a.lim + ' min)' : '') + '. Tempo é o recurso que não volta.');
        link('app:' + i, 'mod:foco');
      });

      /* espiritual */
      S().get('es_praticas', []).forEach(p => {
        const dias = Object.keys(p.hist || {}).length;
        add('sp:' + p.id, p.nome.split('/')[0].trim(), 'espiritual', 'Prática espiritual: ' + p.nome + ' — ' + dias + ' dias registrados. Constância vale mais que duração.');
        link('sp:' + p.id, 'mod:espiritual');
      });

      /* insights = as pontes entre as áreas (o ouro) */
      if (window.Insights) {
        window.Insights.correlacoes().forEach((c, k) => {
          const ga = AREA_MOD[c.a], gb = AREA_MOD[c.b];
          if (!ga) return;
          const info = window.Insights.conta(c.conta);
          add('ins:' + k, stripTags(c.txt).slice(0, 22), ga, '💡 Padrão detectado: ' + stripTags(c.txt) + (info ? ' — ' + info.nota : ''), { cor: '#D97F5A', base: 1, mod: ga });
          link('ins:' + k, 'mod:' + ga);
          if (gb && gb !== ga) link('ins:' + k, 'mod:' + gb);
        });
        window.Insights.hipoteses().forEach((h, k) => {
          const found = SRC_MOD.find(([nome]) => h.src.indexOf(nome) === 0);
          const g = found ? found[1] : 'cerebro';
          add('hip:' + k, stripTags(h.q).slice(0, 22), g, '💡 ' + stripTags(h.q), { cor: '#D97F5A', base: 1, mod: g });
          link('hip:' + k, 'mod:' + g);
        });
      }

      return { nodes, links };
    }
  };

  /* ---------------- o motor (física + interação idênticas ao Obsidian) ---------------- */
  const ObsidianGraph = {
    _raf: 0,

    css() {
      if (document.getElementById('og-style')) return;
      const st = document.createElement('style');
      st.id = 'og-style';
      st.textContent =
        '.og-wrap{position:relative;width:100%;height:100%;background:#221913;border-radius:8px;overflow:hidden;touch-action:none}' +
        '.og-wrap canvas{display:block;width:100%;height:100%;cursor:default}' +
        '.og-pop{position:absolute;z-index:5;max-width:270px;background:#372921;border:1px solid #453329;border-radius:9px;' +
          'padding:12px 14px;box-shadow:0 14px 40px rgba(0,0,0,.5);color:#C0AB99;font-size:12px;line-height:1.55;' +
          'animation:ogin .18s ease;pointer-events:auto}' +
        '@keyframes ogin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
        '.og-pop b.og-t{display:block;font-size:13px;color:#F7F1EA;margin-bottom:2px}' +
        '.og-pop .og-g{display:inline-block;font-size:10px;font-weight:700;padding:1.5px 8px;border-radius:99px;margin-bottom:7px;' +
          'background:rgba(255,255,255,.07)}' +
        '.og-pop .og-x{position:absolute;top:7px;right:9px;background:none;border:0;color:#97826F;cursor:pointer;font-size:13px}' +
        '.og-pop .og-btn{display:inline-block;margin-top:9px;font-size:11.5px;font-weight:600;color:#fff;background:#453329;' +
          'border:0;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:inherit}' +
        '.og-pop .og-btn:hover{background:#544034}' +
        '.og-zoom{position:absolute;right:10px;bottom:10px;z-index:4;display:flex;flex-direction:column;gap:5px}' +
        '.og-zoom button{width:30px;height:30px;border-radius:7px;border:1px solid #453329;background:#372921;color:#C0AB99;' +
          'cursor:pointer;font-size:15px;line-height:1}' +
        '.og-zoom button:hover{background:#2C211A}' +
        '.og-hint{position:absolute;left:12px;bottom:10px;z-index:4;font-size:10.5px;color:#6B5344;pointer-events:none}';
      document.head.appendChild(st);
    },

    mount(container, opts) {
      opts = opts || {};
      this.css();
      cancelAnimationFrame(this._raf);
      container.classList.add('og-wrap');
      container.innerHTML = '<canvas></canvas>' +
        '<div class="og-zoom"><button data-z="in">+</button><button data-z="out">−</button><button data-z="fit" title="centralizar">⌂</button></div>' +
        '<div class="og-hint">arraste os pontos · role para zoom · clique para entender</div>';
      const canvas = container.querySelector('canvas');
      const ctx2 = canvas.getContext('2d');

      const data = opts.data || BrainData.build();
      const N = data.nodes, L = data.links;
      const deg = new Array(N.length).fill(0);
      L.forEach(l => { deg[l.s]++; deg[l.t]++; });
      const R = i => Math.min(13, 2.6 + (N[i].base || 0) * 0.9 + deg[i] * 0.55);

      /* vizinhança p/ highlight */
      const nb = N.map(() => new Set());
      L.forEach(l => { nb[l.s].add(l.t); nb[l.t].add(l.s); });

      /* posições iniciais: filhos perto do pai (converge rápido e bonito) */
      let W = 600, H = 500, dpr = 1;
      const groupAngle = {};
      if (typeof MODULES !== 'undefined') MODULES.forEach((m, i) => groupAngle[m.id] = -Math.PI / 2 + i * 2 * Math.PI / MODULES.length);
      N.forEach((n, i) => {
        const a = (groupAngle[n.group] !== undefined ? groupAngle[n.group] : Math.random() * 6.28) + (Math.random() - .5) * .7;
        const r = n.id === 'voce' ? 0 : (n.id.indexOf('mod:') === 0 ? 130 : 200 + Math.random() * 130);
        n.x = Math.cos(a) * r + (Math.random() - .5) * 24;
        n.y = Math.sin(a) * r + (Math.random() - .5) * 24;
        n.vx = 0; n.vy = 0; n.fx = null; n.fy = null;
      });

      /* estado de vista e interação */
      let tx = 0, ty = 0, k = 1;
      let alpha = 1, hover = -1, selected = -1;
      let dragging = -1, panning = false, moved = false;
      let px = 0, py = 0, pop = null;

      const fit = () => {
        const rect = container.getBoundingClientRect();
        W = Math.max(200, rect.width); H = Math.max(200, rect.height);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = W * dpr; canvas.height = H * dpr;
        tx = W / 2; ty = H / 2;
        k = Math.min(1, Math.min(W, H) / 760);
        alpha = Math.max(alpha, .3);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(container);

      /* física (forças estilo d3/Obsidian) */
      const LINKD = 42;
      function tick() {
        const a = alpha;
        // repulsão n²
        for (let i = 0; i < N.length; i++) {
          const ni = N[i];
          for (let j = i + 1; j < N.length; j++) {
            const nj = N[j];
            let dx = nj.x - ni.x, dy = nj.y - ni.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = (Math.random() - .5); dy = (Math.random() - .5); d2 = 1; }
            if (d2 > 32000) continue;
            const f = -820 * a / d2;
            const d = Math.sqrt(d2);
            const fx = dx / d * f, fy = dy / d * f;
            ni.vx += fx; ni.vy += fy;
            nj.vx -= fx; nj.vy -= fy;
          }
        }
        // molas dos links (força ~ 1/min(grau) como o d3)
        L.forEach(l => {
          const s = N[l.s], t = N[l.t];
          let dx = t.x - s.x, dy = t.y - s.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const desired = LINKD + R(l.s) + R(l.t);
          const strength = 1 / Math.max(1, Math.min(deg[l.s], deg[l.t]));
          const f = (d - desired) * 0.28 * strength * a;
          dx /= d; dy /= d;
          s.vx += dx * f; s.vy += dy * f;
          t.vx -= dx * f; t.vy -= dy * f;
        });
        // gravidade ao centro
        N.forEach(n => {
          const g = n.id === 'voce' ? .09 : .015;
          n.vx -= n.x * g * a; n.vy -= n.y * g * a;
        });
        // integração
        N.forEach(n => {
          if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return; }
          n.vx *= .82; n.vy *= .82;
          n.x += n.vx; n.y += n.vy;
        });
        alpha = Math.max(.02, alpha * .985);
      }
      for (let i = 0; i < 160; i++) tick(); // pré-assentamento

      /* helpers de coordenadas */
      const toWorld = (sx, sy) => [(sx - tx) / k, (sy - ty) / k];
      const toScreen = n => [n.x * k + tx, n.y * k + ty];
      const hit = (sx, sy) => {
        const [wx, wy] = toWorld(sx, sy);
        let best = -1, bd = 1e9;
        for (let i = 0; i < N.length; i++) {
          const d = Math.hypot(wx - N[i].x, wy - N[i].y);
          if (d < R(i) + 6 / k && d < bd) { bd = d; best = i; }
        }
        return best;
      };

      /* caixinha de contexto (a "nota" do ponto) */
      const closePop = () => { if (pop) { pop.remove(); pop = null; } selected = -1; };
      const openPop = i => {
        closePop();
        selected = i;
        const n = N[i];
        const m = typeof MODULES !== 'undefined' ? MODULES.find(x => x.id === (n.mod || n.group)) : null;
        pop = document.createElement('div');
        pop.className = 'og-pop';
        pop.innerHTML =
          '<button class="og-x">✕</button>' +
          '<b class="og-t">' + esc(n.label) + '</b>' +
          '<span class="og-g" style="color:' + n.cor + '">' + esc(m ? m.n : n.group) + '</span>' +
          '<div>' + esc(n.ctx) + '</div>' +
          '<div style="margin-top:7px;font-size:10.5px;color:#97826F">' + deg[i] + ' conexõe' + (deg[i] === 1 ? '' : 's') + ' neste ponto</div>' +
          (m && n.id !== 'voce' ? '<button class="og-btn">Abrir ' + esc(m.n) + ' →</button>' : '');
        container.appendChild(pop);
        pop.querySelector('.og-x').onclick = e => { e.stopPropagation(); closePop(); };
        const btn = pop.querySelector('.og-btn');
        if (btn) btn.onclick = e => { e.stopPropagation(); if (opts.onOpenModule) opts.onOpenModule(m.id); };
        placePop();
      };
      function placePop() {
        if (!pop || selected < 0) return;
        const [sx, sy] = toScreen(N[selected]);
        const bw = pop.offsetWidth || 250, bh = pop.offsetHeight || 120;
        let x = sx + R(selected) * k + 14, y = sy - bh / 2;
        if (x + bw > W - 8) x = sx - bw - R(selected) * k - 14;
        if (x < 8) x = 8;
        y = Math.max(8, Math.min(H - bh - 8, y));
        pop.style.left = x + 'px'; pop.style.top = y + 'px';
      }

      /* interação */
      canvas.addEventListener('pointerdown', e => {
        canvas.setPointerCapture(e.pointerId);
        const r = canvas.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top;
        moved = false;
        const h = hit(px, py);
        if (h >= 0) { dragging = h; N[h].fx = N[h].x; N[h].fy = N[h].y; }
        else panning = true;
      });
      canvas.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        const sx = e.clientX - r.left, sy = e.clientY - r.top;
        if (dragging >= 0) {
          const [wx, wy] = toWorld(sx, sy);
          N[dragging].fx = wx; N[dragging].fy = wy;
          alpha = Math.max(alpha, .45);
          if (Math.hypot(sx - px, sy - py) > 4) moved = true;
        } else if (panning) {
          tx += sx - px; ty += sy - py;
          px = sx; py = sy;
          if (Math.hypot(e.movementX, e.movementY) > 0) moved = true;
          placePop();
        } else {
          const h = hit(sx, sy);
          if (h !== hover) { hover = h; canvas.style.cursor = h >= 0 ? 'pointer' : 'default'; }
        }
      });
      canvas.addEventListener('pointerup', e => {
        if (dragging >= 0) {
          const i = dragging;
          N[i].fx = null; N[i].fy = null;
          dragging = -1;
          if (!moved) openPop(i);
        } else if (panning) {
          panning = false;
          if (!moved) closePop();
        }
      });
      canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const sx = e.clientX - r.left, sy = e.clientY - r.top;
        const [wx, wy] = toWorld(sx, sy);
        k = Math.max(.22, Math.min(4, k * (e.deltaY < 0 ? 1.13 : .885)));
        tx = sx - wx * k; ty = sy - wy * k;
        placePop();
      }, { passive: false });
      container.querySelector('.og-zoom').addEventListener('click', e => {
        const z = e.target.dataset && e.target.dataset.z;
        if (!z) return;
        if (z === 'fit') { tx = W / 2; ty = H / 2; k = Math.min(1, Math.min(W, H) / 760); }
        else k = Math.max(.22, Math.min(4, k * (z === 'in' ? 1.25 : .8)));
        placePop();
      });

      /* render (visual idêntico: pontos cinza, hover acende e apaga o resto) */
      const draw = () => {
        if (!canvas.isConnected) { cancelAnimationFrame(this._raf); ro.disconnect(); return; }
        tick();
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2.clearRect(0, 0, W, H);
        ctx2.fillStyle = '#221913';
        ctx2.fillRect(0, 0, W, H);

        const focus = selected >= 0 ? selected : hover;
        const active = focus >= 0 ? nb[focus] : null;

        // links
        L.forEach(l => {
          const [x1, y1] = toScreen(N[l.s]);
          const [x2, y2] = toScreen(N[l.t]);
          const lit = focus >= 0 && (l.s === focus || l.t === focus);
          const dim = focus >= 0 && !lit;
          ctx2.beginPath();
          ctx2.moveTo(x1, y1); ctx2.lineTo(x2, y2);
          ctx2.strokeStyle = lit ? N[focus].cor + 'AA' : (dim ? 'rgba(150,150,160,.05)' : 'rgba(150,150,160,.16)');
          ctx2.lineWidth = lit ? 1.4 : 1;
          ctx2.stroke();
        });

        // nós
        for (let i = 0; i < N.length; i++) {
          const n = N[i];
          const [sx, sy] = toScreen(n);
          if (sx < -30 || sy < -30 || sx > W + 30 || sy > H + 30) continue;
          const r = R(i) * k;
          const isFocus = i === focus;
          const isNb = active && active.has(i);
          const dim = focus >= 0 && !isFocus && !isNb;
          ctx2.beginPath();
          ctx2.arc(sx, sy, Math.max(1.5, r), 0, 6.283);
          ctx2.fillStyle = isFocus ? n.cor : (isNb ? n.cor + 'D9' : (dim ? 'rgba(160,160,170,.16)' : '#97826F'));
          ctx2.fill();
          if (isFocus || i === selected) {
            ctx2.beginPath();
            ctx2.arc(sx, sy, Math.max(1.5, r) + 3.5, 0, 6.283);
            ctx2.strokeStyle = n.cor + '66';
            ctx2.lineWidth = 2;
            ctx2.stroke();
          }
          // rótulos: no hover (nó + vizinhos) ou em zoom alto
          if (isFocus || isNb || k > 1.55) {
            ctx2.font = (isFocus ? '600 ' : '') + '10.5px ' + '"Segoe UI",system-ui';
            ctx2.textAlign = 'center';
            ctx2.fillStyle = isFocus ? '#F7F1EA' : (dim ? 'rgba(170,170,180,.2)' : 'rgba(200,200,210,.75)');
            ctx2.fillText(n.label, sx, sy + r + 12);
          }
        }
        placePop();
        this._raf = requestAnimationFrame(draw);
      };
      this._raf = requestAnimationFrame(draw);
    }
  };

  window.BrainData = BrainData;
  window.ObsidianGraph = ObsidianGraph;
})();
