// src/handlers/subscription.ts
import { Message } from "whatsapp-web.js";
import { getUserStats, PLANS, activateSubscription } from "../database/subscription";
import { BOT_INFO } from "../config";

// أمر عرض الخطط
export async function handlePlans(message: Message) {
  let plansText = `💎 *باقات ${BOT_INFO.name}* 💎\n\n`;
  
  for (const plan of PLANS) {
    if (plan.id === 'free') continue;
    plansText += `━━━━━━━━━━━━━━━━━━━━\n`;
    plansText += `📌 *${plan.name}*\n`;
    plansText += `💰 ${plan.price} دولار | ${plan.priceTRY} ليرة تركية\n`;
    plansText += `📨 ${plan.messagesPerDay.toLocaleString()} رسالة/يوم\n`;
    plansText += `📅 ${plan.durationDays} يوم\n`;
    plansText += `✨ الميزات:\n`;
    for (const feature of plan.features) {
      plansText += `   • ${feature}\n`;
    }
  }
  
  plansText += `━━━━━━━━━━━━━━━━━━━━\n`;
  plansText += `💳 *طرق الدفع:*\n`;
  plansText += `• USDT (TRC20)\n`;
  plansText += `• ليرة تركية (Ziraat Bankası)\n`;
  plansText += `• دولار (Western Union)\n\n`;
  plansText += `📞 *للاشتراك:* تواصل مع المطور @${BOT_INFO.instagram}\n`;
  plansText += `💬 أرسل معرف العملية بعد الدفع لتفعيل الاشتراك`;
  
  await message.reply(plansText);
}

// أمر عرض إحصائيات المستخدم
export async function handleMyStats(message: Message, from: string) {
  const stats = await getUserStats(from);
  await message.reply(stats);
}

// أمر لتفعيل الاشتراك (للمطور فقط)
export async function handleActivateSubscription(
  message: Message, 
  from: string, 
  args: string[]
) {
  // التحقق من أن المرسل هو المطور
  const developerNumber = process.env.DEVELOPER_PHONE || "";
  if (from !== developerNumber && from !== `972${developerNumber}`) {
    await message.reply("❌ هذا الأمر للمطور فقط!");
    return;
  }
  
  if (args.length < 3) {
    await message.reply(`⚠️ *طريقة الاستخدام:*\n!activate <رقم الهاتف> <معرف الخطة> <رقم العملية>\n\n📌 *الخطط المتاحة:*\n${PLANS.filter(p => p.id !== 'free').map(p => `• ${p.id}: ${p.name} - ${p.price}$`).join('\n')}`);
    return;
  }
  
  const [targetPhone, planId, transactionId] = args;
  const plan = PLANS.find(p => p.id === planId);
  
  if (!plan) {
    await message.reply(`❌ خطة غير موجودة! الخطط المتاحة: ${PLANS.filter(p => p.id !== 'free').map(p => p.id).join(', ')}`);
    return;
  }
  
  const success = await activateSubscription(targetPhone, planId, transactionId, plan.price);
  
  if (success) {
    await message.reply(`✅ *تم تفعيل الاشتراك بنجاح!*\n\n👤 المستخدم: ${targetPhone}\n💎 الباقة: ${plan.name}\n📅 المدة: ${plan.durationDays} يوم\n🆔 رقم العملية: ${transactionId}\n\n🔓 تم تفعيل ${plan.messagesPerDay.toLocaleString()} رسالة يومياً للمستخدم`);
  } else {
    await message.reply("❌ حدث خطأ أثناء تفعيل الاشتراك");
  }
}
