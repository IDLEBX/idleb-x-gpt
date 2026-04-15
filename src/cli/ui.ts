// src/cli/ui.ts
import color from "picocolors";
import { BOT_INFO } from "../config.js";

export const print = (text: string) => {
  console.log(color.green("◇") + "  " + text);
};

export const printError = (text: string) => {
  console.log(color.red("◇") + "  " + text);
};

export const printIntro = () => {
  console.log("");
  console.log(color.bgCyan(color.white(` ${BOT_INFO.name} `)));
  console.log("|" + "─".repeat(65) + "|");
  console.log(`| اقوى بوت واتساب بالذكاء الاصطناعي |`);
  console.log(`| مطور: ${BOT_INFO.developer.padEnd(45)} |`);
  console.log(`| Instagram: ${BOT_INFO.instagram.padEnd(42)} |`);
  console.log(`| GitHub: ${BOT_INFO.github.padEnd(46)} |`);
  console.log("|" + "─".repeat(65) + "|");
  console.log("");
};

export const printQRCode = (qr: string) => {
  console.log(qr);
  console.log("🔐 قم بمسح رمز QR هذا لتسجيل الدخول إلى واتساب ويب...");
};

export const printLoading = () => {
  console.log("⏳ جاري تحميل البوت...");
};

export const printAuthenticated = () => {
  console.log("✅ تم المصادقة بنجاح، بدء الجلسة!");
};

export const printAuthenticationFailure = () => {
  console.log("❌ فشل المصادقة!");
};

export const printOutro = () => {
  console.log("");
  console.log("🚀 البوت جاهز للاستخدام!");
  console.log(`📢 ${BOT_INFO.name} يعمل الآن`);
  console.log(`👨‍💻 للمساعدة: @${BOT_INFO.instagram}`);
  console.log("");
};
