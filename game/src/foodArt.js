// Detailed culinary vector illustration helpers for ingredients, plated meals, kitchen tools, and chef.
import { partBaseItem } from './recipes.js';

export function drawIngredientArt(ctx, itemId, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (itemId && itemId.endsWith('_burnt')) {
    // Charred burnt lump
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(-5, -2, 6, 0, Math.PI * 2);
    ctx.arc(6, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, 6);
    ctx.moveTo(6, -6);
    ctx.lineTo(-6, 6);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const base = partBaseItem(itemId || '');
  const isChopped = itemId?.endsWith('_chopped');
  const isSeared = itemId?.endsWith('_seared');
  const isSimmered = itemId?.endsWith('_simmered');

  if (base === 'tomato') {
    if (isChopped) {
      // Two bright sliced tomato medallions with seed chambers
      for (const [ox, oy, r] of [[-7, 3, 10], [8, -2, 10]]) {
        ctx.fillStyle = '#c1121f';
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ox, oy, r - 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(ox - 2.5, oy - 2, 2.3, 0, Math.PI * 2);
        ctx.arc(ox + 2.5, oy + 2, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(0, 3, 15, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-5, -4, 4, 2.2, -0.5, 0, Math.PI * 2);
      ctx.fill();
      // Green stem calyx
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-1, -11);
      ctx.lineTo(1, -15);
      ctx.lineTo(3, -11);
      ctx.lineTo(7, -12);
      ctx.closePath();
      ctx.fill();
    }
  } else if (base === 'mushroom') {
    if (isChopped) {
      // Sliced mushroom caps + green parsley flecks
      for (const [ox, oy] of [[-8, 3], [6, -3]]) {
        ctx.fillStyle = '#d6ccc2';
        ctx.fillRect(ox - 3, oy, 6, 8);
        ctx.fillStyle = '#7f5539';
        ctx.beginPath();
        ctx.arc(ox, oy, 9, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 7, 3, 0, Math.PI * 2);
      ctx.arc(-9, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ede0d4';
      ctx.beginPath();
      ctx.roundRect(-5, 0, 10, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#7f5539';
      ctx.beginPath();
      ctx.ellipse(0, -1, 15, 10, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#9c6644';
      ctx.beginPath();
      ctx.ellipse(-3, -4, 8, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (base === 'steak') {
    ctx.fillStyle = isSeared ? '#5c2c16' : '#9e2a2b';
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 22, 9);
    ctx.fill();
    ctx.fillStyle = isSeared ? '#7c3f1d' : '#c1121f';
    ctx.beginPath();
    ctx.roundRect(-13, -8, 26, 17, 7);
    ctx.fill();
    if (isSeared) {
      // Grill char stripes + golden butter pat
      ctx.strokeStyle = '#2c1409';
      ctx.lineWidth = 2.5;
      for (const gx of [-7, 0, 7]) {
        ctx.beginPath();
        ctx.moveTo(gx - 3, -7);
        ctx.lineTo(gx + 3, 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-4, -4, 8, 6);
    } else {
      // Creamy beef marbling lines
      ctx.strokeStyle = '#f8edeb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.quadraticCurveTo(0, 2, 9, -4);
      ctx.moveTo(-6, 5);
      ctx.quadraticCurveTo(2, 1, 8, 6);
      ctx.stroke();
    }
  } else if (base === 'salmon') {
    ctx.fillStyle = isSeared ? '#ea580c' : '#ff7b54';
    ctx.beginPath();
    ctx.moveTo(-16, -7);
    ctx.quadraticCurveTo(0, -12, 16, -5);
    ctx.lineTo(13, 10);
    ctx.quadraticCurveTo(0, 12, -14, 8);
    ctx.closePath();
    ctx.fill();
    // Classic salmon fat stripes
    ctx.strokeStyle = isSeared ? '#fed7aa' : '#ffe5d9';
    ctx.lineWidth = 2;
    for (const sx of [-8, -1, 6]) {
      ctx.beginPath();
      ctx.moveTo(sx, -6);
      ctx.lineTo(sx - 2, 8);
      ctx.stroke();
    }
    if (isSeared) {
      // Charred crust glaze + lemon slice highlight
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.quadraticCurveTo(0, -11, 14, -5);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(10, 4, 5, 0, Math.PI);
      ctx.fill();
    }
  } else if (base === 'rice') {
    if (isSimmered) {
      // Ceramic bowl filled with creamy saffron risotto
      ctx.fillStyle = '#fff8ee';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI, false);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, -1, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden grain bowl / pouch
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(-13, -10, 26, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      for (const [rx, ry] of [[-5, -2], [3, -4], [-1, 3], [6, 2], [-6, 5]]) {
        ctx.beginPath();
        ctx.ellipse(rx, ry, 3, 1.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (base === 'bun') {
    // Glossy brioche bun with sesame seeds
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-15, 2, 30, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 11, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    for (const [sx, sy] of [[-6, -5], [0, -7], [6, -5], [-3, -2], [4, -2]]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 1.8, 1, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawPlatedDish(ctx, recipeId, partsList, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Gleaming porcelain dinner plate with gold inner ring
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 29, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffdf9';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5dccb';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#f4b942';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (recipeId === 'bistro_burger') {
    // Complete stacked gourmet burger with golden cheddar melt & crisp lettuce
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-15, 5, 30, 7, 3);
    ctx.fill();
    ctx.fillStyle = '#4c1d0d';
    ctx.beginPath();
    ctx.roundRect(-16, -2, 32, 8, 3);
    ctx.fill();
    // Melted cheddar cheese drip
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-15, -3);
    ctx.lineTo(15, -3);
    ctx.lineTo(12, 3);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-13, -6, 26, 3);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-15, -8, 30, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, -8, 16, 11, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-6, -15, 3, 1.5);
    ctx.fillRect(0, -16, 3, 1.5);
    ctx.fillRect(5, -13, 3, 1.5);
  } else if (recipeId === 'truffle_steak') {
    drawIngredientArt(ctx, 'steak_seared', -4, -1, 0.82);
    drawIngredientArt(ctx, 'mushroom_chopped', 10, 4, 0.7);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-10, -7, 4, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (recipeId === 'wild_risotto') {
    drawIngredientArt(ctx, 'rice_simmered', 0, 0, 0.96);
    drawIngredientArt(ctx, 'mushroom_chopped', 2, -4, 0.64);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-6, -6, 4.5, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (recipeId === 'saffron_salmon') {
    drawIngredientArt(ctx, 'rice_simmered', -5, 2, 0.8);
    drawIngredientArt(ctx, 'salmon_seared', 6, -3, 0.76);
    drawIngredientArt(ctx, 'tomato_chopped', 10, 5, 0.5);
  } else if (recipeId === 'royal_feast') {
    drawIngredientArt(ctx, 'rice_simmered', 0, 4, 0.78);
    drawIngredientArt(ctx, 'steak_seared', -9, -4, 0.66);
    drawIngredientArt(ctx, 'salmon_seared', 9, -4, 0.66);
    drawIngredientArt(ctx, 'mushroom_chopped', 0, -9, 0.54);
  } else if (partsList && partsList.length > 0) {
    // Mid-assembly dish: draw placed parts cleanly stacked with slight offsets
    const offsets = [
      [-6, 3],
      [7, -2],
      [-2, -6],
      [5, 5],
    ];
    for (let i = 0; i < partsList.length; i += 1) {
      const [ox, oy] = offsets[i % offsets.length];
      drawIngredientArt(ctx, partsList[i], ox, oy, 0.7);
    }
  }

  ctx.restore();
}

export function drawChefCharacter(ctx, chef) {
  ctx.save();
  ctx.translate(chef.x, chef.y);
  ctx.scale(1.26, 1.26);

  // Dash speed aura streaks
  if (chef.dashTimer > 0) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 2.5;
    for (const dy of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(-chef.facingX * 16, dy);
      ctx.lineTo(-chef.facingX * 36, dy);
      ctx.stroke();
    }
  }

  // Soft floor contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
  ctx.beginPath();
  ctx.ellipse(0, 21, 21, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = Math.sin(chef.walkPhase) * (Math.hypot(chef.vx, chef.vy) > 10 ? 2.5 : 0);

  // Chef shoulders & double-breasted crisp white coat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 5 + bob, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Warm terracotta bistro apron & brass buttons
  ctx.fillStyle = '#c86432';
  ctx.beginPath();
  ctx.roundRect(-12, 1 + bob, 24, 16, 6);
  ctx.fill();
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(-5, 6 + bob, 1.6, 0, Math.PI * 2);
  ctx.arc(5, 6 + bob, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Crimson bistro neckerchief
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(-9, 1 + bob);
  ctx.lineTo(0, 8 + bob);
  ctx.lineTo(9, 1 + bob);
  ctx.closePath();
  ctx.fill();

  // Expressive head + warm cheeks
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -6 + bob, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  const ex = chef.facingX * 4;
  const ey = chef.facingY * 2;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(-4 + ex, -6 + ey + bob, 2.2, 0, Math.PI * 2);
  ctx.arc(4 + ex, -6 + ey + bob, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Crisp tall pleated toque hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-12, -25 + bob, 24, 12, 5);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-6, -25 + bob, 6.5, Math.PI, 0);
  ctx.arc(0, -27 + bob, 7, Math.PI, 0);
  ctx.arc(6, -25 + bob, 6.5, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Chopping chef's blade gleam flash
  if (chef.chopAnim > 0) {
    ctx.save();
    ctx.translate(chef.facingX * 8, 8 + bob);
    ctx.rotate((chef.chopAnim / 0.16) * -0.95);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(22, -5);
    ctx.lineTo(24, 2);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-7, -3, 8, 5);
    ctx.restore();
  }

  // Carried item or full plated meal in hands
  if (chef.holding) {
    const hx = chef.facingX * 21;
    const hy = 13 + chef.facingY * 14 + bob;
    if (chef.holding.kind === 'plated') {
      drawPlatedDish(ctx, chef.holding.recipe.id, chef.holding.recipe.parts, hx, hy, 0.85);
    } else {
      drawIngredientArt(ctx, chef.holding.itemId, hx, hy, 0.92);
    }
  }

  ctx.restore();
}
