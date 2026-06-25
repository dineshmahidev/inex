import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Shield, Fingerprint, Lock } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { UserSettings } from '@/hooks/useDatabase';

interface SecurityLockProps {
  settings: UserSettings;
  onUnlock: () => void;
}

export function SecurityLock({ settings, onUnlock }: SecurityLockProps) {
  const [visible, setVisible] = useState(settings?.isLocked || false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (settings?.isLocked) {
      handleBiometric();
    }
  }, [settings?.isLocked]);

  const handleBiometric = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Smart Tracker',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        setVisible(false);
        onUnlock();
      }
    }
  };

  const handlePinSubmit = () => {
    if (pin === settings?.pin) {
      setVisible(false);
      onUnlock();
    } else {
      Alert.alert("Incorrect PIN");
      setPin('');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Shield color={Colors.primary} size={64} style={{ marginBottom: 20 }} />
        <Text style={styles.title}>Secure Vault Locked</Text>
        <Text style={styles.subtitle}>Enter 4-Digit PIN to access your data</Text>
        
        <TextInput
          style={styles.input}
          placeholder="----"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={pin}
          onChangeText={(v) => { setPin(v); if(v.length === 4 && v === settings?.pin) { setVisible(false); onUnlock(); } }}
          autoFocus
        />

        <TouchableOpacity style={styles.bioBtn} onPress={handleBiometric}>
          <Fingerprint color={Colors.primary} size={32} />
          <Text style={styles.bioText}>Use Biometrics</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F4F6',
    width: 200,
    height: 60,
    borderRadius: 20,
    textAlign: 'center',
    fontSize: 32,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    letterSpacing: 20,
    paddingLeft: 20,
  },
  bioBtn: {
    marginTop: 40,
    alignItems: 'center',
    gap: 10,
  },
  bioText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
