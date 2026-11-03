/**
 * CONTROLE NAS TELAS — o direcional move o foco e o A confirma, em qualquer tela
 * ou janela, sem código específico para cada uma: o navegador procura os alvos
 * clicáveis da camada que está por cima (janela da partida, janela do menu ou
 * tela) e clica no escolhido.
 */
const TARGETS = 'button:not([disabled]), .card, .starter-card, .trainer-card, .stage-card.clickable';
// as janelas do menu abrem por cima das da partida (Opções na pausa, o PC no Centro Pokémon)
const LAYERS = ['.modal:not(.hidden)', '.overlay:not(.hidden)', '.screen:not(.hidden)'];

const visible = (node) => node.offsetParent !== null && !node.closest('.hidden');

export class PadNavigator {
  constructor() {
    this.current = null;
  }

  /** A camada de cima: a janela do menu, a da partida, ou a tela. */
  scope() {
    for (const selector of LAYERS) {
      const layers = [...document.querySelectorAll(selector)].filter(visible);
      if (layers.length) return layers[layers.length - 1];
    }
    return null;
  }

  /** Um botão do controle nas telas: up/down/left/right, a (confirma) ou b (volta). */
  handle(button) {
    const scope = this.scope();
    if (!scope) return;
    const targets = [...scope.querySelectorAll(TARGETS)].filter(visible);
    if (!targets.length) return;

    let index = targets.indexOf(this.current);
    if (button === 'a') {
      if (index === -1) this.focus(targets[0]);
      else this.current.click();
      return;
    }
    if (button === 'b') {
      // voltar: o botão de fechar ou de voltar da camada, se ela tiver
      scope.querySelector('[data-close], [data-back], #capture-skip, #btn-restart-no')?.click();
      return;
    }
    const step = button === 'left' || button === 'up' ? -1 : 1;
    index = index === -1 ? 0 : (index + step + targets.length) % targets.length;
    this.focus(targets[index]);
  }

  focus(node) {
    this.current?.classList.remove('pad-focus');
    this.current = node;
    node.classList.add('pad-focus');
    node.scrollIntoView?.({ block: 'nearest' });
  }
}
