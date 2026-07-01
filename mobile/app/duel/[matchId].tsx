// ============================================================
//  duel/[matchId].tsx — صفحهٔ دوئل async
//  بازیکن لِگِ خودش را می‌زند؛ سپس نتیجه در برابرِ حریف (انسان/ربات).
//  تایمر از deadlineِ سرور؛ درستی سمت سرور.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font } from '../../src/theme';
import { toFa, toFaSigned } from '../../src/lib/fa';
import { useDuel } from '../../src/store/useDuel';
import AnswerButton, {
  type AnswerState,
} from '../../src/components/AnswerButton';
import TimerRing from '../../src/components/TimerRing';

const DIFF_FA: Record<string, string> = {
  EASY: 'آسان',
  MEDIUM: 'متوسط',
  HARD: 'سخت',
};

export default function DuelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const status = useDuel((s) => s.status);
  const round = useDuel((s) => s.round);
  const roundNumber = useDuel((s) => s.roundNumber);
  const totalRounds = useDuel((s) => s.totalRounds);
  const endsAtMs = useDuel((s) => s.endsAtMs);
  const myScore = useDuel((s) => s.myScore);
  const lastResult = useDuel((s) => s.lastResult);
  const result = useDuel((s) => s.result);
  const opponentName = useDuel((s) => s.opponentName);
  const begin = useDuel((s) => s.begin);
  const answer = useDuel((s) => s.answer);
  const next = useDuel((s) => s.next);
  const refresh = useDuel((s) => s.refresh);
  const reset = useDuel((s) => s.reset);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (matchId) void begin(matchId, 5);
    return () => reset();
  }, [matchId, begin, reset]);

  React.useEffect(() => {
    setSelectedId(null);
  }, [round?.roundId]);

  React.useEffect(() => {
    if (!lastResult) return;
    Haptics.notificationAsync(
      lastResult.isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => undefined);
  }, [lastResult]);

  // در حالتِ انتظارِ حریف، هر چند ثانیه وضعیت را چک کن
  React.useEffect(() => {
    if (status !== 'waiting') return;
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [status, refresh]);

  const onSelect = (optionId: string) => {
    if (status !== 'playing') return;
    setSelectedId(optionId);
    void answer(optionId);
  };

  const onExpire = React.useCallback(() => {
    if (useDuel.getState().status === 'playing') void answer(null);
  }, [answer]);

  // ---- نمای پایانی ----
  if (status === 'finished' && result) {
    const win = result.outcome === 'win';
    const draw = result.outcome === 'draw';
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.bigEmoji}>{win ? '🏆' : draw ? '🤝' : '💪'}</Text>
        <Text style={styles.outcome}>
          {win ? 'بردی!' : draw ? 'مساوی' : 'باختی'}
        </Text>
        <Text style={styles.vsScore}>
          {toFa(result.myScore)} — {toFa(result.oppScore)}
        </Text>
        <Text style={styles.oppName}>در برابرِ {opponentName ?? 'حریف'}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryTxt}>بازگشت به خانه</Text>
        </Pressable>
      </View>
    );
  }

  // ---- انتظارِ حریف (فقط در دوئلِ انسان‌با‌انسان پیش می‌آید) ----
  if (status === 'waiting') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.amber} size="large" />
        <Text style={styles.waitTxt}>لِگت را زدی! منتظرِ حریف…</Text>
        <Text style={styles.oppName}>امتیازِ تو: {toFa(myScore)}</Text>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/')}>
          <Text style={styles.ghostTxt}>بعداً نتیجه را می‌بینم</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'loading' || !round) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.amber} size="large" />
        <Text style={styles.waitTxt}>در حال یافتنِ حریف…</Text>
      </View>
    );
  }

  const correctId = lastResult?.correctOptionId;
  const stateFor = (optionId: string): AnswerState => {
    if (!lastResult) return 'idle';
    if (optionId === correctId) return 'correct';
    if (optionId === selectedId) return 'wrong';
    return 'dim';
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.badge}>⚔️ دوئل</Text>
        <Text style={styles.qcount}>
          سؤال {toFa(roundNumber)} از {toFa(totalRounds)}
        </Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreTxt}>{toFa(myScore)}</Text>
        </View>
      </View>

      <View style={styles.timerWrap}>
        <TimerRing
          endsAtMs={endsAtMs}
          totalSec={15}
          onExpire={onExpire}
          paused={status !== 'playing'}
        />
        {lastResult && (
          <Text
            style={[
              styles.points,
              { color: lastResult.points >= 0 ? colors.correct : colors.wrong },
            ]}
          >
            {toFaSigned(lastResult.points)}
          </Text>
        )}
      </View>

      <View style={styles.qtag}>
        <Text style={styles.qtagTxt}>
          ⚽ {DIFF_FA[round.question.difficulty] ?? round.question.difficulty}
        </Text>
      </View>

      <Text style={styles.question}>{round.question.text}</Text>

      <View style={styles.answers}>
        {round.options.map((o, i) => (
          <AnswerButton
            key={o.id}
            index={i + 1}
            label={o.text}
            state={stateFor(o.id)}
            disabled={status !== 'playing'}
            onPress={() => onSelect(o.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {lastResult && status === 'answered' && (
          <Pressable style={styles.nextBtn} onPress={() => void next()}>
            <Text style={styles.nextTxt}>
              {roundNumber >= totalRounds ? 'دیدن نتیجه ↻' : 'سؤال بعدی ↻'}
            </Text>
          </Pressable>
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
  center: {
    flex: 1,
    backgroundColor: colors.pitchDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    color: colors.amber,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
  },
  qcount: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
  },
  scorePill: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  scoreTxt: {
    color: colors.amber,
    fontFamily: font.family.black,
    fontSize: font.size.title,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    minHeight: 150,
  },
  points: {
    position: 'absolute',
    top: 0,
    right: spacing.xxl,
    fontFamily: font.family.black,
    fontSize: font.size.h2,
  },
  qtag: {
    alignSelf: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  qtagTxt: {
    color: colors.chalk,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
  },
  question: {
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.h2,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: spacing.xl,
  },
  answers: { gap: spacing.md },
  footer: { minHeight: 64, justifyContent: 'center', marginTop: spacing.md },
  nextBtn: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextTxt: {
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
  },
  bigEmoji: { fontSize: 72 },
  outcome: {
    color: colors.chalk,
    fontFamily: font.family.black,
    fontSize: font.size.h1,
  },
  vsScore: {
    color: colors.amber,
    fontFamily: font.family.black,
    fontSize: font.size.h2,
  },
  oppName: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
  },
  waitTxt: {
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.title,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.amber,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxxl,
    marginTop: spacing.lg,
  },
  primaryTxt: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.title,
  },
  ghostBtn: { paddingVertical: spacing.md, marginTop: spacing.sm },
  ghostTxt: {
    color: colors.chalkDim,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
  },
});
