import process from "process";

import { TranscriptionMode } from "./types/transcription-mode";
import { TTSMode } from "./types/tts-mode";
import { AWSPollyEngine } from "./types/aws-polly-engine";

// Environment variables
import dotenv from "dotenv";
dotenv.config();

// معلومات البوت الجديدة
export const BOT_INFO = {
  name: "IDLEB X GPT",
  developer: "IDLEB X",
  instagram: "xlb_me",
  github: "IDLEBX",
  version: "2.0.0",
  website: "https://github.com/IDLEBX"
};

export const MESSAGES = {
  welcome: `🌟 *مرحباً بك في IDLEB X GPT* 🌟

أنا بوت ذكاء اصطناعي مصمم خصيصاً لك!

📢 المطور: IDLEB X
📷 انستجرام: xlb_me
💻 GitHub: IDLEX

✨ استمتع بالتجربة!`,

  footer: `\n━━━━━━━━━━━━━━━\n🤖 IDLEB X GPT | مطور: IDLEB X`,

  limitReached: `⚠️ *لقد استنفذت رسائلك المجانية اليومية!* ⚠️

📊 عدد رسائلك اليوم: 5 من 5
💎 للترقية والتواصل: @xlb_me`,

  subscriptionRequired: `💎 *هذه الميزة للاشتراكات المدفوعة فقط*

للاشتراك، تواصل مع المطور:
📷 انستجرام: xlb_me
💻 GitHub: IDLEBX`
};

// Config Interface
interface IConfig {
  // Access control
  whitelistedPhoneNumbers: string[];
  whitelistedEnabled: boolean;
  // OpenAI
  openAIModel: string;
  openAIAPIKeys: string[];
  maxModelTokens: number;
  prePrompt: string | undefined;

  // Prefix
  prefixEnabled: boolean;
  prefixSkippedForMe: boolean;
  gptPrefix: string;
  dallePrefix: string;
  stableDiffusionPrefix: string;
  langChainPrefix: string;
  resetPrefix: string;
  aiConfigPrefix: string;

  // Groupchats
  groupchatsEnabled: boolean;

  // Prompt Moderation
  promptModerationEnabled: boolean;
  promptModerationBlacklistedCategories: string[];

  // AWS
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsPollyVoiceId: string;
  awsPollyEngine: AWSPollyEngine;

  // Voice transcription & Text-to-Speech
  speechServerUrl: string;
  whisperServerUrl: string;
  openAIServerUrl: string;
  whisperApiKey: string;
  ttsEnabled: boolean;
  ttsMode: TTSMode;
  ttsTranscriptionResponse: boolean;
  transcriptionEnabled: boolean;
  transcriptionMode: TranscriptionMode;
  transcriptionLanguage: string;
}

// Config
export const config: IConfig = {
  whitelistedPhoneNumbers: process.env.WHITELISTED_PHONE_NUMBERS?.split(",") || [],
  whitelistedEnabled: getEnvBooleanWithDefault("WHITELISTED_ENABLED", false),

  openAIAPIKeys: (process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY || "").split(",").filter((key) => !!key),
  openAIModel: process.env.OPENAI_GPT_MODEL || "gpt-3.5-turbo",
  maxModelTokens: getEnvMaxModelTokens(),
  prePrompt: process.env.PRE_PROMPT,

  // Prefix
  prefixEnabled: getEnvBooleanWithDefault("PREFIX_ENABLED", false), // changed to false
  prefixSkippedForMe: getEnvBooleanWithDefault("PREFIX_SKIPPED_FOR_ME", true),
  gptPrefix: process.env.GPT_PREFIX || "!gpt",
  dallePrefix: process.env.DALLE_PREFIX || "!dalle",
  stableDiffusionPrefix: process.env.STABLE_DIFFUSION_PREFIX || "!sd",
  resetPrefix: process.env.RESET_PREFIX || "!reset",
  aiConfigPrefix: process.env.AI_CONFIG_PREFIX || "!config",
  langChainPrefix: process.env.LANGCHAIN_PREFIX || "!lang",

  // Groupchats
  groupchatsEnabled: getEnvBooleanWithDefault("GROUPCHATS_ENABLED", true), // changed to true

  // Prompt Moderation
  promptModerationEnabled: getEnvBooleanWithDefault("PROMPT_MODERATION_ENABLED", false),
  promptModerationBlacklistedCategories: getEnvPromptModerationBlacklistedCategories(),

  // AWS
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsRegion: process.env.AWS_REGION || "",
  awsPollyVoiceId: process.env.AWS_POLLY_VOICE_ID || "",
  awsPollyEngine: getEnvAWSPollyVoiceEngine(),

  // Speech API
  speechServerUrl: process.env.SPEECH_API_URL || "https://speech-service.verlekar.com",
  whisperServerUrl: process.env.WHISPER_API_URL || "https://transcribe.whisperapi.com",
  openAIServerUrl: process.env.OPENAI_API_URL || "https://api.openai.com/v1/audio/transcriptions",
  whisperApiKey: process.env.WHISPER_API_KEY || "",

  // Text-to-Speech
  ttsEnabled: getEnvBooleanWithDefault("TTS_ENABLED", false),
  ttsMode: getEnvTTSMode(),
  ttsTranscriptionResponse: getEnvBooleanWithDefault("TTS_TRANSCRIPTION_RESPONSE_ENABLED", true),

  // Transcription
  transcriptionEnabled: getEnvBooleanWithDefault("TRANSCRIPTION_ENABLED", false),
  transcriptionMode: getEnvTranscriptionMode(),
  transcriptionLanguage: process.env.TRANSCRIPTION_LANGUAGE || ""
};

function getEnvMaxModelTokens() {
  const envValue = process.env.MAX_MODEL_TOKENS;
  if (envValue == undefined || envValue == "") {
    return 4096;
  }
  return parseInt(envValue);
}

function getEnvBooleanWithDefault(key: string, defaultValue: boolean): boolean {
  const envValue = process.env[key]?.toLowerCase();
  if (envValue == undefined || envValue == "") {
    return defaultValue;
  }
  return envValue == "true";
}

function getEnvPromptModerationBlacklistedCategories(): string[] {
  const envValue = process.env.PROMPT_MODERATION_BLACKLISTED_CATEGORIES;
  if (envValue == undefined || envValue == "") {
    return ["hate", "hate/threatening", "self-harm", "sexual", "sexual/minors", "violence", "violence/graphic"];
  } else {
    return JSON.parse(envValue.replace(/'/g, '"'));
  }
}

function getEnvTranscriptionMode(): TranscriptionMode {
  const envValue = process.env.TRANSCRIPTION_MODE?.toLowerCase();
  if (envValue == undefined || envValue == "") {
    return TranscriptionMode.Local;
  }
  return envValue as TranscriptionMode;
}

function getEnvTTSMode(): TTSMode {
  const envValue = process.env.TTS_MODE?.toLowerCase();
  if (envValue == undefined || envValue == "") {
    return TTSMode.SpeechAPI;
  }
  return envValue as TTSMode;
}

function getEnvAWSPollyVoiceEngine(): AWSPollyEngine {
  const envValue = process.env.AWS_POLLY_VOICE_ENGINE?.toLowerCase();
  if (envValue == undefined || envValue == "") {
    return AWSPollyEngine.Standard;
  }
  return envValue as AWSPollyEngine;
}

export default config;
