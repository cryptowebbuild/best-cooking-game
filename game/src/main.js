// Game loop coordinator, audio wiring, localStorage best score, and ?shot screenshot hooks.
import { BEST_STORAGE_KEY, WORLD } from './config.js';
import { createRng } from './random.js';
import { createAudioEngine } from './audio.js';
import {
  ACT_CONFIRM,
  ACT_DASH,
  ACT_INTERACT,
  ACT_MUTE,
  ACT_PAUSE,
  createKitchenInput,
} from './input.js';
import {
  EVT_BURN,
  EVT_CHOP,
  EVT_DASH,
  EVT_DROP,
  EVT_OVER,
  EVT_PERFECT,
  EVT_PICK,
  EVT_SERVE,
  createKitchenWorld,
} from './kitchenState.js';
import {
  SCR_OVER,
  SCR_PAUSED,
  SCR_PLAY,
  SCR_TITLE,
  createKitchenRenderer,
} from './renderer.js';
import { stageScene } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
const seedVal = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedVal) ? seedVal : 1;

const canvas = document.getElementById('kitchen-canvas');
const announcer = document.getElementById('sr-announcer');

const world = createKitchenWorld(createRng(seed));
const renderer = createKitchenRenderer(canvas);
const audio = createAudioEngine();

function loadBestTips() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_STORAGE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestTips(tips) {
  try {
    window.localStorage.setItem(BEST_STORAGE_KEY, String(tips));
  } catch {
    // Ignore storage denial in private browsing modes
  }
}

function announce(msg) {
  if (announcer) announcer.textContent = msg;
}

function triggerAudio(events, combo) {
  if (events & EVT_SERVE) audio.playServe(combo);
  else if (events & EVT_PERFECT) audio.playPerfectSear();
  else if (events & EVT_CHOP) audio.playChop(1);
  else if (events & EVT_PICK) audio.playPick();
  else if (events & EVT_DROP) audio.playDrop();
  if (events & EVT_BURN) audio.playBurn();
  if (events & EVT_DASH) audio.playDash();
  if (events & EVT_OVER) audio.playShiftOver();
}

function runScreenshotMode(name) {
  const staged = stageScene(name, world);
  let frames = 0;
  function renderShot() {
    renderer.draw(world.state, staged.screen, staged.bestTips, world.nearestStation());
    frames += 1;
    if (frames < 3) requestAnimationFrame(renderShot);
    else window.__shotReady = true;
  }
  requestAnimationFrame(renderShot);
}

function runInteractiveGame() {
  const input = createKitchenInput(canvas, renderer.getViewTransform);
  let screen = SCR_TITLE;
  let bestTips = loadBestTips();
  let acc = 0;
  let prev = performance.now();

  function startShift() {
    audio.unlock();
    world.reset();
    acc = 0;
    screen = SCR_PLAY;
    announce('Dinner service started. Chop, sear, assemble and serve!');
  }

  function finishShift() {
    screen = SCR_OVER;
    if (world.state.tips > bestTips) {
      bestTips = world.state.tips;
      saveBestTips(bestTips);
    }
    announce(`Shift complete. Tips earned $${world.state.tips}. Best $${bestTips}.`);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.25, (now - prev) / 1000);
    prev = now;
    acc += dt;

    const acts = input.takeActions();
    const click = input.takeClick();

    if (acts & ACT_MUTE) audio.toggleMute();

    if (screen === SCR_TITLE || screen === SCR_OVER) {
      if (acts & ACT_CONFIRM || click) {
        startShift();
      }
      acc = 0;
      renderer.draw(world.state, screen, bestTips, null);
      return;
    }

    if (acts & ACT_PAUSE) {
      screen = screen === SCR_PLAY ? SCR_PAUSED : SCR_PLAY;
      announce(screen === SCR_PAUSED ? 'Service paused.' : 'Service resumed.');
      acc = 0;
    }

    if (screen === SCR_PLAY) {
      let stepOnce = true;
      while (acc >= WORLD.step && screen === SCR_PLAY) {
        const events = world.step(
          WORLD.step,
          input.moveVector(),
          stepOnce && Boolean(acts & ACT_INTERACT),
          stepOnce && Boolean(acts & ACT_DASH),
          stepOnce ? click : null,
          input.getPointerWorld(),
        );
        stepOnce = false;
        triggerAudio(events, world.state.combo);
        if (events & EVT_OVER) finishShift();
        acc -= WORLD.step;
      }
    } else {
      acc = 0;
    }

    renderer.draw(world.state, screen, bestTips, world.nearestStation());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCR_PLAY) {
      screen = SCR_PAUSED;
      announce('Service paused.');
    }
  });

  announce('Saffron and Steel ready. Press Space or click to cook.');
  requestAnimationFrame(loop);
}

if (shotParam) {
  runScreenshotMode(shotParam);
} else {
  runInteractiveGame();
}
