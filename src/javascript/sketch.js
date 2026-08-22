// ================================================
//   PING PONG GALÁCTICO – sketch.js (v5.5)
// ================================================

console.log("🚀 Sketch Galáctico v5.5 - FINAL CUT");

// --- Objetos do jogo ---
let raqueteJogador, raqueteComputador, bola, barraSuperior, barraInferior;
let pontosJogador = 0, pontosComputador = 0;
let venceu = false, jogoPausado = true;
let particulas = [];

// Paleta de cores por tema
const CORES_TEMAS = {
  espaco: { bola: "#00E5FF", raqueteJ: "#00E5FF", raqueteC: "#A259FF", particula: "#FFFFFF" },
  neon: { bola: "#FF00FF", raqueteJ: "#39FF14", raqueteC: "#FF00FF", particula: "#39FF14" },
  fogo: { bola: "#FFFF00", raqueteJ: "#FF4500", raqueteC: "#FFA500", particula: "#FFCC00" }
};

const VELOCIDADE_CPU = { facil: 3, normal: 5, dificil: 8 };
const PONTOS_VALIDOS = [3, 5, 10];
const MAX_PARTICULAS = 300;

// Configurações padrão
let config = {
  volumeSom: 0.5,
  volumeMusica: 0.4,
  dificuldade: 'normal',
  tema: 'espaco',
  pontos: 5,
};

const el = (id) => document.getElementById(id);
// Remove o display inline para que o valor definido no CSS volte a valer
// (#placar e #home-btn são flex; forçar 'block' quebrava o alinhamento).
const show = (id) => { const e = el(id); if (e) e.style.removeProperty('display'); };
const hide = (id) => { const e = el(id); if (e) e.style.display = 'none'; };

const escaparHTML = (v) => String(v).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// =============================================
//  PERSISTÊNCIA (tolerante a falhas)
// =============================================
// localStorage lança exceção em modo privado ou com JSON corrompido. Sem os
// try/catch, uma única falha derrubava a avaliação do script inteiro.
function lerStorage(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch (e) {
    console.warn('Não foi possível ler "' + chave + '" do armazenamento local.', e);
    return padrao;
  }
}

function gravarStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.warn('Não foi possível gravar "' + chave + '" no armazenamento local.', e);
  }
}

let ranking = lerStorage('ppg_ranking', []);
if (!Array.isArray(ranking)) ranking = [];

function carregarConfig() {
  const salvo = lerStorage('ppg_config', null);
  if (!salvo || typeof salvo !== 'object') return;

  const volume = (v, padrao) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : padrao;
  };

  config.volumeSom = volume(salvo.volumeSom, config.volumeSom);
  config.volumeMusica = volume(salvo.volumeMusica, config.volumeMusica);
  if (VELOCIDADE_CPU[salvo.dificuldade]) config.dificuldade = salvo.dificuldade;
  if (CORES_TEMAS[salvo.tema]) config.tema = salvo.tema;
  if (PONTOS_VALIDOS.includes(salvo.pontos)) config.pontos = salvo.pontos;
}

const salvarConfig = () => gravarStorage('ppg_config', config);

carregarConfig();

// Fallback de paleta: um tema inválido não pode derrubar o loop de desenho.
const cores = () => CORES_TEMAS[config.tema] || CORES_TEMAS.espaco;

// =============================================
//  MOTOR DE ÁUDIO HÍBRIDO (Splash Trigger)
// =============================================
let audioCtx = null;
let audioIndisponivel = false;
let musicStarted = false;
let tempo = 0;
let usesExternalMusic = false;
let loopProceduralAtivo = false;

function initAudio() {
  if (audioCtx || audioIndisponivel) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) { audioIndisponivel = true; return null; }
  try {
    audioCtx = new Ctx();
  } catch (e) {
    audioIndisponivel = true;
    console.warn("⚠️ Web Audio indisponível. O jogo segue sem efeitos sonoros.", e);
  }
  return audioCtx;
}

function retomarAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { });
  }
}

// Função chamada pelo botão da Splash Screen
window.entrarNoJogo = () => {
  // Tudo aqui é opcional: nenhuma falha de áudio pode impedir a troca de tela.
  try {
    initAudio();
    retomarAudio();
  } catch (e) {
    console.warn("⚠️ Falha ao inicializar o áudio.", e);
  }

  const splash = el('splash-screen');
  const avancar = () => {
    hide('splash-screen');
    show('menu');
    if (!musicStarted) {
      musicStarted = true;
      startMusic();
    }
    tocarBeep(600, 0.2);
  };

  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(avancar, 600);
  } else {
    avancar();
  }
};

function tocarBeep(freq = 440, dur = 0.1, tipo = 'sine', vol = 0.1) {
  if (config.volumeSom <= 0) return;
  if (!initAudio()) return;
  retomarAudio();
  try {
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(Math.max(0.0001, vol * config.volumeSom), time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.start(time); osc.stop(time + dur);
  } catch (e) { }
}

const tocarGol = () => tocarBeep(200, 0.4, 'sawtooth', 0.2);
const tocarRaquete = () => tocarBeep(600, 0.1, 'square', 0.1);
const tocarBorda = () => tocarBeep(800, 0.05, 'sine', 0.05);

function startMusic() {
  const audioEl = el('bg-music');
  if (!audioEl) { loopMusicProcedural(); return; }

  // onerror precisa ser registrado ANTES do play(): registrado depois, sobrava
  // uma janela em que erro e rejeição disparavam dois loops simultâneos.
  audioEl.onerror = () => {
    usesExternalMusic = false;
    loopMusicProcedural();
  };

  audioEl.volume = config.volumeMusica;
  const reproducao = audioEl.play();
  if (reproducao && typeof reproducao.then === 'function') {
    reproducao.then(() => {
      console.log("🎵 Música externa (MP3) iniciada!");
      usesExternalMusic = true;
    }).catch(() => {
      console.warn("⚠️ Autoplay bloqueado ou erro no MP3. Usando sintetizador.");
      usesExternalMusic = false;
      loopMusicProcedural();
    });
  }
}

// Fallback: Sintetizador 8-bit
const melodia = [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23];
const baixo = [196.00, 196.00, 174.61, 155.56];

function loopMusicProcedural() {
  // Guarda de instância única: sem ela, cada falha de áudio empilhava um novo
  // setTimeout recursivo e a trilha tocava sobreposta a si mesma.
  if (loopProceduralAtivo) return;
  loopProceduralAtivo = true;
  tocarCicloProcedural();
}

function tocarCicloProcedural() {
  if (usesExternalMusic) { loopProceduralAtivo = false; return; }

  if (config.volumeMusica > 0 && audioCtx) {
    const time = audioCtx.currentTime;
    if (tempo % 4 === 0) tocarSomNota(60, 0.15, 'sine', 0.5 * config.volumeMusica, time);
    if (tempo % 2 === 0) tocarSomNota(baixo[Math.floor(tempo / 4) % baixo.length], 0.3, 'triangle', 0.3 * config.volumeMusica, time);
    tocarSomNota(melodia[tempo % melodia.length], 0.2, 'square', 0.12 * config.volumeMusica, time);
    tempo++;
  }
  setTimeout(tocarCicloProcedural, 250);
}

function tocarSomNota(freq, dur, tipo, vol, startTime) {
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    osc.type = tipo; osc.frequency.setValueAtTime(freq, startTime);
    if (tipo === 'sine') osc.frequency.exponentialRampToValueAtTime(0.01, startTime + dur);
    g.gain.setValueAtTime(Math.max(0.0001, vol), startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.start(startTime); osc.stop(startTime + dur);
  } catch (e) { }
}

// =============================================
//  P5.JS CORE
// =============================================

function setup() {
  // Telas HiDPI: o p5 usa a densidade do aparelho sem teto, entao um celular
  // com DPR 3 renderizava 9x mais pixels por quadro. O teto de 2 mantem a
  // nitidez e corta boa parte do custo.
  if (typeof pixelDensity === 'function' && typeof displayDensity === 'function') {
    pixelDensity(Math.min(displayDensity(), 2));
  }

  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  cnv.style('position', 'fixed');
  cnv.style('top', '0'); cnv.style('left', '0'); cnv.style('z-index', '0');

  raqueteJogador = new Raquete(30, height / 2, 18, 110, true);
  raqueteComputador = new Raquete(width - 48, height / 2, 18, 110, false);
  bola = new Bola(24);
  barraSuperior = new Barra(0, 10);
  barraInferior = new Barra(height - 10, 10);

  aplicarTemaVisual();
  renderizarRanking();
  atualizarUIConfig();
}

function draw() {
  let bg = color(5, 5, 20);
  if (config.tema === 'fogo') bg = color(20, 5, 5);
  else if (config.tema === 'neon') bg = color(10, 5, 20);
  background(bg);

  stroke(255, 255, 255, 15);
  for (let i = 0; i < width; i += 120) line(i, 0, i, height);
  for (let i = 0; i < height; i += 120) line(0, i, width, i);

  if (jogoPausado) return;

  // Movimento por tempo, nao por quadro: num monitor de 144Hz ou num celular
  // que cai para 40fps o jogo andava em velocidades diferentes.
  const dt = constrain((typeof deltaTime === 'number' ? deltaTime : 16.667) / 16.667, 0.2, 3);

  raqueteJogador.atualizar(dt); raqueteComputador.atualizar(dt);

  // A bola avanca em sub-passos de no maximo um quadro. Sem isso, um engasgo
  // que dobrasse o dt faria a bola pular a raquete inteira.
  const subPassos = Math.ceil(dt);
  const passo = dt / subPassos;
  for (let i = 0; i < subPassos; i++) {
    bola.atualizar(passo);
    bola.checarColisao(raqueteJogador);
    bola.checarColisao(raqueteComputador);
  }

  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].atualizar(dt); particulas[i].exibir();
    if (particulas[i].vida <= 0) particulas.splice(i, 1);
  }

  raqueteJogador.exibir(); raqueteComputador.exibir(); bola.exibir();
  barraSuperior.exibir(); barraInferior.exibir();

  if (!venceu) {
    if (pontosJogador >= config.pontos) finalizarPartida(true);
    else if (pontosComputador >= config.pontos) finalizarPartida(false);
  }
}

// Reposiciona os objetos: sem isso a raquete da CPU ficava presa na largura
// antiga e a barra inferior flutuava no meio da tela depois de um resize.
function windowResized() {
  const larguraAnterior = width, alturaAnterior = height;
  resizeCanvas(windowWidth, windowHeight);
  if (!raqueteJogador || !larguraAnterior || !alturaAnterior) return;

  const escalaX = width / larguraAnterior, escalaY = height / alturaAnterior;
  raqueteJogador.x = 30;
  raqueteComputador.x = width - 48;
  raqueteJogador.y *= escalaY;
  raqueteComputador.y *= escalaY;
  barraInferior.y = height - 10;
  bola.x *= escalaX;
  bola.y *= escalaY;
}

// Impede o scroll nativo enquanto o dedo arrasta a raquete durante a partida.
function touchMoved() {
  return jogoPausado;
}

// =============================================
//  CONTROLE & CONFIGS
// =============================================

// =============================================
//  ORIENTAÇÃO (celular deve jogar na horizontal)
// =============================================
const SEM_MEDIA_QUERY = { matches: false, addEventListener() { }, addListener() { } };
const telaEmPe = (window.matchMedia
  ? window.matchMedia('(orientation: portrait) and (max-width: 900px) and (pointer: coarse)')
  : SEM_MEDIA_QUERY);

let jogoAtivo = false; // partida em andamento, independente da pausa por rotação
let rotacaoIgnorada = false;

const emPe = () => telaEmPe.matches && !rotacaoIgnorada;

function aplicarPausaPorRotacao() {
  if (!jogoAtivo || venceu) return;
  // Em pé o aviso de girar cobre a tela; deixar a bola correndo atrás dele
  // faria o jogador perder pontos sem ver nada.
  jogoPausado = emPe();
}

// Escape para quem está com a rotação da tela travada no aparelho e não
// consegue virar: sem isso o aviso bloquearia o jogo inteiro.
window.ignorarRotacao = () => {
  rotacaoIgnorada = true;
  document.body.classList.add('ignorar-rotacao');
  aplicarPausaPorRotacao();
  tocarBeep(500, 0.1);
};

if (telaEmPe.addEventListener) telaEmPe.addEventListener('change', aplicarPausaPorRotacao);
else if (telaEmPe.addListener) telaEmPe.addListener(aplicarPausaPorRotacao);

// Melhor esforço: só funciona em tela cheia e nem todo navegador aceita.
// O aviso de girar continua sendo a garantia real.
function tentarPaisagem() {
  if (!telaEmPe.matches) return;
  try {
    const travar = () => {
      if (screen.orientation && screen.orientation.lock) {
        const p = screen.orientation.lock('landscape');
        if (p && p.catch) p.catch(() => { });
      }
    };
    const raiz = document.documentElement;
    if (document.fullscreenElement) travar();
    else if (raiz.requestFullscreen) {
      const p = raiz.requestFullscreen();
      if (p && p.then) p.then(travar).catch(() => { });
    }
  } catch (e) { }
}

window.iniciarJogo = () => {
  if (!bola) return; // p5 ainda não executou setup()
  hide('menu'); show('placar'); show('home-btn');
  document.body.classList.add('jogando');
  venceu = false; pontosJogador = 0; pontosComputador = 0;
  particulas = [];
  jogoAtivo = true;
  tentarPaisagem();
  jogoPausado = emPe();
  atualizarPlacarHTML(); bola.reiniciar();
  tocarBeep(500, 0.2);
};

window.voltarParaMenu = () => {
  hide('mensagem-container'); hide('configuracoes-menu'); hide('ranking-menu');
  hide('placar'); hide('home-btn');
  document.body.classList.remove('jogando');
  show('menu'); jogoPausado = true; jogoAtivo = false;
  particulas = [];
};

window.reiniciarJogo = () => {
  if (!bola) return;
  hide('mensagem-container');
  pontosJogador = 0; pontosComputador = 0; venceu = false;
  particulas = [];
  jogoAtivo = true;
  jogoPausado = emPe();
  bola.reiniciar(); atualizarPlacarHTML();
};

window.abrirConfiguracoes = () => { tocarBeep(480, 0.1); hide('menu'); show('configuracoes-menu'); };
window.fecharConfiguracoes = () => { tocarBeep(380, 0.1); hide('configuracoes-menu'); show('menu'); };
window.abrirRanking = () => { tocarBeep(480, 0.1); renderizarRanking(); hide('menu'); show('ranking-menu'); };
window.fecharRanking = () => { tocarBeep(380, 0.1); hide('ranking-menu'); show('menu'); };

window.setVolumeSom = (v) => {
  const n = parseFloat(v);
  config.volumeSom = Number.isFinite(n) ? n : 0;
  atualizarUIConfig();
  salvarConfig();
  tocarBeep(500, 0.05);
};

window.setVolumeMusica = (v) => {
  const n = parseFloat(v);
  config.volumeMusica = Number.isFinite(n) ? n : 0;
  atualizarUIConfig();
  salvarConfig();
  const audioEl = el('bg-music');
  if (audioEl) audioEl.volume = config.volumeMusica;
};

window.setDificuldade = (d) => {
  if (!VELOCIDADE_CPU[d]) return;
  config.dificuldade = d; tocarBeep(450, 0.1); atualizarUIConfig(); salvarConfig();
};

window.setTema = (t) => {
  if (!CORES_TEMAS[t]) return;
  config.tema = t; tocarBeep(550, 0.1); aplicarTemaVisual(); atualizarUIConfig(); salvarConfig();
};

window.setPontos = (p) => {
  if (!PONTOS_VALIDOS.includes(p)) return;
  config.pontos = p; tocarBeep(500, 0.1); atualizarUIConfig(); salvarConfig();
};

function aplicarTemaVisual() {
  // classList em vez de sobrescrever className: o antigo apagava qualquer
  // outra classe do body (como "jogando") ao trocar de tema.
  Object.keys(CORES_TEMAS).forEach(t => document.body.classList.remove('tema-' + t));
  if (config.tema !== 'espaco') document.body.classList.add('tema-' + config.tema);
}

function atualizarUIConfig() {
  const definirTexto = (id, texto) => { const e = el(id); if (e) e.innerText = texto; };
  const definirValor = (id, valor) => { const e = el(id); if (e) e.value = valor; };
  const definirClasse = (id, base, ativo) => {
    const e = el(id);
    if (!e) return;
    e.className = ativo ? base + ' active' : base;
    e.setAttribute('aria-pressed', String(ativo));
  };

  definirTexto('val-som', Math.round(config.volumeSom * 100) + "%");
  definirValor('vol-som', config.volumeSom);
  definirTexto('val-musica', Math.round(config.volumeMusica * 100) + "%");
  definirValor('vol-musica', config.volumeMusica);

  Object.keys(VELOCIDADE_CPU).forEach(d => definirClasse('diff-' + d, 'diff-btn', config.dificuldade === d));
  Object.keys(CORES_TEMAS).forEach(t => definirClasse('tema-' + t, 'theme-btn', config.tema === t));
  PONTOS_VALIDOS.forEach(p => definirClasse('pts-' + p, 'pts-btn', config.pontos === p));
}

function atualizarPlacarHTML(destaque) {
  const alvoJogador = el('pontosJogador');
  const alvoCpu = el('pontosComputador');
  if (alvoJogador) alvoJogador.innerText = pontosJogador;
  if (alvoCpu) alvoCpu.innerText = pontosComputador;

  const alvo = destaque === 'jogador' ? alvoJogador : destaque === 'computador' ? alvoCpu : null;
  if (alvo) {
    alvo.classList.remove('ping');
    void alvo.offsetWidth; // força o reinício da animação
    alvo.classList.add('ping');
  }
}

function finalizarPartida(ganhou) {
  venceu = true; jogoPausado = true;
  show('mensagem-container');

  const msg = el('mensagem-vitoria');
  if (msg) {
    msg.innerHTML = (ganhou ? '<h1>🚀 VITÓRIA!</h1>' : '<h1>☄️ DERROTA!</h1>')
      + '<p style="font-size:2em; color:var(--accent2);">' + pontosJogador + ' - ' + pontosComputador + '</p>';
  }

  const instrucoes = el('instrucoes-vitoria');
  if (instrucoes) {
    instrucoes.innerText = ganhou
      ? 'Órbita dominada. Pronto para a próxima rodada?'
      : 'A CPU levou essa. Tente de novo ou ajuste a dificuldade no menu.';
  }

  salvarNoRanking(pontosJogador, pontosComputador, ganhou);
  tocarBeep(ganhou ? 600 : 200, 0.5);
}

function salvarNoRanking(pj, pc, v) {
  ranking.unshift({ pj, pc, v, d: new Date().toLocaleDateString() });
  if (ranking.length > 8) ranking.length = 8;
  gravarStorage('ppg_ranking', ranking);
  renderizarRanking();
}

function renderizarRanking() {
  const lista = el('ranking-lista');
  if (!lista) return;
  if (ranking.length === 0) {
    lista.innerHTML = '<p class="ranking-empty">Nenhuma partida registrada.</p>';
    return;
  }
  lista.innerHTML = ranking.map(r =>
    '<div class="ranking-item">' +
    '<span class="ranking-name">' + (r.v ? '🏆' : '💀') + ' ' + escaparHTML(r.d) + '</span>' +
    '<span class="ranking-score">' + escaparHTML(r.pj) + ' - ' + escaparHTML(r.pc) + '</span>' +
    '</div>'
  ).join('');
}

// =============================================
//  CLASSES
// =============================================

class Raquete {
  constructor(x, y, w, h, isPlayer) { this.x = x; this.y = y; this.w = w; this.h = h; this.isPlayer = isPlayer; }
  atualizar(dt = 1) {
    if (this.isPlayer) {
      if (mouseY > 0 && mouseY < height) this.y = lerp(this.y, mouseY, constrain(0.22 * dt, 0, 1));
    } else {
      // Controle proporcional: acelera longe da bola e desacelera ao chegar
      // perto. O anterior era liga-desliga com zona morta de 10px, entao a
      // raquete andava sempre na velocidade maxima e vibrava em volta do alvo.
      const vel = VELOCIDADE_CPU[config.dificuldade] || 5;
      this.y += constrain((bola.y - this.y) * 0.2, -vel, vel) * dt;
    }
    this.y = constrain(this.y, this.h / 2 + 10, height - this.h / 2 - 10);
  }
  exibir() {
    push(); rectMode(CENTER);
    let col = color(this.isPlayer ? cores().raqueteJ : cores().raqueteC);
    noStroke();
    // Metade das camadas de brilho: mesmo degrade, metade das chamadas de desenho.
    for (let i = 10; i > 0; i -= 2) { fill(red(col), green(col), blue(col), 25 - i * 2); rect(this.x, this.y, this.w + i * 2, this.h + i * 2, 8); }
    fill(255); rect(this.x, this.y, this.w, this.h, 4); pop();
  }
}

class Bola {
  constructor(r) { this.r = r; this.reiniciar(); }
  reiniciar() { this.x = width / 2; this.y = height / 2; this.vx = random([-7, 7]); this.vy = random(-5, 5); }
  atualizar(dt = 1) {
    this.x += this.vx * dt; this.y += this.vy * dt;

    // Reposiciona junto com a inversão: sem o clamp, a bola podia atravessar a
    // barra e ficar invertendo vy a cada quadro, presa tremendo na borda.
    const limiteTopo = this.r / 2 + 10;
    const limiteBase = height - this.r / 2 - 10;
    if (this.y < limiteTopo) { this.y = limiteTopo; this.vy = abs(this.vy); tocarBorda(); }
    else if (this.y > limiteBase) { this.y = limiteBase; this.vy = -abs(this.vy); tocarBorda(); }

    if (this.x > width) { pontosJogador++; tocarGol(); this.reiniciar(); atualizarPlacarHTML('jogador'); }
    else if (this.x < 0) { pontosComputador++; tocarGol(); this.reiniciar(); atualizarPlacarHTML('computador'); }
  }
  checarColisao(r) {
    if (abs(this.x - r.x) < this.r / 2 + r.w / 2 && abs(this.y - r.y) < this.r / 2 + r.h / 2) {
      if (this.x < width / 2) {
        if (this.vx >= 0) return;
        this.x = r.x + r.w / 2 + this.r / 2;
      } else {
        if (this.vx <= 0) return;
        this.x = r.x - r.w / 2 - this.r / 2;
      }
      this.vx *= -1.08;

      this.vy = (this.y - r.y) * 0.15;
      // Piso vertical: uma batida no centro exato zerava vy e a partida podia
      // travar num rali perfeitamente horizontal e sem fim.
      if (abs(this.vy) < 1.2) this.vy = 1.2 * (random() < 0.5 ? -1 : 1);
      this.vx = constrain(this.vx, -20, 20);

      tocarRaquete();
      if (particulas.length < MAX_PARTICULAS) {
        let pColor = cores().particula;
        for (let i = 0; i < 15; i++) particulas.push(new Particula(this.x, this.y, pColor));
      }
    }
  }
  exibir() {
    push(); noStroke();
    let col = color(cores().bola);
    for (let i = 8; i > 0; i -= 2) { fill(red(col), green(col), blue(col), 40 - i * 4); ellipse(this.x, this.y, this.r + i * 4); }
    fill(255); ellipse(this.x, this.y, this.r); pop();
  }
}

class Barra { constructor(y, h) { this.y = y; this.h = h; } exibir() { noStroke(); fill(35, 45, 90); rectMode(CORNER); rect(0, this.y, width, this.h); } }

class Particula {
  constructor(x, y, col) { this.x = x; this.y = y; this.vx = random(-4, 4); this.vy = random(-4, 4); this.vida = 255; this.col = color(col); this.tamanho = random(2, 6); }
  atualizar(dt = 1) { this.x += this.vx * dt; this.y += this.vy * dt; this.vida -= 8 * dt; }
  exibir() { noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.vida); ellipse(this.x, this.y, this.tamanho); }
}
