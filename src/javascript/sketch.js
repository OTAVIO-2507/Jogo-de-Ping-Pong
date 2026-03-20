// ================================================
//   PING PONG GALÁCTICO – sketch.js (AUDIO RESILIENT)
// ================================================

console.log("🚀 Sketch Galáctico v5.3 - Áudio Nativo Ativado");

// --- Objetos do jogo ---
let raqueteJogador, raqueteComputador, bola, barraSuperior, barraInferior;
let pontosJogador = 0, pontosComputador = 0;
let venceu = false, jogoPausado = true;
let particulas = [];

// Configurações padrão
let config = {
  volumeSom: 0.5,
  volumeMusica: 0.4,
  dificuldade: 'normal',
  tema: 'espaco',
  pontos: 5,
};

// Paleta de cores por tema
const CORES_TEMAS = {
  espaco: { bola: "#00E5FF", raqueteJ: "#00E5FF", raqueteC: "#A259FF", particula: "#FFFFFF" },
  neon: { bola: "#FF00FF", raqueteJ: "#39FF14", raqueteC: "#FF00FF", particula: "#39FF14" },
  fogo: { bola: "#FFFF00", raqueteJ: "#FF4500", raqueteC: "#FFA500", particula: "#FFCC00" }
};

const VELOCIDADE_CPU = { facil: 3, normal: 5, dificil: 8 };
let ranking = JSON.parse(localStorage.getItem('ppg_ranking') || '[]');

const el = (id) => document.getElementById(id);
const show = (id) => { const e = el(id); if (e) e.style.display = 'block'; };
const hide = (id) => { const e = el(id); if (e) e.style.display = 'none'; };

// =============================================
//  MOTOR DE ÁUDIO HÍBRIDO (Tag Audio + Synth)
// =============================================
let audioCtx = null;
let musicStarted = false;
let tempo = 0;
let usesExternalMusic = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Iniciar música e áudio no primeiro clique
document.addEventListener('click', () => {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!musicStarted) {
    startMusic();
    musicStarted = true;
  }
}, { once: true });

function tocarBeep(freq = 440, dur = 0.1, tipo = 'sine', vol = 0.1) {
  if (config.volumeSom <= 0) return;
  initAudio();
  try {
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(vol * config.volumeSom, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.start(time); osc.stop(time + dur);
  } catch (e) { }
}

const tocarGol = () => tocarBeep(200, 0.4, 'sawtooth', 0.2);
const tocarRaquete = () => tocarBeep(600, 0.1, 'square', 0.1);
const tocarBorda = () => tocarBeep(800, 0.05, 'sine', 0.05);

function startMusic() {
  const audioEl = el('bg-music');
  if (audioEl) {
    audioEl.volume = config.volumeMusica;
    audioEl.play().then(() => {
      console.log("🎵 Música externa (MP3) iniciada!");
      usesExternalMusic = true;
    }).catch(err => {
      console.warn("⚠️ Não foi possível tocar o MP3 automaticamente. Usando sintetizador procedural.", err);
      loopMusicProcedural();
    });
    
    // Fallback caso o arquivo MP3 não carregue ou falhe
    audioEl.onerror = () => {
       console.warn("❌ Erro ao carregar arquivo de música. Mudando para procedural.");
       usesExternalMusic = false;
       loopMusicProcedural();
    }
  } else {
    loopMusicProcedural();
  }
}

// Fallback: Sintetizador 8-bit
const melodia = [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23];
const baixo = [196.00, 196.00, 174.61, 155.56];

function loopMusicProcedural() {
  if (usesExternalMusic) return; // Se a externa estiver tocando, cancela procedural
  
  if (config.volumeMusica > 0 && audioCtx) {
    const time = audioCtx.currentTime;
    if (tempo % 4 === 0) tocarSomNota(60, 0.15, 'sine', 0.5 * config.volumeMusica, time);
    if (tempo % 2 === 0) tocarSomNota(baixo[Math.floor(tempo / 4) % baixo.length], 0.3, 'triangle', 0.3 * config.volumeMusica, time);
    tocarSomNota(melodia[tempo % melodia.length], 0.2, 'square', 0.12 * config.volumeMusica, time);
    tempo++;
  }
  setTimeout(loopMusicProcedural, 250);
}

function tocarSomNota(freq, dur, tipo, vol, startTime) {
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);
    osc.type = tipo; osc.frequency.setValueAtTime(freq, startTime);
    if (tipo === 'sine') osc.frequency.exponentialRampToValueAtTime(0.01, startTime + dur);
    g.gain.setValueAtTime(vol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.start(startTime); osc.stop(startTime + dur);
  } catch (e) { }
}

// =============================================
//  P5.JS CORE
// =============================================

function setup() {
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

  raqueteJogador.atualizar(); raqueteComputador.atualizar(); bola.atualizar();
  bola.checarColisao(raqueteJogador); bola.checarColisao(raqueteComputador);

  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].atualizar(); particulas[i].exibir();
    if (particulas[i].vida <= 0) particulas.splice(i, 1);
  }

  raqueteJogador.exibir(); raqueteComputador.exibir(); bola.exibir();
  barraSuperior.exibir(); barraInferior.exibir();

  if (!venceu) {
    if (pontosJogador >= config.pontos) finalizarPartida(true);
    else if (pontosComputador >= config.pontos) finalizarPartida(false);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// =============================================
//  CONTROLE & CONFIGS
// =============================================

window.iniciarJogo = () => {
  hide('menu'); show('placar'); show('home-btn');
  jogoPausado = false; venceu = false; pontosJogador = 0; pontosComputador = 0;
  atualizarPlacarHTML(); bola.reiniciar();
  tocarBeep(500, 0.2);
};

window.voltarParaMenu = () => {
  hide('mensagem-container'); hide('configuracoes-menu'); hide('ranking-menu'); hide('placar');
  show('menu'); jogoPausado = true;
};

window.reiniciarJogo = () => {
  hide('mensagem-container');
  pontosJogador = 0; pontosComputador = 0; venceu = false; jogoPausado = false;
  bola.reiniciar(); atualizarPlacarHTML();
};

window.abrirConfiguracoes = () => { tocarBeep(480, 0.1); hide('menu'); show('configuracoes-menu'); };
window.fecharConfiguracoes = () => { tocarBeep(380, 0.1); hide('configuracoes-menu'); show('menu'); };
window.abrirRanking = () => { tocarBeep(480, 0.1); renderizarRanking(); hide('menu'); show('ranking-menu'); };
window.fecharRanking = () => { tocarBeep(380, 0.1); hide('ranking-menu'); show('menu'); };

window.setVolumeSom = (v) => { 
  config.volumeSom = parseFloat(v); 
  atualizarUIConfig();
  tocarBeep(500, 0.05); 
};

window.setVolumeMusica = (v) => { 
  config.volumeMusica = parseFloat(v); 
  atualizarUIConfig();
  const audioEl = el('bg-music');
  if (audioEl) audioEl.volume = config.volumeMusica;
};

window.setDificuldade = (d) => { config.dificuldade = d; tocarBeep(450, 0.1); atualizarUIConfig(); };
window.setTema = (t) => { config.tema = t; tocarBeep(550, 0.1); aplicarTemaVisual(); atualizarUIConfig(); };
window.setPontos = (p) => { config.pontos = p; tocarBeep(500, 0.1); atualizarUIConfig(); };

function aplicarTemaVisual() {
  document.body.className = config.tema === 'espaco' ? '' : 'tema-' + config.tema;
}

function atualizarUIConfig() {
  if (el('val-som')) el('val-som').innerText = Math.round(config.volumeSom * 100) + "%";
  if (el('vol-som')) el('vol-som').value = config.volumeSom;
  if (el('val-musica')) el('val-musica').innerText = Math.round(config.volumeMusica * 100) + "%";
  if (el('vol-musica')) el('vol-musica').value = config.volumeMusica;
  ['facil', 'normal', 'dificil'].forEach(d => el('diff-' + d).className = config.dificuldade === d ? 'diff-btn active' : 'diff-btn');
  ['espaco', 'neon', 'fogo'].forEach(t => el('tema-' + t).className = config.tema === t ? 'theme-btn active' : 'theme-btn');
  [3, 5, 10].forEach(p => el('pts-' + p).className = config.pontos === p ? 'pts-btn active' : 'pts-btn');
}

function atualizarPlacarHTML() {
  if (el('pontosJogador')) el('pontosJogador').innerText = pontosJogador;
  if (el('pontosComputador')) el('pontosComputador').innerText = pontosComputador;
}

function finalizarPartida(ganhou) {
  venceu = true; jogoPausado = true;
  show('mensagem-container');
  const msg = el('mensagem-vitoria');
  if (msg) {
    msg.innerHTML = ganhou ? '<h1>🚀 VITÓRIA!</h1>' : '<h1>☄️ DERROTA!</h1>';
    msg.innerHTML += `<p style="font-size:2em; color:var(--accent2);">${pontosJogador} - ${pontosComputador}</p>`;
  }
  salvarNoRanking(pontosJogador, pontosComputador, ganhou);
  tocarBeep(ganhou ? 600 : 200, 0.5);
}

function salvarNoRanking(pj, pc, v) {
  ranking.unshift({ pj, pc, v, d: new Date().toLocaleDateString() });
  if (ranking.length > 8) ranking.pop();
  localStorage.setItem('ppg_ranking', JSON.stringify(ranking));
}

function renderizarRanking() {
  const lista = el('ranking-lista');
  if (!lista) return;
  if (ranking.length === 0) { lista.innerHTML = '<p class="ranking-empty">Nenhuma partida registrada.</p>'; return; }
  lista.innerHTML = ranking.map(r => `<div class="ranking-item"><span>${r.v ? '🏆' : '💀'} ${r.d}</span><span>${r.pj} - ${r.pc}</span></div>`).join('');
}

// =============================================
//  CLASSES
// =============================================

class Raquete {
  constructor(x, y, w, h, isPlayer) { this.x = x; this.y = y; this.w = w; this.h = h; this.isPlayer = isPlayer; }
  atualizar() {
    if (this.isPlayer) { if (mouseY > 0 && mouseY < height) this.y = lerp(this.y, mouseY, 0.2); }
    else {
      let vel = VELOCIDADE_CPU[config.dificuldade] || 5;
      if (this.y < bola.y - 10) this.y += vel; else if (this.y > bola.y + 10) this.y -= vel;
    }
    this.y = constrain(this.y, this.h / 2 + 10, height - this.h / 2 - 10);
  }
  exibir() {
    push(); rectMode(CENTER);
    let col = color(this.isPlayer ? CORES_TEMAS[config.tema].raqueteJ : CORES_TEMAS[config.tema].raqueteC);
    noStroke();
    for (let i = 10; i > 0; i--) { fill(red(col), green(col), blue(col), 25 - i * 2); rect(this.x, this.y, this.w + i * 2, this.h + i * 2, 8); }
    fill(255); rect(this.x, this.y, this.w, this.h, 4); pop();
  }
}

class Bola {
  constructor(r) { this.r = r; this.reiniciar(); }
  reiniciar() { this.x = width / 2; this.y = height / 2; this.vx = random([-7, 7]); this.vy = random(-5, 5); }
  atualizar() {
    this.x += this.vx; this.y += this.vy;
    if (this.y < this.r / 2 + 10 || this.y > height - this.r / 2 - 10) { this.vy *= -1; tocarBorda(); }
    if (this.x > width) { pontosJogador++; tocarGol(); this.reiniciar(); atualizarPlacarHTML(); }
    else if (this.x < 0) { pontosComputador++; tocarGol(); this.reiniciar(); atualizarPlacarHTML(); }
  }
  checarColisao(r) {
    if (abs(this.x - r.x) < this.r / 2 + r.w / 2 && abs(this.y - r.y) < this.r / 2 + r.h / 2) {
      if (this.x < width / 2) { if (this.vx < 0) { this.x = r.x + r.w / 2 + this.r / 2; this.vx *= -1.08; } }
      else { if (this.vx > 0) { this.x = r.x - r.w / 2 - this.r / 2; this.vx *= -1.08; } }
      this.vy = (this.y - r.y) * 0.15; this.vx = constrain(this.vx, -20, 20);
      tocarRaquete();
      let pColor = CORES_TEMAS[config.tema].particula;
      for (let i = 0; i < 15; i++) particulas.push(new Particula(this.x, this.y, pColor));
    }
  }
  exibir() {
    push(); noStroke();
    let col = color(CORES_TEMAS[config.tema].bola);
    for (let i = 8; i > 0; i--) { fill(red(col), green(col), blue(col), 40 - i * 4); ellipse(this.x, this.y, this.r + i * 4); }
    fill(255); ellipse(this.x, this.y, this.r); pop();
  }
}

class Barra { constructor(y, h) { this.y = y; this.h = h; } exibir() { noStroke(); fill(35, 45, 90); rectMode(CORNER); rect(0, this.y, width, this.h); } }

class Particula {
  constructor(x, y, col) { this.x = x; this.y = y; this.vx = random(-4, 4); this.vy = random(-4, 4); this.vida = 255; this.col = color(col); this.tamanho = random(2, 6); }
  atualizar() { this.x += this.vx; this.y += this.vy; this.vida -= 8; }
  exibir() { noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.vida); ellipse(this.x, this.y, this.tamanho); }
}
