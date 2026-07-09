# Jogo de Ping Pong

Jogo clássico de ping pong para navegador, construído com p5.js: física de colisão, placar em tempo real, trilha sonora e partidas diretamente na tela inicial, sem instalação.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5dotjs&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)

[![Demonstração online](https://img.shields.io/badge/demonstra%C3%A7%C3%A3o-online-2EA44F?style=for-the-badge)](https://otavio-2507.github.io/Jogo-de-Ping-Pong/)

[![Prévia do jogo](docs/preview.webp)](https://otavio-2507.github.io/Jogo-de-Ping-Pong/)

## Visão geral

O projeto implementa a mecânica completa de uma partida de ping pong: movimentação das raquetes, deslocamento e aceleração da bola, detecção de colisão e contagem de pontos, tudo renderizado quadro a quadro pelo loop de desenho do p5.js. O objetivo foi exercitar lógica de jogos, renderização em tempo real e organização de estado em JavaScript.

## Funcionalidades

- Partida completa com placar atualizado em tempo real
- Detecção de colisão entre bola, raquetes e limites da tela
- Movimentação do adversário controlada por lógica própria
- Trilha sonora integrada à partida
- Tela inicial com chamada para começar o jogo
- Tipografia temática de fliperama (Orbitron e Press Start 2P)

## Tecnologias

| Tecnologia | Aplicação no projeto |
| --- | --- |
| p5.js | Loop de renderização, desenho dos elementos e ciclo do jogo |
| JavaScript (ES6+) | Lógica de colisão, pontuação e estados da partida |
| HTML5 | Estrutura da página e carregamento das dependências |
| CSS3 | Estilização da moldura e da tela inicial |
| Google Fonts | Tipografia temática (Orbitron, Press Start 2P) |

## Como executar

```bash
git clone https://github.com/OTAVIO-2507/Jogo-de-Ping-Pong.git
cd Jogo-de-Ping-Pong
```

Abra o arquivo `index.html` no navegador e clique em iniciar. O p5.js é carregado via CDN, sem configuração adicional.

## Estrutura do projeto

```
Jogo-de-Ping-Pong/
├── index.html              Página do jogo
├── src/
│   ├── javascript/
│   │   └── sketch.js       Lógica do jogo (p5.js)
│   ├── style/
│   │   └── styles.css      Estilos da página
│   └── audio/
│       └── musica.mp3      Trilha sonora
└── docs/
    └── preview.webp        Imagem de prévia do README
```

## Autor

**Otávio Oliveira** — Desenvolvedor Full Stack

[GitHub](https://github.com/OTAVIO-2507) · [Portfólio](https://otavio-2507.github.io/Portifolio-v2/) · [E-mail](mailto:56otavio@gmail.com)
