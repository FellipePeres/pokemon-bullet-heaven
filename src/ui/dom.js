/** Atalhos de DOM usados pela interface. */

import { iconHTML } from '../render/icons.js';

export const el = (id) => document.getElementById(id);

export function create(tag, className = '', html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export const show = (node) => node && node.classList.remove('hidden');
export const hide = (node) => node && node.classList.add('hidden');
export const setVisible = (node, visible) => (visible ? show(node) : hide(node));

/**
 * Mensagem rápida no topo da tela.
 * `icon` pode ser uma chave de render/icons.js (vira o ícone do item)
 * ou qualquer texto/emoji solto.
 */
export function toast(text, icon = '') {
  const container = el('toast-container');
  if (!container) return;
  const mark = icon && /^[a-z][a-z-]*$/i.test(icon) ? iconHTML(icon, 20) : (icon ? `${icon} ` : '');
  const node = create('div', 'toast', `${mark}${text}`);
  container.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 320);
  }, 2200);
}
