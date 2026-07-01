// ============================================================
//  login.tsx — ورود با شمارهٔ موبایل (OTP → JWT)
// ============================================================

import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, font } from '../src/theme';
import { toFa } from '../src/lib/fa';
import { requestOtp, verifyOtp } from '../src/api/auth';
import { useSession } from '../src/store/useSession';

type Step = 'phone' | 'code';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setAuth = useSession((s) => s.setAuth);

  const [step, setStep] = React.useState<Step>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const askOtp = async () => {
    setError(null);
    if (!/^09\d{9}$/.test(phone)) {
      setError('شمارهٔ موبایل معتبر نیست (۰۹xxxxxxxxx).');
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(phone);
      setDevCode(res.devCode ?? null);
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ارسال کد');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('کدِ ۶ رقمی را وارد کن.');
      return;
    }
    setBusy(true);
    try {
      const res = await verifyOtp(phone, code);
      await setAuth(res.token, res.user);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'کد نادرست است');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.logo}>فوتبالیکا ⚽</Text>
      <Text style={styles.tagline}>
        با دانشِ فوتبالی‌ات، باشگاهت را قهرمان کن.
      </Text>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>شمارهٔ موبایل</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              placeholder="۰۹xxxxxxxxx"
              placeholderTextColor={colors.chalkDim}
              maxLength={11}
              textAlign={I18nManager.isRTL ? 'right' : 'left'}
            />
            <PrimaryButton
              label="ارسال کد"
              busy={busy}
              onPress={askOtp}
              disabled={phone.length < 11}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>
              کدِ پیامک‌شده به {toFa(phone)} را وارد کن
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="------"
              placeholderTextColor={colors.chalkDim}
              maxLength={6}
              textAlign="center"
            />
            {devCode && (
              <Text style={styles.devHint}>
                (حالت توسعه) کد: {toFa(devCode)}
              </Text>
            )}
            <PrimaryButton
              label="ورود"
              busy={busy}
              onPress={confirm}
              disabled={code.length < 6}
            />
            <Pressable onPress={() => setStep('phone')}>
              <Text style={styles.back}>ویرایش شماره</Text>
            </Pressable>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.skip}>فعلاً به‌عنوان مهمان ادامه می‌دهم</Text>
      </Pressable>
    </View>
  );
}

function PrimaryButton(props: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={props.busy || props.disabled}
      onPress={props.onPress}
      style={{ marginTop: spacing.lg, opacity: props.disabled ? 0.5 : 1 }}
    >
      <LinearGradient
        colors={[colors.amber, colors.amberDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cta}
      >
        {props.busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text style={styles.ctaTxt}>{props.label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pitchDeep,
    paddingHorizontal: spacing.lg,
  },
  logo: {
    color: colors.chalk,
    fontFamily: font.family.black,
    fontSize: font.size.h1,
    textAlign: 'center',
  },
  tagline: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  label: {
    color: colors.chalk,
    fontFamily: font.family.medium,
    fontSize: font.size.label,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: colors.chalk,
    fontFamily: font.family.bold,
    fontSize: font.size.title,
  },
  codeInput: { fontSize: font.size.h2, letterSpacing: 8 },
  devHint: {
    color: colors.amber,
    fontFamily: font.family.regular,
    fontSize: font.size.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cta: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ctaTxt: {
    color: colors.ink,
    fontFamily: font.family.black,
    fontSize: font.size.title,
  },
  back: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  error: {
    color: colors.wrong,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  skip: {
    color: colors.chalkDim,
    fontFamily: font.family.medium,
    fontSize: font.size.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
