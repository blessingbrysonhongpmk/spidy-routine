import { AppScreenShell } from '@/components/AppScreenShell';
import { SpidyButton } from '@/components/SpidyButton';
import { SpidyInput } from '@/components/SpidyInput';
import { SpidyLogo } from '@/components/SpidyLogo';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { showAlert } from '@/services/platformAlert';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  const { loginEmail, registerEmail, loginGoogle } = useAuth();
  const { playSound, triggerHaptic } = useSound();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      showAlert('Required Fields', 'Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      playSound('buttonTap');
      if (isRegister) {
        await registerEmail(name || 'Hero Operative', email, password);
      } else {
        await loginEmail(email, password);
      }
      playSound('taskSuccess');
      triggerHaptic('success');
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert('Authentication Notice', error.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      playSound('buttonTap');
      triggerHaptic('medium');
      await loginGoogle('Blessing', 'blessing@gmail.com');
      playSound('taskSuccess');
      triggerHaptic('success');
      router.replace('/(tabs)');
    } catch (err: any) {
      showAlert('Google Sign-In', err.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    playSound('symbioteWhoosh');
    triggerHaptic('light');
    router.replace('/(tabs)');
  };

  return (
    <AppScreenShell topBreathingSpace={16} applyBottomInset={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vector Spidy Brand Header (Zero personal photo) */}
        <View style={styles.brandBox}>
          <View style={styles.heroLogoWrapper}>
            <SpidyLogo variant="hero" size={72} />
          </View>
          <Text style={styles.taglineSub}>YOUR DAY. YOUR MISSION.</Text>
          <View style={styles.logoRow}>
            <Text style={styles.brandText}>SPIDEY FLOW</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.subText}>Personal Daily Protocol & Mission Control</Text>
        </View>

        {/* Clean Auth Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            {isRegister ? 'OPERATIVE REGISTRATION' : 'SECURITY CLEARANCE'}
          </Text>

          <View style={{ gap: 14 }}>
            {isRegister ? (
              <SpidyInput
                label="OPERATIVE NAME"
                placeholder="e.g. Blessing"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
                showClearButton
              />
            ) : null}

            <SpidyInput
              label="EMAIL ADDRESS"
              placeholder="operative@spideyflow.app"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              showClearButton
            />

            <SpidyInput
              label="ACCESS CODE / PASSWORD"
              placeholder="••••••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
          </View>

          {/* Primary Action Button */}
          <View style={{ marginTop: 20 }}>
            <SpidyButton
              title={loading ? 'VERIFYING...' : isRegister ? 'CREATE CLEARANCE' : 'ENTER MISSION CONTROL'}
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="lg"
              icon="shield-checkmark"
              sound="buttonTap"
              haptic="medium"
            />
          </View>

          {/* Switch Login / Register */}
          <TouchableOpacity
            style={styles.switchAuthBtn}
            onPress={() => setIsRegister(!isRegister)}
          >
            <Text style={styles.switchAuthText}>
              {isRegister
                ? 'Already have clearance? Sign In'
                : 'New operative? Create Clearance'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <SpidyButton
            title="Continue with Google"
            onPress={handleGoogleLogin}
            disabled={loading}
            variant="subtle"
            size="md"
            icon="logo-google"
            sound="buttonTap"
          />

          {/* Guest / Offline Access */}
          <View style={{ marginTop: 10 }}>
            <SpidyButton
              title="Continue Offline as Guest"
              onPress={handleGuestAccess}
              variant="ghost"
              size="md"
              sound="symbioteWhoosh"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    paddingBottom: Spacing.huge,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroLogoWrapper: {
    marginBottom: Spacing.md,
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  taglineSub: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: SpideyColors.textPrimary,
    letterSpacing: 1.5,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SpideyColors.spideyRed,
  },
  subText: {
    color: SpideyColors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: SpideyColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    padding: Spacing.xl,
  },
  formTitle: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: SpideyColors.inputBackground,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: SpideyColors.borderSubtle,
    color: SpideyColors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 14,
  },
  submitBtn: {
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: SpideyColors.spideyRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  switchAuthText: {
    color: SpideyColors.thorBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SpideyColors.borderSubtle,
  },
  dividerText: {
    color: SpideyColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpideyColors.surfaceElevated,
    borderRadius: Radii.sm,
    height: 44,
    borderWidth: 1,
    borderColor: SpideyColors.borderMuted,
    marginBottom: Spacing.md,
  },
  googleBtnText: {
    color: SpideyColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  guestBtnText: {
    color: SpideyColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
