// Kitchen dimensions, station layout, chef physics, timing curves, and bistro color palette.

export const WORLD = {
  width: 1280,
  height: 720,
  step: 1 / 60,
  shiftSeconds: 150,
  maxTickets: 4,
};

export const CHEF_CFG = {
  radius: 22,
  speed: 360,
  dashSpeed: 780,
  dashDuration: 0.16,
  dashCooldown: 0.65,
  interactRadius: 102,
};

export const TIMING = {
  chopHitsNeeded: 4,
  chopCooldown: 0.14,
  searCookSeconds: 3.4,
  searPerfectEnd: 5.4,
  searBurnSeconds: 7.4,
  simmerCookSeconds: 3.6,
  simmerBurnSeconds: 9.0,
  ticketBasePatience: 46,
  ticketMinPatience: 28,
  comboWindowSeconds: 14,
};

export const PALETTE = {
  bgDark: '#1b130f',
  floorA: '#eadbc8',
  floorB: '#dfd0ba',
  grout: '#cbb89e',
  headerBg: '#1e1612',
  headerBorder: '#3b2b22',
  woodCounter: '#7b4b2a',
  woodHighlight: '#99623b',
  marbleCounter: '#f5efe6',
  marbleVein: '#ded4c6',
  steel: '#4b5563',
  steelLight: '#9ca3af',
  copper: '#c86432',
  copperBright: '#eb8c54',
  gold: '#f4b942',
  flame: '#ff6b2b',
  urgent: '#dc2626',
  ready: '#16a34a',
  ink: '#1f1916',
  muted: '#6b5e54',
  cream: '#fffaf3',
};

// Interactive station layout in 1280x720 world coordinates
export const STATIONS = [
  // Left cold pantry crates
  { id: 'crate_tomato', kind: 'crate', item: 'tomato', label: 'Tomato', x: 74, y: 215, w: 96, h: 72, key: '1' },
  { id: 'crate_mushroom', kind: 'crate', item: 'mushroom', label: 'Mushroom', x: 74, y: 300, w: 96, h: 72, key: '2' },
  { id: 'crate_steak', kind: 'crate', item: 'steak', label: 'Steak', x: 74, y: 385, w: 96, h: 72, key: '3' },
  { id: 'crate_salmon', kind: 'crate', item: 'salmon', label: 'Salmon', x: 74, y: 470, w: 96, h: 72, key: '4' },
  { id: 'crate_rice', kind: 'crate', item: 'rice', label: 'Saffron Rice', x: 74, y: 555, w: 96, h: 72, key: '5' },
  { id: 'crate_bun', kind: 'crate', item: 'bun', label: 'Brioche Bun', x: 74, y: 640, w: 96, h: 72, key: '6' },

  // Top hot line (stoves & simmering pot)
  { id: 'skillet_1', kind: 'skillet', label: 'Skillet 1', x: 380, y: 210, w: 120, h: 86 },
  { id: 'skillet_2', kind: 'skillet', label: 'Skillet 2', x: 540, y: 210, w: 120, h: 86 },
  { id: 'pot_1', kind: 'pot', label: 'Broth Pot', x: 710, y: 210, w: 120, h: 86 },
  { id: 'pass_warm', kind: 'counter', label: 'Spice Pass', x: 870, y: 210, w: 112, h: 86 },

  // Central marble island: chopping & plating
  { id: 'board_1', kind: 'board', label: 'Prep Board 1', x: 350, y: 515, w: 118, h: 84 },
  { id: 'board_2', kind: 'board', label: 'Prep Board 2', x: 500, y: 515, w: 118, h: 84 },
  { id: 'plate_1', kind: 'plate', label: 'Plate Station 1', x: 660, y: 515, w: 128, h: 84 },
  { id: 'plate_2', kind: 'plate', label: 'Plate Station 2', x: 816, y: 515, w: 128, h: 84 },
  { id: 'trash_1', kind: 'trash', label: 'Compost', x: 966, y: 515, w: 84, h: 84 },

  // Right service pass & bell
  { id: 'serve_pass', kind: 'serve', label: 'SERVE WINDOW', x: 1174, y: 365, w: 114, h: 164 },
];

export const BEST_STORAGE_KEY = 'saffron-steel.best.v1';
