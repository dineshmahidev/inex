import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { useDatabase } from '@/hooks/useDatabase';
import { useRouter } from 'expo-router';
import { Camera, User, ArrowRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { settings, setSettings, Colors } = useDatabase();
  const router = useRouter();
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [currency, setCurrency] = useState(settings?.currency || '₹');

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleFinish = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    setSettings({ 
        ...settings, 
        userName: name, 
        userImage: image, 
        currency: currency,
        hasOnboarded: true 
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Image 
            source={require('../assets/splash_logo.png')} 
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 160,
              height: 160,
              opacity: 0.15, // Keep it as a nice watermark or slightly faded so it doesn't block text
              transform: [{ rotate: '10deg' }]
            }}
            resizeMode="contain"
          />

          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>Welcome to</Text>
            <Text style={[styles.brand, { color: Colors.primary }]}>Tracksy</Text>
            <Text style={[styles.subtitle, { color: Colors.textMuted }]}>{"Let's set up your profile to get started."}</Text>
          </View>

          <TouchableOpacity onPress={handlePickImage} style={styles.imageBox}>
            {image ? (
                <Image source={{ uri: image }} style={styles.pic} />
            ) : (
                <View style={[styles.placeholder, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                    <User size={50} color={Colors.textMuted} />
                    <View style={[styles.cam, { backgroundColor: Colors.primary }]}>
                        <Camera size={16} color="#000" />
                    </View>
                </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: Colors.textMuted }]}>WHAT SHOULD WE CALL YOU?</Text>
            <TextInput 
                style={[styles.input, { color: Colors.text, borderBottomColor: Colors.border }]}
                placeholder="Enter your name"
                placeholderTextColor="#555"
                value={name}
                onChangeText={setName}
            />

            <Text style={[styles.label, { color: Colors.textMuted, marginTop: 30 }]}>SELECT PREFERRED CURRENCY</Text>
            <View style={styles.currencyRow}>
              {['₹', '$', '€', '£'].map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[
                    styles.currencyBtn, 
                    { borderColor: Colors.border },
                    currency === c && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                  ]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[
                    styles.currencyText, 
                    { color: Colors.text },
                    currency === c && { color: '#000', fontWeight: '900' }
                  ]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={handleFinish}>
            <Text style={styles.btnText}>GET STARTED</Text>
            <ArrowRight size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => {
            setSettings({ ...settings, hasOnboarded: true });
            router.replace('/(tabs)');
          }}>
            <Text style={[styles.skipBtnText, { color: Colors.textMuted }]}>SKIP FOR NOW</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 40, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700' },
  brand: { fontSize: 48, fontWeight: '900', marginTop: -5 },
  subtitle: { fontSize: 16, marginTop: 15, lineHeight: 24 },
  imageBox: { alignSelf: 'center', marginVertical: 40 },
  pic: { width: 140, height: 140, borderRadius: 70 },
  placeholder: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  cam: { position: 'absolute', bottom: 5, right: 5, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#000' },
  inputSection: { marginBottom: 60 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
  input: { fontSize: 24, fontWeight: '800', borderBottomWidth: 1, paddingBottom: 10 },
  currencyRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  currencyBtn: { padding: 15, borderRadius: 12, borderWidth: 1, flex: 1, alignItems: 'center', justifyContent: 'center' },
  currencyText: { fontSize: 22, fontWeight: '600' },
  btn: { height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 },
  btnText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skipBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  skipBtnText: { fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' },
});
