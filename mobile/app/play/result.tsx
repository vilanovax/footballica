// ============================================================
//  play/result.tsx — نتیجهٔ مَچ
//  چیدمان از design-mockups/footbalika-round-result.html.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, font } from '../../src/theme';
import { toFa } from '../../src/lib/fa';
import { useMatch } from '../../src/store/useMatch';

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const summary = useMatch((s) => s.summary);
  const reset = useMatch((s) => s.reset);

  const score = summary?.score ?? 0;
  const total = summary?.totalRounds ?? 5;

  const goHome = () => {
    reset();
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.body}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>پایان مَچ!</Text>
        <Text style={styles.sub}>
          {toFa(total)} سؤال · امتیازِ نهایی
        </Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreNum}>{toFa(score)}</Text>
          <Text style={styles.scoreLabel}>امتیاز</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={goHome}>
          <View style={styles.ctaShadow} />
          <LinearGradient
            colors={[colors.amber, colors.amberDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaTxt}>بازی دوباره</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.ghost} onPress={goHome}>
          <Text style={styles.ghostTxt}>بازگشت به خانه</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pitchDeep,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  trophy: { fontSize: 72 },
  title: { color: colors.chalk, fontFamily: font.family.black, fontSize: font.size.h1 },
  sub: { color: colors.chalkDim, fontFamily: font.family.medium, fontSize: font.size.label },
  scoreCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  scoreNum: { color: colors.amber, fontFamily: font.family.black, fontSize: 56 },
  scoreLabel: { color: colors.chalkDim, fontFamily: font.family.medium, fontSize: font.size.label },
  actions: { gap: spacing.md },
  ctaShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    bottom: -2,
    borderRadius: radius.xl,
    backgroundColor: colors.amberShadow,
  },
  cta: {
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingVertical: 18,
  },
  ctaTxt: { color: colors.ink, fontFamily: font.family.black, fontSize: font.size.h2 },
  ghost: { alignItems: 'center', paddingVertical: spacing.md },
  ghostTxt: { color: colors.chalkDim, fontFamily: font.family.bold, fontSize: font.size.label },
});
