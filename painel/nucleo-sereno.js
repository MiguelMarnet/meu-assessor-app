/* ============================================================
   ASSESSOR.IA — NÚCLEO SERENO (motor v4)

   Duas referências, uma coisa só:

   · O VÍDEO deu o MATERIAL: uma gota d'água. Translúcida de
     verdade — o fundo atravessa —, com realces especulares
     alongados que seguem a curvatura, borda com contorno de luz, e
     lóbulos GRANDES e MACIOS. Não é argila; é líquido preso numa
     película.
   · A FOTO deu a LUZ e a COR: creme no alto, terracota embaixo,
     luz difusa quente, e um campo de micro-ondas concêntricas.

   Três coisas que este arquivo corrige de tentativas anteriores:

   1. TRANSLÚCIDO, não fosco. Eu tinha tirado `transmission` por
      custo (medi 16,2ms de um quadro de 29,4ms na v3). Mas é ela
      que faz a bola do vídeo ser bola d'água. Volta — e o orçamento
      é pago baixando o detalhe da malha, que a deformação macia
      não precisa de tanta.
   2. RUÍDO DE BAIXA FREQUÊNCIA. O polimorfismo estava com
      frequência alta e por isso parecia desenho animado. No vídeo
      são 3-4 lóbulos enormes e suaves. Frequência cai de 0.85 para
      0.42 e a amplitude sobe.
   3. MUITAS MICRO-ONDAS. O campo tinha poucos anéis largos. A foto
      tem muitos anéis finos que vão abrindo conforme se afastam —
      um chirp, não uma senoide de período fixo.
   ============================================================ */

import { NOISE } from './nucleo.js';

export const SERENO = {
  topo:   0xF2E7D2,
  alto:   0xEDD3AE,
  meio:   0xE8B896,
  baixo:  0xD97F5A,
  base:   0xC96A45,
  crista: 0xFAF4EC,
  vale:   0xE3CFBD,
  contato:0xC99B7E,
};

export function nivelDoAparelho() {
  const mem = navigator.deviceMemory || 4;
  const cpu = navigator.hardwareConcurrency || 4;
  const toque = matchMedia('(hover: none)').matches;
  if (toque && (mem <= 4 || cpu <= 4)) return 1;
  if (toque) return 2;
  return 3;
}

/* `transmissao` desligada no nível 1: ela redesenha a cena inteira
   num render target, e celular fraco não paga esse pedágio. Lá a
   translucidez vira alpha + fresnel, que lê parecido e custa zero. */
/* Orçamento medido na Intel UHD 630 a 1280×800, não estimado:
   com corpo 44 + campo 200×88 dava 21,7ms (46fps) — a transmissão
   sozinha custava 13,2ms porque redesenha a cena INTEIRA, e nessa
   segunda passada o campo pesa tanto quanto o corpo. Cortar os dois
   pela metade é o que devolve o quadro. A deformação é de baixa
   frequência (uFreq 0.42), então o corpo continua liso com menos
   malha — detalhe alto só serviria para ruído fino que não existe. */
const PERFIL = {
  1: { corpo: 20, fio: 12, pontos: 16, anelR: 70,  anelA: 40, transmissao: false, dpr: 1.25 },
  2: { corpo: 26, fio: 14, pontos: 18, anelR: 96,  anelA: 52, transmissao: true,  dpr: 1.5  },
  3: { corpo: 32, fio: 18, pontos: 24, anelR: 128, anelA: 64, transmissao: true,  dpr: 1.75 },
};

/* ---------- a forma ----------
   O distort() da v2, com a frequência baixada. A assinatura é dele;
   o que muda é o tamanho das features. */
const PELE = `
  uniform float uTime, uAmp, uShapeA, uShapeB, uShapeMix;
  uniform vec3  uToqueDir;
  uniform float uToqueF, uFreq;

  vec3 esculpir(vec3 p){
    vec3 d = distort(p, uTime, uFreq, 0.18, uAmp, uShapeA, uShapeB, uShapeMix);
    vec3 dir = normalize(p);
    float dt = 1.0 - dot(dir, uToqueDir);
    return d - dir * (uToqueF * exp(-dt*dt*5.5) * 0.30);
  }`;

/* O degradê entra como TINTA, não como pintura.
   Multiplicar a cor do vidro pelo terracota cru escurecia o miolo
   até quase preto (medido: [65,0,1] no centro). Normalizando cada
   parada pelo próprio canal máximo, o vermelho fica em 1.0 e só o
   verde e o azul descem — ou seja, a bola ESQUENTA de cima para
   baixo em vez de apagar. É o que a foto faz. */
const GRADIENTE = `
  vec3 tinta(vec3 c){ return c / max(max(c.r, c.g), max(c.b, 0.001)); }
  vec3 corPorAltura(float y, float raio, vec3 cTopo, vec3 cAlto, vec3 cMeio, vec3 cBaixo, vec3 cBase){
    float h = clamp((y / (raio*1.02)) * 0.5 + 0.5, 0.0, 1.0);
    /* O TOPO NÃO É TINGIDO. Este era o erro: eu aplicava tinta quente
       na bola inteira, então o alto já saía pêssego ([202,160,130])
       em vez do creme do próprio vidro, e a variação do topo à base
       era de míseros 16 pontos de verde.
       Na foto o creme do alto É o material; só a base puxa terracota.
       Então a rampa vai de BRANCO (não mexe) até o terracota. */
    if (h > 0.34) return mix(tinta(cMeio), vec3(1.0), smoothstep(0.34, 0.80, h));
    return mix(tinta(cBase), tinta(cMeio), smoothstep(0.0, 0.34, h));
  }`;

export class NucleoSereno {
  constructor(opts) {
    const { THREE, RoomEnvironment, canvas, reduzido = false } = opts;
    this.THREE = THREE;
    this.reduzido = reduzido;
    this.nivel = opts.nivel || nivelDoAparelho();
    this.perfil = PERFIL[this.nivel];

    const R = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.nivel >= 2, alpha: true });
    R.setPixelRatio(Math.min(devicePixelRatio, this.perfil.dpr));
    /* `false` também aqui: quem manda no tamanho VISUAL do canvas é o
       CSS (`#scene{width:100vw;height:100vh}`). O renderer cuida só da
       resolução do buffer. Ver a nota longa em `redimensionar()`. */
    R.setSize(innerWidth || 1, innerHeight || 1, false);
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.12;

    this.cena = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, (innerWidth || 1) / (innerHeight || 1), 0.1, 100);
    this.camera.position.set(0, 1.4, 8.2);

    /* Os realces do vídeo — aqueles 4-5 pontos brilhantes agrupados —
       são reflexos de painéis de luz. RoomEnvironment é exatamente
       isso: um estúdio com retângulos luminosos. É de graça e é a
       fonte do brilho. */
    if (RoomEnvironment) {
      const pm = new THREE.PMREMGenerator(R);
      this.cena.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    }

    /* chave quente de cima + contra-luz fria por trás: a contra-luz
       é o que desenha a borda iluminada da gota */
    const kl = new THREE.DirectionalLight(0xFFF0DC, 2.1); kl.position.set(-3, 6, 4); this.cena.add(kl);
    const bl = new THREE.DirectionalLight(0xCFE0FF, 1.3); bl.position.set(2, 1.5, -6); this.cena.add(bl);
    this.cena.add(new THREE.AmbientLight(0xFFF6EA, 0.35));

    /* ---- FUNDO DENTRO DA CENA ----
       Sem isto a transmissão não tem o que atravessar: o canvas é
       transparente, a bola refrata o vazio e sai PRETA. Medido: o
       miolo dava [65,0,1]. Na foto de referência a esfera refrata o
       creme do ambiente — então o creme precisa existir em 3D, não
       só no CSS atrás do canvas. */
    this.corFundo = new THREE.Color(0xF7F1EA);
    this.cena.background = this.corFundo;

    this.raiz = new THREE.Group();
    this.cena.add(this.raiz);

    this.RAIO = 1.35;
    this.escuro = false;

    this._toqueDir = new THREE.Vector3(0, 0, 1);
    this._toqueF = 0; this._toqueVel = 0; this._toqueAlvo = 0;
    this.girando = { x: 0, y: 0, vx: 0, vy: 0 };
    this._pulso = 0;
    this._comp = 0; this._compAlvo = 0;
    this._corComp = new THREE.Color(SERENO.baixo);
    this._forma = [0, 0, 0];
    this._amp = 0.24;

    this._ondas = new Float32Array(12);
    this._corOnda = [];
    for (let i = 0; i < 4; i++) this._corOnda.push(new THREE.Color(SERENO.baixo));
    this._proxOnda = 0;
    this._semanas = new Float32Array(16);

    this.uForma = {
      uTime:    { value: 0 },
      uAmp:     { value: 0.24 },
      uShapeA:  { value: 0 },
      uShapeB:  { value: 0 },
      uShapeMix:{ value: 0 },
      uToqueDir:{ value: this._toqueDir },
      uToqueF:  { value: 0 },
      /* 0.42 em vez de 0.85: features duas vezes maiores. É a
         diferença entre "bolha de sabão" e "batata". */
      uFreq:    { value: 0.42 },
    };
    this.uCor = {
      uTopo:  { value: new THREE.Color(SERENO.topo) },
      uAlto:  { value: new THREE.Color(SERENO.alto) },
      uMeio:  { value: new THREE.Color(SERENO.meio) },
      uBaixo: { value: new THREE.Color(SERENO.baixo) },
      uBase:  { value: new THREE.Color(SERENO.base) },
      uRaio:  { value: this.RAIO },
    };

    this._montarCorpo();
    this._montarFio();
    this._montarPontos();
    this._montarCampo();
    this._montarContato();

    addEventListener('resize', () => this.redimensionar());
  }

  /* ================= o corpo: a gota ================= */
  _montarCorpo() {
    const T = this.THREE, p = this.perfil;
    const geo = new T.IcosahedronGeometry(this.RAIO, p.corpo);

    /* Material físico de verdade, porque é ele que traz transmissão,
       fresnel, clearcoat e reflexo de ambiente prontos e corretos.
       Escrever isso à mão daria pior. */
    const mat = new T.MeshPhysicalMaterial({
      color: 0xFFF3E4,
      roughness: 0.06,          // vidro liso → realces nítidos e alongados
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.4,     // os realces vêm daqui
      transparent: true,
      /* FrontSide, não DoubleSide: com transmissão a face de trás
         absorve de novo e a bola escurece. Medido: DoubleSide dava
         média [198,186,172], FrontSide dá [217,207,198] — mais
         limpa, e ainda por cima metade dos fragmentos. */
      side: T.FrontSide,
    });

    if (p.transmissao) {
      mat.transmission = 1;
      mat.thickness = 1.4;
      mat.ior = 1.36;                                  // entre água (1.33) e vidro
      /* Atenuação SUAVE. Com attenuationColor no terracota cru e
         distância 1.5 o miolo mediu [65,0,1] — preto avermelhado.
         A cor de atenuação agora é o pêssego do meio da paleta e a
         distância é o dobro: a luz atravessa e sai quente, não
         morre no caminho. */
      mat.attenuationColor = new T.Color(SERENO.meio);
      mat.attenuationDistance = 3.4;
      mat.specularIntensity = 1;
    } else {
      /* Nível 1 (celular fraco): sem transmissão, a translucidez sai
         de alpha + fresnel. 0.55 deixava a bola FANTASMA — medido,
         ela cobria 12k pixels contra 22k nos outros níveis, ou seja
         metade dela sumia no fundo. 0.84 devolve o corpo e ainda lê
         como vidro por causa do clearcoat e do reflexo de ambiente. */
      mat.opacity = 0.84;
      mat.envMapIntensity = 2.9;   // compensa a falta de refração
      /* e a cor de base esquenta: sem atenuação o calor precisa vir
         do material, senão a bola fica pálida no celular fraco
         (medido: [225,199,176] contra [202,161,134] com refração) */
      mat.color.setHex(0xEDD2AE);
    }

    const uni = Object.assign({}, this.uForma, this.uCor, {
      uPulso: { value: 0 }, uFade: { value: 1 },
      /* Sem transmissão a bola não ganha o calor da atenuação e sai
         pálida — medido: [220,197,178] contra [202,160,134] nos
         níveis com refração. A tinta compensa a diferença. */
      uTinta: { value: p.transmissao ? 0.78 : 1.15 },
    });
    this.uniCorpo = uni;

    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      this.shCorpo = sh;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>',
          `#include <common>\n${NOISE}\n${PELE}\nvarying vec3 vMundoP;\nvec3 gD;`)
        .replace('#include <beginnormal_vertex>', `
          vec3 gp = position;
          vec3 gN = normalize(gp);
          gD = esculpir(gp);
          /* normal por diferenças finitas — sem isto a luz não segue
             a superfície esculpida e os realces mentem */
          vec3 gT = normalize(cross(gN, abs(gN.y) < 0.99 ? vec3(0.,1.,0.) : vec3(1.,0.,0.)));
          vec3 gB = normalize(cross(gN, gT));
          float ge = 0.010;
          vec3 g1 = esculpir(gp + gT*ge);
          vec3 g2 = esculpir(gp + gB*ge);
          vec3 objectNormal = normalize(cross(g1-gD, g2-gD));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`)
        .replace('#include <begin_vertex>',
          `vec3 transformed = gD;\n vMundoP = (modelMatrix * vec4(gD,1.0)).xyz;`);

      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vMundoP;
          uniform vec3 uTopo, uAlto, uMeio, uBaixo, uBase;
          uniform float uRaio, uPulso, uFade, uTinta;
          ${GRADIENTE}`)
        /* o degradê creme→terracota entra como cor de base; a
           transmissão e o fresnel continuam por conta do three */
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.a *= uFade;`)
        /* A tinta entra no FIM, sobre a cor já resolvida (reflexo +
           transmissão + fresnel). Aplicar antes, no diffuse, não
           funcionava: num material transmissivo o diffuse quase não
           aparece — quem manda é o que atravessa e o que reflete. */
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
          /* 0.34 e não 0.88. Vidro se TINGE, não se pinta: com força
             alta a bola media [176,86,57] — marrom chapado. Sem
             tinta nenhuma ela mede [217,207,198], creme translúcido.
             Um terço do caminho entre os dois é onde ela vira a gota
             cor de mel da referência. */
          vec3 _t = corPorAltura(vMundoP.y, uRaio, uTopo, uAlto, uMeio, uBaixo, uBase);
          gl_FragColor.rgb *= mix(vec3(1.0), _t, uTinta) * (1.0 + uPulso*0.20);`);
    };
    mat.customProgramCacheKey = () => 'sereno-corpo';

    this.corpo = new T.Mesh(geo, mat);
    this.corpo.renderOrder = 2;
    this.raiz.add(this.corpo);
    this.matCorpo = mat;
  }

  _montarFio() {
    const T = this.THREE;
    const geo = new T.IcosahedronGeometry(this.RAIO, this.perfil.fio);
    const uni = Object.assign({}, this.uForma, {
      uCor: { value: new T.Color(0x8A705E) }, uOpacidade: { value: 0 },
    });
    this.uniFio = uni;
    const mat = new T.ShaderMaterial({
      uniforms: uni, wireframe: true, transparent: true, depthWrite: false,
      vertexShader: `${NOISE}\n${PELE}
        void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(esculpir(position),1.0); }`,
      fragmentShader: `precision mediump float; uniform vec3 uCor; uniform float uOpacidade;
        void main(){ gl_FragColor = vec4(uCor, uOpacidade); }`,
    });
    this.fio = new T.Mesh(geo, mat);
    this.fio.visible = false;
    this.fio.renderOrder = 3;
    this.raiz.add(this.fio);
    this.matFio = mat;
  }

  _montarPontos() {
    const T = this.THREE;
    const geo = new T.IcosahedronGeometry(this.RAIO, this.perfil.pontos);
    const uni = Object.assign({}, this.uForma, {
      uCor: { value: new T.Color(0x8A705E) }, uOpacidade: { value: 0 }, uTam: { value: 2.6 },
    });
    this.uniPontos = uni;
    const mat = new T.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false,
      vertexShader: `${NOISE}\n${PELE}
        uniform float uTam;
        void main(){
          vec4 mv = modelViewMatrix*vec4(esculpir(position),1.0);
          gl_Position = projectionMatrix*mv;
          gl_PointSize = uTam*(180.0/-mv.z);
        }`,
      fragmentShader: `precision mediump float; uniform vec3 uCor; uniform float uOpacidade;
        void main(){ vec2 c=gl_PointCoord-0.5; if(dot(c,c)>0.25) discard;
          gl_FragColor=vec4(uCor,uOpacidade); }`,
    });
    this.pontos = new T.Points(geo, mat);
    this.pontos.visible = false;
    this.raiz.add(this.pontos);
    this.matPontos = mat;
  }

  /* ================= o campo de micro-ondas =================
     A foto tem MUITOS anéis finos que vão abrindo conforme se
     afastam do centro. Isso não é uma senoide de período fixo — é um
     chirp: a fase anda com pow(r, 0.72), então perto do centro os
     anéis são apertados e lá fora ficam largos. */
  _montarCampo() {
    const T = this.THREE, p = this.perfil;
    const geo = new T.RingGeometry(0.05, 8.5, p.anelA, p.anelR);

    this.uniCampo = {
      uTempo:   { value: 0 },
      uCrista:  { value: new T.Color(SERENO.crista) },
      uVale:    { value: new T.Color(SERENO.vale) },
      uSemanas: { value: this._semanas },
      uOndas:   { value: this._ondas },
      uCorOnda: { value: this._corOnda },
      uComp:    { value: 0 },
      uRespiro: { value: this.reduzido ? 0 : 1 },
      uAlfa:    { value: 0.85 },
    };

    const mat = new T.ShaderMaterial({
      uniforms: this.uniCampo, transparent: true, side: T.DoubleSide, depthWrite: false,
      vertexShader: `
        uniform float uTempo, uRespiro;
        uniform float uSemanas[16];
        uniform float uOndas[12];
        varying float vR, vAlt, vOnda, vIncl;

        float alturaEm(float r, float t){
          float env = 0.0;
          for (int i = 0; i < 16; i++) {
            float centro = 1.3 + float(i) * 0.42;
            float d = (r - centro) / 0.42;
            env += uSemanas[i] * exp(-d*d);
          }
          /* CHIRP: muitos anéis finos perto do centro, abrindo para
             fora — a textura da foto. Uma senoide de período fixo
             dava anéis todos iguais, que é o que estava errado. */
          float fase = pow(max(r, 0.02), 0.72) * 13.0;
          float onda = sin(fase - t*0.16*uRespiro);
          float h = onda * (0.016 + 0.032*env) * exp(-r*0.16);

          for (int i = 0; i < 4; i++) {
            float forca = uOndas[i*3+1];
            if (forca > 0.001) {
              float idade = t - uOndas[i*3];
              float d = r - idade*2.35;
              h += forca * 0.050 * exp(-d*d*2.0) * exp(-idade*0.45);
            }
          }
          return h;
        }

        void main(){
          vec3 p = position;
          float r = length(p.xy);
          vR = r;
          float h = alturaEm(r, uTempo);
          vAlt = h;
          float e = 0.02;
          vIncl = (alturaEm(r+e, uTempo) - h) / e;

          vOnda = 0.0;
          for (int i = 0; i < 4; i++) {
            float forca = uOndas[i*3+1];
            if (forca > 0.001) {
              float idade = uTempo - uOndas[i*3];
              float d = r - idade*2.35;
              vOnda = max(vOnda, forca * exp(-d*d*2.0) * exp(-idade*0.45));
            }
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, p.y, h, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        uniform vec3 uCrista, uVale, uCorOnda[4];
        uniform float uComp, uAlfa;
        varying float vR, vAlt, vOnda, vIncl;
        void main(){
          /* compressão suave: com clamp puro a inclinação estourava
             os extremos e o campo virava faixas chapadas. A razão
             s/(1+abs(s)) nunca satura, entao a superficie rola
             inteira. (Sem crase neste comentario: ele vive dentro de
             um template literal e crase fecharia a string.) */
          float s = vIncl * 0.62;
          float tom = 0.5 - 0.5 * (s / (1.0 + abs(s)));
          tom = clamp(tom + vAlt*0.8, 0.0, 1.0);
          vec3 cor = mix(uVale, uCrista, tom);
          cor = mix(cor, uCorOnda[0], clamp(vOnda*0.45, 0.0, 1.0));
          float a = smoothstep(8.5, 4.8, vR) * smoothstep(0.05, 0.5, vR);
          a *= (1.0 - uComp*0.8) * uAlfa;
          gl_FragColor = vec4(cor, a);
        }`,
    });

    this.campo = new T.Mesh(geo, mat);
    this.campo.rotation.x = -Math.PI / 2;
    this.campo.position.y = -1.6;
    this.campo.renderOrder = 0;
    this.raiz.add(this.campo);
    this.matCampo = mat;
  }

  _montarContato() {
    const T = this.THREE;
    const mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uCor: { value: new T.Color(SERENO.contato) }, uForca: { value: 1 }, uBrilho: { value: 0.30 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `precision mediump float; uniform vec3 uCor; uniform float uForca, uBrilho; varying vec2 vUv;
        void main(){ float d=length(vUv-0.5)*2.0;
          gl_FragColor=vec4(uCor,(1.0-smoothstep(0.0,1.0,d))*uBrilho*uForca); }`,
    });
    this.contato = new T.Mesh(new T.PlaneGeometry(3.6, 3.6), mat);
    this.contato.rotation.x = -Math.PI / 2;
    this.contato.position.y = -1.57;
    this.contato.renderOrder = 1;
    this.raiz.add(this.contato);
    this.matContato = mat;
  }

  /* ================= API ================= */
  definirForma(a, b, mix) { this._forma = [a, b, mix]; }
  definirAmplitude(amp)   { this._amp = amp; }

  definirCamadas(solido, fio, pontos) {
    this.corpo.visible = solido > 0.01;
    this.uniCorpo.uFade.value = solido;
    this.corpo.scale.setScalar(1 - pontos * 0.5);
    this.fio.visible = fio > 0.01;
    this.uniFio.uOpacidade.value = fio * 0.75;
    this.fio.scale.setScalar(1 - pontos * 0.5);
    this.pontos.visible = pontos > 0.01;
    this.uniPontos.uOpacidade.value = pontos * 0.9;
    this.pontos.scale.setScalar(0.75 + pontos * 0.45);
  }

  definirSemanas(semanas) {
    const maior = Math.max(1, ...semanas);
    for (let i = 0; i < 16; i++) this._semanas[i] = semanas[i] ? Math.sqrt(semanas[i] / maior) : 0;
  }

  definirTema(escuro) {
    this.escuro = escuro;
    this._corFundoAlvo = new this.THREE.Color(escuro ? 0x221913 : 0xF7F1EA);

    /* PRIMEIRA CHAMADA ASSENTA NA HORA, SEM TRANSIÇÃO (2026-08-12).
       O corpo tem transmission:1 -- ele REFRATA `cena.background`. E o
       background nascia sempre creme (0xF7F1EA, no construtor) e só ia
       pro marrom por lerp de 0.045/quadro, ou seja ~65 quadros ≈ 1,1s.
       No tema escuro isso fazia a bola refratar CREME durante o primeiro
       segundo e aparecer BRANCA, virando pêssego só depois que o fundo
       assentava. Mesmo aparelho, mesmo código, duas cores -- só dependia
       de quando você olhava (foi exatamente isso que o Miguel viu nos
       dois prints). Trocar de tema no meio da sessão continua com a
       transição suave; só a PRIMEIRA vez é instantânea, que é quando não
       existe "cor anterior" pra transicionar. */
    if (!this._temaAplicado) {
      this._temaAplicado = true;
      this.corFundo.copy(this._corFundoAlvo);
    }

    /* ---- as ondas precisam EXISTIR no escuro ----
       Antes: crista #3A2A20 e vale #14100D sobre um fundo #1A1310.
       Os três eram praticamente a mesma coisa, então o campo sumia e
       o núcleo boiava no nada. Agora a crista é bem mais clara que o
       fundo e o vale é mais escuro: o relevo aparece pelos dois
       lados, e dá para ver que a bola está POUSADA sobre algo. */
    /* Medido: com crista #5C4633 / vale #1A130E o campo saía entre 12
       e 20 sobre um fundo de 38 — ou seja, mais ESCURO que o fundo.
       Virava um buraco, não um chão. No escuro a superfície tem que
       CAPTAR a luz: o vale fica na altura do fundo e a crista bem
       acima, então o relevo aparece e a bola tem onde pousar. */
    this.uniCampo.uCrista.value.set(escuro ? 0xB88A5C : SERENO.crista);
    this.uniCampo.uVale.value.set(escuro ? 0x2A1F17 : SERENO.vale);
    this.uniCampo.uAlfa.value = escuro ? 1.0 : 0.85;

    /* no claro a esfera projeta SOMBRA no chão; no escuro ela é o
       objeto mais luminoso da cena, então derrama LUZ nele */
    this.matContato.uniforms.uCor.value.set(escuro ? 0x6B4E33 : SERENO.contato);
    this.matContato.uniforms.uBrilho.value = escuro ? 0.42 : 0.30;

    const linha = escuro ? 0xC0AB99 : 0x8A705E;
    this.uniFio.uCor.value.set(linha);
    this.uniPontos.uCor.value.set(linha);
  }

  encostar(clientX, clientY, pressionado) {
    const T = this.THREE;
    const el = this.renderer.domElement;
    const r = el.getBoundingClientRect();
    const lw = r.width || el.width || 1, lh = r.height || el.height || 1;
    const nx = ((clientX - r.left) / lw) * 2 - 1, ny = -((clientY - r.top) / lh) * 2 + 1;
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return false;
    if (!this._raio) { this._raio = new T.Raycaster(); this._v2 = new T.Vector2(); }
    this._v2.set(nx, ny);
    this._raio.setFromCamera(this._v2, this.camera);
    const hits = this._raio.intersectObject(this.corpo, false);
    if (!hits.length) { if (!pressionado) this._toqueAlvo = 0; return false; }
    this._toqueDir.copy(this.corpo.worldToLocal(hits[0].point.clone()).normalize());
    this._toqueAlvo = pressionado ? 1 : 0.3;
    return true;
  }

  soltar() { this._toqueAlvo = 0; }

  empurrar(dx, dy) {
    this.girando.vy += dx * 0.0034;
    this.girando.vx += dy * 0.0022;
  }

  pulsar(corHex, forca = 1) {
    this._pulso = Math.min(1.2, this._pulso + forca * 0.8);
    const i = this._proxOnda % 4;
    this._ondas[i * 3] = this._tempo || 0;
    this._ondas[i * 3 + 1] = Math.min(1.2, forca);
    if (corHex) this._corOnda[i].set(corHex);
    this._proxOnda++;
  }

  companheiro(ativo, corHex) {
    this._compAlvo = ativo ? 1 : 0;
    if (ativo && corHex) this._corComp.set(corHex);
  }

  /* Redimensiona só se realmente mudou, e devolve se mexeu.
     A guarda de janela zerada continua (0/0 = NaN envenena a matriz de
     projeção para sempre), mas ela sozinha criava um buraco: se a
     janela mudasse de tamanho ENQUANTO estava com área zero — janela
     minimizada e restaurada noutro tamanho, aba oculta, teclado do
     celular abrindo e fechando — o evento `resize` era descartado
     pela guarda e NENHUM outro vinha depois. O canvas ficava travado
     no tamanho antigo: mais largo que a janela, com a cena inteira
     deslocada para fora do centro. É por isso que `quadro()` confere
     o tamanho todo frame; comparar dois inteiros é de graça e fecha
     todos os casos de evento perdido, inclusive troca de monitor
     (que muda o devicePixelRatio sem disparar resize). */
  redimensionar() {
    const w = innerWidth, h = innerHeight;
    if (!(w > 0 && h > 0)) return false;
    const dpr = Math.min(devicePixelRatio, this.perfil.dpr);
    const at = this.renderer.getSize(this._tam || (this._tam = new this.THREE.Vector2()));
    if (Math.round(at.x) === w && Math.round(at.y) === h && this.renderer.getPixelRatio() === dpr) return false;
    this.renderer.setPixelRatio(dpr);
    /* `false` = NÃO escrever width/height inline no canvas.
       Este era o bug: `setSize` por padrão grava o tamanho em pixel
       no style do elemento, sobrepondo o `width:100vw;height:100vh`
       do CSS. Bastava um quadro não rodar logo depois de um resize
       (aba oculta, janela restaurada, rAF estrangulado) e o canvas
       congelava no tamanho antigo — 1280×800 dentro de uma janela de
       400×790, medido. A cena virava um retângulo fixo no canto.
       Deixando o CSS mandar no tamanho VISUAL, o canvas estica
       sempre; o que ajustamos aqui é só a resolução do buffer. Um
       resize perdido agora custa um quadro levemente suave, não um
       layout quebrado. */
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    return true;
  }

  quadro(t, ctx) {
    const T = this.THREE;
    const { alvoZ = 8.2, parX = 0, parY = 0 } = ctx || {};
    this._tempo = t;

    /* rede de segurança: se o canvas destoar da janela, corrige aqui
       mesmo que nenhum evento `resize` tenha chegado */
    this.redimensionar();

    this._toqueVel += (this._toqueAlvo - this._toqueF) * 0.18;
    this._toqueVel *= 0.70;
    this._toqueF += this._toqueVel;

    this.girando.vx *= 0.93; this.girando.vy *= 0.93;
    this.girando.x += this.girando.vx; this.girando.y += this.girando.vy;
    this._pulso *= 0.94;
    for (let i = 0; i < 4; i++) {
      if (this._ondas[i * 3 + 1] > 0 && t - this._ondas[i * 3] > 9) this._ondas[i * 3 + 1] = 0;
    }
    this._comp += (this._compAlvo - this._comp) * 0.09;
    const c = this._comp;

    /* o fundo da cena acompanha o tema no mesmo ritmo do CSS (que
       tem transition de .8s) — senão o 3D salta e o resto desliza */
    if (this._corFundoAlvo) this.corFundo.lerp(this._corFundoAlvo, 0.045);

    /* a base do degradê veste a cor do módulo aberto */
    if (!this._cBaixo) { this._cBaixo = new T.Color(SERENO.baixo); this._cBase = new T.Color(SERENO.base); }
    this.uCor.uBaixo.value.lerp(c > 0.5 ? this._corComp : this._cBaixo, 0.05);
    this.uCor.uBase.value.lerp(c > 0.5 ? this._corComp : this._cBase, 0.05);
    if (this.matCorpo.attenuationColor) this.matCorpo.attenuationColor.copy(this.uCor.uBase.value);

    const [sA, sB, sMix] = this._forma;
    /* prefers-reduced-motion CONGELA a forma. Antes eu zerava só a
       rotação, mas o `uTime` continuava alimentando o ruído do
       distort() — medido: a silhueta ia de 275px a 301px entre t=2 e
       t=9 mesmo com movimento reduzido ligado. Quem pediu menos
       movimento estava recebendo o principal deles. O toque, o pulso
       e as ondas de evento seguem funcionando: são resposta a uma
       ação da pessoa, não animação ambiente. */
    this.uForma.uTime.value = this.reduzido ? 1.7 : t;
    this.uForma.uAmp.value = this._amp;
    this.uForma.uShapeA.value = sA;
    this.uForma.uShapeB.value = sB;
    this.uForma.uShapeMix.value = sMix;
    this.uForma.uToqueF.value = this._toqueF;
    this.uniCorpo.uPulso.value = this._pulso;
    this.uniCampo.uTempo.value = t;
    this.uniCampo.uComp.value = c;
    this.matContato.uniforms.uForca.value = 1 - c * 0.8;

    const ry = (this.reduzido ? 0 : t * 0.10) + this.girando.y + parX * 0.4;
    const rx = this.girando.x + parY * 0.3;
    this.corpo.rotation.set(rx, ry, 0);
    this.fio.rotation.set(rx, ry, 0);
    this.pontos.rotation.set(rx, ry * 1.15, 0);

    const escala = 1 - c * 0.70;
    this.raiz.scale.setScalar(escala);
    this.raiz.position.set(c * -0.1, c * 2.6, c * 1.4);

    /* ---- compensação de proporção ----
       O FOV é VERTICAL e fixo, então quanto mais estreita a tela,
       maior o núcleo fica na horizontal. Medido num celular alto
       (375×812): a bola dava 383px de largura numa tela de 375 —
       102%, estourando pelos dois lados. Aqui a câmera recua o
       tanto que faltar para o núcleo caber em `LARGURA_ALVO` da
       largura útil, e o recuo é proporcional para o empurrão do
       scroll continuar existindo. Em telas largas o fator é 1 e
       nada muda. */
    const LARGURA_ALVO = 0.58;
    const tanF = Math.tan(this.camera.fov * Math.PI / 360);
    const zMin = 1.36 / Math.max(0.05, tanF * this.camera.aspect * LARGURA_ALVO);
    const fator = Math.max(1, zMin / 8.2);
    this.camera.position.z = alvoZ * fator;
    this.camera.position.x = parX * 0.16 * (1 - c);
    this.camera.position.y = 1.4 - parY * 0.1 * (1 - c);
    /* O alvo da câmera DESCE enquanto o orbe sobe — é isso que o
       joga para o topo da tela. Antes eu olhava para c*2.3, quase a
       altura do próprio orbe, e ele parava no meio da tela: medido,
       ficava em y 277-358px enquanto a faixa transparente da tela de
       módulo acaba em 180px. Ou seja, o companheiro existia e ficava
       escondido atrás do fundo opaco. */
    /* No celular o orbe e o titulo disputavam o mesmo pedaco de tela: uma
       coluna so, os dois centrados, o texto lido por cima da esfera.
       As minhas tentativas anteriores mexiam no CANVAS — opacidade, mascara,
       escala. Todas estragaram o 3D: escalar mostra a borda da cena como um
       retangulo mais claro, e esticar deforma a esfera (a camera nao reajusta
       o aspecto sozinha).
       O certo e mover a CAMERA, nao a imagem: olhar mais para baixo joga o
       orbe para o alto do quadro sem tocar em um pixel do render. Qualidade
       intacta, sem borda, sem deformacao. */
    const subir = innerWidth <= 600 ? -1.7 : 0;
    this.camera.lookAt(0, c * 0.60 + subir, 0);

    this.renderer.render(this.cena, this.camera);
  }

  sonda() {
    const i = this.renderer.info.render;
    return {
      nivel: this.nivel, detalheCorpo: this.perfil.corpo,
      transmissao: !!this.perfil.transmissao,
      chamadas: i.calls, triangulos: i.triangles,
      forma: this._forma, amplitude: +this._amp.toFixed(3),
      frequencia: this.uForma.uFreq.value,
      toque: +this._toqueF.toFixed(3), pulso: +this._pulso.toFixed(3),
      companheiro: +this._comp.toFixed(2),
      camadas: { corpo: this.corpo.visible, fio: this.fio.visible, pontos: this.pontos.visible },
      ondasVivas: [0, 1, 2, 3].filter(k => this._ondas[k * 3 + 1] > 0.001).length,
      escuro: this.escuro,
    };
  }
}
