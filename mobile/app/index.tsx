// ============================================================
//  index.tsx — صفحهٔ خانه (لابی)
//  چیدمان و رنگ از design-mockups/footbalika-home.html.
//  فاز ۰: بیشتر استاتیک؛ «بازی سریع» و «بمب» حلقهٔ اصلی را شروع می‌کنند.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, font } from '../src/theme';
import { toFa } from '../src/lib/fa';
import { useSession } from '../src/store/useSession';
import { useMatch } from '../src/store/useMatch';
import type { GameMode } from '../src/api/match';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const displayName = useSession((s) => s.displayName);
  const sessionStatus = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const start = useMatch((s) => s.start);
  const status = useMatch((s) => s.status);
  const [pending, setPending] = React.useState<GameMode | null>(null);

  const isAuthed = sessionStatus === 'authed';

  const launch = async (mode: GameMode) => {
    setPending(mode);
    await start(userId, mode, 5);
    setPending(null);
    // اگر شروع موفق بود، به صفحهٔ سؤال برو
    if (useMatch.getState().status === 'playing') {
      const id = useMatch.getState().matchId;
      if (id) router.push(`/play/${id}`);
    }
  };

  const busy = status === 'loading' || pending !== null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxxl,
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* نوار بالا: پروفایل + جان + سکه */}
      <View style={styles.topbar}>
        <Pressable
          style={styles.profile}
          onPress={() => router.push('/login')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{displayName.slice(0, 1)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.sub}>
              {isAuthed
                ? `سطح ${toFa(user?.level ?? 1)} · لیگ طلایی`
                : 'برای ورود بزن ›'}
            </Text>
          </View>
        </Pressable>
        <View style={styles.stats}>
          <View style={styles.chip}>
            <Text style={styles.chipTxt}>❤️ {toFa(user?.lives ?? 5)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipTxt}>🪙 {toFa(user?.coins ?? 0)}</Text>
          </View>
        </View>
      </View>

      {/* کارت استریک */}
      <View style={styles.streak}>
        <Text style={styles.fire}>🔥</Text>
        <Text style={styles.streakTxt}>
          {toFa(4)} روز پشت‌سرهم! امروز هم بازی کن تا نشکند.
        </Text>
      </View>

      {/* اکشن اصلی: بازی سریع */}
      <Text style={styles.ready}>آماده‌ای؟</Text>
      <Pressable disabled={busy} onPress={() => launch('QUICK')}>
        <View style={[styles.ctaShadow]} />
        <LinearGradient
          colors={[colors.amber, colors.amberDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cta}
        >
          {pending === 'QUICK' ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.ctaTxt}>بازی سریع ⚡</Text>
          )}
        </LinearGradient>
      </Pressable>

      {/* دسترسیِ سریع: رده‌بندی */}
      <Pressable
        style={styles.navRow}
        onPress={() => router.push('/leaderboard')}
      >
        <Text style={styles.navTxt}>📊 جدول رده‌بندی</Text>
        <Text style={styles.navChevron}>›</Text>
      </Pressable>

      {/* مودهای بازی */}
      <Text style={styles.section}>مودهای بازی</Text>
      <View style={styles.grid}>
        <ModeCard emoji="⚔️" title="دوئل ۱به۱" sub="۵ سؤال، نوبتی" soon />
        <ModeCard
          emoji="💣"
          title="حالت بمب"
          sub="قبل از انفجار جواب بده"
          hot
          loading={pending === 'BOMB'}
          onPress={() => launch('BOMB')}
        />
        <ModeCard
          emoji="🎯"
          title="تک‌نفره"
          sub="تمرین و کسب سکه"
          loading={pending === 'QUICK'}
          onPress={() => launch('QUICK')}
        />
        <ModeCard emoji="🏆" title="تورنمنت" sub="۳۲ نفر، جایزهٔ بزرگ" soon />
      </View>

      {/* بازی‌های در جریان (استاتیک — فاز ۲) */}
      <View style={styles.rowBetween}>
        <Text style={styles.section}>بازی‌های در جریان</Text>
        <Text style={styles.link}>همه</Text>
      </View>
      <OngoingRow
        initial="س.ک"
        name="سینا کریمی"
        detail={`راند ${toFa(2)} · تو ${toFa(320)} — او ${toFa(280)}`}
        badge="نوبت تو"
        turn
      />
      <OngoingRow
        initial="م.ا"
        name="مهدی احمدی"
        detail="تورنمنت · مرحلهٔ یک‌هشتم"
        badge="منتظر او"
      />
      <OngoingRow
        initial="ز.ر"
        name="زهرا رضایی"
        detail={`راند ${toFa(1)} · تازه شروع شد`}
        badge="نوبت تو"
        turn
      />
    </ScrollView>
  );
}

function ModeCard(props: {
  emoji: string;
  title: string;
  sub: string;
  hot?: boolean;
  soon?: boolean;
  loading?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.mode}
      disabled={props.soon || props.loading}
      onPress={props.onPress}
    >
      {props.hot && (
        <View style={styles.hot}>
          <Text style={styles.hotTxt}>داغ 🔥</Text>
        </View>
      )}
      {props.soon && (
        <View style={styles.soon}>
          <Text style={styles.soonTxt}>به‌زودی</Text>
        </View>
      )}
      {props.loading ? (
        <ActivityIndicator color={colors.amber} style={{ height: 34 }} />
      ) : (
        <Text style={styles.modeEmoji}>{props.emoji}</Text>
      )}
      <Text style={styles.modeTitle}>{props.title}</Text>
      <Text style={styles.modeSub}>{props.sub}</Text>
    </Pressable>
  );
}

function OngoingRow(props: {
  initial: string;
  name: string;
  detail: string;
  badge: string;
  turn?: boolean;
}) {
  return (
    <View style={styles.ongoing}>
      <View style={styles.oAvatar}>
        <Text style={styles.oAvatarTxt}>{props.initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.oName}>{props.name}</Text>
        <Text style={styles.oDetail}>{props.detail}</Text>
      </View>
      <View style={[styles.oBadge, props.turn && styles.oBadgeTurn]}>
        <Text style={[styles.oBadgeTxt, props.turn && styles.oBadgeTxtTurn]}>
          {props.badge}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.pitchDeep },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.teamPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontFamily: font.family.black, fontSize: 18 },
  name: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.title },
  sub: { color: colors.chalkDim, fontFamily: font.family.regular, fontSize: font.size.caption },
  stats: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipTxt: { color: colors.chalk, fontFamily: font.family.medium, fontSize: font.size.body },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  fire: { fontSize: 26 },
  streakTxt: {
    flex: 1,
    color: colors.chalk,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
    textAlign: 'right',
  },
  ready: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
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
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: spacing.xl,
  },
  ctaTxt: { color: colors.ink, fontFamily: font.family.black, fontSize: font.size.h2 },
  section: {
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.title,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  link: { color: colors.amber, fontFamily: font.family.medium, fontSize: font.size.body },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  navTxt: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.label },
  navChevron: { color: colors.chalkDim, fontFamily: font.family.black, fontSize: font.size.title },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mode: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'flex-end',
    gap: 4,
  },
  modeEmoji: { fontSize: 30 },
  modeTitle: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.label },
  modeSub: { color: colors.chalkDim, fontFamily: font.family.regular, fontSize: font.size.caption },
  hot: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.wrong,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hotTxt: { color: '#fff', fontFamily: font.family.bold, fontSize: 10 },
  soon: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonTxt: { color: colors.chalkDim, fontFamily: font.family.bold, fontSize: 10 },
  ongoing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  oAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.teamBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oAvatarTxt: { color: '#fff', fontFamily: font.family.bold, fontSize: font.size.body },
  oName: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.label, textAlign: 'right' },
  oDetail: { color: colors.chalkDim, fontFamily: font.family.regular, fontSize: font.size.caption, textAlign: 'right' },
  oBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.glass,
  },
  oBadgeTurn: { backgroundColor: colors.amber },
  oBadgeTxt: { color: colors.chalkDim, fontFamily: font.family.bold, fontSize: font.size.caption },
  oBadgeTxtTurn: { color: colors.ink },
});
