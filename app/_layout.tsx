import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME, initDatabase } from '@/database/db';

export default function RootLayout() {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // تشغيل قاعدة البيانات
    initDatabase();
    // فحص التفعيل
    checkActivation();
  }, []);

  const checkActivation = async () => {
    try {
      const activated = await SecureStore.getItemAsync('isActivated');
      setIsActivated(activated === 'true');
    } catch (e) {
      setIsActivated(false);
    }
  };

  // شاشة تحميل بسيطة حتى يتم فحص التفعيل
  if (isActivated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          {!isActivated ? (
            <Stack.Screen name="activation" options={{ gestureEnabled: false }} />
          ) : (
            <Stack.Screen name="(tabs)" />
          )}
        </Stack>
        <StatusBar style="auto" />
      </SQLiteProvider>
    </ThemeProvider>
  );
}