// ============================================================
//  BombTimer.tsx — نمایشِ بمبِ فتیله‌دار برای حالت بمب.
//  فتیله با نزدیک‌شدن به انفجار کوتاه و قرمز می‌شود؛ عددِ ثانیه
//  روی بمب می‌آید. زمان از deadlineِ سرور می‌آید (server-authoritative).
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, font } from '../theme';
import { toFa } from '../lib/fa';
import { useCountdown } from '../lib/useCountdown';

interface Props {
  endsAtMs: number;
  totalSec: number;
  onExpire: () => void;
  paused?: boolean;
}

export default function BombTimer({
  endsAtMs,
  totalSec,
  onExpire,
  paused = false,
}: Props) {
  const remainingMs = useCountdown(endsAtMs, paused, onExpire);
  const ratio = Math.max(0, Math.min(1, remainingMs / (totalSec * 1000)));
  const seconds = Math.ceil(remainingMs / 1000);
  const tense = ratio <= 0.4;

  // تپشِ بمب وقتی فتیله کوتاه است
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    pulse.value = tense
      ? withRepeat(withTiming(1.08, { duration: 260 }), -1, true)
      : withTiming(1, { duration: 200 });
  }, [tense, pulse]);
  const bombStyle = useAnimatedStyle(() => ({
    transform: [{ scale: paused ? 1 : pulse.value }],
  }));

  const fuseHeight = 30 * ratio;
  const fuseColor = ratio > 0.4 ? '#5b4632' : colors.fuse;

  return (
    <View style={styles.wrap}>
      {/* فتیله */}
      <View
        style={[styles.fuse, { height: fuseHeight, backgroundColor: fuseColor }]}
      />
      <Animated.View
        style={[
          styles.bomb,
          bombStyle,
          tense && { borderColor: colors.wrong },
        ]}
      >
        <Text style={styles.num}>{toFa(seconds)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end', height: 140 },
  fuse: { width: 5, borderRadius: 3, marginBottom: 2 },
  bomb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#161616',
    borderWidth: 3,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    color: colors.amber,
    fontFamily: font.family.black,
    fontSize: font.size.timer,
  },
});
