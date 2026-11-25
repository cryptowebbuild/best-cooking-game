// Unified keyboard (WASD/Arrows + Space/E + Shift/Q + P) and mouse click-to-station input.
import { WORLD } from './config.js';

export const ACT_INTERACT = 1;
export const ACT_DASH = 2;
export const ACT_PAUSE = 4;
export const ACT_CONFIRM = 8;
export const ACT_MUTE = 16;

export function createKitchenInput(canvas, getViewTransform) {
  const held = { up: false, down: false, left: false, right: false };
  let actions = 0;
  let pendingClick = null;
  let pointerWorld = { x: -100, y: -100 };

  function toWorld(clientX, clientY) {
    const v = getViewTransform();
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    return {
      x: (px - v.x) / v.scale,
      y: (py - v.y) / v.scale,
    };
  }

  window.addEventListener('keydown', (e) => {
    const c = e.code;
    if (c === 'KeyW' || c === 'ArrowUp') held.up = true;
    else if (c === 'KeyS' || c === 'ArrowDown') held.down = true;
    else if (c === 'KeyA' || c === 'ArrowLeft') held.left = true;
    else if (c === 'KeyD' || c === 'ArrowRight') held.right = true;
    else if (c === 'Space' || c === 'KeyE') {
      if (!e.repeat) actions |= ACT_INTERACT | ACT_CONFIRM;
    } else if (c === 'Enter') {
      if (!e.repeat) actions |= ACT_CONFIRM;
    } else if (c === 'ShiftLeft' || c === 'ShiftRight' || c === 'KeyQ') {
      if (!e.repeat) actions |= ACT_DASH;
    } else if (c === 'KeyP' || c === 'Escape') {
      if (!e.repeat) actions |= ACT_PAUSE;
    } else if (c === 'KeyM') {
      if (!e.repeat) actions |= ACT_MUTE;
    } else {
      return;
    }
    e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    const c = e.code;
    if (c === 'KeyW' || c === 'ArrowUp') held.up = false;
    else if (c === 'KeyS' || c === 'ArrowDown') held.down = false;
    else if (c === 'KeyA' || c === 'ArrowLeft') held.left = false;
    else if (c === 'KeyD' || c === 'ArrowRight') held.right = false;
  });

  window.addEventListener('blur', () => {
    held.up = false;
    held.down = false;
    held.left = false;
    held.right = false;
  });

  canvas.addEventListener('pointermove', (e) => {
    pointerWorld = toWorld(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointerdown', (e) => {
    const pt = toWorld(e.clientX, e.clientY);
    pointerWorld = pt;
    if (pt.x >= 0 && pt.x <= WORLD.width && pt.y >= 0 && pt.y <= WORLD.height) {
      pendingClick = pt;
      actions |= ACT_CONFIRM;
    }
  });

  return {
    moveVector() {
      const dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (dx === 0 && dy === 0) return { dx: 0, dy: 0 };
      const len = Math.hypot(dx, dy);
      return { dx: dx / len, dy: dy / len };
    },
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
    takeClick() {
      const c = pendingClick;
      pendingClick = null;
      return c;
    },
    getPointerWorld() {
      return pointerWorld;
    },
  };
}
