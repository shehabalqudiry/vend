import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import db from '../../database/db';
import { useIsFocused } from '@react-navigation/native';

export default function HomeScreen() {
  const theme = Colors.dark;
  const router = useRouter();
  const isFocused = useIsFocused();

  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);

  const fetchData = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const salesToday = db.getFirstSync(
        "SELECT SUM(total_amount) as total, COUNT(id) as count FROM sales WHERE date LIKE ?",
        [`${today}%`]
      ) as { total: number, count: number };

      setStats({ total: salesToday?.total || 0, count: salesToday?.count || 0 });

      const lastSales = db.getAllSync("SELECT * FROM sales ORDER BY id DESC LIMIT 5") as any[];
      setRecentSales(lastSales);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused]);

  const handleOpenDetails = (sale: any) => {
    const items = db.getAllSync(
      `SELECT si.*, p.name, p.unit FROM sale_items si 
       JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`,
      [sale.id]
    ) as any[];
    setSelectedSale(sale);
    setSaleItems(items);
    setDetailModalVisible(true);
  };

  const handlePrint = async () => {
    const html = `
      <html dir="rtl">
        <body style="font-family: Arial; padding: 20px;">
          <h2 style="text-align:center;">فاتورة مبيعات #${selectedSale.id}</h2>
          <p>التاريخ: ${new Date(selectedSale.date).toLocaleString('ar-EG')}</p>
          <hr/>
          <table style="width:100%; text-align:right;">
            <tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>
            ${saleItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price_at_sale}</td></tr>`).join('')}
          </table>
          <hr/>
          <h3>الإجمالي: ${selectedSale.total_amount} ج.م</h3>
        </body>
      </html>
    `;
    await Print.printAsync({ html });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>مرحباً بك،</Text>
          <Text style={[styles.mainTitle, { color: theme.text }]}>لوحة التحكم</Text>
        </View>

        <View style={[styles.mainStatsCard, { backgroundColor: theme.tint }]}>
          <Text style={styles.mainStatsLabel}>إجمالي مبيعات اليوم</Text>
          <Text style={styles.mainStatsValue}>{stats.total.toFixed(2)} ج.م</Text>
          <Text style={styles.subStatsText}>{stats.count} عملية ناجحة اليوم</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card }]} onPress={() => router.push('/products')}>
            <Ionicons name="cube" size={24} color={theme.tint} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>المخزون</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card }]} onPress={() => router.push('/add-sale')}>
            <Ionicons name="barcode" size={24} color={theme.tint} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>بيع جديد</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={() => router.push('/reports')}><Text style={{ color: theme.tint }}>الكل</Text></TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>أحدث العمليات</Text>
        </View>

        {recentSales.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.saleCard, { backgroundColor: theme.card }]}
            onPress={() => handleOpenDetails(item)}
          >
            <View style={styles.priceTag}>
              <Text style={[styles.amountText, { color: theme.tint }]}>{item.total_amount.toFixed(2)}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>ج.م</Text>
            </View>
            <View style={styles.saleInfo}>
              <Text style={[styles.saleId, { color: theme.text }]}>فاتورة #{item.id}</Text>
              <View style={styles.dateRow}>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  {new Date(item.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
              <Ionicons name="chevron-back" size={18} color={theme.tint} />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>

      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>تفاصيل الفاتورة</Text>
              <View style={{width: 28}}/>
            </View>
            
            <FlatList
              data={saleItems}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemTotal, { color: theme.tint }]}>{(item.quantity * item.price_at_sale).toFixed(2)}</Text>
                  <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.quantity} {item.unit} × {item.price_at_sale}</Text>
                  </View>
                </View>
              )}
            />

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Text style={[styles.finalPrice, { color: theme.tint }]}>{selectedSale?.total_amount.toFixed(2)} ج.م</Text>
              <TouchableOpacity style={[styles.printBtn, { backgroundColor: theme.tint }]} onPress={handlePrint}>
                <Text style={styles.printBtnText}>طباعة</Text>
                <Ionicons name="print" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 20, alignItems: 'flex-end' },
  welcomeText: { fontSize: 14 },
  mainTitle: { fontSize: 26, fontWeight: 'bold' },
  mainStatsCard: { padding: 25, borderRadius: 25, marginBottom: 25 },
  mainStatsLabel: { color: '#000', fontSize: 15, opacity: 0.7 },
  mainStatsValue: { color: '#000', fontSize: 32, fontWeight: 'bold' },
  subStatsText: { color: '#000', fontSize: 12, marginTop: 5, fontWeight: '600', opacity: 0.6 },
  quickActions: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  actionBtn: { flex: 1, padding: 18, borderRadius: 20, alignItems: 'center', gap: 8 },
  actionBtnText: { fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Sale Card Style (مثل التقارير)
  saleCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 12 },
  priceTag: { alignItems: 'center', minWidth: 70 },
  amountText: { fontSize: 18, fontWeight: 'bold' },
  saleInfo: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  saleId: { fontSize: 15, fontWeight: 'bold' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12 },
  statusBadge: { padding: 5 },

  // Modal Style
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemTotal: { fontSize: 16, fontWeight: 'bold' },
  modalFooter: { paddingTop: 20, borderTopWidth: 1, alignItems: 'center' },
  finalPrice: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
  printBtn: { flexDirection: 'row', width: '100%', padding: 16, borderRadius: 15, justifyContent: 'center', alignItems: 'center', gap: 10 },
  printBtnText: { fontSize: 18, fontWeight: 'bold' }
});