import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useDatabase } from '@/context/DatabaseContext';
import { useRouter } from 'expo-router';
import { Lock, Fingerprint, Delete, RefreshCw } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LockScreen() {
    const { settings, setSettings, Colors } = useDatabase();
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [newPin, setNewPin] = useState('');
    const isAuthenticating = useRef(false);

    useEffect(() => {
        // Biometrics auto-prompt removed as per user request
    }, []);

    const handleBiometricAuth = async () => {
        if (isAuthenticating.current) return;
        
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            
            if (!hasHardware || !isEnrolled) {
                Alert.alert("Biometrics Unavailable", "Please use your PIN to unlock.");
                return;
            }

            isAuthenticating.current = true;
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Tracksy',
                fallbackLabel: 'Use PIN',
                disableDeviceFallback: false,
            });

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)');
            }
        } catch (e) {
            console.error("Auth error:", e);
        } finally {
            isAuthenticating.current = false;
        }
    };

    const handleResetPin = async () => {
        if (isAuthenticating.current) return;

        try {
            isAuthenticating.current = true;
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify identity to reset PIN',
            });

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsResetting(true);
                setPin('');
            }
        } finally {
            isAuthenticating.current = false;
        }
    };

    const handleKeyPress = (num: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        if (isResetting) {
            if (newPin.length < 4) {
                const np = newPin + num;
                setNewPin(np);
                if (np.length === 4) {
                    setSettings({ ...settings, pin: np });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert("Success", "PIN has been reset.", [
                        { text: "Continue", onPress: () => router.replace('/(tabs)') }
                    ]);
                }
            }
            return;
        }

        if (pin.length < 4) {
            const currentPin = pin + num;
            setPin(currentPin);
            setError(false);
            
            if (currentPin.length === 4) {
                if (currentPin === settings.pin) {
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
        if (isResetting) {
            setNewPin(newPin.slice(0, -1));
        } else if (pin.length > 0) {
            setPin(pin.slice(0, -1));
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                    {isResetting ? <RefreshCw size={32} color={Colors.primary} /> : <Lock size={32} color={Colors.primary} />}
                </View>
                <Text style={[styles.title, { color: Colors.text }]}>
                    {isResetting ? 'Set New PIN' : 'Enter PIN'}
                </Text>
                <Text style={[styles.subtitle, { color: error ? '#ef4444' : Colors.textMuted }]}>
                    {isResetting ? 'Enter a new 4-digit PIN' : (error ? 'Incorrect PIN. Try again.' : 'Welcome back, ' + settings.userName)}
                </Text>
            </View>

            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map(i => (
                    <View 
                        key={i} 
                        style={[
                            styles.dot, 
                            { 
                                backgroundColor: i < (isResetting ? newPin.length : pin.length) ? Colors.primary : 'transparent',
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
                    <View style={styles.key} />
                    <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
                        <Text style={[styles.keyText, { color: Colors.text }]}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.key} onPress={handleDelete}>
                        <Delete size={28} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {!isResetting && (
                    <TouchableOpacity 
                        style={styles.forgotBtn} 
                        onPress={() => {
                            Alert.alert(
                                "Forgot PIN?", 
                                "Use biometrics to verify and reset your PIN.",
                                [
                                    { text: "Verify with Biometrics", onPress: handleResetPin },
                                    { text: "Cancel", style: 'cancel' }
                                ]
                            );
                        }}
                    >
                        <Text style={[styles.forgotText, { color: Colors.textMuted }]}>Forgot PIN?</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
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
