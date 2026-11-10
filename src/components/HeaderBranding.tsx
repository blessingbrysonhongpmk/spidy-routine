import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSound } from '@/context/SoundContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AnimatedProgress } from './AnimatedProgress';
import { WebButtonInteraction } from './WebButtonInteraction';

interface HeaderBrandingProps {
  dateHeader: string;
  percentage?: number;
  streakDays?: number;
  nextActivityTitle?: string;
  onNextActivityPress?: () => void;
  onProgressPress?: () => void;
  activeTab?: 'today' | 'routine' | 'tasks';
}

/**
 * HeaderBranding:
 * World-class SPIDEY FLOW header and dashboard command module.
 * Matches the refined UI design with:
 * - Hamburger menu (left), metallic SPIDEY FLOW branding (center), circular hero avatar (right)
 * - Greeting ("Hello, [Name]! 👋", "Let's make today count.", calendar date) with hero silhouette
 * - Dual-arc circular progress telemetry (75% / Today's Progress / ⚡)
 * - Motivational Trophy card ("Great Progress! Keep going, you're on fire! 🏆")
 * - Next Activity quick-card ("Next Activity: Complete 3 tasks >")
 * - Three-pill segmented switcher: [ 📅 Today ] [ 🔄 Routine ] [ ☑ Tasks ]
 */
export const HeaderBranding: React.FC<HeaderBrandingProps> = ({
  dateHeader,
  percentage = 0,
  nextActivityTitle = 'Complete 3 tasks',
  onNextActivityPress,
  onProgressPress,
  activeTab = 'today',
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { playSound, triggerHaptic } = useSound();
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuPress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/(tabs)/settings');
  };

  const handleProfilePress = () => {
    playSound('buttonTap');
    triggerHaptic('light');
    router.push('/profile');
  };

  const handleTabSwitch = (tab: 'today' | 'routine' | 'tasks') => {
    playSound('buttonTap');
    triggerHaptic('light');
    if (tab === 'today') router.push('/(tabs)');
    if (tab === 'routine') router.push('/(tabs)/routine');
    if (tab === 'tasks') router.push('/(tabs)/tasks');
  };

  const isUnregistered = !user?.name;
  const displayName = isUnregistered ? 'Agent' : user.name;

  return (
    <View style={styles.container}>
      {/* 1. Top Application Bar: ☰, SPIDEY FLOW, Hero Avatar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open settings menu"
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.brandCenter}>
          <View style={styles.brandRow}>
            <Text style={styles.brandSpidey}>SPIDEY </Text>
            <Text style={styles.brandFlow}>FLOW</Text>
          </View>
          <Text style={styles.brandTagline}>Your Day. Your Mission.</Text>
        </View>

        <TouchableOpacity
          style={[styles.avatarButton, { borderColor: '#E50914' }]}
          onPress={handleProfilePress}
          activeOpacity={0.8}
          accessibilityLabel="User profile"
        >
          <Image
            source={require('@/assets/images/hero-portrait.jpg')}
            style={styles.avatarImg}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      {/* 2. Hero Greeting Row with Moonlit City Skyline Silhouette */}
      <View style={styles.greetingContainer}>
        {/* Left Column: Greeting, Subtitle, Date */}
        <View style={styles.greetingLeft}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
            <Text style={styles.greetingName}>
              Hello, <Text style={{ color: '#FFFFFF' }}>{displayName}!</Text> 👋
            </Text>
            <Text style={styles.subGreeting}>
              {user?.motto || "Let's make today count."}
            </Text>
          </TouchableOpacity>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
            <Text style={styles.dateText}>{dateHeader}</Text>
            {liveTime ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Ionicons name="time-outline" size={13} color="#38BDF8" />
                <Text style={[styles.dateText, { color: '#38BDF8', fontWeight: '700' }]}>
                  {liveTime}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Right Column: Hero Silhouette Silhouette Graphic with Red Moon & Lightning */}
        <View style={styles.heroGraphicWrapper} pointerEvents="none">
          <Svg width={110} height={90} viewBox="0 0 110 90" fill="none">
            <Defs>
              <LinearGradient id="moonGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#991B1B" stopOpacity="0.2" />
              </LinearGradient>
            </Defs>
            {/* Red Moon */}
            <Circle cx={85} cy={35} r={22} fill="url(#moonGlow)" />
            {/* City Skyline Silhouette */}
            <Path
              d="M0 90 L20 70 L30 70 L30 60 L45 60 L45 75 L60 75 L60 50 L72 50 L72 75 L95 75 L95 55 L110 55 L110 90 Z"
              fill="#06090F"
            />
            {/* Superhero Silhouette on Rooftop */}
            <Path
              d="M75 50 C 75 45, 78 40, 83 40 C 86 40, 88 43, 87 46 C 89 48, 90 53, 85 55 C 80 57, 75 55, 75 50 Z"
              fill="#0F172A"
            />
            {/* Electric Streak */}
            <Path
              d="M0 45 L30 52 L25 58 L55 64"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
          </Svg>
        </View>
      </View>

      {/* 3. Telemetry & Motivation Cards Row */}
      <View style={styles.cardsRow}>
        {/* Left: Dual-Arc Circular Progress Ring Card */}
        <TouchableOpacity
          style={styles.progressCard}
          onPress={onProgressPress}
          activeOpacity={0.8}
        >
          <AnimatedProgress
            percentage={percentage}
            size={98}
            strokeWidth={7}
            label="Today's Progress"
            showIcon={true}
            triggerLightningOnIncrease={true}
          />
        </TouchableOpacity>

        {/* Right: Stacked Trophy & Next Activity Cards */}
        <View style={styles.rightCardsCol}>
          {/* Top Motivation Trophy Card */}
          <View style={styles.trophyCard}>
            <View style={styles.trophyTextBox}>
              <View style={styles.trophyHeaderRow}>
                <Text style={styles.trophyIcon}>🏆</Text>
                <Text style={styles.trophyTitle}>Great Progress!</Text>
              </View>
              <Text style={styles.trophySubtitle}>
                {percentage >= 100
                  ? 'All missions cleared! Legendary.'
                  : "Keep going, you're on fire!"}
              </Text>
            </View>
            <Text style={styles.trophyBigIcon}>🏆</Text>
          </View>

          {/* Bottom Next Activity Card */}
          <TouchableOpacity
            style={styles.nextActivityCard}
            onPress={onNextActivityPress}
            activeOpacity={0.8}
          >
            <View style={styles.targetIconBox}>
              <View style={styles.targetOuterCircle}>
                <View style={styles.targetInnerDot} />
              </View>
            </View>
            <View style={styles.nextActivityTextBox}>
              <Text style={styles.nextActivityLabel}>Next Activity</Text>
              <Text style={styles.nextActivityTitle} numberOfLines={1}>
                {nextActivityTitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Segmented Navigation Bar: [ 📅 Today ] [ 🔄 Routine ] [ ☑ Tasks ] */}
      <View style={styles.segmentedNav}>
        {[
          { key: 'today', label: 'Today', icon: 'calendar' },
          { key: 'routine', label: 'Routine', icon: 'sync' },
          { key: 'tasks', label: 'Tasks', icon: 'checkbox-outline' },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <WebButtonInteraction
              key={tab.key}
              style={[
                styles.navPill,
                isSelected && styles.navPillActive,
              ]}
              onPress={() => handleTabSwitch(tab.key as any)}
              variant="compact"
              sound="buttonTap"
              haptic="light"
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isSelected ? '#EF4444' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.navPillText,
                  isSelected && styles.navPillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </WebButtonInteraction>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandCenter: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandSpidey: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandFlow: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E50914',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.8,
    overflow: 'hidden',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  greetingLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subGreeting: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
  },
  dateText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dotSeparator: {
    color: '#64748B',
    fontSize: 12,
    marginHorizontal: 3,
  },
  heroGraphicWrapper: {
    width: 110,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#0F1622',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rightCardsCol: {
    flex: 1.35,
    justifyContent: 'space-between',
    gap: 8,
  },
  trophyCard: {
    flex: 1,
    backgroundColor: '#0F1622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trophyTextBox: {
    flex: 1,
    paddingRight: 6,
  },
  trophyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trophyIcon: {
    fontSize: 13,
  },
  trophyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  trophySubtitle: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  trophyBigIcon: {
    fontSize: 24,
  },
  nextActivityCard: {
    flex: 1,
    backgroundColor: '#0F1622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  targetOuterCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  nextActivityTextBox: {
    flex: 1,
  },
  nextActivityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  nextActivityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  segmentedNav: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  navPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  navPillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  navPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
