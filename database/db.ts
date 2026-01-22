import * as SQLite from 'expo-sqlite';

// اسم قاعدة البيانات ثابت هنا لضمان عدم التكرار
export const DATABASE_NAME = 'vend_v2.db';

const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const initDatabase = async () => {
  try {
    // تفعيل القيود البرمجية (Foreign Keys) لضمان ربط الفواتير بالعملاء
    await db.execAsync(`PRAGMA foreign_keys = ON;`);

    // إنشاء الجداول (لن يتم مسح البيانات القديمة لأننا نستخدم IF NOT EXISTS)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          barcode TEXT UNIQUE,
          stock INTEGER DEFAULT 0,
          unit TEXT DEFAULT 'قطعة'
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        total_debt REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'كاش',
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price_at_sale REAL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);
    console.log("Database & Tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export default db;