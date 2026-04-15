// src/database/subscription.ts
import sqlite3 from 'sqlite3';
import { BOT_INFO, MESSAGES } from '../config';

let db: sqlite3.Database;

export interface User {
  phoneNumber: string;
  name: string;
  messageCount: number;
  maxMessages: number;
  subscriptionType: 'free' | 'basic' | 'pro' | 'unlimited';
  subscriptionExpiry: string | null;
  totalMessagesUsed: number;
  createdAt: string;
  lastResetAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceTRY: number;
  messagesPerDay: number;
  durationDays: number;
  features: string[];
}

// خطط الاشتراك بالدولار والليرة التركية (مناسبة لسوريا)
export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'مجاني',
    price: 0,
    priceTRY: 0,
    messagesPerDay: 5,
    durationDays: 30,
    features: ['📨 5 رسائل يومياً', '🤖 GPT-3.5', '💬 دردشة نصية فقط']
  },
  {
    id: 'basic',
    name: 'أساسي',
    price: 2,
    priceTRY: 60,
    messagesPerDay: 100,
    durationDays: 30,
    features: ['📨 100 رسالة يومياً', '🧠 GPT-4', '🎨 توليد صور DALL-E', '🎤 دعم صوتي']
  },
  {
    id: 'pro',
    name: 'احترافي',
    price: 5,
    priceTRY: 150,
    messagesPerDay: 500,
    durationDays: 30,
    features: ['📨 500 رسالة يومياً', '🧠 GPT-4 + DALL-E', '🌐 ترجمة فورية', '📄 تحليل ملفات', '⚡ أولوية في الرد']
  },
  {
    id: 'unlimited',
    name: 'غير محدود',
    price: 10,
    priceTRY: 300,
    messagesPerDay: 999999,
    durationDays: 30,
    features: ['📨 رسائل غير محدودة', '👑 جميع الميزات', '💎 دعم VIP', '🔌 API مخصص']
  }
];

// تهيئة قاعدة البيانات
export function initDatabase() {
  db = new sqlite3.Database('./subscriptions.db');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      phoneNumber TEXT PRIMARY KEY,
      name TEXT,
      messageCount INTEGER DEFAULT 0,
      maxMessages INTEGER DEFAULT 5,
      subscriptionType TEXT DEFAULT 'free',
      subscriptionExpiry TEXT,
      totalMessagesUsed INTEGER DEFAULT 0,
      createdAt TEXT,
      lastResetAt TEXT
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phoneNumber TEXT,
      amount REAL,
      planId TEXT,
      transactionId TEXT,
      status TEXT,
      createdAt TEXT,
      FOREIGN KEY (phoneNumber) REFERENCES users(phoneNumber)
    )
  `);
  
  console.log('✅ قاعدة البيانات جاهزة');
}

// إضافة مستخدم جديد
export async function addUser(phoneNumber: string, name: string = ''): Promise<User> {
  return new Promise((resolve, reject) => {
    const today = new Date().toDateString();
    const now = new Date().toISOString();
    
    const newUser: User = {
      phoneNumber,
      name,
      messageCount: 0,
      maxMessages: PLANS[0].messagesPerDay,
      subscriptionType: 'free',
      subscriptionExpiry: null,
      totalMessagesUsed: 0,
      createdAt: now,
      lastResetAt: today
    };
    
    db.run(
      `INSERT OR REPLACE INTO users (phoneNumber, name, messageCount, maxMessages, subscriptionType, subscriptionExpiry, totalMessagesUsed, createdAt, lastResetAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newUser.phoneNumber, newUser.name, newUser.messageCount, newUser.maxMessages, newUser.subscriptionType, newUser.subscriptionExpiry, newUser.totalMessagesUsed, newUser.createdAt, newUser.lastResetAt],
      (err) => {
        if (err) reject(err);
        else resolve(newUser);
      }
    );
  });
}

// جلب معلومات المستخدم
export async function getUser(phoneNumber: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE phoneNumber = ?`,
      [phoneNumber],
      (err, row: User) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

// التحقق من صلاحية المستخدم وعدد الرسائل
export async function checkUserLimit(phoneNumber: string): Promise<{
  allowed: boolean;
  remaining: number;
  plan: SubscriptionPlan;
  message: string;
  user: User | null;
}> {
  return new Promise((resolve, reject) => {
    const today = new Date().toDateString();
    
    db.get(
      `SELECT * FROM users WHERE phoneNumber = ?`,
      [phoneNumber],
      async (err, user: User) => {
        if (err) {
          reject(err);
          return;
        }
        
        // إذا كان المستخدم جديد، نضيفه
        if (!user) {
          const newUser = await addUser(phoneNumber, '');
          const plan = PLANS.find(p => p.id === 'free')!;
          resolve({
            allowed: true,
            remaining: plan.messagesPerDay,
            plan,
            user: newUser,
            message: `🌟 *مرحباً بك في ${BOT_INFO.name}!* 🌟\n\n✨ أنت الآن في *الباقة المجانية*\n📨 لديك ${plan.messagesPerDay} رسالة مجانية يومياً\n\n💎 للترقية والميزات المدفوعة:\n📷 تواصل: @${BOT_INFO.instagram}\n💻 GitHub: ${BOT_INFO.github}`
          });
          return;
        }
        
        // التحقق من تاريخ إعادة التعيين
        if (user.lastResetAt !== today) {
          db.run(
            `UPDATE users SET messageCount = 0, lastResetAt = ? WHERE phoneNumber = ?`,
            [today, phoneNumber]
          );
          user.messageCount = 0;
          user.lastResetAt = today;
        }
        
        // جلب خطة المستخدم
        let plan = PLANS.find(p => p.id === user.subscriptionType);
        if (!plan) plan = PLANS[0];
        
        // التحقق من انتهاء الاشتراك
        if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
          db.run(
            `UPDATE users SET subscriptionType = 'free', maxMessages = ? WHERE phoneNumber = ?`,
            [PLANS[0].messagesPerDay, phoneNumber]
          );
          user.subscriptionType = 'free';
          user.maxMessages = PLANS[0].messagesPerDay;
          plan = PLANS[0];
        }
        
        const remaining = plan.messagesPerDay - user.messageCount;
        
        if (remaining <= 0) {
          resolve({
            allowed: false,
            remaining: 0,
            plan,
            user,
            message: `⚠️ *لقد استنفذت رسائلك اليومية!* ⚠️\n\n📊 *إحصائيات اليوم:*\n• استخدمت: ${user.messageCount} من ${plan.messagesPerDay}\n• متبقي: 0\n\n💎 *للترقية:*\n📷 انستجرام: @${BOT_INFO.instagram}\n💻 GitHub: ${BOT_INFO.github}\n\n💰 *أسعار الباقات:*\n• أساسي: $2 (60 ليرة تركية)\n• احترافي: $5 (150 ليرة)\n• غير محدود: $10 (300 ليرة)`
          });
          return;
        }
        
        resolve({
          allowed: true,
          remaining,
          plan,
          user,
          message: `✅ *متبقي لك اليوم:* ${remaining} رسالة\n💎 *باقتك:* ${plan.name}`
        });
      }
    );
  });
}

// تحديث عدد الرسائل بعد الاستخدام
export async function incrementMessageCount(phoneNumber: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET messageCount = messageCount + 1, totalMessagesUsed = totalMessagesUsed + 1 WHERE phoneNumber = ?`,
      [phoneNumber],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// تفعيل اشتراك مدفوع
export async function activateSubscription(
  phoneNumber: string, 
  planId: string, 
  transactionId: string,
  amount: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) {
      resolve(false);
      return;
    }
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.durationDays);
    
    db.run(
      `UPDATE users SET subscriptionType = ?, maxMessages = ?, subscriptionExpiry = ? WHERE phoneNumber = ?`,
      [planId, plan.messagesPerDay, expiryDate.toISOString(), phoneNumber],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        db.run(
          `INSERT INTO payments (phoneNumber, amount, planId, transactionId, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [phoneNumber, amount, planId, transactionId, 'completed', new Date().toISOString()],
          (err2) => {
            if (err2) reject(err2);
            else resolve(true);
          }
        );
      }
    );
  });
}

// جلب إحصائيات المستخدم
export async function getUserStats(phoneNumber: string): Promise<string> {
  const user = await getUser(phoneNumber);
  if (!user) return "❌ لا توجد بيانات للمستخدم";
  
  const plan = PLANS.find(p => p.id === user.subscriptionType) || PLANS[0];
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString('ar') : 'غير محدد';
  
  return `
📊 *إحصائيات حسابك في ${BOT_INFO.name}*

👤 *رقمك:* ${user.phoneNumber}
💎 *الباقة:* ${plan.name}
📨 *الحد اليومي:* ${user.messageCount} / ${plan.messagesPerDay}
📈 *إجمالي الرسائل:* ${user.totalMessagesUsed}
📅 *تاريخ الاشتراك:* ${new Date(user.createdAt).toLocaleDateString('ar')}
⏰ *ينتهي في:* ${expiry}

💎 *للترقية:* تواصل مع المطور @${BOT_INFO.instagram}
  `;
      }
