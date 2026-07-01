// ============================================================
//  TimerRing.tsx — حلقهٔ تایمرِ اسکوربوردی (SVG)
//  ⚠️ منبعِ زمان، deadlineِ سرور است. این کامپوننت فقط «باقی‌مانده»
//  را نسبت به ساعتِ سنکرون‌شده نمایش می‌دهد؛ خودش تصمیم‌گیرندهٔ
//  پایان نیست — وقتی به صفر رسید onExpire را صدا می‌زند و سرور
//  در submitAnswer دیر/به‌موقع بودن را قطعی می‌کند.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, font } from '../theme';
import { toFa } from '../lib/fa';
import { useCountdown } from '../lib/useCountdown';

interface Props {
  /** لحظهٔ پایان بر حسب ساعتِ کلاینتِ سنکرون‌شده (ms epoch). */
  endsAtMs: number;
  /** کلِ مدتِ راند به ثانیه (برای محاسبهٔ نسبتِ حلقه). */
  totalSec: number;
  /** وقتی زمان به صفر رسید (یک‌بار). */
  onExpire: () => void;
  /** پس از قفل‌شدنِ پاسخ، تایمر متوقف می‌شود. */
  paused?: boolean;
  size?: number;
}

const RADIUS = 56;
const CIRC = 2 * Math.PI * RADIUS;

export default function TimerRing({
  endsAtMs,
  totalSec,
  onExpire,
  paused = false,
  size = 140,
}: Props) {
  const remainingMs = useCountdown(endsAtMs, paused, onExpire);
  const ratio = Math.max(0, Math.min(1, remainingMs / (totalSec * 1000)));
  const color =
    ratio > 0.5 ? colors.correct : ratio > 0.25 ? colors.amber : colors.wrong;
  const seconds = Math.ceil(remainingMs / 1000);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* شیارِ پس‌زمینه */}
        <Circle
          cx={center}
          cy={center}
          r={RADIUS}
          stroke={colors.glassBorder}
          strokeWidth={10}
          fill="none"
        />
        {/* پیشرفت — از بالا، ساعت‌گرد معکوس */}
        <Circle
          cx={center}
          cy={center}
          r={RADIUS}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - ratio)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.num, { color }]}>{toFa(seconds)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: font.family.black, fontSize: font.size.timer },
});
