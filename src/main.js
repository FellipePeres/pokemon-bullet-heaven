import { Game } from './game/Game.js';
import { CONFIG } from './core/config.js';

/** Ponto de entrada: cria o jogo assim que a página carrega. */
const canvas = document.getElementById('game-canvas');
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const game = new Game(canvas);

// útil para testar no console do navegador (ex.: game.startStage('route_1'))
window.game = game;
