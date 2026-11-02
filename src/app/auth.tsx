import { WebBackground } from '@/components/WebBackground';
import { WebButtonInteraction } from '@/components/WebButtonInteraction';
import { Radii, Spacing, SpideyColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
      Alert.alert('Required Fields', 'Please fill in both email and password.');
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
      Alert.alert('Authentication Notice', error.message || 'Login failed. Please verify credentials.');
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
      Alert.alert('Google Sign-In', err.message || 'Could not sign in with Google.');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <WebBackground />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Operative Portrait Avatar & Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.heroAvatarBadge}>
            <Image
              source={require('@/assets/images/hero-portrait.jpg')}
              style={styles.heroAvatarImg}
              contentFit="cover"
            />
            <View style={styles.heroAvatarRing} />
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

          {isRegister ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OPERATIVE NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Blessing"
                placeholderTextColor={SpideyColors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.textInput}
              placeholder="operative@spideyflow.app"
              placeholderTextColor={SpideyColors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ACCESS CODE / PASSWORD</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••••••"
              placeholderTextColor={SpideyColors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Primary Action Button with Web Pull */}
          <WebButtonInteraction
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            variant="primary"
            sound="buttonTap"
            haptic="medium"
          >
            <Text style={styles.submitBtnText}>
              {loading
                ? 'VERIFYING...'
                : isRegister
                  ? 'CREATE CLEARANCE'
                  : 'ENTER MISSION CONTROL'}
            </Text>
          </WebButtonInteraction>

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

          {/* Google Sign In with Web Pull */}
          <WebButtonInteraction
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
            variant="subtle"
            sound="buttonTap"
            haptic="light"
          >
            <Ionicons name="logo-google" size={17} color="#EA4335" style={{ marginRight: 8 }} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </WebButtonInteraction>

          {/* Guest / Offline Access with Web Pull */}
          <WebButtonInteraction
            style={styles.guestBtn}
            onPress={handleGuestAccess}
            variant="subtle"
            sound="symbioteWhoosh"
            haptic="light"
          >
            <Text style={styles.guestBtnText}>Continue Offline as Guest</Text>
          </WebButtonInteraction>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpideyColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 64,
    paddingBottom: Spacing.huge,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroAvatarBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: SpideyColors.spideyRed,
    shadowColor: SpideyColors.spideyRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
  },
  heroAvatarRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.4)',
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
