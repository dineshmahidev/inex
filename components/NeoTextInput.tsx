import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface NeoTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function NeoTextInput({ label, error, containerStyle, style, ...props }: NeoTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <View style={styles.shadowLayer} />
        <TextInput
          {...props}
          style={[
            styles.input,
            style,
            isFocused && styles.inputFocused,
            error && styles.inputError,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: Colors.border,
    borderRadius: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 2.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  inputFocused: {
    backgroundColor: '#f3f4f6', // Light gray highlight when focused
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
});
