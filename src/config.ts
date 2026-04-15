// src/handlers/ai-config.ts
import { config } from "../config";

// تعريف هيكل الـ AI Config
export interface IAiConfig {
  gpt: {
    apiKey: string;
    maxModelTokens: number;
  };
  dalle: {
    size: string;
  };
  general: {
    whitelist: string[];
    settings: any;
  };
  transcription: {
    enabled: boolean;
    mode: string;
  };
  tts: {
    enabled: boolean;
  };
  sd: {
    model: string;
  };
  commandsMap: {
    [key: string]: any;
  };
}

// القيم الافتراضية للإعدادات
export const aiConfig: IAiConfig = {
  gpt: {
    apiKey: process.env.OPENAI_API_KEY || "",
    maxModelTokens: parseInt(process.env.MAX_MODEL_TOKENS || "4096"),
  },
  dalle: {
    size: process.env.DALLE_IMAGE_SIZE || "1024x1024",
  },
  general: {
    whitelist: process.env.WHITELISTED_PHONE_NUMBERS?.split(",") || [],
    settings: {},
  },
  transcription: {
    enabled: process.env.TRANSCRIPTION_ENABLED === "true",
    mode: process.env.TRANSCRIPTION_MODE || "local",
  },
  tts: {
    enabled: process.env.TTS_ENABLED === "true",
  },
  sd: {
    model: process.env.STABLE_DIFFUSION_MODEL || "runwayml/stable-diffusion-v1-5",
  },
  commandsMap: {},
};

// تهيئة الإعدادات
export function initAiConfig() {
  console.log("🚀 تهيئة إعدادات الذكاء الاصطناعي...");
  
  // التأكد من وجود مفتاح API
  if (!aiConfig.gpt.apiKey) {
    console.warn("⚠️ تحذير: OPENAI_API_KEY غير موجود في ملف .env");
    console.warn("⚠️ البوت راح يشتغل لكن بدون ذكاء اصطناعي!");
  } else {
    console.log(`✅ تم العثور على مفتاح API: ${aiConfig.gpt.apiKey.substring(0, 15)}...`);
  }
  
  console.log(`📌 إعدادات GPT:`);
  console.log(`   • maxModelTokens: ${aiConfig.gpt.maxModelTokens}`);
  console.log(`📌 إعدادات DALL-E:`);
  console.log(`   • size: ${aiConfig.dalle.size}`);
  console.log(`📌 إعدادات الترجمة الصوتية:`);
  console.log(`   • enabled: ${aiConfig.transcription.enabled}`);
  console.log(`   • mode: ${aiConfig.transcription.mode}`);
  console.log(`📌 إعدادات تحويل النص لكلام:`);
  console.log(`   • enabled: ${aiConfig.tts.enabled}`);
  
  console.log("✅ تم تهيئة الإعدادات بنجاح!");
}

// جلب قيمة إعداد معين
export function getConfig(module: keyof IAiConfig, key: string): any {
  try {
    const moduleConfig = aiConfig[module];
    if (moduleConfig && moduleConfig[key as keyof typeof moduleConfig] !== undefined) {
      return moduleConfig[key as keyof typeof moduleConfig];
    }
    return null;
  } catch (error) {
    console.error(`خطأ في جلب الإعداد: ${module}.${key}`, error);
    return null;
  }
}

// تعيين قيمة إعداد معين
export function setConfig(module: keyof IAiConfig, key: string, value: any): boolean {
  try {
    const moduleConfig = aiConfig[module];
    if (moduleConfig) {
      (moduleConfig as any)[key] = value;
      console.log(`✅ تم تحديث الإعداد: ${module}.${key} = ${value}`);
      
      // تطبيق التغييرات المهمة فوراً
      if (module === "gpt" && key === "maxModelTokens") {
        console.log(`🔄 تم تحديث maxModelTokens إلى ${value}`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`خطأ في تعيين الإعداد: ${module}.${key}`, error);
    return false;
  }
}

// جلب جميع الإعدادات كنص
export function getAllConfigs(): string {
  let result = "📋 *إعدادات البوت الحالية*\n\n";
  
  result += "🤖 *GPT Settings:*\n";
  result += `   • API Key: ${aiConfig.gpt.apiKey ? "✅ موجود" : "❌ غير موجود"}\n`;
  result += `   • Max Tokens: ${aiConfig.gpt.maxModelTokens}\n\n`;
  
  result += "🎨 *DALL-E Settings:*\n";
  result += `   • Image Size: ${aiConfig.dalle.size}\n\n`;
  
  result += "👥 *General Settings:*\n";
  result += `   • Whitelist: ${aiConfig.general.whitelist.length > 0 ? aiConfig.general.whitelist.join(", ") : "الكل مسموح"}\n\n`;
  
  result += "🎤 *Transcription Settings:*\n";
  result += `   • Enabled: ${aiConfig.transcription.enabled ? "✅" : "❌"}\n`;
  result += `   • Mode: ${aiConfig.transcription.mode}\n\n`;
  
  result += "🔊 *TTS Settings:*\n";
  result += `   • Enabled: ${aiConfig.tts.enabled ? "✅" : "❌"}\n\n`;
  
  result += "🖼️ *Stable Diffusion:*\n";
  result += `   • Model: ${aiConfig.sd.model}\n`;
  
  return result;
}

// تصدير كل شيء
export default { aiConfig, initAiConfig, getConfig, setConfig, getAllConfigs };
