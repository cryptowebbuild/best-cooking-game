// Pure deterministic kitchen simulation: chef kinematics, cooking curves, orders, combos, and particles.
import { CHEF_CFG, STATIONS, TIMING, WORLD } from './config.js';
import {
  INGREDIENTS,
  RECIPES,
  canAcceptOnPlate,
  isReadyPart,
  matchCompleteRecipe,
  partBaseItem,
  transformIngredient,
} from './recipes.js';

export const EVT_NONE = 0;
export const EVT_PICK = 1;
export const EVT_DROP = 2;
export const EVT_CHOP = 4;
export const EVT_PERFECT = 8;
export const EVT_SERVE = 16;
export const EVT_BURN = 32;
export const EVT_DASH = 64;
export const EVT_OVER = 128;

export function createKitchenWorld(rng) {
  const chef = {
    x: 620,
    y: 390,
    vx: 0,
    vy: 0,
    facingX: 0,
    facingY: -1,
    holding: null, // { kind: 'item', itemId, perfect } | { kind: 'plated', recipe, perfectCount }
    dashTimer: 0,
    dashCooldown: 0,
    chopAnim: 0,
    walkPhase: 0,
  };

  // Clone mutable station state map
  const stationStates = new Map();
  function initStations() {
    stationStates.clear();
    for (const s of STATIONS) {
      stationStates.set(s.id, {
        def: s,
        itemId: null,       // single raw/cooked item on board/skillet/pot/counter
        cookElapsed: 0,     // seconds on stove/pot
        cookState: 'empty', // 'empty' | 'cooking' | 'ready' | 'perfect' | 'burnt'
        chopHits: 0,
        chopItem: null,
        parts: [],          // assembly plate contents
        platedRecipe: null, // matched complete recipe
        perfectCount: 0,
      });
    }
  }

  const state = {
    chef,
    stations: STATIONS,
    stationStates,
    tickets: [],
    nextTicketId: 1,
    spawnTimer: 0,
    score: 0,
    tips: 0,
    dishesServed: 0,
    perfectSeared: 0,
    missedOrders: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    wave: 1,
    timeLeft: WORLD.shiftSeconds,
    elapsed: 0,
    hoveredStationId: null,
    autoTargetStationId: null,
    particles: [],
    popups: [],
    bellPulse: 0,
    servedCounts: {},
  };

  function spawnPopup(x, y, text, color) {
    state.popups.push({ x, y, vy: -38, text, color, life: 1.35, maxLife: 1.35 });
  }

  function spawnBurst(x, y, color, count, kind = 'spark') {
    for (let i = 0; i < count; i += 1) {
      const ang = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.5;
      const spd = 40 + rng() * 110;
      state.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (kind === 'steam' ? 45 : 20),
        r: kind === 'steam' ? 5 + rng() * 5 : 3 + rng() * 3,
        color,
        kind,
        life: kind === 'steam' ? 0.9 : 0.45,
        maxLife: kind === 'steam' ? 0.9 : 0.45,
      });
    }
  }

  function spawnOrderTicket() {
    if (state.tickets.length >= WORLD.maxTickets) return;
    // Unlock higher tier recipes as wave rises
    const available = RECIPES.filter((r) => r.tier <= state.wave || state.elapsed > 35);
    const pick = available[Math.floor(rng() * available.length)];
    const maxPatience = Math.max(
      TIMING.ticketMinPatience,
      TIMING.ticketBasePatience - (state.wave - 1) * 4,
    );
    state.tickets.push({
      id: state.nextTicketId++,
      recipe: pick,
      patience: maxPatience,
      maxPatience,
      freshTimer: 0.5,
    });
  }

  function reset() {
    chef.x = 620;
    chef.y = 390;
    chef.vx = 0;
    chef.vy = 0;
    chef.facingX = 0;
    chef.facingY = -1;
    chef.holding = null;
    chef.dashTimer = 0;
    chef.dashCooldown = 0;
    chef.chopAnim = 0;
    chef.walkPhase = 0;
    initStations();
    state.tickets = [];
    state.nextTicketId = 1;
    state.score = 0;
    state.tips = 0;
    state.dishesServed = 0;
    state.perfectSeared = 0;
    state.missedOrders = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.comboTimer = 0;
    state.wave = 1;
    state.timeLeft = WORLD.shiftSeconds;
    state.elapsed = 0;
    state.autoTargetStationId = null;
    state.particles = [];
    state.popups = [];
    state.bellPulse = 0;
    state.servedCounts = {};
    // Always open shift with 3 varied orders on the board
    spawnOrderTicket();
    spawnOrderTicket();
    spawnOrderTicket();
    state.spawnTimer = 6.5;
  }

  function nearestStation(px = chef.x, py = chef.y) {
    let best = null;
    let bestDist = CHEF_CFG.interactRadius;
    for (const st of STATIONS) {
      const dist = Math.hypot(px - st.x, py - st.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = st;
      }
    }
    return best;
  }

  function stationAtPoint(px, py) {
    for (const st of STATIONS) {
      if (
        px >= st.x - st.w / 2 - 10 &&
        px <= st.x + st.w / 2 + 10 &&
        py >= st.y - st.h / 2 - 10 &&
        py <= st.y + st.h / 2 + 10
      ) {
        return st;
      }
    }
    return null;
  }

  function interactWithStation(st) {
    let events = EVT_NONE;
    const ss = stationStates.get(st.id);
    if (!ss) return events;
    const hold = chef.holding;

    // 1. Cold Pantry Crates
    if (st.kind === 'crate') {
      if (!hold) {
        chef.holding = { kind: 'item', itemId: st.item, perfect: false };
        spawnBurst(st.x, st.y - 10, INGREDIENTS[st.item].color, 6);
        events |= EVT_PICK;
      } else if (hold.kind === 'item' && hold.itemId === st.item) {
        chef.holding = null;
        events |= EVT_DROP;
      }
      return events;
    }

    // 2. Compost / Trash Bin
    if (st.kind === 'trash') {
      if (hold) {
        chef.holding = null;
        spawnBurst(st.x, st.y - 10, '#6b7280', 8);
        spawnPopup(st.x, st.y - 36, 'CLEARED', '#cbd5e1');
        events |= EVT_DROP;
      } else if (ss.parts.length > 0) {
        ss.parts = [];
      }
      return events;
    }

    // 3. Prep Chopping Boards
    if (st.kind === 'board') {
      if (ss.chopItem && isReadyPart(ss.chopItem)) {
        // Pick up chopped item if hands free
        if (!hold) {
          chef.holding = { kind: 'item', itemId: ss.chopItem, perfect: false };
          ss.chopItem = null;
          ss.chopHits = 0;
          events |= EVT_PICK;
          return events;
        }
      }
      if (!ss.chopItem && hold && hold.kind === 'item') {
        const res = transformIngredient(hold.itemId, 'board');
        if (res) {
          ss.chopItem = hold.itemId;
          ss.chopHits = 1;
          chef.holding = null;
          chef.chopAnim = 0.16;
          spawnBurst(st.x, st.y - 8, INGREDIENTS[ss.chopItem].color, 7);
          events |= EVT_CHOP;
          return events;
        }
      }
      if (ss.chopItem && !isReadyPart(ss.chopItem)) {
        ss.chopHits += 1;
        chef.chopAnim = 0.16;
        const base = partBaseItem(ss.chopItem);
        spawnBurst(st.x, st.y - 8, INGREDIENTS[base].color, 8);
        events |= EVT_CHOP;
        if (ss.chopHits >= TIMING.chopHitsNeeded) {
          ss.chopItem = transformIngredient(ss.chopItem, 'board');
          spawnPopup(st.x, st.y - 38, 'DICED!', '#22c55e');
        }
        return events;
      }
      return events;
    }

    // 4. Copper Skillets & Simmering Broth Pot
    if (st.kind === 'skillet' || st.kind === 'pot') {
      if (ss.itemId && !hold) {
        if (ss.cookState === 'ready' || ss.cookState === 'perfect' || ss.cookState === 'burnt') {
          const outItem =
            ss.cookState === 'burnt'
              ? `${ss.itemId}_burnt`
              : transformIngredient(ss.itemId, st.kind);
          const isPerf = ss.cookState === 'perfect';
          chef.holding = { kind: 'item', itemId: outItem, perfect: isPerf };
          if (isPerf) {
            state.perfectSeared += 1;
            state.score += 35;
            state.tips += 35;
            spawnPopup(st.x, st.y - 42, 'PERFECT! +$35', '#facc15');
            spawnBurst(st.x, st.y - 12, '#facc15', 12);
            events |= EVT_PERFECT;
          } else {
            events |= EVT_PICK;
          }
          ss.itemId = null;
          ss.cookElapsed = 0;
          ss.cookState = 'empty';
          return events;
        }
      }
      if (!ss.itemId && hold && hold.kind === 'item') {
        const res = transformIngredient(hold.itemId, st.kind);
        if (res) {
          ss.itemId = hold.itemId;
          ss.cookElapsed = 0;
          ss.cookState = 'cooking';
          chef.holding = null;
          spawnBurst(st.x, st.y - 8, '#fb923c', 6);
          events |= EVT_DROP;
          return events;
        }
      }
      return events;
    }

    // 5. Warm Spice Counter (Single item temp rest)
    if (st.kind === 'counter') {
      if (!ss.itemId && hold && hold.kind === 'item') {
        ss.itemId = hold.itemId;
        ss.cookState = hold.perfect ? 'perfect' : 'ready';
        chef.holding = null;
        events |= EVT_DROP;
      } else if (ss.itemId && !hold) {
        chef.holding = { kind: 'item', itemId: ss.itemId, perfect: ss.cookState === 'perfect' };
        ss.itemId = null;
        ss.cookState = 'empty';
        events |= EVT_PICK;
      }
      return events;
    }

    // 6. Assembly Plate Stations
    if (st.kind === 'plate') {
      if (hold && hold.kind === 'item' && !ss.platedRecipe) {
        if (canAcceptOnPlate(ss.parts, hold.itemId)) {
          ss.parts.push(hold.itemId);
          if (hold.perfect) ss.perfectCount += 1;
          chef.holding = null;
          spawnBurst(st.x, st.y - 10, '#f4b942', 8);
          const done = matchCompleteRecipe(ss.parts);
          if (done) {
            ss.platedRecipe = done;
            spawnPopup(st.x, st.y - 40, `${done.short.toUpperCase()} READY!`, '#4ade80');
            spawnBurst(st.x, st.y - 12, '#4ade80', 14);
            events |= EVT_PERFECT;
          } else {
            events |= EVT_DROP;
          }
          return events;
        }
      }
      if (!hold && ss.platedRecipe) {
        chef.holding = {
          kind: 'plated',
          recipe: ss.platedRecipe,
          perfectCount: ss.perfectCount,
        };
        ss.parts = [];
        ss.platedRecipe = null;
        ss.perfectCount = 0;
        events |= EVT_PICK;
        return events;
      }
      return events;
    }

    // 7. Service Pass / Brass Bell Window
    if (st.kind === 'serve') {
      if (hold && hold.kind === 'plated') {
        const idx = state.tickets.findIndex((t) => t.recipe.id === hold.recipe.id);
        state.bellPulse = 0.5;
        chef.holding = null;
        if (idx >= 0) {
          const ticket = state.tickets[idx];
          state.tickets.splice(idx, 1);
          state.combo += 1;
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          state.comboTimer = TIMING.comboWindowSeconds;
          const speedBonus = Math.round((ticket.patience / ticket.maxPatience) * 30);
          const searBonus = hold.perfectCount * 25;
          const mult = 1 + (state.combo - 1) * 0.25;
          const totalEarned = Math.round((hold.recipe.basePoints + speedBonus + searBonus) * mult);
          state.score += totalEarned;
          state.tips += totalEarned;
          state.dishesServed += 1;
          state.servedCounts[hold.recipe.id] = (state.servedCounts[hold.recipe.id] || 0) + 1;
          spawnPopup(
            st.x - 40,
            st.y - 54,
            `+$${totalEarned} ${state.combo > 1 ? `x${state.combo}` : 'SERVED!'}`,
            '#facc15',
          );
          spawnBurst(st.x - 10, st.y - 12, '#facc15', 18);
          spawnOrderTicket();
          events |= EVT_SERVE;
        } else {
          // Off-menu dish still earns modest house comp
          state.score += 40;
          state.tips += 40;
          state.dishesServed += 1;
          spawnPopup(st.x - 40, st.y - 54, '+$40 COMP', '#93c5fd');
          spawnBurst(st.x - 10, st.y - 12, '#93c5fd', 10);
          events |= EVT_SERVE;
        }
        return events;
      }
    }

    return events;
  }

  function steerAroundIsland(targetX, targetY) {
    const islLeft = 286;
    const islRight = 1012;
    const midY = 515;
    // If destination is on the central island itself, approach its closer top/bottom edge cleanly
    let goalY = targetY;
    if (targetX > islLeft && targetX < islRight && targetY >= 470 && targetY <= 562) {
      goalY = chef.y <= midY ? 464 : 568;
    }
    const crossesIsland =
      (chef.y < 472 && goalY > 560) ||
      (chef.y > 560 && goalY < 472);
    if (crossesIsland && chef.x > islLeft - 24 && chef.x < islRight + 24) {
      const gateX = chef.x < (islLeft + islRight) / 2 ? islLeft - 38 : islRight + 38;
      const dx = gateX - chef.x;
      const len = Math.abs(dx) || 1;
      return { dx: dx / len, dy: 0 };
    }
    const dx = targetX - chef.x;
    const dy = goalY - chef.y;
    const dist = Math.hypot(dx, dy) || 1;
    return { dx: dx / dist, dy: dy / dist };
  }

  function step(dt, moveVec, interactPressed, dashPressed, clickPt, pointerWorld) {
    let events = EVT_NONE;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.wave = state.elapsed >= 95 ? 3 : state.elapsed >= 45 ? 2 : 1;

    if (state.bellPulse > 0) state.bellPulse = Math.max(0, state.bellPulse - dt);
    if (chef.chopAnim > 0) chef.chopAnim = Math.max(0, chef.chopAnim - dt);
    if (chef.dashCooldown > 0) chef.dashCooldown = Math.max(0, chef.dashCooldown - dt);
    if (chef.dashTimer > 0) chef.dashTimer = Math.max(0, chef.dashTimer - dt);

    if (state.combo > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    // Hover hint for mouse users
    const hov = pointerWorld ? stationAtPoint(pointerWorld.x, pointerWorld.y) : null;
    state.hoveredStationId = hov ? hov.id : null;

    // Handle click-to-station target
    if (clickPt) {
      const clickedSt = stationAtPoint(clickPt.x, clickPt.y);
      if (clickedSt) {
        const d = Math.hypot(chef.x - clickedSt.x, chef.y - clickedSt.y);
        if (d <= CHEF_CFG.interactRadius) {
          events |= interactWithStation(clickedSt);
          state.autoTargetStationId = null;
        } else {
          state.autoTargetStationId = clickedSt.id;
        }
      } else {
        state.autoTargetStationId = null;
      }
    }

    // Manual movement overrides click-auto-walk
    let mx = moveVec.dx;
    let my = moveVec.dy;
    if (mx !== 0 || my !== 0) {
      state.autoTargetStationId = null;
    } else if (state.autoTargetStationId) {
      const targetSt = STATIONS.find((s) => s.id === state.autoTargetStationId);
      if (targetSt) {
        const dx = targetSt.x - chef.x;
        const dy = targetSt.y - chef.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= CHEF_CFG.interactRadius - 8) {
          events |= interactWithStation(targetSt);
          state.autoTargetStationId = null;
        } else if (dist > 1) {
          const mv = steerAroundIsland(targetSt.x, targetSt.y);
          mx = mv.dx;
          my = mv.dy;
        }
      }
    }

    if (dashPressed && chef.dashCooldown === 0 && (mx !== 0 || my !== 0)) {
      chef.dashTimer = CHEF_CFG.dashDuration;
      chef.dashCooldown = CHEF_CFG.dashCooldown;
      spawnBurst(chef.x, chef.y + 12, '#fde68a', 6);
      events |= EVT_DASH;
    }

    const spd = chef.dashTimer > 0 ? CHEF_CFG.dashSpeed : CHEF_CFG.speed;
    chef.vx = mx * spd;
    chef.vy = my * spd;
    if (mx !== 0 || my !== 0) {
      chef.facingX = mx;
      chef.facingY = my;
      chef.walkPhase += dt * (chef.dashTimer > 0 ? 18 : 11);
    }

    // Move chef with smooth corner-gliding boundary & island separation
    const nextX = chef.x + chef.vx * dt;
    const nextY = chef.y + chef.vy * dt;
    chef.x = Math.min(1108, Math.max(142, nextX));
    chef.y = Math.min(676, Math.max(166, nextY));

    const islLeft = 286;
    const islRight = 1012;
    const islTop = 470;
    const islBot = 562;
    if (chef.x > islLeft && chef.x < islRight && chef.y > islTop && chef.y < islBot) {
      const dxL = Math.abs(chef.x - islLeft);
      const dxR = Math.abs(islRight - chef.x);
      const dyT = Math.abs(chef.y - islTop);
      const dyB = Math.abs(islBot - chef.y);
      const m = Math.min(dxL, dxR, dyT, dyB);
      if (m === dyT) chef.y = islTop;
      else if (m === dyB) chef.y = islBot;
      else if (m === dxL) chef.x = islLeft;
      else chef.x = islRight;
    }
    if (chef.x > 304 && chef.x < 944 && chef.y < 268) {
      chef.y = 268;
    }

    if (interactPressed) {
      const target = nearestStation();
      if (target) {
        events |= interactWithStation(target);
      }
    }

    // Update Stove & Broth Pot cooking progress + steam particles
    for (const ss of stationStates.values()) {
      if ((ss.def.kind === 'skillet' || ss.def.kind === 'pot') && ss.itemId) {
        ss.cookElapsed += dt;
        const cookDone =
          ss.def.kind === 'skillet' ? TIMING.searCookSeconds : TIMING.simmerCookSeconds;
        const burnAt =
          ss.def.kind === 'skillet' ? TIMING.searBurnSeconds : TIMING.simmerBurnSeconds;
        const prevState = ss.cookState;
        if (ss.cookElapsed < cookDone) {
          ss.cookState = 'cooking';
        } else if (
          ss.def.kind === 'skillet' &&
          ss.cookElapsed < TIMING.searPerfectEnd
        ) {
          ss.cookState = 'perfect';
        } else if (ss.cookElapsed < burnAt) {
          ss.cookState = 'ready';
        } else {
          ss.cookState = 'burnt';
        }
        if (ss.cookState === 'burnt' && prevState !== 'burnt') {
          spawnPopup(ss.def.x, ss.def.y - 76, 'BURNT!', '#ef4444');
          events |= EVT_BURN;
        }
        if (rng() < dt * (ss.cookState === 'burnt' ? 14 : 6)) {
          spawnBurst(
            ss.def.x + (rng() - 0.5) * 26,
            ss.def.y - 18,
            ss.cookState === 'burnt' ? '#374151' : '#ffffff',
            1,
            'steam',
          );
        }
      }
    }

    // Update Tickets patience & wave spawning
    for (let i = state.tickets.length - 1; i >= 0; i -= 1) {
      const t = state.tickets[i];
      if (t.freshTimer > 0) t.freshTimer = Math.max(0, t.freshTimer - dt);
      t.patience -= dt;
      if (t.patience <= 0) {
        state.tickets.splice(i, 1);
        state.missedOrders += 1;
        state.combo = 0;
        spawnPopup(380 + i * 200, 118, 'ORDER EXPIRED', '#f87171');
        spawnOrderTicket();
      }
    }

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (state.tickets.length < WORLD.maxTickets) spawnOrderTicket();
      state.spawnTimer = Math.max(5.5, 10 - state.wave * 1.4);
    }

    // Update particles & floating popups
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      const pp = state.popups[i];
      pp.life -= dt;
      if (pp.life <= 0) {
        state.popups.splice(i, 1);
        continue;
      }
      pp.y += pp.vy * dt;
    }

    if (state.timeLeft <= 0) events |= EVT_OVER;
    return events;
  }

  reset();
  return { state, reset, step, nearestStation, steerAroundIsland };
}
