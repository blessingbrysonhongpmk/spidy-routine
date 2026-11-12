import { useSound } from '@/context/SoundContext';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * CustomTabBar:
 * Mobile-first fixed bottom navigation bar with 5 thumb-friendly destinations:
 * Home, Routine, Tasks, Calendar, Settings.
 * Respects safe-area insets, maintains >=48px touch targets, and centers cleanly on desktop.
 */
export const CustomTabBar: React.FC<any> = ({
  state,
  navigation,
  navigateToTab,
}) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { playSound, triggerHaptic } = useSound();

  const getIconName = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'index':
        return isFocused ? 'home' : 'home-outline';
      case 'routine':
        return isFocused ? 'clipboard' : 'clipboard-outline';
      case 'tasks':
        return isFocused ? 'checkbox' : 'checkbox-outline';
      case 'calendar':
        return isFocused ? 'calendar' : 'calendar-outline';
      case 'settings':
        return isFocused ? 'settings' : 'settings-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'routine':
        return 'Routine';
      case 'tasks':
        return 'Tasks';
      case 'calendar':
        return 'Calendar';
      case 'settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 12);

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.borderSubtle,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.innerRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const iconName = getIconName(route.name, isFocused);
          const label = getLabel(route.name);

          const onPress = () => {
            playSound('buttonTap');
            triggerHaptic('light');

            if (navigation?.emit) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                if (navigation?.navigate) {
                  navigation.navigate(route.name);
                } else if (navigateToTab) {
                  navigateToTab(route.key);
                }
              }
            } else if (navigateToTab) {
              navigateToTab(route.key);
            } else if (navigation?.navigate) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
            >
              <View
                style={[
                  styles.iconBadge,
                  isFocused && {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              >
                <Ionicons
                  name={iconName as any}
                  size={20}
                  color={isFocused ? '#FFFFFF' : colors.textMuted}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.textMuted,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 8,
    width: '100%',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconBadge: {
    width: 40,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    marginTop: 3,
  },
});
