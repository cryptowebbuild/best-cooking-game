// Layered 1280x720 canvas renderer: kitchen counters, stoves, order board, timers, HUD, and screens.
import { PALETTE, TIMING, WORLD } from './config.js';
import { INGREDIENTS, RECIPES, matchingPartialRecipes } from './recipes.js';
import { drawChefCharacter, drawIngredientArt, drawPlatedDish } from './foodArt.js';

export const SCR_TITLE = 'title';
export const SCR_PLAY = 'play';
export const SCR_PAUSED = 'paused';
export const SCR_OVER = 'over';

function formatClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

export function createKitchenRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(window.innerWidth * dpr));
    const h = Math.max(1, Math.round(window.innerHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    view.scale = Math.min(w / WORLD.width, h / WORLD.height);
    view.x = (w - WORLD.width * view.scale) / 2;
    view.y = (h - WORLD.height * view.scale) / 2;
  }

  function drawTileFloor() {
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 128, WORLD.width, WORLD.height - 128);
    const tile = 48;
    for (let ty = 128; ty < WORLD.height; ty += tile) {
      for (let tx = 0; tx < WORLD.width; tx += tile) {
        if (((tx / tile + ty / tile) & 1) === 0) {
          ctx.fillStyle = PALETTE.floorB;
          ctx.fillRect(tx, ty, tile, tile);
        }
      }
    }
    // Subtle warm kitchen ambient rug along center corridor
    ctx.fillStyle = 'rgba(180, 120, 75, 0.14)';
    ctx.beginPath();
    ctx.roundRect(225, 312, 875, 136, 20);
    ctx.fill();
  }

  function drawKitchenFurniture() {
    // Left Pantry Wooden Counter Strip
    ctx.fillStyle = '#3e271a';
    ctx.beginPath();
    ctx.roundRect(14, 166, 124, 536, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.woodCounter;
    ctx.beginPath();
    ctx.roundRect(18, 170, 114, 526, 10);
    ctx.fill();

    // Top Hot Line Stainless & Copper Hood Range with burner dials & shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.roundRect(306, 164, 636, 108, 12);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(306, 158, 636, 106, 12);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(312, 164, 624, 94, 10);
    ctx.fill();
    // Stove brass control knobs along front lip
    for (let kx = 344; kx <= 810; kx += 58) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(kx, 258, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4b942';
      ctx.beginPath();
      ctx.arc(kx, 258, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Veined Marble Island with shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.roundRect(284, 474, 738, 104, 12);
    ctx.fill();
    ctx.fillStyle = '#b9ab99';
    ctx.beginPath();
    ctx.roundRect(284, 466, 738, 102, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.marbleCounter;
    ctx.beginPath();
    ctx.roundRect(288, 470, 730, 92, 10);
    ctx.fill();
    // Subtle marble veins
    ctx.strokeStyle = PALETTE.marbleVein;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(310, 495);
    ctx.quadraticCurveTo(450, 520, 620, 488);
    ctx.moveTo(690, 540);
    ctx.quadraticCurveTo(820, 498, 975, 530);
    ctx.stroke();

    // Right Service Window Pass & Brass Trim
    ctx.fillStyle = '#3e271a';
    ctx.beginPath();
    ctx.roundRect(1110, 268, 138, 200, 12);
    ctx.fill();
    ctx.fillStyle = '#6f4427';
    ctx.beginPath();
    ctx.roundRect(1116, 274, 126, 188, 10);
    ctx.fill();
  }

  function drawProgressBar(x, y, w, h, frac, color, bg = '#1e293b') {
    const clamped = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    if (clamped > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(h, w * clamped), h, h / 2);
      ctx.fill();
    }
  }

  function drawStations(state, nearStationId) {
    for (const st of state.stations) {
      const ss = state.stationStates.get(st.id);
      const isNear = st.id === nearStationId;
      const isHov = st.id === state.hoveredStationId;
      const isAuto = st.id === state.autoTargetStationId;

      ctx.save();
      ctx.translate(st.x, st.y);

      if (isNear || isHov || isAuto) {
        ctx.strokeStyle = isNear ? '#facc15' : '#38bdf8';
        ctx.lineWidth = isNear ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(-st.w / 2 - 4, -st.h / 2 - 4, st.w + 8, st.h + 8, 10);
        ctx.stroke();
      }

      if (st.kind === 'crate') {
        ctx.fillStyle = '#54331d';
        ctx.beginPath();
        ctx.roundRect(-st.w / 2, -st.h / 2, st.w, st.h, 8);
        ctx.fill();
        ctx.fillStyle = '#f8efe2';
        ctx.beginPath();
        ctx.roundRect(-st.w / 2 + 6, -st.h / 2 + 6, st.w - 12, st.h - 22, 6);
        ctx.fill();
        drawIngredientArt(ctx, st.item, 0, -7, 0.95);
        ctx.fillStyle = '#fff7ed';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(st.label.toUpperCase(), 0, st.h / 2 - 5);
      } else if (st.kind === 'skillet') {
        // Burner halo & copper frying pan
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        if (ss.itemId) {
          // Glowing flame ring
          ctx.strokeStyle = ss.cookState === 'burnt' ? '#ef4444' : '#f97316';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 31, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Copper skillet handle + pan
        ctx.fillStyle = '#b45309';
        ctx.fillRect(22, -4, 24, 8);
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.copperBright;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (ss.itemId) {
          const shownId =
            ss.cookState === 'burnt'
              ? `${ss.itemId}_burnt`
              : ss.cookState === 'perfect' || ss.cookState === 'ready'
                ? `${ss.itemId}_seared`
                : ss.itemId;
          drawIngredientArt(ctx, shownId, 0, 0, 0.92);

          // Cook gauge inside high-contrast pill above stove
          const ratio = Math.min(1, ss.cookElapsed / TIMING.searBurnSeconds);
          const barCol =
            ss.cookState === 'perfect'
              ? '#facc15'
              : ss.cookState === 'ready'
                ? '#f97316'
                : ss.cookState === 'burnt'
                  ? '#ef4444'
                  : '#38bdf8';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.roundRect(-48, -64, 96, 30, 6);
          ctx.fill();
          drawProgressBar(-38, -45, 76, 8, ratio, barCol, '#334155');
          ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = ss.cookState === 'perfect' ? '#fef08a' : '#f8fafc';
          const tag =
            ss.cookState === 'perfect'
              ? 'GOLD SEAR!'
              : ss.cookState === 'ready'
                ? 'PULL SOON!'
                : ss.cookState === 'burnt'
                  ? 'BURNT!'
                  : 'SEARING...';
          ctx.fillText(tag, 0, -51);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(st.label.toUpperCase(), 0, 42);
        }
      } else if (st.kind === 'pot') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.copper;
        ctx.beginPath();
        ctx.arc(0, 0, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ss.itemId ? '#fbbf24' : '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.fill();
        if (ss.itemId) {
          const shown =
            ss.cookState === 'burnt'
              ? `${ss.itemId}_burnt`
              : ss.cookElapsed >= TIMING.simmerCookSeconds
                ? 'rice_simmered'
                : 'rice';
          drawIngredientArt(ctx, shown, 0, 0, 0.85);
          const ratio = Math.min(1, ss.cookElapsed / TIMING.simmerCookSeconds);
          const ready = ss.cookElapsed >= TIMING.simmerCookSeconds && ss.cookState !== 'burnt';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.roundRect(-48, -64, 96, 30, 6);
          ctx.fill();
          drawProgressBar(-38, -45, 76, 8, ratio, ready ? '#4ade80' : '#fbbf24', '#334155');
          ctx.fillStyle = ready ? '#86efac' : '#fde68a';
          ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ready ? 'RISOTTO READY!' : 'SIMMERING...', 0, -51);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('BROTH POT', 0, 42);
        }
      } else if (st.kind === 'counter') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(-st.w / 2 + 8, -st.h / 2 + 8, st.w - 16, st.h - 16, 8);
        ctx.fill();
        if (ss.itemId) {
          drawIngredientArt(ctx, ss.itemId, 0, 0, 0.95);
        } else {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('WARM PASS', 0, 4);
        }
      } else if (st.kind === 'board') {
        // Thick wooden cutting board
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(-42, -26, 84, 52, 6);
        ctx.fill();
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.roundRect(-38, -22, 76, 44, 4);
        ctx.fill();
        if (ss.chopItem) {
          drawIngredientArt(ctx, ss.chopItem, 0, 0, 0.95);
          if (!ss.chopItem.endsWith('_chopped')) {
            drawProgressBar(-32, -36, 64, 8, ss.chopHits / TIMING.chopHitsNeeded, '#22c55e');
            ctx.fillStyle = '#15803d';
            ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`CHOP ${ss.chopHits}/${TIMING.chopHitsNeeded}`, 0, -42);
          } else {
            ctx.fillStyle = '#15803d';
            ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DICED — PICK UP', 0, -34);
          }
        } else {
          // Knife rested cleanly on board
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-14, -4, 24, 5);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(10, -4, 10, 5);
          ctx.fillStyle = '#451a03';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CHOP BOARD', 0, 42);
        }
      } else if (st.kind === 'plate') {
        // Marble assembly platter zone
        ctx.fillStyle = '#e7e0d3';
        ctx.beginPath();
        ctx.roundRect(-46, -28, 92, 56, 10);
        ctx.fill();
        ctx.strokeStyle = ss.platedRecipe ? '#16a34a' : '#c2b6a4';
        ctx.lineWidth = ss.platedRecipe ? 3 : 2;
        ctx.stroke();

        if (ss.platedRecipe) {
          drawPlatedDish(ctx, ss.platedRecipe.id, ss.parts, 0, 0, 1.05);
          ctx.fillStyle = '#15803d';
          ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`READY: ${ss.platedRecipe.short.toUpperCase()}`, 0, -36);
        } else if (ss.parts.length > 0) {
          drawPlatedDish(ctx, null, ss.parts, 0, 0, 1.0);
          const matches = matchingPartialRecipes(ss.parts);
          const hint = matches.length > 0 ? matches[0] : null;
          ctx.fillStyle = '#1d4ed8';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          if (hint) {
            const missing = hint.parts.filter((p) => !ss.parts.includes(p));
            const nextIng = INGREDIENTS[missing[0]?.replace(/_(chopped|seared|simmered)$/, '')];
            ctx.fillText(
              `${hint.short}: +${nextIng ? nextIng.short : missing.length}`,
              0,
              -36,
            );
          } else {
            ctx.fillText(`ASSEMBLING (${ss.parts.length})`, 0, -36);
          }
        } else {
          ctx.fillStyle = '#fffdf9';
          ctx.beginPath();
          ctx.ellipse(0, 0, 24, 17, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PLATING', 0, 42);
        }
      } else if (st.kind === 'trash') {
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.roundRect(-24, -24, 48, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(-18, -18, 36, 36, 5);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('COMPOST', 0, 42);
      } else if (st.kind === 'serve') {
        // Golden Brass Service Pass + Bell
        const pulse = state.bellPulse > 0 ? 1 + state.bellPulse * 0.2 : 1;
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(-44, -68, 88, 136, 10);
        ctx.fill();
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(-36, -58, 72, 116, 8);
        ctx.fill();

        // Brass bell dome
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-16, 6, 32, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 6, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-4, -1, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SERVE', 0, -24);
        ctx.fillText('PASS', 0, -10);
        if (state.chef.holding?.kind === 'plated') {
          ctx.fillStyle = '#15803d';
          ctx.fillText('RING BELL!', 0, 38);
        }
      }

      ctx.restore();
    }
  }

  function drawOrderBoardAndHud(state) {
    // Dark mahogany & steel header rail
    ctx.fillStyle = PALETTE.headerBg;
    ctx.fillRect(0, 0, WORLD.width, 126);
    ctx.fillStyle = PALETTE.headerBorder;
    ctx.fillRect(0, 124, WORLD.width, 4);

    // Left HUD Panel: Shift Timer, Score, Wave & Combo
    ctx.fillStyle = '#2a1f1a';
    ctx.beginPath();
    ctx.roundRect(14, 10, 278, 106, 10);
    ctx.fill();
    ctx.strokeStyle = state.timeLeft < 20 ? '#ef4444' : '#573b2c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Timer
    ctx.textAlign = 'left';
    ctx.fillStyle = state.timeLeft < 20 ? '#fca5a5' : '#fde68a';
    ctx.font = 'bold 34px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(formatClock(state.timeLeft), 28, 48);

    // Wave badge
    const waveNames = ['LUNCH OPEN', 'DINNER RUSH', 'CHEF PEAK'];
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(28, 60, 106, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(waveNames[state.wave - 1] || 'DINNER RUSH', 37, 75);

    // Tips & Served count
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`$${state.tips}`, 278, 44);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`Served: ${state.dishesServed}  •  Perfect: ${state.perfectSeared}`, 278, 72);

    // Combo badge
    ctx.textAlign = 'left';
    if (state.combo > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`STREAK x${state.combo} ACTIVE!`, 28, 104);
    } else {
      ctx.fillStyle = '#a8a29e';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('WASD/Click • Space Interact • Shift Dash', 28, 104);
    }

    // Order Tickets along Stainless Rail (up to 4)
    const railX = 310;
    const cardW = 228;
    const gap = 12;
    for (let i = 0; i < state.tickets.length; i += 1) {
      const t = state.tickets[i];
      const x = railX + i * (cardW + gap);
      const y = 10;
      const pct = Math.max(0, t.patience / t.maxPatience);
      const urgent = pct < 0.28;

      ctx.fillStyle = urgent ? '#fef2f2' : '#fffdf7';
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, 106, 8);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#dc2626' : '#d6ccc2';
      ctx.lineWidth = urgent ? 2.5 : 1.5;
      ctx.stroke();

      // Top colored clip bar
      ctx.fillStyle = t.recipe.accent;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, 24, [8, 8, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`#${t.id} ${t.recipe.short.toUpperCase()}`, x + 10, y + 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`$${t.recipe.basePoints}`, x + cardW - 10, y + 16);

      // Visual recipe icons inside ticket
      const spacing = Math.min(48, (cardW - 24) / t.recipe.parts.length);
      const startX = x + (cardW - spacing * (t.recipe.parts.length - 1)) / 2;
      for (let pIdx = 0; pIdx < t.recipe.parts.length; pIdx += 1) {
        const part = t.recipe.parts[pIdx];
        const px = startX + pIdx * spacing;
        drawIngredientArt(ctx, part, px, y + 54, 0.72);
        ctx.fillStyle = '#44403c';
        ctx.font = 'bold 9px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const prepTag = part.endsWith('_chopped')
          ? 'CHOP'
          : part.endsWith('_seared')
            ? 'SEAR'
            : part.endsWith('_simmered')
              ? 'POT'
              : 'RAW';
        ctx.fillText(prepTag, px, y + 79);
      }

      // Patience bar at bottom of ticket
      const barColor = pct > 0.5 ? '#16a34a' : pct > 0.28 ? '#f59e0b' : '#dc2626';
      drawProgressBar(x + 10, y + 90, cardW - 20, 8, pct, barColor, '#e5e7eb');
    }
  }

  function drawRecipePocketCard() {
    // Compact bottom-right menu reference so players always see recipe combos
    const x = 1044;
    const y = 492;
    const w = 222;
    const h = 214;
    ctx.fillStyle = 'rgba(30, 22, 18, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = '#573b2c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f4b942';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KITCHEN MENU GUIDE', x + 12, y + 20);

    let ry = y + 36;
    for (const r of RECIPES) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(x + 8, ry - 11, w - 16, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.short, x + 14, ry);
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'right';
      ctx.fillText(`$${r.basePoints}`, x + w - 14, ry);

      // Tiny part icons row
      let ix = x + 26;
      for (const p of r.parts) {
        drawIngredientArt(ctx, p, ix, ry + 12, 0.44);
        ix += 28;
      }
      ry += 35;
    }
  }

  function drawParticlesAndPopups(state) {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = p.kind === 'steam' ? alpha * 0.55 : alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const pp of state.popups) {
      const alpha = Math.max(0, pp.life / pp.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 4;
      ctx.strokeText(pp.text, pp.x, pp.y);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawTitleOverlay(bestTips) {
    ctx.fillStyle = 'rgba(18, 12, 9, 0.72)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    const w = 660;
    const h = 420;
    const x = (WORLD.width - w) / 2;
    const y = (WORLD.height - h) / 2;

    ctx.fillStyle = '#1e1612';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = '#f4b942';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4b942';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('ARTISAN BISTRO RUSH', WORLD.width / 2, y + 48);

    ctx.fillStyle = '#fffaf3';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('SAFFRON & STEEL', WORLD.width / 2, y + 102);

    ctx.fillStyle = '#d6ccc2';
    ctx.font = '17px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(
      'Chop fresh produce, time golden skillet sears, plate dishes & ring the service bell.',
      WORLD.width / 2,
      y + 144,
    );

    // Showcase the 5 dish art medallions
    let sx = WORLD.width / 2 - 200;
    for (const r of RECIPES) {
      drawPlatedDish(ctx, r.id, r.parts, sx, y + 210, 0.95);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(r.short, sx, y + 245);
      sx += 100;
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(
      'Move: WASD / Arrows or Click Station  •  Chop/Interact: Space / E  •  Dash: Shift',
      WORLD.width / 2,
      y + 292,
    );
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`Best Shift Tips: $${bestTips}`, WORLD.width / 2, y + 324);

    // Start Button
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(WORLD.width / 2 - 175, y + 346, 350, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO COOK', WORLD.width / 2, y + 376);
  }

  function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(18, 12, 9, 0.68)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = '#1e1612';
    ctx.beginPath();
    ctx.roundRect(WORLD.width / 2 - 220, WORLD.height / 2 - 90, 440, 180, 14);
    ctx.fill();
    ctx.strokeStyle = '#f4b942';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText('SERVICE PAUSED', WORLD.width / 2, WORLD.height / 2 - 16);
    ctx.fillStyle = '#f4b942';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Press P or Space to resume kitchen rush', WORLD.width / 2, WORLD.height / 2 + 34);
  }

  function drawShiftSummary(state, bestTips) {
    ctx.fillStyle = 'rgba(18, 12, 9, 0.78)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    const w = 620;
    const h = 420;
    const x = (WORLD.width - w) / 2;
    const y = (WORLD.height - h) / 2;

    ctx.fillStyle = '#1e1612';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = '#f4b942';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4b942';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('DINNER SERVICE COMPLETE', WORLD.width / 2, y + 46);

    ctx.fillStyle = '#fffaf3';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText('SHIFT SCORECARD', WORLD.width / 2, y + 92);

    const stars = state.tips >= 550 ? 3 : state.tips >= 280 ? 2 : 1;
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), WORLD.width / 2, y + 138);

    const stats = [
      ['TOTAL TIPS EARNED', `$${state.tips}`, '#4ade80'],
      ['DISHES SERVED', `${state.dishesServed}`, '#fffaf3'],
      ['GOLD PERFECT SEARS', `${state.perfectSeared}`, '#facc15'],
      ['MAX STREAK COMBO', `x${Math.max(1, state.maxCombo)}`, '#38bdf8'],
      ['RECORD SHIFT TIPS', `$${Math.max(bestTips, state.tips)}`, '#f4b942'],
    ];

    let sy = y + 178;
    for (const [label, val, col] of stats) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(x + 60, sy - 20, w - 120, 30, 6);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d6ccc2';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(label, x + 78, sy);
      ctx.textAlign = 'right';
      ctx.fillStyle = col;
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(val, x + w - 78, sy);
      sy += 36;
    }

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(WORLD.width / 2 - 185, y + 356, 370, 44, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', WORLD.width / 2, y + 383);
  }

  function draw(state, screen, bestTips, nearStation) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.bgDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawTileFloor();
    drawKitchenFurniture();
    drawOrderBoardAndHud(state);
    drawRecipePocketCard();
    drawStations(state, screen === SCR_PLAY ? nearStation?.id : null);
    drawChefCharacter(ctx, state.chef);
    drawParticlesAndPopups(state);

    if (screen === SCR_TITLE) drawTitleOverlay(bestTips);
    else if (screen === SCR_PAUSED) drawPauseOverlay();
    else if (screen === SCR_OVER) drawShiftSummary(state, bestTips);
  }

  resize();
  window.addEventListener('resize', resize);
  return {
    draw,
    getViewTransform: () => view,
  };
}
