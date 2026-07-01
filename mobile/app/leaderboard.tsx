// ============================================================
//  leaderboard.tsx — جدولِ رده‌بندیِ سراسری (از Redis سمتِ سرور).
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
import { getLeaderboard, getMyRank } from '../src/api/leaderboard';
import { useSession } from '../src/store/useSession';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const myUserId = useSession((s) => s.userId);

  const board = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard(50),
  });

  const mine = useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: getMyRank,
    enabled: status === 'authed',
  });

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
        <Text style={styles.title}>رده‌بندی</Text>
        <View style={{ width: 48 }} />
      </View>

      {board.isLoading && (
        <ActivityIndicator color={colors.amber} style={{ marginTop: spacing.xxxl }} />
      )}
      {board.isError && (
        <Text style={styles.dim}>خطا در بارگذاریِ جدول.</Text>
      )}

      {board.data && (
        <FlatList
          data={board.data}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          ListEmptyComponent={
            <Text style={styles.dim}>هنوز امتیازی ثبت نشده.</Text>
          }
          renderItem={({ item }) => {
            const isMe = item.userId === myUserId;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={[styles.rank, item.rank <= 3 && styles.rankTop]}>
                  {toFa(item.rank)}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                  {isMe ? ' (تو)' : ''}
                </Text>
                <Text style={styles.score}>{toFa(item.score)}</Text>
              </View>
            );
          }}
        />
      )}

      {/* نوارِ جایگاهِ من */}
      {status === 'authed' && mine.data && (
        <View style={styles.mePill}>
          <Text style={styles.meTxt}>
            جایگاهِ تو:{' '}
            {mine.data.rank == null ? 'خارج از جدول' : `رتبهٔ ${toFa(mine.data.rank)}`}
            {' · '}
            {toFa(mine.data.score)} امتیاز
          </Text>
        </View>
      )}
      {status !== 'authed' && (
        <Pressable style={styles.mePill} onPress={() => router.push('/login')}>
          <Text style={styles.meTxt}>برای ثبتِ جایگاهت وارد شو ›</Text>
        </Pressable>
      )}
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
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMe: { borderColor: colors.amber, backgroundColor: 'rgba(255,194,60,0.08)' },
  rank: {
    width: 34,
    textAlign: 'center',
    color: colors.chalkDim,
    fontFamily: font.family.black,
    fontSize: font.size.title,
  },
  rankTop: { color: colors.amber },
  name: {
    flex: 1,
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.label,
    textAlign: 'right',
  },
  score: { color: colors.amber, fontFamily: font.family.black, fontSize: font.size.title },
  mePill: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  meTxt: { color: colors.chalk, fontFamily: font.family.bold, fontSize: font.size.body },
});
