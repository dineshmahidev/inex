import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  KeyboardAvoidingView, 
  Platform 
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
        hasOnboarded: true 
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>Welcome to</Text>
            <Text style={[styles.brand, { color: Colors.primary }]}>Flow Ledger</Text>
            <Text style={[styles.subtitle, { color: Colors.textMuted }]}>Let's set up your profile to get started.</Text>
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
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={handleFinish}>
            <Text style={styles.btnText}>GET STARTED</Text>
            <ArrowRight size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 40, justifyContent: 'center' },
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
  btn: { height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 },
  btnText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
