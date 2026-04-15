// src/handlers/message.ts
import { Message, Client } from "whatsapp-web.js";
import { checkUserLimit, incrementMessageCount } from "../database/subscription";
import { getConfig } from "./ai-config";
import { MESSAGES, BOT_INFO } from "../config";
import { chatgpt } from "../providers/openai";

// أوامر البوت
const COMMANDS: { [key: string]: (msg: Message, args: string, from: string) => Promise<void> } = {};

// أمر عرض الخطط
COMMANDS["!خطط"] = async (msg, args, from) => {
  const { handlePlans } = await import("./subscription");
  await handlePlans(msg);
};

// أمر عرض إحصائياتي
COMMANDS["!احصائياتي"] = async (msg, args, from) => {
  const { handleMyStats } = await import("./subscription");
  await handleMyStats(msg, from);
};

// أمر تفعيل اشتراك (للمطور فقط)
COMMANDS["!تفعيل"] = async (msg, args, from) => {
  const { handleActivateSubscription } = await import("./subscription");
  const argsArray = args.split(" ");
  await handleActivateSubscription(msg, from, argsArray);
};

// أمر مساعدة
COMMANDS["!مساعدة"] = async (msg, args, from) => {
  const helpText = `
🌟 *${BOT_INFO.name} - المساعدة* 🌟

📌 *الأوامر المتاحة:*

• *!خطط* - عرض باقات الاشتراك
• *!احصائياتي* - عرض إحصائيات حسابك
• *!مساعدة* - عرض هذه المساعدة

💬 *للدردشة:* فقط اكتب سؤالك مباشرة

━━━━━━━━━━━━━━━
👨‍💻 المطور: ${BOT_INFO.developer}
📷 Instagram: ${BOT_INFO.instagram}
  `;
  await msg.reply(helpText);
};

// معالجة الرسائل العادية (GPT)
async function handleNormalMessage(message: Message, client: Client, prompt: string, from: string) {
  try {
    // التحقق من الـ limit
    const { allowed, remaining, plan, message: limitMessage } = await checkUserLimit(from);
    
    if (!allowed) {
      await message.reply(limitMessage);
      return;
    }

    // إرسال رسالة مؤقتة
    await message.reply(`🤔 *${BOT_INFO.name} يفكر...*\n✨ متبقي لك اليوم: ${remaining} رسالة\n━━━━━━━━━━━━━━━`);

    // استدعاء OpenRouter API
    const response = await chatgpt.sendMessage(prompt);
    const reply = response.text;

    // زيادة عدد الرسائل
    await incrementMessageCount(from);

    // إرسال الرد
    const finalReply = `${reply}\n\n━━━━━━━━━━━━━━━\n💬 متبقي: ${remaining - 1} رسالة | 💎 باقتك: ${plan.name}`;
    await message.reply(finalReply);
    
  } catch (error: any) {
    console.error("Error in handleNormalMessage:", error);
    await message.reply(`❌ عذراً، حدث خطأ: ${error.message || "حاول مرة أخرى"}`);
  }
}

// الوظيفة الرئيسية لمعالجة الرسائل
export async function handleIncomingMessage(message: Message, client: Client) {
  try {
    const from = message.from;
    let body = message.body || "";
    const chat = await message.getChat();
    const isGroup = chat.isGroup;
    
    // الحصول على رقم المرسل
    let senderNumber = from;
    if (from.includes("@c.us")) {
      senderNumber = from.split("@")[0];
    }
    
    // تنظيف النص
    body = body.trim();
    
    // إذا كان البادئات معطلة والرسالة موجهة للبوت
    const isMentioned = message.mentionedIds?.some(id => id.includes(client.info.wid._serialized)) || false;
    
    // التحقق إذا كانت رسالة خاصة أو منشن في المجموعة
    const shouldReply = !isGroup || isMentioned || body.startsWith(`@${BOT_INFO.name}`);
    
    if (!shouldReply) return;
    
    // إزالة المنشن من النص
    let cleanPrompt = body;
    if (isMentioned && message.mentionedIds) {
      for (const mention of message.mentionedIds) {
        const contact = await client.getContactById(mention);
        cleanPrompt = cleanPrompt.replace(`@${contact.number}`, "").trim();
      }
    }
    cleanPrompt = cleanPrompt.replace(`@${BOT_INFO.name}`, "").trim();
    
    // التحقق من الأوامر
    if (cleanPrompt.startsWith("!")) {
      const parts = cleanPrompt.split(" ");
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(" ");
      
      if (COMMANDS[command]) {
        await COMMANDS[command](message, args, senderNumber);
        return;
      }
    }
    
    // إذا كان النص فارغاً
    if (!cleanPrompt) {
      await message.reply(MESSAGES.welcome);
      return;
    }
    
    // معالجة كرسالة عادية للـ GPT
    await handleNormalMessage(message, client, cleanPrompt, senderNumber);
    
  } catch (error: any) {
    console.error("Error in handleIncomingMessage:", error);
    await message.reply("❌ عذراً، حدث خطأ غير متوقع. حاول مرة أخرى.");
  }
}
