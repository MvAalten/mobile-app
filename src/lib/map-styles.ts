import type { Terrain } from '@/lib/hex-map';

export type MapStyle = {
  id: string;
  name: string;
  blurb: string;
  /** Background of the whole map. */
  background: string;
  /** Face colour per terrain. */
  palette: Record<Terrain, string>;
  /** Extrusion height in px per terrain (0 = flat). */
  depth: Record<Terrain, number>;
  /** Outline colour/width of the top face. */
  stroke: string;
  strokeWidth: number;
  /** Icon + label colours. */
  ink: string;
  /** Light/dark edge highlights on the top face for a bevelled look. */
  bevel: boolean;
  /** Soft drop shadow under raised tiles. */
  shadow: boolean;
  /** Fill opacity of the top face (watercolour look uses < 1). */
  faceOpacity: number;
  /** Whether to draw terrain icons above the label. */
  icons: boolean;
};

const flat = (n: number): Record<Terrain, number> => ({
  Ocean: n, Mountain: n, Settlement: n, Castle: n, Forest: n, Plains: n, Desert: n, Swamp: n,
});

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'tsr',
    name: 'Classic TSR Parchment',
    blurb: '1980s boxed-set look: flat muted hexes, brown ink, hand-drawn icons.',
    background: '#e9d9ae',
    palette: {
      Ocean: '#a9c4c9', Mountain: '#b9ab94', Settlement: '#d9b36a', Castle: '#c58f78',
      Forest: '#8fae78', Plains: '#d7d38f', Desert: '#e8cf8e', Swamp: '#93a58a',
    },
    depth: flat(0),
    stroke: '#5a3e22',
    strokeWidth: 2,
    ink: '#4a3219',
    bevel: false,
    shadow: false,
    faceOpacity: 1,
    icons: true,
  },
  {
    id: 'relief',
    name: 'Isometric Relief',
    blurb: 'Raised hex prisms: mountains and castles tower, oceans sit low.',
    background: '#14171f',
    palette: {
      Ocean: '#3f7fc4', Mountain: '#9a9aa6', Settlement: '#e0a94a', Castle: '#a45fc4',
      Forest: '#2f8f5a', Plains: '#9dcb3a', Desert: '#ecce78', Swamp: '#6c8450',
    },
    depth: { Ocean: 2, Mountain: 13, Settlement: 7, Castle: 16, Forest: 8, Plains: 5, Desert: 5, Swamp: 3 },
    stroke: '#00000066',
    strokeWidth: 1,
    ink: '#ffffff',
    bevel: true,
    shadow: true,
    faceOpacity: 1,
    icons: true,
  },
  {
    id: 'slab',
    name: 'Dungeon Stone Slabs',
    blurb: 'Thick carved stone blocks, tinted by terrain, lit by torchlight.',
    background: '#0f0d0c',
    palette: {
      Ocean: '#52707d', Mountain: '#7c7873', Settlement: '#9a7b52', Castle: '#80607e',
      Forest: '#566b4e', Plains: '#82865a', Desert: '#9b8a62', Swamp: '#59604a',
    },
    depth: flat(16),
    stroke: '#1a1715',
    strokeWidth: 1.5,
    ink: '#efe6d2',
    bevel: true,
    shadow: true,
    faceOpacity: 1,
    icons: true,
  },
  {
    id: 'board',
    name: 'Wooden Board-Game Tiles',
    blurb: 'Chunky glossy tiles on a wood table, like a classic hex strategy game.',
    background: '#6b4a2b',
    palette: {
      Ocean: '#3e8fd0', Mountain: '#a3a3ac', Settlement: '#e8a23a', Castle: '#b0559e',
      Forest: '#2f9a55', Plains: '#a9d43f', Desert: '#f0d27a', Swamp: '#789a52',
    },
    depth: flat(11),
    stroke: '#00000040',
    strokeWidth: 1,
    ink: '#ffffff',
    bevel: true,
    shadow: true,
    faceOpacity: 1,
    icons: true,
  },
  {
    id: 'greyhawk',
    name: 'Ink & Watercolour Greyhawk',
    blurb: 'Pale watercolour washes with bold black ink lines on cream paper.',
    background: '#f6efdc',
    palette: {
      Ocean: '#7fb0d6', Mountain: '#b0a79b', Settlement: '#e6b56a', Castle: '#c98fb4',
      Forest: '#6fae78', Plains: '#cfdc85', Desert: '#f0d896', Swamp: '#97ad86',
    },
    depth: flat(0),
    stroke: '#1d1d1d',
    strokeWidth: 2.2,
    ink: '#1d1d1d',
    bevel: false,
    shadow: false,
    faceOpacity: 0.85,
    icons: true,
  },
];

export const DEFAULT_STYLE_ID = 'relief';

export function getStyle(id: string | undefined): MapStyle {
  return MAP_STYLES.find((s) => s.id === id) ?? MAP_STYLES.find((s) => s.id === DEFAULT_STYLE_ID)!;
}

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const mix = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
