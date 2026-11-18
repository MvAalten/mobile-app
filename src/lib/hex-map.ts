export const TERRAINS = [
  'Ocean',
  'Mountain',
  'Settlement',
  'Castle',
  'Forest',
  'Plains',
  'Desert',
  'Swamp',
] as const;

export type Terrain = (typeof TERRAINS)[number];

/** Terrains that grow into regions. Settlements and castles are scattered separately. */
export const CLUSTER_TERRAINS: Terrain[] = ['Ocean', 'Mountain', 'Forest', 'Plains', 'Desert', 'Swamp'];
export const FEATURE_TERRAINS = ['Settlement', 'Castle'] as const;

/** How common each terrain is, 0 (never) to MAX_WEIGHT (very common). */
export type Weights = Record<Terrain, number>;

export const MAX_WEIGHT = 5;

export const DEFAULT_WEIGHTS: Weights = {
  Ocean: 2,
  Mountain: 2,
  Settlement: 2,
  Castle: 1,
  Forest: 3,
  Plains: 3,
  Desert: 1,
  Swamp: 1,
};

export const TERRAIN_COLORS: Record<Terrain, string> = {
  Ocean: '#4A90D9',
  Mountain: '#8E8E93',
  Settlement: '#D9A441',
  Castle: '#9B59B6',
  Forest: '#2E8B57',
  Plains: '#9ACD32',
  Desert: '#E8C872',
  Swamp: '#6B7F4E',
};

export type HexTile = { col: number; row: number; terrain: Terrain };

/** Small seeded PRNG so the same seed always gives the same map. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Neighbour offsets for "odd-r" hex layout (odd rows are shifted right). */
function neighbours(col: number, row: number, cols: number, rows: number): number[] {
  const offsets =
    row % 2
      ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
      : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
  const result: number[] = [];
  for (const [dc, dr] of offsets) {
    const c = col + dc;
    const r = row + dr;
    if (c >= 0 && c < cols && r >= 0 && r < rows) result.push(r * cols + c);
  }
  return result;
}

/**
 * Clustered map: scatter a few seed tiles per terrain (more seeds for higher
 * weights), then grow every region outward at random until the grid is full.
 */
export const MAX_CLUSTER = 5;
export const DEFAULT_CLUSTER = 3;

/** Share of tiles that start as a region seed per clustering level (0 = scattered, 5 = huge regions). */
const SEED_SHARE = [0.6, 0.35, 0.2, 0.12, 0.07, 0.03];

export function generateMap(
  cols: number,
  rows: number,
  weights: Weights,
  seed: number,
  cluster: number = DEFAULT_CLUSTER,
): HexTile[] {
  const rand = mulberry32(seed);
  const count = cols * rows;
  const pool = CLUSTER_TERRAINS.filter((t) => weights[t] > 0);
  const total = pool.reduce((sum, t) => sum + weights[t], 0);
  const grid: (Terrain | null)[] = new Array(count).fill(null);

  if (total === 0) {
    grid.fill('Plains');
  } else {
    const frontier: number[] = [];
    const seedBudget = Math.max(pool.length, Math.round(count * SEED_SHARE[Math.min(MAX_CLUSTER, Math.max(0, cluster))]));
    for (const terrain of pool) {
      const seeds = Math.max(1, Math.round((weights[terrain] / total) * seedBudget));
      for (let i = 0; i < seeds; i++) {
        const idx = Math.floor(rand() * count);
        if (grid[idx] === null) {
          grid[idx] = terrain;
          frontier.push(idx);
        }
      }
    }

    // Grow regions: pick a random filled tile and let it claim a free neighbour.
    while (frontier.length > 0) {
      const f = Math.floor(rand() * frontier.length);
      const idx = frontier[f];
      const free = neighbours(idx % cols, Math.floor(idx / cols), cols, rows).filter((n) => grid[n] === null);
      if (free.length === 0) {
        frontier[f] = frontier[frontier.length - 1];
        frontier.pop();
        continue;
      }
      const target = free[Math.floor(rand() * free.length)];
      grid[target] = grid[idx];
      frontier.push(target);
    }
  }

  // Scattered features: single tiles, never part of a cluster, never touching one another.
  const shuffled = (candidates: number[]) => {
    const list = [...candidates];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const place = (feature: Terrain, wanted: number, canReplace: (t: Terrain | null) => boolean) => {
    let placed = 0;
    for (const idx of shuffled(grid.map((_, i) => i))) {
      if (placed >= wanted) break;
      if (!canReplace(grid[idx])) continue;
      const touching = neighbours(idx % cols, Math.floor(idx / cols), cols, rows).some((n) => grid[n] === feature);
      if (touching) continue;
      grid[idx] = feature;
      placed++;
    }
  };
  const perUnit = (divisor: number) => Math.max(1, Math.round(count / divisor));
  place('Castle', weights.Castle * perUnit(60), (t) => t === 'Mountain');
  place('Settlement', weights.Settlement * perUnit(30), (t) => t !== null && t !== 'Ocean' && t !== 'Castle');

  return grid.map((terrain, i) => ({
    col: i % cols,
    row: Math.floor(i / cols),
    terrain: terrain ?? 'Plains',
  }));
}
