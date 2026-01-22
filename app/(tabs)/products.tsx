import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import db from '@/database/db';
import { useRouter } from 'expo-router';

interface Product {
  id: number;
  name: string;
  price: number;
  barcode: string;
  stock: number;
  unit: string;
}

export default function ProductsScreen() {
  const isFocused = useIsFocused();
  const theme = Colors.dark;
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // حقول الإدخال
  const [form, setForm] = useState({ name: '', price: '', barcode: '', stock: '', unit: 'قطعة' });

  const units = ['قطعة', 'كرتونة', 'جالون', 'لتر', 'كيلو', 'كجم', 'متر', 'متر مربع', 'متر مكعب', 'كيلو متر مربع', 'كيلو متر مكعب'];

  const fetchProducts = useCallback(() => {
    try {
      const result = db.getAllSync('SELECT * FROM products ORDER BY id DESC') as Product[];
      setProducts(result);
    } catch (e) {
      console.error("خطأ في جلب المنتجات", e);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchProducts();
  }, [isFocused, fetchProducts]);

  const handleSave = () => {
    if (!form.name || !form.price) return Alert.alert('خطأ', 'الاسم والسعر مطلوبان');

    try {
      if (editingId) {
        db.runSync(
          'UPDATE products SET name=?, price=?, barcode=?, stock=?, unit=? WHERE id=?',
          [form.name, parseFloat(form.price), form.barcode, parseInt(form.stock) || 0, form.unit, editingId]
        );
      } else {
        db.runSync(
          'INSERT INTO products (name, price, barcode, stock, unit) VALUES (?, ?, ?, ?, ?)',
          [form.name, parseFloat(form.price), form.barcode, parseInt(form.stock) || 0, form.unit]
        );
      }
      closeModal();
      fetchProducts();
    } catch (e) { Alert.alert('خطأ', 'الباركود مكرر أو بيانات خاطئة'); }
  };

  const deleteProduct = (id: number) => {
    Alert.alert('حذف', 'هل أنت متأكد من حذف هذا المنتج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => {
        db.runSync('DELETE FROM products WHERE id = ?', [id]);
        fetchProducts();
      }}
    ]);
  };

  const resetStock = (id: number) => {
    db.runSync('UPDATE products SET stock = 0 WHERE id = ?', [id]);
    fetchProducts();
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setForm({ name: product.name, price: product.price?.toString() || '', barcode: product.barcode, stock: product.stock?.toString() || '0', unit: product.unit });
    } else {
      setEditingId(null);
      setForm({ name: '', price: '', barcode: '', stock: '0', unit: 'قطعة' });
    }
    setModalVisible(true);
  };

  const closeModal = () => { setModalVisible(false); setEditingId(null); };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-forward" size={28} color={theme.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>المخزون والمنتجات</Text>
        <TouchableOpacity onPress={() => openModal()}><Ionicons name="add-circle" size={32} color={theme.tint} /></TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardMain}>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.tint, fontWeight: 'bold' }}>{item.price} ج.م / {item.unit}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>متاح: {item.stock} {item.unit}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => resetStock(item.id)} style={styles.iconBtn}>
                  <Ionicons name="refresh" size={20} color="#FFA000" />
                </TouchableOpacity> */}
                <TouchableOpacity onPress={() => deleteProduct(item.id)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? 'تعديل منتج' : 'إضافة منتج'}</Text>
            
            <TextInput placeholder="اسم المنتج" placeholderTextColor="#666" style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
            <TextInput placeholder="السعر" keyboardType="numeric" placeholderTextColor="#666" style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]} value={form.price} onChangeText={(t) => setForm({...form, price: t})} />
            <TextInput placeholder="الكمية الافتتاحية" keyboardType="numeric" placeholderTextColor="#666" style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]} value={form.stock} onChangeText={(t) => setForm({...form, stock: t})} />
            <TextInput placeholder="الباركود" placeholderTextColor="#666" style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]} value={form.barcode} onChangeText={(t) => setForm({...form, barcode: t})} />
            
            <Text style={{ color: theme.text, marginBottom: 10, textAlign: 'right' }}>وحدة القياس:</Text>
            <View style={styles.unitContainer}>
              {units.map(u => (
                <TouchableOpacity key={u} onPress={() => setForm({...form, unit: u})} style={[styles.unitBadge, { backgroundColor: form.unit === u ? theme.tint : theme.inputBackground }]}>
                  <Text style={{ color: form.unit === u ? '#000' : theme.text }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: theme.tint }]} onPress={handleSave}><Text style={styles.btnText}>حفظ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn]} onPress={closeModal}><Text style={{ color: theme.danger }}>إلغاء</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: { marginHorizontal: 20, marginBottom: 10, borderRadius: 15, padding: 15 },
  cardMain: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  info: { alignItems: 'flex-end', flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', marginBottom: 5 },
  actions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center' },
  modalContent: { margin: 20, borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderRadius: 10, padding: 15, marginBottom: 15, textAlign: 'right' },
  unitContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  unitBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  modalButtons: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  btn: { flex: 0.45, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});