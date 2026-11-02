import { CONFIG } from '../core/config.js';

/**
 * Qual quadro da folha do treinador mostrar agora.
 *
 * O passo acompanha a distância andada, como no FireRed (ver os anims
 * sAnim_GoSouth e sAnim_RunSouth do jogo):
 *   andar   meio quadrado com o pé da vez e meio parado; o pé troca a cada quadrado
 *   correr  5/8 do quadrado na passada e o resto no pé da vez
 * A direita não existe na folha: é a esquerda espelhada.
 */
export function trainerFrame(player, look) {
  const frames = look.frames;
  const pose = player.dir === 'right' ? 'left' : player.dir;
  const flip = player.dir === 'right';
  if (!player.moving) return { frame: frames.stand[pose], flip };

  const { stride, runAt } = CONFIG.trainer.animation;
  const steps = player.stride / stride;
  const foot = Math.floor(steps) % 2;
  const within = steps - Math.floor(steps);

  if (player.speed >= runAt) {
    return { frame: within < 5 / 8 ? frames.run[pose][0] : frames.run[pose][1 + foot], flip };
  }
  return { frame: within < 0.5 ? frames.walk[pose][foot] : frames.stand[pose], flip };
}
