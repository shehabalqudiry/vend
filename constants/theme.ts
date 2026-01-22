/**
 * Theme Constants matching the provided UI Design (Dark Mode & Green Branding).
 */

import { Platform } from 'react-native';

// الألوان المستخرجة من التصميم
const primaryGreen = '#00E676'; // اللون الأخضر الفاقع للأزرار والأرقام
const darkBackground = '#121212'; // الخلفية الداكنة جداً
const darkSurface = '#1E1E1E'; // لون الكروت (Cards) والقوائم
const errorRed = '#CF6679'; // لون الحذف والأخطاء

const tintColorLight = '#00C853';
const tintColorDark = primaryGreen;

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#F5F5F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E0E0E0',
    inputBackground: '#EEEEEE',
    danger: '#D32F2F',
  },
  dark: {
    text: '#FFFFFF', // النص الأبيض الأساسي
    textSecondary: '#B0B0B0', // النصوص الفرعية (مثل التواريخ أو العناوين الصغيرة)
    background: darkBackground, // الخلفية السوداء
    tint: tintColorDark, // اللون الأخضر المميز
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: darkSurface, // خلفية المربعات في الشاشة الرئيسية
    border: '#333333', // الفواصل الرفيعة
    inputBackground: '#2C2C2E', // خلفية حقول الإدخال والبحث
    danger: errorRed, // أيقونات الحذف
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Times New Roman',
    rounded: 'System', 
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});