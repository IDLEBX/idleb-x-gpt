// src/providers/openai.ts
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { ChatGPTAPI } from "chatgpt";
import OpenAI from "openai";

import ffmpeg from "fluent-ffmpeg";
import { blobFromSync, File } from "fetch-blob/from.js";
import config from "../config";
import { getConfig } from "../handlers/ai-config";

export let chatgpt: ChatGPTAPI;
export let openai: OpenAI;

// استخدام OpenRouter بدلاً من OpenAI المباشر
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function initOpenAI() {
  const apiKey = getConfig("gpt", "apiKey") || process.env.OPENAI_API_KEY;
  const model = config.openAIModel || "openai/gpt-3.5-turbo";
  
  console.log(`🚀 تهيئة OpenRouter API...`);
  console.log(`📌 النموذج المستخدم: ${model}`);
  
  // تهيئة ChatGPTAPI مع OpenRouter
  chatgpt = new ChatGPTAPI({
    apiKey: apiKey,
    apiBaseUrl: OPENROUTER_BASE_URL,
    completionParams: {
      model: model,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: getConfig("gpt", "maxModelTokens") || 4096,
    }
  });

  // تهيئة OpenAI client مع OpenRouter
  openai = new OpenAI({
    apiKey: apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/IDLEBX/whatsapp-chatgpt",
      "X-Title": "IDLEB X GPT",
    }
  });
  
  console.log(`✅ OpenRouter API جاهز للعمل!`);
}

export async function transcribeOpenAI(audioBuffer: Buffer): Promise<{ text: string; language: string }> {
  const url = config.openAIServerUrl || "https://api.openai.com/v1/audio/transcriptions";
  let language = "";

  const tempdir = os.tmpdir();
  const oggPath = path.join(tempdir, randomUUID() + ".ogg");
  const wavFilename = randomUUID() + ".wav";
  const wavPath = path.join(tempdir, wavFilename);
  fs.writeFileSync(oggPath, audioBuffer);
  
  try {
    await convertOggToWav(oggPath, wavPath);
  } catch (e) {
    fs.unlinkSync(oggPath);
    return {
      text: "",
      language
    };
  }

  const formData = new FormData();
  formData.append("file", new File([blobFromSync(wavPath)], wavFilename, { type: "audio/wav" }));
  formData.append("model", "whisper-1");
  if (config.transcriptionLanguage) {
    formData.append("language", config.transcriptionLanguage);
    language = config.transcriptionLanguage;
  }

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${getConfig("gpt", "apiKey")}`);

  const options = {
    method: "POST",
    body: formData,
    headers
  };

  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    console.error(e);
  } finally {
    fs.unlinkSync(oggPath);
    fs.unlinkSync(wavPath);
  }

  if (!response || response.status != 200) {
    console.error(response);
    return {
      text: "",
      language: language
    };
  }

  const transcription = await response.json();
  return {
    text: transcription.text,
    language
  };
}

async function convertOggToWav(oggPath: string, wavPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(oggPath)
      .toFormat("wav")
      .outputOptions("-acodec pcm_s16le")
      .output(wavPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}
