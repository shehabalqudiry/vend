import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Application from 'expo-application'; // المكتبة الجديدة
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../constants/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ActivationScreen() {
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [inputKey, setInputKey] = useState('');
  const router = useRouter();
  const theme = Colors.dark;

  useEffect(() => {
    loadDeviceId();
  }, []);

  const loadDeviceId = async () => {
    try {
      const id = Application.getAndroidId() || "UNKNOWN_ID";
      setDeviceId(id.toUpperCase());
    } catch (e) {
      Alert.alert("خطأ", "تعذر جلب معرف الجهاز");
    } finally {
      setLoading(false);
    }
  };

  const validateKey = async () => {
    const prefix = "9pQ";
    const suffix = "Z2!";
    const expectedKey = (prefix + deviceId.split('').reverse().join('') + suffix).toUpperCase();

    if (inputKey.trim().toUpperCase() === expectedKey) {
      await SecureStore.setItemAsync('isActivated', 'true');
      Alert.alert("تم التفعيل", "مرحباً بك في VEND", [
        { text: "ابدأ الآن", onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert("خطأ", "كود التفعيل غير مطابق لهذا الجهاز.");
    }
  };

  const copyId = async () => {
    await Clipboard.setStringAsync(deviceId);
    Alert.alert("تم النسخ", "ارسل الرمز للمبرمج لتفعيل النسخة");
  };

  if (loading) return <ActivityIndicator size="large" style={{flex:1, backgroundColor:'#000'}} />;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Ionicons name="hardware-chip-outline" size={80} color={theme.tint} />
      <Text style={[styles.title, { color: '#fff' }]}>تفعيل الجهاز</Text>
      
      <TouchableOpacity onPress={copyId} style={styles.idBox}>
        <Text style={styles.deviceIdText}>{deviceId}</Text>
        <Ionicons name="copy-outline" size={20} color={theme.tint} />
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { color: '#fff', borderColor: '#333' }]}
        placeholder="أدخل كود التفعيل"
        placeholderTextColor="#666"
        value={inputKey}
        onChangeText={setInputKey}
      />

      <TouchableOpacity style={[styles.btn, { backgroundColor: theme.tint }]} onPress={validateKey}>
        <Text style={styles.btnText}>تفعيل الآن</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  idBox: { flexDirection: 'row', backgroundColor: '#1C1C1E', padding: 15, borderRadius: 12, width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  deviceIdText: { color: '#00E676', fontWeight: 'bold' },
  input: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 15, textAlign: 'center', marginBottom: 20, backgroundColor: '#111' },
  btn: { width: '100%', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 18 }
}); 