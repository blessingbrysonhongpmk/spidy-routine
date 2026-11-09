import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLightning } from './LightningEffect';
import { SpiderEmblem } from './SpiderEmblem';
import { WebButtonInteraction } from './WebButtonInteraction';

const { width } = Dimensions.get('window');

/**
 * CustomTabBar:
 * Precision-engineered bottom navigation bar uniting Spider-Man, Thor, and Venom.
 * Features signature web-pull interactions, illuminated spider hallmark, and electric state feedback.
 */
export const CustomTabBar: React.FC<any> = ({
  state,
  descriptors,
  navigation,
  navigateToTab,
}) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { triggerLightning } = useLightning();

  const getIconName = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'index':
        return isFocused ? 'home' : 'home-outline';
      case 'routine':
        return isFocused ? 'time' : 'time-outline';
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
        return 'Today';
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

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      {/* Precision Spider Emblem Centered Above Tab Bar */}
      <View style={styles.spiderEmblemContainer} pointerEvents="none">
        <SpiderEmblem size={26} color={colors.borderMuted} opacity={0.65} />
      </View>

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.tabBarBorder,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const iconName = getIconName(route.name, isFocused);
          const label = getLabel(route.name);

          const onPress = () => {
            if (!isFocused) {
              triggerLightning({ intensity: 'light', playSoundEffect: false });
            }

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
            <WebButtonInteraction
              key={route.key}
              onPress={onPress}
              variant="tab"
              sound="buttonTap"
              haptic="light"
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName as any}
                  size={20}
                  color={isFocused ? colors.primary : colors.textMuted}
                />
                {isFocused && (
                  <View
                    style={[
                      styles.iconGlow,
                      { backgroundColor: colors.primarySubtle },
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.textMuted,
                    fontWeight: isFocused ? '800' : '500',
                  },
                ]}
              >
                {label}
              </Text>

              {/* Refined Active Dot Indicator */}
              {isFocused && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </WebButtonInteraction>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  spiderEmblemContainer: {
    position: 'absolute',
    top: -13,
    left: width / 2 - 13,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  iconGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    zIndex: -1,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: Radii.pill,
  },
});
