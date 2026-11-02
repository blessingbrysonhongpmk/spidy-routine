import { Radii, SpideyColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useLightning } from './LightningEffect';
import { SpiderEmblem } from './SpiderEmblem';
import { WebButtonInteraction } from './WebButtonInteraction';

const { width } = Dimensions.get('window');

/**
 * CustomTabBar:
 * Understated, precision-engineered bottom navigation bar.
 * Features signature Spider-Man web-pull interactions on tab switch, laser-etched Spider emblem, and Thor electric highlights.
 */
export const CustomTabBar: React.FC<any> = ({
  state,
  descriptors,
  navigation,
  navigateToTab,
}) => {
  const { triggerLightning } = useLightning();

  const getIconName = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'index':
        return isFocused ? 'home' : 'home-outline';
      case 'routine':
        return isFocused ? 'barbell' : 'barbell-outline';
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
      case 'calendar':
        return 'Calendar';
      case 'settings':
        return 'Settings';
      default:
        return routeName;
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Precision Spider Emblem Centered Above Tab Bar */}
      <View style={styles.spiderEmblemContainer} pointerEvents="none">
        <SpiderEmblem size={30} color={SpideyColors.borderMuted} opacity={0.4} />
      </View>

      <View style={styles.container}>
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
              <Ionicons
                name={iconName as any}
                size={20}
                color={isFocused ? SpideyColors.spideyRed : SpideyColors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelFocused,
                ]}
              >
                {label}
              </Text>

              {/* Refined 4px Active Dot Indicator */}
              {isFocused && <View style={styles.activeDot} />}
            </WebButtonInteraction>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: SpideyColors.background,
    position: 'relative',
  },
  spiderEmblemContainer: {
    position: 'absolute',
    top: -15,
    left: width / 2 - 15,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: SpideyColors.surface,
    borderTopWidth: 1,
    borderTopColor: SpideyColors.borderSubtle,
    paddingBottom: 4,
    paddingTop: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: SpideyColors.textMuted,
    marginTop: 3,
  },
  tabLabelFocused: {
    color: SpideyColors.spideyRed,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: SpideyColors.spideyRed,
  },
});
