// Deterministic scene staging for ?shot=rush|title|combo|summary via real simulation steps.
import { TIMING, WORLD } from './config.js';
import { EVT_OVER } from './kitchenState.js';
import { SCR_OVER, SCR_PLAY, SCR_TITLE } from './renderer.js';

function moveStep(world, tx, ty, interact = false) {
  const dist = Math.hypot(tx - world.state.chef.x, ty - world.state.chef.y);
  const mv = dist > 8 ? world.steerAroundIsland(tx, ty) : { dx: 0, dy: 0 };
  world.step(WORLD.step, mv, interact, false, null, null);
  return dist;
}

function walkToAndInteract(world, stationId, stepsMax = 280) {
  const st = world.state.stations.find((s) => s.id === stationId);
  if (!st) return;
  for (let i = 0; i < stepsMax; i += 1) {
    const dist = Math.hypot(world.state.chef.x - st.x, world.state.chef.y - st.y);
    const near = world.nearestStation();
    if (dist <= 82 && near && near.id === stationId) {
      world.step(WORLD.step, { dx: 0, dy: 0 }, true, false, null, null);
      return;
    }
    moveStep(world, st.x, st.y, false);
  }
}

function walkToPoint(world, x, y, stepsMax = 140) {
  for (let i = 0; i < stepsMax; i += 1) {
    if (moveStep(world, x, y, false) <= 10) break;
  }
}

function advanceIdle(world, seconds) {
  const n = Math.round(seconds / WORLD.step);
  for (let i = 0; i < n; i += 1) {
    world.step(WORLD.step, { dx: 0, dy: 0 }, false, false, null, null);
  }
}

function waitStationReady(world, stationId, targetSeconds, maxWaitSec = 8) {
  const ticks = Math.round(maxWaitSec / 0.15);
  for (let i = 0; i < ticks; i += 1) {
    const ss = world.state.stationStates.get(stationId);
    if (!ss || !ss.itemId || ss.cookElapsed >= targetSeconds) break;
    advanceIdle(world, 0.15);
  }
}

export function stageScene(shotName, world) {
  world.reset();

  if (shotName === 'title') {
    // Stage lively sizzling pans + prepped tomato visible around the compact welcome banner!
    walkToAndInteract(world, 'crate_salmon');
    walkToAndInteract(world, 'skillet_1');
    walkToAndInteract(world, 'crate_rice');
    walkToAndInteract(world, 'pot_1');
    walkToAndInteract(world, 'crate_tomato');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'board_1');
    walkToPoint(world, 250, 340);
    return { screen: SCR_TITLE, bestTips: 640 };
  }

  if (shotName === 'rush') {
    // 1. Build completed Saffron Mushroom Risotto on plate_2 ("READY: RISOTTO"!)
    walkToAndInteract(world, 'crate_rice');
    walkToPoint(world, 240, 380);
    walkToAndInteract(world, 'pot_1');
    walkToAndInteract(world, 'crate_mushroom');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'board_2');
    for (let h = 0; h < TIMING.chopHitsNeeded - 1; h += 1) {
      advanceIdle(world, 0.08);
      walkToAndInteract(world, 'board_2');
    }
    walkToAndInteract(world, 'board_2');
    walkToAndInteract(world, 'plate_2');
    waitStationReady(world, 'pot_1', TIMING.simmerCookSeconds + 0.15);
    walkToAndInteract(world, 'pot_1');
    walkToAndInteract(world, 'plate_2');

    // 2. Build Bistro Smash Burger MID-ASSEMBLY on plate_1 (Bun + Seared Steak -> "Burger: +TOM")
    walkToAndInteract(world, 'crate_steak');
    walkToAndInteract(world, 'skillet_1');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'crate_bun');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'plate_1');
    waitStationReady(world, 'skillet_1', TIMING.searCookSeconds + 0.2);
    walkToAndInteract(world, 'skillet_1');
    walkToAndInteract(world, 'plate_1');

    // 3. Fire up active kitchen rush: saffron rice simmering -> salmon gold sear -> steak searing -> tomato half-chopped (2/4)!
    walkToAndInteract(world, 'crate_rice');
    walkToPoint(world, 240, 380);
    walkToAndInteract(world, 'pot_1');
    walkToAndInteract(world, 'crate_salmon');
    walkToAndInteract(world, 'skillet_1');
    walkToAndInteract(world, 'crate_steak');
    walkToAndInteract(world, 'skillet_2');
    walkToAndInteract(world, 'crate_tomato');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'board_1');
    advanceIdle(world, 0.08);
    walkToAndInteract(world, 'board_1');
    world.state.chef.facingX = 0;
    world.state.chef.facingY = 1;
    world.state.chef.chopAnim = 0.14;

    world.state.tips = 385;
    world.state.score = 385;
    world.state.dishesServed = 3;
    world.state.perfectSeared = 2;
    world.state.combo = 3;
    world.state.wave = 2;
    return { screen: SCR_PLAY, bestTips: 485 };
  }

  if (shotName === 'combo') {
    // Serve a live Truffle Char Steak at the Brass Bell while Skillet 2 & Pot 1 cook!
    walkToAndInteract(world, 'crate_steak');
    walkToAndInteract(world, 'skillet_1');
    walkToAndInteract(world, 'crate_mushroom');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'board_2');
    for (let h = 0; h < TIMING.chopHitsNeeded - 1; h += 1) {
      advanceIdle(world, 0.08);
      walkToAndInteract(world, 'board_2');
    }
    walkToAndInteract(world, 'board_2');
    walkToAndInteract(world, 'plate_1');
    waitStationReady(world, 'skillet_1', TIMING.searCookSeconds + 0.25);
    walkToAndInteract(world, 'skillet_1');
    walkToAndInteract(world, 'plate_1');

    walkToAndInteract(world, 'crate_bun');
    walkToPoint(world, 240, 420);
    walkToAndInteract(world, 'plate_2');
    walkToAndInteract(world, 'crate_rice');
    walkToPoint(world, 240, 380);
    walkToAndInteract(world, 'pot_1');
    walkToAndInteract(world, 'crate_salmon');
    walkToAndInteract(world, 'skillet_2');
    walkToPoint(world, 660, 420);
    walkToAndInteract(world, 'plate_1');
    world.state.tips = 240;
    world.state.score = 240;
    world.state.dishesServed = 2;
    world.state.combo = 2;
    world.state.comboTimer = 10;
    world.state.wave = 2;
    walkToAndInteract(world, 'serve_pass');
    advanceIdle(world, 0.14);
    return { screen: SCR_PLAY, bestTips: 485 };
  }

  // Summary screen: stage sizzling active kitchen around compact gold scorecard!
  walkToAndInteract(world, 'crate_steak');
  walkToAndInteract(world, 'skillet_1');
  walkToAndInteract(world, 'crate_mushroom');
  walkToPoint(world, 240, 420);
  walkToAndInteract(world, 'board_1');
  for (let h = 0; h < TIMING.chopHitsNeeded; h += 1) {
    advanceIdle(world, 0.1);
    walkToAndInteract(world, 'board_1');
  }
  walkToAndInteract(world, 'plate_1');
  waitStationReady(world, 'skillet_1', TIMING.searCookSeconds + 0.2);
  walkToAndInteract(world, 'skillet_1');
  walkToAndInteract(world, 'plate_1');
  walkToAndInteract(world, 'plate_1');
  walkToAndInteract(world, 'serve_pass');

  walkToAndInteract(world, 'crate_salmon');
  walkToAndInteract(world, 'skillet_2');
  walkToAndInteract(world, 'crate_rice');
  walkToAndInteract(world, 'pot_1');
  waitStationReady(world, 'skillet_2', TIMING.searCookSeconds + 0.15, 2.0);

  world.state.tips = 785;
  world.state.score = 785;
  world.state.dishesServed = 6;
  world.state.perfectSeared = 5;
  world.state.maxCombo = 4;
  world.state.wave = 3;
  world.state.timeLeft = 0;
  return { screen: SCR_OVER, bestTips: 785 };
}
