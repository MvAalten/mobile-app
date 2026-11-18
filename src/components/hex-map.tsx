import type { Ref } from 'react';
import { ScrollView } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { HexTile, Terrain } from '@/lib/hex-map';
import { shade, type MapStyle } from '@/lib/map-styles';

const SIZE = 34; // hex radius (center to corner)
const HEX_W = Math.sqrt(3) * SIZE;
const HEX_H = 2 * SIZE;
const PAD = 8;

/** Pointy-top hexagon corners, starting at upper right, clockwise. */
function corners(cx: number, cy: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return [cx + SIZE * Math.cos(a), cy + SIZE * Math.sin(a)];
  });
}

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/** Small ink glyph for a terrain, centred on (x, y). */
function Icon({ terrain, x, y, color }: { terrain: Terrain; x: number; y: number; color: string }) {
  const p = { stroke: color, strokeWidth: 1.4, fill: 'none', strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  switch (terrain) {
    case 'Mountain':
      return (
        <G transform={`translate(${x},${y})`}>
          <Polyline points="-12,6 -4,-7 2,1 6,-4 13,6" {...p} />
          <Polyline points="-4,-7 -1,-1 -6,-2" {...p} />
        </G>
      );
    case 'Forest':
      return (
        <G transform={`translate(${x},${y})`}>
          <Polygon points="-7,5 -2,-7 3,5" {...p} />
          <Polygon points="1,6 6,-4 11,6" {...p} />
          <Path d="M-2 5 l0 3 M6 6 l0 3" {...p} />
        </G>
      );
    case 'Ocean':
      return (
        <G transform={`translate(${x},${y})`}>
          <Path d="M-12 -2 q3 -5 6 0 t6 0 t6 0 t6 0" {...p} />
          <Path d="M-9 5 q3 -5 6 0 t6 0 t6 0" {...p} />
        </G>
      );
    case 'Plains':
      return (
        <G transform={`translate(${x},${y})`}>
          <Path d="M-10 6 l2 -6 M-6 6 l0 -8 M-2 6 l-2 -6 M4 6 l2 -6 M8 6 l0 -8 M12 6 l-2 -6" {...p} />
        </G>
      );
    case 'Desert':
      return (
        <G transform={`translate(${x},${y})`}>
          <Path d="M-13 6 q6 -12 12 0 q4 -7 12 0" {...p} />
          <Circle cx={9} cy={-6} r={2.5} {...p} />
        </G>
      );
    case 'Swamp':
      return (
        <G transform={`translate(${x},${y})`}>
          <Path d="M-9 6 l0 -10 M-4 6 l0 -7 M3 6 l0 -10 M8 6 l0 -6" {...p} />
          <Path d="M-13 7 h26" {...p} />
        </G>
      );
    case 'Settlement':
      return (
        <G transform={`translate(${x},${y})`}>
          <Polyline points="-9,6 -9,-2 0,-9 9,-2 9,6 -9,6" {...p} />
          <Polyline points="-2,6 -2,0 3,0 3,6" {...p} />
        </G>
      );
    case 'Castle':
      return (
        <G transform={`translate(${x},${y})`}>
          <Polyline points="-9,7 -9,-5 -6,-5 -6,-8 -3,-8 -3,-5 3,-5 3,-8 6,-8 6,-5 9,-5 9,7 -9,7" {...p} />
          <Path d="M-2 7 l0 -5 a2 2 0 0 1 4 0 l0 5" {...p} />
        </G>
      );
  }
}

type Props = {
  tiles: HexTile[];
  cols: number;
  rows: number;
  style: MapStyle;
  svgRef?: Ref<Svg>;
};

export function HexMap({ tiles, cols, rows, style, svgRef }: Props) {
  const maxDepth = Math.max(...Object.values(style.depth));
  const width = HEX_W * cols + HEX_W / 2 + PAD * 2;
  const height = HEX_H * 0.75 * (rows - 1) + HEX_H + maxDepth + PAD * 2;

  return (
    <ScrollView horizontal>
      <Svg ref={svgRef} width={width} height={height}>
        <Rect width={width} height={height} fill={style.background} />
        {/* Paint top rows first so lower, taller tiles overlap the ones behind them. */}
        {tiles.map(({ col, row, terrain }) => {
          const base = style.palette[terrain];
          const h = style.depth[terrain];
          const cx = PAD + HEX_W * col + (row % 2 ? HEX_W : HEX_W / 2);
          const baseY = PAD + HEX_H * 0.75 * row + SIZE + maxDepth;
          const cy = baseY - h;
          const top = corners(cx, cy);
          const [, br, bottom, bl] = top;

          return (
            <G key={`${col}-${row}`}>
              {style.shadow && h > 0 && (
                <Polygon points={pts(corners(cx + 4, baseY + 5))} fill="#000" opacity={0.28} />
              )}
              {h > 0 && (
                <>
                  <Polygon
                    points={pts([bl, bottom, [bottom[0], bottom[1] + h], [bl[0], bl[1] + h]])}
                    fill={shade(base, -0.38)}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeLinejoin="round"
                  />
                  <Polygon
                    points={pts([bottom, br, [br[0], br[1] + h], [bottom[0], bottom[1] + h]])}
                    fill={shade(base, -0.55)}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeLinejoin="round"
                  />
                </>
              )}
              <Polygon
                points={pts(top)}
                fill={base}
                fillOpacity={style.faceOpacity}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeLinejoin="round"
              />
              {style.bevel && (
                <>
                  <Polyline
                    points={pts([top[3], top[4], top[5], top[0]])}
                    fill="none"
                    stroke={shade(base, 0.55)}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                  <Polyline
                    points={pts([top[0], top[1], top[2], top[3]])}
                    fill="none"
                    stroke={shade(base, -0.4)}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                </>
              )}
              {style.icons && <Icon terrain={terrain} x={cx} y={cy - 5} color={style.ink} />}
              <SvgText
                x={cx}
                y={cy + 20}
                fontSize={9.5}
                fontWeight="700"
                fill={style.ink}
                textAnchor="middle">
                {terrain}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}
