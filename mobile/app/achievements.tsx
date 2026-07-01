// ============================================================
//  achievements.tsx — فهرست اچیومنت‌ها با پیشرفت و وضعیت.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, font } from '../src/theme';
import { toFa } from '../src/lib/fa';
import { getAchievements, type Achievement } from '../src/api/progress';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const q = useQuery({ queryKey: ['achievements'], queryFn: getAchievements });

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.back}>‹ خانه</Text>
        </Pressable>
        <Text style={styles.title}>اچیومنت‌ها</Text>
        <View style={{ width: 48 }} />
      </View>

      {q.isLoading && (
        <ActivityIndicator color={colors.amber} style={{ marginTop: spacing.xxxl }} />
      )}
      {q.isError && <Text style={styles.dim}>خطا در بارگذاری.</Text>}

      {q.data && (
        <FlatList
          data={q.data}
          keyExtractor={(a) => a.key}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          renderItem={({ item }) => <Row a={item} />}
        />
      )}
    </View>
  );
}

function Row({ a }: { a: Achievement }) {
  const pct = Math.min(100, Math.round((a.progress / a.threshold) * 100));
  const reward = `${a.reward.cards ? `⚡${toFa(a.reward.cards)} ` : ''}${
    a.reward.coins ? `🪙${toFa(a.reward.coins)}` : ''
  }`.trim();

  return (
    <View style={[styles.row, a.unlocked && styles.rowDone]}>
      <Text style={[styles.icon, !a.unlocked && styles.iconLocked]}>
        {a.icon}
      </Text>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>{a.title}</Text>
          {a.unlocked ? (
            <Text style={styles.done}>✓ باز شد</Text>
          ) : (
            <Text style={styles.reward}>{reward}</Text>
          )}
        </View>
        <Text style={styles.desc}>{a.description}</Text>
        {!a.unlocked && (
          <>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.prog}>
              {toFa(Math.min(a.progress, a.threshold))} / {toFa(a.threshold)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pitchDeep,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  back: { color: colors.amber, fontFamily: font.family.bold, fontSize: font.size.label },
  title: { color: colors.chalk, fontFamily: font.family.black, fontSize: font.size.h2 },
  dim: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowDone: { borderColor: colors.correct, backgroundColor: 'rgba(61,214,110,0.07)' },
  icon: { fontSize: 30 },
  iconLocked: { opacity: 0.4 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
    textAlign: 'right',
  },
  done: { color: colors.correct, fontFamily: font.family.bold, fontSize: font.size.caption },
  reward: { color: colors.amber, fontFamily: font.family.bold, fontSize: font.size.caption },
  desc: {
    color: colors.chalkDim,
    fontFamily: font.family.regular,
    fontSize: font.size.caption,
    textAlign: 'right',
    marginTop: 2,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassBorder,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.amber },
  prog: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.caption,
    textAlign: 'left',
    marginTop: 4,
  },
});
