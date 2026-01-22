import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const fadeAnim = new Animated.Value(0); // للظهور التدريجي
    const scaleAnim = new Animated.Value(0.8); // لتكبير اللوجو قليلاً

    useEffect(() => {
        // تشغيل الأنيميشن (ظهور + تكبير بسيط)
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();

        const checkLogic = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const activated = await SecureStore.getItemAsync('isActivated');

            if (activated === 'true' && activated !== null) {
                router.replace('/(tabs)');
            } else {
                router.replace('/activation');
            }
        };

        checkLogic();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                <Image
                    source={require('../assets/images/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1E25', // اللون الأسود الصريح الذي تريده
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.5, // 50% من عرض الشاشة
        height: width * 0.5,
    },
});