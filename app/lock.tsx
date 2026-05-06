import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useDatabase } from '@/context/DatabaseContext';
import { useRouter } from 'expo-router';
import { Lock, Fingerprint, Delete } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LockScreen() {
    const { settings, Colors } = useDatabase();
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
            handleBiometricAuth();
        }
    };

    const handleBiometricAuth = async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Tracksy',
            fallbackLabel: 'Use PIN',
            disableDeviceFallback: false,
        });

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        }
    };

    const handleKeyPress = (num: string) => {
        if (pin.length < 4) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newPin = pin + num;
            setPin(newPin);
            setError(false);
            
            if (newPin.length === 4) {
                if (newPin === settings.pin) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => router.replace('/(tabs)'), 200);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setError(true);
                    setTimeout(() => setPin(''), 500);
                }
            }
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPin(pin.slice(0, -1));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                    <Lock size={32} color={Colors.primary} />
                </View>
                <Text style={[styles.title, { color: Colors.text }]}>Enter PIN</Text>
                <Text style={[styles.subtitle, { color: error ? '#ef4444' : Colors.textMuted }]}>
                    {error ? 'Incorrect PIN. Try again.' : 'Welcome back, ' + settings.userName}
                </Text>
            </View>

            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map(i => (
                    <View 
                        key={i} 
                        style={[
                            styles.dot, 
                            { 
                                backgroundColor: i < pin.length ? Colors.primary : 'transparent',
                                borderColor: error ? '#ef4444' : Colors.primary
                            }
                        ]} 
                    />
                ))}
            </View>

            <View style={styles.pad}>
                {[['1','2','3'], ['4','5','6'], ['7','8','9']].map((row, rIdx) => (
                    <View key={rIdx} style={styles.row}>
                        {row.map(num => (
                            <TouchableOpacity key={num} style={styles.key} onPress={() => handleKeyPress(num)}>
                                <Text style={[styles.keyText, { color: Colors.text }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
        <View style={styles.row}>
          <TouchableOpacity style={styles.key} onPress={handleBiometricAuth}>
            <Fingerprint size={32} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={[styles.keyText, { color: Colors.text }]}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Delete size={28} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.forgotBtn} 
          onPress={() => {
            Alert.alert(
              "Forgot PIN?", 
              "You can unlock using biometrics (FaceID/Fingerprint). If biometrics are not set up, you must reinstall the app to reset access.",
              [
                { text: "Try Biometrics", onPress: handleBiometricAuth },
                { text: "Cancel", style: 'cancel' }
              ]
            );
          }}
        >
          <Text style={[styles.forgotText, { color: Colors.textMuted }]}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  iconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14 },
  dotsContainer: { flexDirection: 'row', gap: 20, marginBottom: 60 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pad: { width: width * 0.8, maxWidth: 300, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%' },
  key: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, fontWeight: '500' },
  forgotBtn: { marginTop: 30, padding: 10 },
  forgotText: { fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' }
});
