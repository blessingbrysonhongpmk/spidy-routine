import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export interface SpidyInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  showClearButton?: boolean;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
  hint?: string;
}

/**
 * SpidyInput:
 * Premium, interactive, tactile input field for SPIDEY FLOW.
 * Features elegant focus states, distinct borders, responsive feedback,
 * clean typography, clear validation, and tactile micro-accessories.
 */
export const SpidyInput: React.FC<SpidyInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showClearButton = false,
  onClear,
  containerStyle,
  required = false,
  hint,
  value,
  onChangeText,
  onFocus,
  onBlur,
  multiline = false,
  style,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = Boolean(value && value.length > 0);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Optional Top Label */}
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{label}</Text>
          {required ? <Text style={styles.requiredStar}>*</Text> : null}
          {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
        </View>
      ) : null}

      {/* Input Field Container */}
      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {/* Left Icon Accessory */}
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? '#EF4444' : isFocused ? '#38BDF8' : '#64748B'}
            style={styles.leftIcon}
          />
        ) : null}

        {/* Core TextInput */}
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
            style,
          ]}
          placeholderTextColor="#64748B"
          selectionColor="#38BDF8"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...restProps}
        />

        {/* Clear Action Button */}
        {showClearButton && hasValue ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.accessoryBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Clear input"
          >
            <Ionicons name="close-circle" size={17} color="#64748B" />
          </TouchableOpacity>
        ) : null}

        {/* Right Icon Accessory */}
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.accessoryBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={rightIcon}
              size={18}
              color={isFocused ? '#38BDF8' : '#64748B'}
            />
          </TouchableOpacity>
        ) : null}

        {/* Subtle Bottom Energy Line when Focused */}
        {isFocused && !error ? <View style={styles.focusActiveLine} /> : null}
      </View>

      {/* Validation Error Message */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  labelText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  requiredStar: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D131F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 13,
    minHeight: 46,
    position: 'relative',
    overflow: 'hidden',
  },
  multilineContainer: {
    minHeight: 82,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: 'rgba(56, 189, 248, 0.65)',
    backgroundColor: '#101726',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  leftIcon: {
    marginRight: 9,
  },
  accessoryBtn: {
    padding: 2,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14.5,
    fontWeight: '500',
    paddingVertical: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 64,
  },
  focusActiveLine: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: '#38BDF8',
    opacity: 0.9,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});

