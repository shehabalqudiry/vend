import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Share } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'day' | 'week' | 'month';

export default function ReportsScreen() {
  const db = useSQLiteContext();
  const [filter, setFilter] = useState<FilterType>('day');
  const [stats, setStats] = useState({
    totalSales: 0,
    cashAmount: 0,
    creditAmount: 0,
    collectedAmount: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (selectedFilter: FilterType) => {
    let dateCondition = "";
    let params: string[] = [];

    if (selectedFilter === 'day') {
      const today = new Date().toISOString().split('T')[0];
      dateCondition = "LIKE ?";
      params = [`${today}%`];
    } else if (selectedFilter === 'week') {
      dateCondition = ">= date('now', '-7 days')";
    } else if (selectedFilter === 'month') {
      dateCondition = ">= date('now', 'start of month')";
    }

    try {
      const salesQuery = `SELECT SUM(total_amount) as total FROM sales WHERE date ${dateCondition}`;
      const cashQuery = `SELECT SUM(total_amount) as total FROM sales WHERE payment_method = 'كاش' AND date ${dateCondition}`;
      const creditQuery = `SELECT SUM(total_amount) as total FROM sales WHERE payment_method = 'آجل' AND date ${dateCondition}`;
      const collectedQuery = `SELECT SUM(amount_paid) as total FROM debt_payments WHERE payment_date ${dateCondition}`;

      const [salesRow, cashRow, creditRow, collectedRow] = await Promise.all([
        db.getFirstAsync(salesQuery, params),
        db.getFirstAsync(cashQuery, params),
        db.getFirstAsync(creditQuery, params),
        db.getFirstAsync(collectedQuery, params),
      ]);

      const mixedHistory = await db.getAllAsync(`
        SELECT s.id, s.total_amount as amount, s.payment_method as type, s.date, c.name as customer_name, 'SALE' as category
        FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.date ${dateCondition}
        UNION ALL
        SELECT p.id, p.amount_paid as amount, 'نقدًا' as type, p.payment_date as date, c.name as customer_name, 'COLLECTION' as category
        FROM debt_payments p JOIN customers c ON p.customer_id = c.id
        WHERE p.payment_date ${dateCondition}
        ORDER BY date DESC LIMIT 20
      `, params);

      setRecentSales(mixedHistory);
      setStats({
        totalSales: (salesRow as any)?.total || 0,
        cashAmount: (cashRow as any)?.total || 0,
        creditAmount: (creditRow as any)?.total || 0,
        collectedAmount: (collectedRow as any)?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats(filter);
    }, [filter])
  );

  // دالة تصدير التقرير لمشاركته
  const shareReport = async () => {
    const filterNames = { day: 'اليوم', week: 'آخر 7 أيام', month: 'هذا الشهر' };
    let reportText = `📊 *تقرير مبيعات (${filterNames[filter]})*\n`;
    reportText += `--------------------------\n`;
    reportText += `💰 إجمالي المبيعات: ${stats.totalSales} ج.م\n`;
    reportText += `💵 كاش محصل: ${stats.cashAmount} ج.م\n`;
    reportText += `💳 ديون صادرة: ${stats.creditAmount} ج.m\n`;
    reportText += `📥 تحصيل مديونيات: ${stats.collectedAmount} ج.م\n`;
    reportText += `--------------------------\n`;
    reportText += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`;

    try {
      await Share.share({ message: reportText });
    } catch (error) {
      Alert.alert("خطأ", "فشل في مشاركة التقرير");
    }
  };

  const FilterBtn = ({ type, label }: { type: FilterType, label: string }) => (
    <TouchableOpacity 
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]} 
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(filter)} tintColor="#00E676" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={shareReport} style={styles.shareIcon}>
            <Ionicons name="share-social-outline" size={24} color="#00E676" />
        </TouchableOpacity>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.headerTitle}>تقارير الأداء</Text>
            <Ionicons name="stats-chart" size={26} color="#00E676" style={{marginLeft: 10}} />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FilterBtn type="month" label="الشهر الحالي" />
        <FilterBtn type="week" label="آخر 7 أيام" />
        <FilterBtn type="day" label="اليوم" />
      </View>

      <View style={[styles.mainCard, { borderColor: '#222' }]}>
        <Text style={styles.cardLabel}>إجمالي المبيعات (كاش + آجل)</Text>
        <Text style={styles.mainAmount}>{stats.totalSales.toLocaleString()} ج.م</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Ionicons name="cash-outline" size={22} color="#00E676" />
          <Text style={styles.smallLabel}>كاش محصل</Text>
          <Text style={styles.smallAmount}>{stats.cashAmount.toLocaleString()} ج.م</Text>
        </View>
        <View style={styles.smallCard}>
          <Ionicons name="time-outline" size={22} color="#FF5252" />
          <Text style={styles.smallLabel}>ديون صادرة</Text>
          <Text style={styles.smallAmount}>{stats.creditAmount.toLocaleString()} ج.م</Text>
        </View>
      </View>

      <View style={[styles.mainCard, { marginTop: 15, backgroundColor: '#0A1A12', borderColor: '#00E67633' }]}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <Ionicons name="wallet-outline" size={22} color="#00E676" style={{ marginLeft: 8 }} />
          <Text style={[styles.cardLabel, { color: '#00E676' }]}>إجمالي الديون المحصلة</Text>
        </View>
        <Text style={[styles.mainAmount, { color: '#00E676', fontSize: 26 }]}>
          {stats.collectedAmount.toLocaleString()} ج.م
        </Text>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>سجل العمليات للفترة المختارة</Text>
        {recentSales.map((item: any, index) => (
          <View key={`${item.category}-${item.id}-${index}`} style={[
            styles.historyItem, 
            { borderRightColor: item.category === 'COLLECTION' ? '#00E676' : (item.type === 'آجل' ? '#FF5252' : '#333') }
          ]}>
            <View style={styles.leftInfo}>
              <Text style={[styles.amountText, { color: item.category === 'COLLECTION' ? '#00E676' : (item.type === 'آجل' ? '#FF5252' : '#fff') }]}>
                {item.category === 'COLLECTION' ? `+ ${item.amount}` : `${item.amount}`} ج.م
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} • {new Date(item.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.rightInfo}>
              <Text style={styles.customerNameText}>
                {item.category === 'COLLECTION' ? `تحصيل: ${item.customer_name}` : (item.type === 'آجل' ? item.customer_name : 'بيع نقدي')}
              </Text>
              <View style={[styles.badge, { backgroundColor: item.category === 'COLLECTION' ? 'rgba(0,230,118,0.1)' : '#222' }]}>
                <Text style={[styles.badgeText, { color: item.category === 'COLLECTION' ? '#00E676' : '#888' }]}>
                  {item.category === 'COLLECTION' ? 'تحصيل مديونية' : (item.type === 'آجل' ? 'فاتورة آجلة' : 'بيع كاش')}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 45, marginBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  shareIcon: { padding: 8, backgroundColor: '#1C1C1E', borderRadius: 10 },
  filterContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#1C1C1E', borderRadius: 12, padding: 5 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: { backgroundColor: '#2C2C2E' },
  filterText: { color: '#666', fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#00E676' },
  mainCard: { backgroundColor: '#1C1C1E', padding: 22, borderRadius: 18, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  cardLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  mainAmount: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  smallCard: { backgroundColor: '#1C1C1E', width: '48%', padding: 18, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  smallLabel: { color: '#888', fontSize: 11, marginVertical: 6 },
  smallAmount: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  historySection: { marginTop: 25, marginBottom: 80 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  historyItem: { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderRightWidth: 4 },
  leftInfo: { alignItems: 'flex-start' },
  rightInfo: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  dateText: { color: '#666', fontSize: 10, marginTop: 4 },
  customerNameText: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: 'bold' },
});