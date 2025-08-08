let raqueteJogador, raqueteComputador, bola, barraSuperior, barraInferior;
let fundoImg, bolaImg, barraJogadorImg, barraComputadorImg;
let pontosJogador = 0;
let pontosComputador = 0;
let venceu = false; // Controle de estado do jogo
let jogoPausado = true; // Inicialmente, o jogo começa pausado

function preload() {
  fundoImg = loadImage('src/img/fundo1.png');
  bolaImg = loadImage('src/img/bola.png');
  barraJogadorImg = loadImage('src/img/barra01.png');
  barraComputadorImg = loadImage('src/img/barra02.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  raqueteJogador = new Raquete(30, height / 2, 20, 110);
  raqueteComputador = new Raquete(width - 40, height / 2, 20, 110);
  bola = new Bola(30);
  barraSuperior = new Barra(0, 0, width, 5);
  barraInferior = new Barra(0, height, width, 5);

  // Botão de reinício, mas inicialmente escondido
  let botaoReiniciar = select('#restart-btn');
  botaoReiniciar.mousePressed(reiniciarJogo);

  // Adiciona o evento para o botão de iniciar jogo
  select('#iniciar-jogo').mousePressed(iniciarJogo);
}

function draw() {
  if (jogoPausado) {
    return; // Se o jogo estiver pausado, nada será desenhado ou atualizado
  }

  let escala = Math.max(width / fundoImg.width, height / fundoImg.height);
  let imgWidth = fundoImg.width * escala;
  let imgHeight = fundoImg.height * escala;
  let imgX = (width - imgWidth) / 2;
  let imgY = (height - imgHeight) / 2;
  image(fundoImg, imgX, imgY, imgWidth, imgHeight);

  raqueteJogador.atualizar();
  raqueteComputador.atualizar();
  bola.atualizar(barraSuperior, barraInferior);

  bola.verificarColisaoRaquete(raqueteJogador);
  bola.verificarColisaoRaquete(raqueteComputador);

  raqueteJogador.exibir();
  raqueteComputador.exibir();
  bola.exibir();
  barraSuperior.exibir();
  barraInferior.exibir();

  // Atualiza o placar no HTML com animação
  atualizarPlacar();

  // Verifica se alguém venceu ou perdeu e exibe a mensagem correspondente
  if (pontosJogador >= 3 && pontosJogador > pontosComputador) {
    exibirMensagemVitoria();
  } else if (pontosComputador >= 3 && pontosComputador > pontosJogador) {
    exibirMensagemPerda();
  }
}

// Adicione a função windowResized para redimensionar o canvas
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);  // Redimensiona o canvas para a largura e altura da janela
}

function atualizarPlacar() {
  let pontosJogadorElement = document.getElementById("pontosJogador");
  let pontosComputadorElement = document.getElementById("pontosComputador");

  // Animação para pontos do jogador
  pontosJogadorElement.classList.add("aumentar-pontos");
  setTimeout(() => {
    pontosJogadorElement.classList.remove("aumentar-pontos");
  }, 500);

  // Animação para pontos do computador
  pontosComputadorElement.classList.add("aumentar-pontos");
  setTimeout(() => {
    pontosComputadorElement.classList.remove("aumentar-pontos");
  }, 500);

  // Atualiza os valores dos pontos no HTML
  pontosJogadorElement.textContent = pontosJogador;
  pontosComputadorElement.textContent = pontosComputador;

  // Verifica se houve um gol para fazer o fundo piscar e adicionar efeitos visuais
  if (pontosJogador > 0 || pontosComputador > 0) {
    ativarAnimacaoGol();
  }
}

function ativarAnimacaoGol() {
  // Adiciona uma animação de flash no fundo
  select('body').addClass('flash-fundo');

  // Adiciona animação no placar
  select('#placar').addClass('placar-gol');

  // A animação do placar será reaplicada para todos os gols
  setTimeout(() => {
    select('#placar').removeClass('placar-gol'); // Remove a classe de animação
    // Força a animação a ser reaplicada imediatamente
    setTimeout(() => {
      select('#placar').addClass('placar-gol');
    }, 0); // Coloca a animação de volta no placar
  }, 1000); // A duração do efeito de animação
}

function exibirMensagemPerda() {
  venceu = true; // O jogo é pausado após derrota
  jogoPausado = true; // Pausa o jogo
  document.body.classList.add('body-sem-gradiente');  // Remove o gradiente de fundo
  select('#mensagem-container').show();
  select('#mensagem-vitoria').html(`  
    <h1>😞 Você Perdeu! 😞</h1>
    <p><strong>Pontuação Final:</strong></p>
    <p><span style="font-size: 24px; font-weight: bold;">Jogador: ${pontosJogador} | Computador: ${pontosComputador}</span></p>
  `);

  select('#instrucoes-vitoria').html(`
    <p>😔 Melhor sorte na próxima! Deseja tentar novamente?</p>
    <p>Clique no botão abaixo para reiniciar o jogo e continuar se desafiando! 🕹️</p>
  `);

  select('#restart-btn').show(); // Mostra o botão de reinício
  select('#restart-btn').addClass('efeito-vitoria');  // Adiciona o efeito ao botão

  // Inicia a animação no fundo e no placar
  select('#placar').addClass('placar-vitoria');
}

function exibirMensagemVitoria() {
  venceu = true; // O jogo é pausado após vitória
  jogoPausado = true; // Pausa o jogo
  document.body.classList.add('body-sem-gradiente');  // Remove o gradiente de fundo
  select('#mensagem-container').show();
  select('#mensagem-vitoria').html(`  
    <h1>🎉 Parabéns! Você Venceu! 🎉</h1>
    <p><strong>Pontuação Final:</strong></p>
    <p><span style="font-size: 24px; font-weight: bold;">Jogador: ${pontosJogador} | Computador: ${pontosComputador}</span></p>
  `);

  select('#instrucoes-vitoria').html(`
    <p>👏 Que jogo incrível! Deseja tentar novamente?</p>
    <p>Clique no botão abaixo para reiniciar a partida e continuar se desafiando! 🕹️</p>
  `);

  select('#restart-btn').show(); // Mostra o botão de reinício
  select('#restart-btn').addClass('efeito-vitoria');  // Adiciona o efeito ao botão

  // Inicia a animação no fundo e no placar
  select('#placar').addClass('placar-vitoria');
}

function reiniciarJogo() {
  // Resetando o estado do jogo
  pontosJogador = 0;
  pontosComputador = 0;
  venceu = false; // O jogo retoma a partir daqui
  jogoPausado = false; // Retoma o jogo

  bola.reiniciar();
  raqueteComputador.y = height / 2 - raqueteComputador.h / 2;
  raqueteJogador.y = height / 2 - raqueteJogador.h / 2;

  select('#restart-btn').hide(); // Esconde o botão de reinício
  select('#mensagem-vitoria').html('');
  select('#instrucoes-vitoria').html('');
  select('#mensagem-container').hide();

  // Exibe o canvas e coloca o fundo novamente
  select('canvas').show();
  document.body.classList.remove('body-sem-gradiente');  // Restaura o gradiente de fundo

  // Reinicia o placar
  select('#pontosJogador').textContent = pontosJogador;
  select('#pontosComputador').textContent = pontosComputador;

}

function iniciarJogo() {
  // Esconde o menu e inicia o jogo
  select('#menu').hide(); // Esconde o menu
  select('#placar').show();// Exibe o placar
  select('canvas').show();// Exibe o jogo
  jogoPausado = false;  // Despausa o jogo
  document.body.classList.remove('body-sem-gradiente'); // Remove o fundo do menu e coloca o fundo gradiente

}

class Raquete {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  atualizar() {
    if (this === raqueteJogador) {
      this.y = mouseY;
    } else {
      if (bola.y > this.y + this.h / 2) {
        this.y += 3;
      } else if (bola.y < this.y - this.h / 2) {
        this.y -= 3;
      }
    }
    this.y = constrain(this.y, this.h / 2 + barraSuperior.h , height - this.h / 2 - barraInferior.h);
  }

  exibir() {
    if (this === raqueteJogador) {
      image(barraJogadorImg, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    } else {
      image(barraComputadorImg, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    }
  }
}

class Bola {
  constructor(r) {
    this.r = r;
    this.reiniciar();
  }

  aumentarVelocidade() {
    const fatorAumento = 1.1;
    this.velocidadeX *= fatorAumento;
    this.velocidadeY *= fatorAumento;
  }

  reiniciar() {
    this.x = width / 2;
    this.y = height / 2;
    this.velocidadeX = random([-4, -3, 3, 4]);
    this.velocidadeY = random(-3, 3);
  }

  atualizar(barraSuperior, barraInferior) {
    this.x += this.velocidadeX;
    this.y += this.velocidadeY;

    if (this.y - this.r / 2 <= barraSuperior.y + barraSuperior.h || 
        this.y + this.r / 2 >= barraInferior.y - barraInferior.h) {
      this.velocidadeY *= -1;
    }

    if (this.x + this.r / 2 >= width) {
      pontosJogador++;
      this.reiniciar();
    } else if (this.x - this.r / 2 <= 0) {
      pontosComputador++;
      raqueteComputador.y = random(height - raqueteComputador.h);
      this.reiniciar();
    }

    // Verifica se algum jogador venceu
    if (pontosJogador >= 3 || pontosComputador >= 3) {
      venceu = true;
      select('#restart-btn').show(); // Mostra o botão para reiniciar o jogo
    }
  }

  verificarColisaoRaquete(raquete) {
    if (this.x - this.r / 2 <= raquete.x + raquete.w / 2 && 
        this.x + this.r / 2 >= raquete.x - raquete.w / 2 && 
        this.y + this.r / 2 >= raquete.y - raquete.h / 2 && 
        this.y - this.r / 2 <= raquete.y + raquete.h / 2) {
      let posicaoRelativa = (this.y - raquete.y) / (raquete.h / 2);
      this.velocidadeY = map(posicaoRelativa, -1, 1, -3, 3);
      this.velocidadeX *= -1;
      this.aumentarVelocidade();
    }
  }

  exibir() {
    image(bolaImg, this.x - this.r / 2, this.y - this.r / 2, this.r, this.r);
  }
}

class Barra {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  exibir() {
    fill(color('#2B3F6D'));
    rectMode(CENTER);
    rect(this.x + this.w / 2, this.y, this.w, this.h);
  }
}

function voltarParaMenu() {
  // Esconde a mensagem de vitória/derrota
  select('#mensagem-container').hide();

  // Esconde a mesagem de configuração
  select('#configuracoes-menu').hide();

  // Esconde o placar
  select('#placar').hide();

  // Esconde o canva do jogo
  select('canvas').hide();

  // Mostra o menu inicial novamente
  select('#menu').show();

  // Restaura o gradiente de fundo
  document.body.classList.remove('body-sem-gradiente');  // Remove a classe para mostrar o gradiente

  // Pausa o jogo e reseta o estado
  jogoPausado = true;
  venceu = false;
  pontosJogador = 0;
  pontosComputador = 0;
  select('#pontosJogador').textContent = pontosJogador;
  select('#pontosComputador').textContent = pontosComputador;
}

function abrirConfiguracoes() {
  // Esconde o menu inicial
  select('#menu').hide();

  // Exibe o menu de configurações
  select('#configuracoes-menu').show();
}

function fecharConfiguracoes() {
  // Esconde o menu de configurações
  select('#configuracoes-menu').hide();

  // Exibe o menu inicial novamente
  select('#menu').show();
}

