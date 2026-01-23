import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [summary, setSummary] = useState({
    todaySales: 0,
    totalDebt: 0,
    lowStockCount: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. مبيعات اليوم
    const salesRow = await db.getFirstAsync("SELECT SUM(total_amount) as total FROM sales WHERE date LIKE ?", [`${today}%`]);
    // 2. إجمالي الديون المستحقة على العملاء
    const debtRow = await db.getFirstAsync("SELECT SUM(total_debt) as total FROM customers");
    // 3. منتجات أوشكت على النفاذ (أقل من 5 قطع مثلاً)
    const stockRow = await db.getFirstAsync("SELECT COUNT(*) as count FROM products WHERE stock < 5");

    setSummary({
      todaySales: (salesRow as any)?.total || 0,
      totalDebt: (debtRow as any)?.total || 0,
      lowStockCount: (stockRow as any)?.count || 0
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const QuickAction = ({ title, icon, color, route }: any) => (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={() => router.push(route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} tintColor="#00E676" />}
    >
      {/* Header بخش */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>أهلاً بك في</Text>
          <Text style={styles.appName}>فِند VEND</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={40} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* كروت الملخص السريع */}
      <View style={styles.summaryContainer}>
        <View style={styles.mainSummaryCard}>
          <Text style={styles.summaryLabel}>مبيعات اليوم</Text>
          <Text style={styles.summaryValue}>{summary.todaySales.toLocaleString()} ج.م</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>مباشر</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.subCard, { borderLeftColor: '#FF5252', borderLeftWidth: 4 }]}>
            <Text style={styles.subLabel}>ديون العملاء</Text>
            <Text style={[styles.subValue, { color: '#FF5252' }]}>{summary.totalDebt} ج.م</Text>
          </View>
          <View style={[styles.subCard, { borderLeftColor: '#FFC107', borderLeftWidth: 4 }]}>
            <Text style={styles.subLabel}>نواقص المخزن</Text>
            <Text style={[styles.subValue, { color: '#FFC107' }]}>{summary.lowStockCount} أصناف</Text>
          </View>
        </View>
      </View>

      {/* أزرار الوصول السريع */}
      <Text style={styles.sectionTitle}>الوصول السريع</Text>
      <View style={styles.actionsGrid}>
        <QuickAction title="فاتورة جديدة" icon="cart-outline" color="#00E676" route="/(tabs)/add-sale" />
        <QuickAction title="العملاء والديون" icon="people-outline" color="#448AFF" route="/(tabs)/customers" />
        <QuickAction title="المخزن" icon="cube-outline" color="#FF9800" route="/(tabs)/products" />
        <QuickAction title="التقارير" icon="bar-chart-outline" color="#E91E63" route="/(tabs)/reports" />
      </View>

      {/* نصيحة ذكية */}
      {/* <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={24} color="#00E676" />
        <Text style={styles.tipText}>
          لديك {summary.lowStockCount} منتجات قاربت على النفاذ، قم بمراجعة المخزن وتحديث الكميات.
        </Text>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  welcomeText: { color: '#666', fontSize: 16, textAlign: 'right' },
  appName: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'right' },
  profileBtn: { padding: 5 },
  
  summaryContainer: { marginBottom: 30 },
  mainSummaryCard: { backgroundColor: '#1C1C1E', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  summaryLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  summaryValue: { color: '#00E676', fontSize: 36, fontWeight: 'bold' },
  badge: { backgroundColor: 'rgba(0, 230, 118, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 10 },
  badgeText: { color: '#00E676', fontSize: 12, fontWeight: 'bold' },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subCard: { backgroundColor: '#1C1C1E', width: '48%', padding: 15, borderRadius: 15 },
  subLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  subValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#1C1C1E', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#2C2C2E' },
  iconContainer: { padding: 15, borderRadius: 15, marginBottom: 12 },
  actionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  tipCard: { flexDirection: 'row-reverse', backgroundColor: '#111', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 50, borderWidth: 1, borderColor: '#00E67633' },
  tipText: { color: '#AAA', fontSize: 13, flex: 1, textAlign: 'right', marginRight: 10 }
});