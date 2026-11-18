import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type Svg from 'react-native-svg';

import { HexMap } from '@/components/hex-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  DEFAULT_CLUSTER,
  DEFAULT_WEIGHTS,
  MAX_CLUSTER,
  MAX_WEIGHT,
  CLUSTER_TERRAINS,
  TERRAIN_COLORS,
  generateMap,
  type Terrain,
  type Weights,
} from '@/lib/hex-map';
import { MAP_STYLES, getStyle } from '@/lib/map-styles';

const COLS = 7;
const ROWS = 9;

function Stepper({
  label,
  value,
  onChange,
  color,
  max = MAX_WEIGHT,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  max?: number;
}) {
  const theme = useTheme();
  const btn = (text: string, next: number) => (
    <Pressable
      accessibilityLabel={`${text === '+' ? 'More' : 'Fewer'} ${label}`}
      onPress={() => onChange(Math.min(max, Math.max(0, next)))}
      style={[styles.stepBtn, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">{text}</ThemedText>
    </Pressable>
  );
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color ?? 'transparent' }]} />
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {btn('-', value - 1)}
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
      {btn('+', value + 1)}
    </View>
  );
}

export default function MapScreen() {
  const theme = useTheme();
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [cluster, setCluster] = useState(DEFAULT_CLUSTER);
  const params = useLocalSearchParams<{ style?: string; seed?: string }>();
  const [styleId, setStyleId] = useState(params.style);
  const mapStyle = getStyle(styleId);
  const [seed, setSeed] = useState(() => Number(params.seed) || Math.floor(Math.random() * 1e9));
  const svgRef = useRef<Svg>(null);
  const tiles = useMemo(() => generateMap(COLS, ROWS, weights, seed, cluster), [weights, seed, cluster]);

  const shareImage = () => {
    svgRef.current?.toDataURL(async (base64) => {
      try {
        const file = new File(Paths.cache, `hex-map-${seed}.png`);
        file.create({ overwrite: true });
        file.write(base64, { encoding: 'base64' });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: 'Save or share map' });
        } else {
          Alert.alert('Sharing is not available on this device');
        }
      } catch (e) {
        Alert.alert('Could not export the map', String(e));
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Map generator</ThemedText>
          <ThemedText themeColor="textSecondary">
            Set how common each terrain is (0 = never), then roll a new map.
          </ThemedText>

          <View style={[styles.panel, { backgroundColor: theme.backgroundElement }]}>
            {CLUSTER_TERRAINS.map((t) => (
              <Stepper key={t} label={t} color={TERRAIN_COLORS[t]} value={weights[t]} onChange={(v) => setWeights((w) => ({ ...w, [t]: v }))} />
            ))}
            <View style={styles.divider} />
            <Stepper label="Settlements (scattered)" color={TERRAIN_COLORS.Settlement} value={weights.Settlement} onChange={(v) => setWeights((w) => ({ ...w, Settlement: v }))} />
            <Stepper label="Castles (on mountains)" color={TERRAIN_COLORS.Castle} value={weights.Castle} onChange={(v) => setWeights((w) => ({ ...w, Castle: v }))} />
            <View style={styles.divider} />
            <Stepper label="Clustering (0 = scattered)" value={cluster} max={MAX_CLUSTER} onChange={setCluster} />
          </View>

          <Pressable style={styles.generate} onPress={() => setSeed(Math.floor(Math.random() * 1e9))}>
            <ThemedText type="smallBold" style={styles.generateText}>
              Generate new map
            </ThemedText>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {MAP_STYLES.map((st) => (
              <Pressable
                key={st.id}
                onPress={() => setStyleId(st.id)}
                style={[styles.chip, { backgroundColor: st.id === mapStyle.id ? '#3c87f7' : theme.backgroundSelected }]}>
                <ThemedText type="smallBold" style={st.id === mapStyle.id ? styles.generateText : undefined}>
                  {st.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <ThemedText type="small" themeColor="textSecondary">
            {mapStyle.blurb}
          </ThemedText>

          <HexMap tiles={tiles} cols={COLS} rows={ROWS} style={mapStyle} svgRef={svgRef} />

          {Platform.OS !== 'web' && (
            <Pressable style={[styles.generate, styles.secondary, { backgroundColor: theme.backgroundSelected }]} onPress={shareImage}>
              <ThemedText type="smallBold">Save / share as image</ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
  panel: { borderRadius: 16, padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  divider: { height: 1, backgroundColor: '#ffffff22', marginVertical: 4 },
  rowLabel: { flex: 1 },
  value: { width: 20, textAlign: 'center' },
  stepBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  generate: { backgroundColor: '#3c87f7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondary: { backgroundColor: undefined },
  generateText: { color: '#fff' },
});
