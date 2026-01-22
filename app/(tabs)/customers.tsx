import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

export default function CustomersScreen() {
  const db = useSQLiteContext();
  const theme = Colors.dark; // التأكد من استخدام نفس الثيم
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchCustomers = async () => {
    const result = await db.getAllAsync('SELECT * FROM customers ORDER BY total_debt DESC');
    setCustomers(result);
    setLoading(false);
  };

  const addCustomer = async () => {
    if (!newName) return;
    
    // 1. إضافة للداتابيز
    await db.runAsync('INSERT INTO customers (name, phone, total_debt) VALUES (?, ?, 0)', [newName, newPhone]);
    
    // 2. تصفير الحقول
    setNewName(''); 
    setNewPhone('');
    setModalVisible(false);
  
    // 3. تحديث القائمة فوراً (لحظياً)
    await fetchCustomers(); 
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  if (loading) return <ActivityIndicator size="large" style={{flex:1, backgroundColor:'#000'}} />;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.title}>العملاء</Text>
        <Ionicons name="people-circle-outline" size={32} color={theme.tint} />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.idBox}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerPhone}>{item.phone || 'بدون هاتف'}</Text>
            </View>
            <View style={styles.debtInfo}>
              <Text style={styles.debtLabel}>المديونية</Text>
              <Text style={[styles.deviceIdText, { color: item.total_debt > 0 ? '#FF5252' : '#00E676' }]}>
                {item.total_debt} ج.م
              </Text>
            </View>
          </View>
        )}
      />

      {/* زر الإضافة بنفس ستايل زر التفعيل ولكن دائري (FAB) */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.tint }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* مودال الإضافة بنفس روح التصميم */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.title, { color: '#fff', fontSize: 20 }]}>إضافة عميل</Text>
            
            <TextInput
              style={[styles.input, { color: '#fff', borderColor: '#333' }]}
              placeholder="اسم العميل"
              placeholderTextColor="#666"
              value={newName}
              onChangeText={setNewName}
            />
            
            <TextInput
              style={[styles.input, { color: '#fff', borderColor: '#333' }]}
              placeholder="رقم الهاتف"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.tint }]} onPress={addCustomer}>
              <Text style={styles.btnText}>حفظ العميل</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: '#666' }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginRight: 10 },
  idBox: { 
    flexDirection: 'row', 
    backgroundColor: '#1C1C1E', 
    padding: 15, 
    borderRadius: 12, 
    width: '100%', 
    justifyContent: 'space-between', 
    marginBottom: 10,
    alignItems: 'center'
  },
  customerName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  customerPhone: { color: '#666', fontSize: 14 },
  debtInfo: { alignItems: 'flex-start', marginStart: 20 },
  debtLabel: { color: '#666', fontSize: 10, marginBottom: 10 },
  deviceIdText: { fontWeight: 'bold', fontSize: 16 },
  
  input: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 15, textAlign: 'right', marginBottom: 15, backgroundColor: '#111' },
  btn: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' }
});