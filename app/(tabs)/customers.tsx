import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
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
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [collectModalVisible, setCollectModalVisible] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);

    const fetchPaymentHistory = async (customerId: number) => {
        const result = await db.getAllAsync(
            'SELECT * FROM debt_payments WHERE customer_id = ? ORDER BY payment_date DESC',
            [customerId]
        ) as any[];
        setPaymentHistory(result);
        setHistoryModalVisible(true);
    };

    const fetchCustomers = async () => {
        const result = await db.getAllAsync('SELECT * FROM customers ORDER BY total_debt DESC');
        setCustomers(result);
        setLoading(false);
    };

    const addCustomer = async () => {
        if (!newName) return;
        await db.runAsync('INSERT INTO customers (name, phone, total_debt) VALUES (?, ?, 0)', [newName, newPhone]);
        setNewName('');
        setNewPhone('');
        setModalVisible(false);
        await fetchCustomers();
    };

    const handlePayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;

        try {
            const amount = parseFloat(paymentAmount);

            await db.runAsync(
                'INSERT INTO debt_payments (customer_id, amount_paid, payment_date) VALUES (?, ?, ?)',
                [selectedCustomer.id, amount, new Date().toISOString()]
            );

            await db.runAsync(
                'UPDATE customers SET total_debt = total_debt - ? WHERE id = ?',
                [amount, selectedCustomer.id]
            );

            Alert.alert("تم التحصيل", `تم خصم ${amount} ج.م من حساب ${selectedCustomer.name}`);
            setCollectModalVisible(false);
            setPaymentAmount('');
            fetchCustomers();
        } catch (e) {
            Alert.alert("خطأ", "فشل في تسجيل عملية الدفع");
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCustomers();
        }, [])
    );

    if (loading) return <ActivityIndicator size="large" style={{ flex: 1, backgroundColor: '#000' }} />;

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <View style={styles.header}>
                <Text style={styles.title}>العملاء</Text>
                <Ionicons name="people-circle-outline" size={32} color={theme.tint} />
            </View>

            <FlatList
                data={customers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.idBox}
                        onPress={() => {
                            setSelectedCustomer(item);
                            setCollectModalVisible(true);
                        }}
                    >
                        <View style={styles.idBox}>
                            <TouchableOpacity
                                onPress={() => fetchPaymentHistory(item.id)}
                                style={{ padding: 10 }}
                            >
                                <Ionicons name="time-outline" size={24} color={theme.tint} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.customerName}>
                                    {item.name}
                                </Text>
                                <Text style={styles.customerPhone}>{item.phone || 'بدون هاتف'}</Text>
                            </View>
                            <View style={styles.debtInfo}>
                                <Text style={styles.debtLabel}>المديونية</Text>
                                <Text style={[styles.deviceIdText, { color: item.total_debt > 0 ? '#FF5252' : '#00E676' }]}>
                                    {item.total_debt} ج.م
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.tint }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={30} color="#000" />
            </TouchableOpacity>
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
            <Modal visible={collectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="cash-outline" size={50} color={theme.tint} style={{ marginBottom: 10 }} />
                        <Text style={styles.modalTitle}>تحصيل من: {selectedCustomer?.name}</Text>

                        <View style={[styles.idBox, { backgroundColor: '#000', borderWidth: 1, borderColor: '#333' }]}>
                            <Text style={{ color: '#666' }}>الدين الحالي:</Text>
                            <Text style={{ color: '#FF5252', fontWeight: 'bold', fontSize: 18 }}>{selectedCustomer?.total_debt} ج.م</Text>
                        </View>

                        <TextInput
                            style={[styles.input, { color: '#fff', borderColor: '#333', marginTop: 20 }]}
                            placeholder="أدخل المبلغ المدفوع"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                        />

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: '#00E676' }]}
                            onPress={handlePayment}
                        >
                            <Text style={[styles.btnText, { color: '#000' }]}>تأكيد التحصيل</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setCollectModalVisible(false)} style={{ marginTop: 20 }}>
                            <Text style={{ color: '#666' }}>إلغاء</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={historyModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <Text style={styles.modalTitle}>سجل مدفوعات {selectedCustomer?.name}</Text>

                        <FlatList
                            data={paymentHistory}
                            style={{ width: '100%' }}
                            renderItem={({ item }) => (
                                <View style={[styles.idBox, { backgroundColor: '#111' }]}>
                                    <Text style={{ color: '#00E676', fontWeight: 'bold' }}>{item.amount_paid} ج.م</Text>
                                    <View>
                                        <Text style={{ color: '#fff', textAlign: 'right' }}>تحصيل نقدي</Text>
                                        <Text style={{ color: '#666', fontSize: 16, textAlign: 'right' }}>
                                            {new Date(item.payment_date).toLocaleDateString('ar-EG')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>لا توجد دفعات سابقة</Text>}
                        />

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: '#333' }]}
                            onPress={() => setHistoryModalVisible(false)}
                        >
                            <Text style={{ color: '#fff' }}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 10
    },
    idBox: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        padding: 18,
        borderRadius: 15,
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E'
    },
    customerName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right'
    },
    customerPhone: {
        color: '#666',
        fontSize: 13,
        marginTop: 4,
        textAlign: 'right'
    },
    debtInfo: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    debtLabel: {
        color: '#666',
        fontSize: 11,
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deviceIdText: {
        fontWeight: 'bold',
        fontSize: 17,
        color: '#00E676'
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        textAlign: 'center',
        marginBottom: 15,
        backgroundColor: '#111',
        fontSize: 18,
        fontWeight: 'bold'
    },
    btn: {
        width: '100%',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    btnText: {
        fontWeight: 'bold',
        fontSize: 16
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 65,
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        padding: 25
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    }
});