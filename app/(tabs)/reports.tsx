import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import db from '../../database/db';
import { useIsFocused } from '@react-navigation/native';

interface SaleRecord {
  id: number;
  total_amount: number;
  date: string;
  payment_method: string;
}

export default function ReportsScreen() {
  const theme = Colors.dark;
  const isFocused = useIsFocused();
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [totals, setTotals] = useState({ daily: 0, monthly: 0 });

  const fetchReports = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7); // YYYY-MM

      const dailyRes = db.getFirstSync(
        "SELECT SUM(total_amount) as sum FROM sales WHERE date LIKE ?",
        [`${today}%`]
      ) as any;

      const monthlyRes = db.getFirstSync(
        "SELECT SUM(total_amount) as sum FROM sales WHERE date LIKE ?",
        [`${month}%`]
      ) as any;

      setTotals({
        daily: dailyRes?.sum || 0,
        monthly: monthlyRes?.sum || 0
      });

      const history = db.getAllSync("SELECT * FROM sales ORDER BY id DESC") as SaleRecord[];
      setSalesHistory(history);

    } catch (error) {
      console.error("Error fetching reports", error);
    }
  };

  useEffect(() => {
    if (isFocused) fetchReports();
  }, [isFocused]);

  const renderSaleCard = ({ item }: { item: SaleRecord }) => (
    <View style={[styles.saleCard, { backgroundColor: theme.card }]}>
      <View style={styles.priceTag}>
        <Text style={[styles.amountText, { color: theme.tint }]}>{item.total_amount.toFixed(2)}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>ج.م</Text>
      </View>
      
      <View style={styles.saleInfo}>
        <Text style={[styles.saleId, { color: theme.text }]}>فاتورة #{item.id}</Text>
        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {new Date(item.date).toLocaleDateString('ar-EG')} | {new Date(item.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
          </Text>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
        </View>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
        <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>تقارير المبيعات</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>مبيعات الشهر</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{totals.monthly.toFixed(0)}</Text>
          <View style={styles.trendLine} />
        </View>
        
        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.tint, borderWidth: 1 }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>مبيعات اليوم</Text>
          <Text style={[styles.statValue, { color: theme.tint }]}>{totals.daily.toFixed(0)}</Text>
          <View style={[styles.trendLine, { backgroundColor: theme.tint }]} />
        </View>
      </View>

      <Text style={[styles.listTitle, { color: theme.text }]}>سجل العمليات</Text>

      <FlatList
        data={salesHistory}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={theme.icon} />
            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>لا توجد مبيعات مسجلة بعد</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 25 },
  statBox: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', overflow: 'hidden' },
  statLabel: { fontSize: 12, marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  trendLine: { position: 'absolute', bottom: 0, width: '100%', height: 4, backgroundColor: '#333' },

  listTitle: { paddingHorizontal: 25, fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  saleCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  priceTag: { alignItems: 'center', minWidth: 70 },
  amountText: { fontSize: 18, fontWeight: 'bold' },
  saleInfo: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  saleId: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12 },
  statusBadge: { padding: 8, borderRadius: 12 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 }
});