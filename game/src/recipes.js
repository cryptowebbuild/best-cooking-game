// Original culinary ingredients, processing stages, and signature recipes.

export const INGREDIENTS = {
  tomato: { name: 'Tomato', short: 'TOM', color: '#e63946', prep: 'chop' },
  mushroom: { name: 'Mushroom', short: 'MSH', color: '#8d6e63', prep: 'chop' },
  steak: { name: 'Prime Steak', short: 'STK', color: '#9e2a2b', prep: 'sear' },
  salmon: { name: 'Salmon Fillet', short: 'SLM', color: '#ff7b54', prep: 'sear' },
  rice: { name: 'Saffron Rice', short: 'RIC', color: '#f4b942', prep: 'simmer' },
  bun: { name: 'Brioche Bun', short: 'BUN', color: '#e09f3e', prep: 'none' },
};

// States an ingredient can transition through:
// raw -> chopped (on board), seared / perfect / burnt (on skillet), simmered (in broth pot)
export function transformIngredient(itemId, stationKind) {
  const def = INGREDIENTS[itemId];
  if (!def) return null;
  if (stationKind === 'board' && def.prep === 'chop') return `${itemId}_chopped`;
  if (stationKind === 'skillet' && def.prep === 'sear') return `${itemId}_seared`;
  if (stationKind === 'pot' && def.prep === 'simmer') return `${itemId}_simmered`;
  return null;
}

export function isReadyPart(partId) {
  if (!partId) return false;
  if (partId === 'bun') return true;
  return partId.endsWith('_chopped') || partId.endsWith('_seared') || partId.endsWith('_simmered');
}

export function partBaseItem(partId) {
  return partId.replace(/_(chopped|seared|simmered|burnt)$/, '');
}

export const RECIPES = [
  {
    id: 'bistro_burger',
    name: 'Bistro Smash Burger',
    short: 'Burger',
    parts: ['bun', 'steak_seared', 'tomato_chopped'],
    basePoints: 110,
    tier: 1,
    accent: '#d97706',
  },
  {
    id: 'truffle_steak',
    name: 'Truffle Char Steak',
    short: 'Truffle Steak',
    parts: ['steak_seared', 'mushroom_chopped'],
    basePoints: 95,
    tier: 1,
    accent: '#991b1b',
  },
  {
    id: 'wild_risotto',
    name: 'Saffron Mushroom Risotto',
    short: 'Risotto',
    parts: ['rice_simmered', 'mushroom_chopped'],
    basePoints: 100,
    tier: 1,
    accent: '#ca8a04',
  },
  {
    id: 'saffron_salmon',
    name: 'Saffron Salmon Bowl',
    short: 'Salmon Bowl',
    parts: ['salmon_seared', 'rice_simmered', 'tomato_chopped'],
    basePoints: 140,
    tier: 2,
    accent: '#ea580c',
  },
  {
    id: 'royal_feast',
    name: 'Chef Surf & Turf',
    short: 'Surf & Turf',
    parts: ['steak_seared', 'salmon_seared', 'rice_simmered', 'mushroom_chopped'],
    basePoints: 195,
    tier: 3,
    accent: '#7c2d12',
  },
];

export function matchCompleteRecipe(partsList) {
  if (!partsList || partsList.length === 0) return null;
  const sortedA = [...partsList].sort().join('|');
  for (const r of RECIPES) {
    const sortedB = [...r.parts].sort().join('|');
    if (sortedA === sortedB) return r;
  }
  return null;
}

export function canAcceptOnPlate(existingParts, newPart) {
  if (!isReadyPart(newPart)) return false;
  if (existingParts.includes(newPart)) return false;
  const candidate = [...existingParts, newPart];
  return RECIPES.some((r) => candidate.every((p) => r.parts.includes(p)));
}

export function matchingPartialRecipes(partsList) {
  if (!partsList || partsList.length === 0) return [];
  return RECIPES.filter((r) => partsList.every((p) => r.parts.includes(p)));
}
