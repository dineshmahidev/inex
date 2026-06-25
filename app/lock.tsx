import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Animated } from 'react-native';
import { useDatabase } from '@/context/DatabaseContext';
import { useRouter } from 'expo-router';
import { Lock, Fingerprint, Delete, RefreshCw, DeleteIcon } from 'lucide-react-native';
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

    // Animating PIN dots
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const brandColor = Colors?.primary || "#F472B6"; // Dynamic brand color

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 80, useNativeDriver: true })
        ]).start();
    };

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
                router.replace('/splash-transition');
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
                        { text: "Continue", onPress: () => router.replace('/splash-transition') }
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
                    setTimeout(() => router.replace('/splash-transition'), 200);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setError(true);
                    triggerShake();
                    setTimeout(() => setPin(''), 600);
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

    const dotsCount = isResetting ? newPin.length : pin.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            {/* Top Logo Header */}
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: brandColor }]}>
                    {isResetting ? (
                        <RefreshCw size={32} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                        <Lock size={30} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                </View>
                <Text style={styles.title}>
                    {isResetting ? 'Set New PIN' : 'Enter PIN'}
                </Text>
                <Text style={[styles.subtitle, error && { color: '#EF4444', fontWeight: "700" }]}>
                    {isResetting 
                        ? 'Enter a new 4-digit PIN' 
                        : (error ? 'Incorrect PIN. Try again.' : `Welcome back, ${settings.userName || 'Kiro'}`)}
                </Text>
            </View>

            {/* Minimally Gorgeous PIN Dots */}
            <Animated.View 
                style={[
                    styles.dotsContainer,
                    { transform: [{ translateX: shakeAnimation }] }
                ]}
            >
                {[0, 1, 2, 3].map(i => {
                    const active = i < dotsCount;
                    return (
                        <View 
                            key={i} 
                            style={[
                                styles.dot, 
                                active && {
                                    backgroundColor: brandColor,
                                    borderColor: brandColor,
                                    transform: [{ scale: 1.15 }]
                                },
                                error && {
                                    borderColor: '#EF4444',
                                    backgroundColor: '#EF4444'
                                }
                            ]} 
                        />
                    );
                })}
            </Animated.View>

            {/* Sleek Raised Keypad */}
            <View style={styles.pad}>
                {[['1','2','3'], ['4','5','6'], ['7','8','9']].map((row, rIdx) => (
                    <View key={rIdx} style={styles.row}>
                        {row.map(num => (
                            <TouchableOpacity 
                                key={num} 
                                style={[styles.key, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }]} 
                                onPress={() => handleKeyPress(num)}
                                activeOpacity={0.65}
                            >
                                <Text style={[styles.keyText, { color: '#171717' }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                <View style={styles.row}>
                    {/* Left: Biometrics Unlock */}
                    <TouchableOpacity 
                        style={[styles.key, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }]} 
                        onPress={handleBiometricAuth}
                        activeOpacity={0.6}
                    >
                        <Fingerprint size={26} color={brandColor} strokeWidth={2.5} />
                    </TouchableOpacity>
                    
                    {/* Center: 0 */}
                    <TouchableOpacity 
                        style={[styles.key, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }]} 
                        onPress={() => handleKeyPress('0')}
                        activeOpacity={0.65}
                    >
                        <Text style={[styles.keyText, { color: '#171717' }]}>0</Text>
                    </TouchableOpacity>
                    
                    {/* Right: Backspace Delete */}
                    <TouchableOpacity 
                        style={[styles.key, { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' }]} 
                        onPress={handleDelete}
                        activeOpacity={0.6}
                    >
                        <Delete size={26} color={brandColor} />
                    </TouchableOpacity>
                </View>

                {/* Reset Link */}
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
                        <Text style={[styles.forgotText, { color: brandColor }]}>Forgot PIN?</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    header: { 
        alignItems: 'center', 
        marginBottom: 40 
    },
    iconBox: { 
        width: 76, 
        height: 76, 
        borderRadius: 38, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1
    },
    title: { 
        fontSize: 24, 
        fontWeight: '900', 
        color: "#171717",
        marginBottom: 8,
        letterSpacing: -0.5
    },
    subtitle: { 
        fontSize: 14, 
        color: "#6B7280",
        fontWeight: "500" 
    },
    dotsContainer: { 
        flexDirection: 'row', 
        gap: 22, 
        marginBottom: 50 
    },
    dot: { 
        width: 14, 
        height: 14, 
        borderRadius: 7, 
        borderWidth: 2, 
        borderColor: "#E2E8F0",
        backgroundColor: "transparent"
    },
    pad: { 
        width: width * 0.8, 
        maxWidth: 300, 
        alignItems: 'center' 
    },
    row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 16, 
        width: '100%' 
    },
    key: { 
        width: 72, 
        height: 72, 
        borderRadius: 36, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1
    },
    specialKey: {
        backgroundColor: "transparent",
        borderWidth: 0,
        elevation: 0,
        shadowOpacity: 0
    },
    keyText: { 
        fontSize: 26, 
        fontWeight: '700', 
    },
    forgotBtn: { 
        marginTop: 24, 
        padding: 10 
    },
    forgotText: { 
        fontSize: 13, 
        fontWeight: '700', 
        textTransform: "uppercase",
        letterSpacing: 0.5
    }
});
