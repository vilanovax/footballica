// ============================================================
//  play/[matchId].tsx — صفحهٔ سؤال + تایمر + بمب
//  چیدمان از design-mockups/footbalika-question-screen.html.
//  تایمر از deadlineِ سرور می‌آید؛ درستی را سرور تعیین می‌کند.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font } from '../../src/theme';
import { toFa, toFaSigned } from '../../src/lib/fa';
import { useSession } from '../../src/store/useSession';
import { useMatch } from '../../src/store/useMatch';
import AnswerButton, {
  type AnswerState,
} from '../../src/components/AnswerButton';
import TimerRing from '../../src/components/TimerRing';
import BombTimer from '../../src/components/BombTimer';

const DIFF_FA: Record<string, string> = {
  EASY: 'آسان',
  MEDIUM: 'متوسط',
  HARD: 'سخت',
};

export default function QuestionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useSession((s) => s.userId);

  const status = useMatch((s) => s.status);
  const mode = useMatch((s) => s.mode);
  const round = useMatch((s) => s.round);
  const roundNumber = useMatch((s) => s.roundNumber);
  const totalRounds = useMatch((s) => s.totalRounds);
  const endsAtMs = useMatch((s) => s.endsAtMs);
  const score = useMatch((s) => s.score);
  const lastResult = useMatch((s) => s.lastResult);
  const answer = useMatch((s) => s.answer);
  const next = useMatch((s) => s.next);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // با آمدنِ راندِ جدید، انتخاب را پاک کن
  React.useEffect(() => {
    setSelectedId(null);
  }, [round?.roundId]);

  // وقتی مَچ تمام شد → صفحهٔ نتیجه
  React.useEffect(() => {
    if (status === 'finished') router.replace('/play/result');
  }, [status, router]);

  // بازخوردِ لمسی هنگام آشکارشدنِ نتیجه
  React.useEffect(() => {
    if (!lastResult) return;
    Haptics.notificationAsync(
      lastResult.isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => undefined);
  }, [lastResult]);

  const locked = status === 'answered' || status === 'loading';

  const onSelect = (optionId: string) => {
    if (locked || status !== 'playing') return;
    setSelectedId(optionId);
    void answer(userId, optionId);
  };

  const onExpire = React.useCallback(() => {
    if (useMatch.getState().status === 'playing') {
      void answer(userId, null);
    }
  }, [answer, userId]);

  if (!round) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.dim}>مَچی در جریان نیست.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>بازگشت به خانه</Text>
        </Pressable>
      </View>
    );
  }

  const isBomb = mode === 'BOMB';
  const totalSec = isBomb ? 8 : 15;
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
      {/* هدر: شماره سؤال + امتیاز */}
      <View style={styles.header}>
        <Text style={styles.qcount}>
          سؤال {toFa(roundNumber)} از {toFa(totalRounds)}
        </Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreTxt}>{toFa(score)}</Text>
        </View>
      </View>

      {/* تایمر (حلقه یا بمب) */}
      <View style={styles.timerWrap}>
        {isBomb ? (
          <BombTimer
            endsAtMs={endsAtMs}
            totalSec={totalSec}
            onExpire={onExpire}
            paused={status !== 'playing'}
          />
        ) : (
          <TimerRing
            endsAtMs={endsAtMs}
            totalSec={totalSec}
            onExpire={onExpire}
            paused={status !== 'playing'}
          />
        )}
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

      {/* تگ دسته/سختی */}
      <View style={[styles.qtag, isBomb && styles.qtagBomb]}>
        <Text style={styles.qtagTxt}>
          {isBomb ? '💣 حالت بمب · فتیله روشن است!' : '⚽'}{' '}
          {DIFF_FA[round.question.difficulty] ?? round.question.difficulty}
        </Text>
      </View>

      {/* متن سؤال */}
      <Text style={styles.question}>{round.question.text}</Text>

      {/* گزینه‌ها */}
      <View style={styles.answers}>
        {round.options.map((o, i) => (
          <AnswerButton
            key={o.id}
            index={i + 1}
            label={o.text}
            state={stateFor(o.id)}
            disabled={locked}
            onPress={() => onSelect(o.id)}
          />
        ))}
      </View>

      {/* پس از پاسخ: دکمهٔ راند بعد */}
      <View style={styles.footer}>
        {status === 'loading' && <ActivityIndicator color={colors.amber} />}
        {lastResult && status === 'answered' && (
          <Pressable style={styles.nextBtn} onPress={() => void next(userId)}>
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
  screen: { flex: 1, backgroundColor: colors.pitchDeep, paddingHorizontal: spacing.lg },
  centerScreen: {
    flex: 1,
    backgroundColor: colors.pitchDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  dim: { color: colors.chalkDim, fontFamily: font.family.medium, fontSize: font.size.label },
  link: { color: colors.amber, fontFamily: font.family.bold, fontSize: font.size.label },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qcount: { color: colors.chalkDim, fontFamily: font.family.medium, fontSize: font.size.label },
  scorePill: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  scoreTxt: { color: colors.amber, fontFamily: font.family.black, fontSize: font.size.title },
  timerWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md, minHeight: 150 },
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
  qtagBomb: { backgroundColor: 'rgba(240,65,62,0.18)', borderColor: colors.wrong },
  qtagTxt: { color: colors.chalk, fontFamily: font.family.medium, fontSize: font.size.body },
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
  nextTxt: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.label },
});
