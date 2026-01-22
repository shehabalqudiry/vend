import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'المنتجات',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="list-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-sale"
        options={{
          title: 'إضافة بيع',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="add-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'التقارير',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="bar-chart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'العملاء',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
