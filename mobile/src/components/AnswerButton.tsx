// ============================================================
//  AnswerButton.tsx — دکمهٔ گزینهٔ چرمیِ برجسته
//  افکتِ «۵px برجسته» + حالت‌های درست/غلط از ماک‌آپ HTML.
//  وابستگی: react-native-reanimated, expo-linear-gradient
// ============================================================

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, font } from '../theme';
import { toFa } from '../lib/fa';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'dim';

interface Props {
  index: number; // ۱..۴ (برای نشان شماره)
  label: string;
  state?: AnswerState;
  disabled?: boolean;
  onPress?: () => void;
}

export default function AnswerButton({
  index,
  label,
  state = 'idle',
  disabled,
  onPress,
}: Props) {
  const tx = useSharedValue(0);
  const sy = useSharedValue(1);
  const press = useSharedValue(0);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: press.value },
      { scale: sy.value },
    ],
  }));

  // وقتی state عوض شد، انیمیشن مناسب را بزن
  React.useEffect(() => {
    if (state === 'wrong') {
      tx.value = withSequence(
        withTiming(-7, { duration: 60 }),
        withTiming(7, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(5, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else if (state === 'correct') {
      sy.value = withSequence(
        withTiming(1.04, { duration: 140 }),
        withTiming(1, { duration: 200 }),
      );
    }
  }, [state, tx, sy]);

  const grad: readonly [string, string] =
    state === 'correct'
      ? [colors.correct, '#1F9F4D']
      : state === 'wrong'
        ? [colors.wrong, '#C52826']
        : [colors.pitchBtn, colors.pitchBtnLow];

  const shColor =
    state === 'correct'
      ? '#127A37'
      : state === 'wrong'
        ? '#8C1816'
        : colors.pitchBtnSh;

  return (
    <Pressable
      disabled={disabled || state === 'dim'}
      onPressIn={() => {
        press.value = withTiming(4, { duration: 80 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 80 });
      }}
      onPress={onPress}
    >
      {/* لایهٔ سایهٔ زیرین = برجستگیِ چرمی */}
      <View style={[styles.shadowLayer, { backgroundColor: shColor }]} />
      <Animated.View style={[aStyle, { opacity: state === 'dim' ? 0.3 : 1 }]}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.btn}
        >
          <View style={styles.num}>
            <Text style={styles.numTxt}>{toFa(index)}</Text>
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {(state === 'correct' || state === 'wrong') && (
            <Text style={styles.tick}>{state === 'correct' ? '✓' : '✗'}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    bottom: -1,
    borderRadius: radius.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTxt: { color: colors.amber, fontFamily: font.family.black, fontSize: 12 },
  label: {
    flex: 1,
    color: '#fff',
    fontFamily: font.family.bold,
    fontSize: font.size.label,
    textAlign: 'right',
  },
  tick: { color: '#fff', fontFamily: font.family.black, fontSize: 16 },
});
