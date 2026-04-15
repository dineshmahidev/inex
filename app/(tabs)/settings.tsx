import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  TextInput,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useDatabase } from '@/hooks/useDatabase';
import { 
    Moon, 
    Sun, 
    Lock, 
    Trash2, 
    User, 
    Camera, 
    Download, 
    Upload, 
    ChevronRight,
    CircleDashed,
    ShieldCheck,
    RefreshCw,
    Edit2,
    Settings
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, setSettings, clearAllData, exportData, importData, refresh, Colors } = useDatabase();
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(settings.userName);

  const toggleTheme = () => {
    setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSettings({ ...settings, userImage: result.assets[0].uri });
    }
  };

  const handleSaveName = () => {
    setSettings({ ...settings, userName: userName });
    setIsEditingName(false);
  };

  const handleExport = async () => {
    try {
        await exportData();
    } catch (e) {
        Alert.alert("Export Failed", "Could not create backup.");
    }
  };

  const handleImport = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
          if (!result.canceled) {
              const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
              await importData(content);
              Alert.alert("Success", "Data imported successfully! The UI will refresh.", [
                  { text: "OK", onPress: () => refresh() }
              ]);
          }
      } catch (e) {
          Alert.alert("Import Failed", "The file might be corrupted or invalid.");
      }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.profileHeader}>
                <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
                    {settings.userImage ? (
                        <Image source={{ uri: settings.userImage }} style={styles.profilePic} />
                    ) : (
                        <View style={[styles.placeholderPic, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                            <User size={40} color={Colors.textMuted} />
                        </View>
                    )}
                    <View style={[styles.cameraIcon, { backgroundColor: Colors.primary }]}>
                        <Camera size={14} color="#000" />
                    </View>
                </TouchableOpacity>

                <View style={styles.nameContainer}>
                    {isEditingName ? (
                        <View style={styles.editRow}>
                            <TextInput 
                                style={[styles.nameInput, { color: Colors.text, borderBottomColor: Colors.primary }]}
                                value={userName}
                                onChangeText={setUserName}
                                autoFocus
                            />
                            <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                                <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>SAVE</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.nameRow}>
                            <Text style={[styles.profileName, { color: Colors.text }]}>{settings.userName}</Text>
                            <View style={[styles.editBadge, { backgroundColor: Colors.primary + '20' }]}>
                                <Edit2 size={12} color={Colors.primary} />
                            </View>
                        </TouchableOpacity>
                    )}
                    <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}>Elite Member</Text>
                </View>
            </View>

            {/* General Settings */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>PREFERENCES</Text>
                <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                {settings.theme === 'dark' ? <Moon size={18} color={Colors.primary} /> : <Sun size={18} color={Colors.primary} />}
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Dark Mode</Text>
                        </View>
                        <Switch 
                            value={settings.theme === 'dark'} 
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#333', true: Colors.primary }}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditingName(true)}>
                        <View style={styles.settingLeft}>
                             <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                <User size={18} color={Colors.primary} />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Change Name</Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                <Lock size={18} color={Colors.primary} />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Data Lock</Text>
                        </View>
                        <Switch 
                            value={settings.isLocked} 
                            onValueChange={(v) => {
                                if(!settings.pin && v) Alert.alert("PIN required", "Set a PIN in Security first.");
                                else setSettings({ ...settings, isLocked: v });
                            }}
                            trackColor={{ false: '#333', true: Colors.primary }}
                        />
                    </View>
                </View>
            </View>

            {/* Data Management */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>PORTABILITY</Text>
                <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                    <TouchableOpacity style={styles.settingItem} onPress={handleExport}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                                <Upload size={18} color="#10B981" />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Export Backup</Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    <TouchableOpacity style={styles.settingItem} onPress={handleImport}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                                <Download size={18} color="#3B82F6" />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Import JSON</Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    <TouchableOpacity style={styles.settingItem} onPress={() => {
                        Alert.alert("Reset App", "This will wipe all data. Continue?", [
                            { text: "Cancel" },
                            { text: "WIPE ALL", style: 'destructive', onPress: clearAllData }
                        ]);
                    }}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                                <Trash2 size={18} color="#EF4444" />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Factory Reset</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>SECURITY</Text>
                <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                    <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy')}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                <ShieldCheck size={18} color={Colors.primary} />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.text }]}>Privacy Policy</Text>
                        </View>
                        <ChevronRight size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.versionText, { color: Colors.text }]}>INEX SMART FINANCE</Text>
                <Text style={[styles.footerInfo, { color: Colors.textMuted }]}>V 1.0.5 • SECURE & OFFLINE</Text>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  profileHeader: { alignItems: 'center', padding: 30, gap: 15 },
  imageContainer: { width: 90, height: 90, borderRadius: 45, position: 'relative' },
  profilePic: { width: 90, height: 90, borderRadius: 45 },
  placeholderPic: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  nameContainer: { alignItems: 'center' },
  profileName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameInput: { fontSize: 22, fontWeight: '900', borderBottomWidth: 2, minWidth: 140, textAlign: 'center' },
  saveBtn: { padding: 5 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 5 },
  card: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  footer: { alignItems: 'center', padding: 40, gap: 4 },
  versionText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  footerInfo: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
});
