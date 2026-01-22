import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, FlatList, Modal, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import db from '../../database/db';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  total_debt: number;
}

export default function AddSaleScreen() {
  const theme = Colors.dark;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // حالات النوافذ المنبثقة
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="camera-outline" size={80} color={theme.icon} />
        <Text style={{ color: theme.text, textAlign: 'center', marginVertical: 20, fontSize: 16 }}>
          يحتاج التطبيق للوصول إلى الكاميرا لمسح الباركود
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.tint }]} onPress={requestPermission}>
          <Text style={styles.btnText}>إعطاء الإذن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addToCart = (product: { id: number, name: string, price: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    Vibration.vibrate(50);
  };

  const updateQuantity = (id: number, type: 'increase' | 'decrease') => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = type === 'increase' ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    Vibration.vibrate(20);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    const product = db.getFirstSync(
      'SELECT id, name, price FROM products WHERE barcode = ?',
      [data]
    ) as { id: number, name: string, price: number } | null;

    if (product) {
      addToCart(product);
      setTimeout(() => setScanned(false), 1500);
    } else {
      Alert.alert("غير موجود", `الباركود ${data} غير مسجل مسبقاً`, [{ text: "حسناً", onPress: () => setScanned(false) }]);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // دالة الحفظ المركزية
  const executeSale = (method: 'كاش' | 'آجل', customerId: number | null = null) => {
    try {
      db.withTransactionSync(() => {
        // 1. إدراج الفاتورة
        const result = db.runSync(
          'INSERT INTO sales (total_amount, payment_method, customer_id, date) VALUES (?, ?, ?, ?)', 
          [totalPrice, method, customerId, new Date().toISOString()]
        );
        const saleId = result.lastInsertRowId;

        // 2. تحديث المنتجات والبنود
        for (const item of cart) {
          db.runSync(
            'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)',
            [saleId, item.id, item.quantity, item.price]
          );
          db.runSync(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [item.quantity, item.id]
          );
        }

        // 3. إذا كان آجل، حدث مديونية العميل
        if (method === 'آجل' && customerId) {
          db.runSync(
            'UPDATE customers SET total_debt = total_debt + ? WHERE id = ?',
            [totalPrice, customerId]
          );
        }
      });

      Alert.alert("تم بنجاح", method === 'كاش' ? "تم حفظ العملية نقدياً" : "تمت إضافة المبلغ لحساب العميل");
      setCart([]);
      setPaymentModalVisible(false);
      setCustomerModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "فشل في إتمام العملية");
    }
  };

  const openCustomerPicker = async () => {
    try {
      const data = await db.getAllAsync('SELECT id, name, total_debt FROM customers') as Customer[];
      if (data.length === 0) {
        Alert.alert("تنبيه", "لا يوجد عملاء مسجلين، قم بإضافة عملاء أولاً من تبويب العملاء");
        return;
      }
      
      setCustomers(data); // تحديث الـ State
      setCustomerModalVisible(true); // فتح المودال
    } catch (error) {
      console.error("خطأ في جلب العملاء:", error);
      Alert.alert("خطأ", "فشل في تحميل قائمة العملاء");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* قسم الكاميرا */}
      <View style={styles.cameraSection}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128"] }}
        />
        <View style={styles.scannerOverlay}>
          <View style={[styles.scannerFrame, { borderColor: theme.tint }]} />
          <Text style={styles.helperText}>ضع الباركود داخل الإطار</Text>
        </View>
      </View>

      {/* قسم السلة */}
      <View style={[styles.cartSection, { backgroundColor: theme.card }]}>
        <View style={styles.cartHeader}>
          <TouchableOpacity onPress={() => setCart([])}>
            <Text style={{ color: theme.danger }}>مسح الكل</Text>
          </TouchableOpacity>
          <Text style={[styles.cartTitle, { color: theme.text }]}>الفاتورة الحالية</Text>
        </View>

        <FlatList
          data={cart}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.cartItem, { borderBottomColor: theme.border }]}>
              <View style={styles.leftPart}>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </TouchableOpacity>
                <Text style={[styles.itemTotal, { color: theme.tint }]}>{(item.price * item.quantity).toFixed(2)}</Text>
              </View>

              <View style={styles.centerPart}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, 'increase')} style={styles.qtyBtn}>
                  <Ionicons name="add" size={18} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, 'decrease')} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.rightPart}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.price} ج.م</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد منتجات مضافة</Text>}
        />

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalPrice, { color: theme.tint }]}>{totalPrice.toFixed(2)} ج.م</Text>
            <Text style={[styles.totalLabel, { color: theme.text }]}>الإجمالي النهائي</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: cart.length > 0 ? theme.tint : theme.icon }]}
            onPress={() => setPaymentModalVisible(true)}
            disabled={cart.length === 0}
          >
            <Text style={styles.saveBtnText}>تأكيد العملية</Text>
            <Ionicons name="checkmark-circle" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* مودال اختيار طريقة الدفع */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>طريقة الحساب</Text>
            
            <TouchableOpacity style={styles.payOption} onPress={() => executeSale('كاش')}>
              <Ionicons name="cash-outline" size={26} color={theme.tint} />
              <Text style={styles.payOptionText}>دفع نقدي (كاش)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.payOption, { borderColor: '#FF5252' }]} onPress={openCustomerPicker}>
              <Ionicons name="calendar-outline" size={26} color="#FF5252" />
              <Text style={[styles.payOptionText, { color: '#FF5252' }]}>تسجيل آجل (شكك)</Text>
            </TouchableOpacity>

            <Pressable onPress={() => setPaymentModalVisible(false)} style={{marginTop: 15}}>
              <Text style={{color: '#666'}}>رجوع</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* مودال اختيار العميل */}
      <Modal visible={customerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', width: '90%' }]}>
            <Text style={styles.modalTitle}>اختر العميل</Text>
            <FlatList
              data={customers}
              style={{ width: '100%' }}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.customerRow} 
                  onPress={() => executeSale('آجل', item.id)}
                >
                  <Text style={{ color: theme.tint, fontWeight: 'bold' }}>{item.total_debt} ج.م</Text>
                  <Text style={{ color: '#fff', fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{color:'#666', textAlign:'center', padding:20}}>لا يوجد عملاء مسجلين</Text>}
            />
            <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.closeBtn}>
              <Text style={{ color: '#fff' }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cameraSection: { flex: 0.8 },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  scannerFrame: { width: 220, height: 120, borderWidth: 2, borderRadius: 15 },
  helperText: { color: '#FFF', marginTop: 10, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, borderRadius: 5 },
  
  cartSection: { flex: 1.2, borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -20, padding: 20 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cartTitle: { fontSize: 18, fontWeight: 'bold' },
  
  cartItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5, alignItems: 'center' },
  rightPart: { flex: 2, alignItems: 'flex-end' },
  centerPart: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  leftPart: { flex: 1.5, flexDirection: 'row', alignItems: 'center' },
  
  itemName: { fontSize: 15, fontWeight: '600' },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  deleteBtn: { padding: 5, marginRight: 8 },
  itemTotal: { fontWeight: 'bold', fontSize: 14 },
  
  footer: { paddingTop: 15, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalPrice: { fontSize: 22, fontWeight: 'bold' },
  saveBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  btn: { padding: 15, borderRadius: 10 },
  btnText: { fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 30 },

  // ستايلات المودال الجديدة بنفس لغة التصميم
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 25, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 25 },
  payOption: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
  payOptionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 18, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeBtn: { marginTop: 15, padding: 12, width: '100%', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 10 }
});