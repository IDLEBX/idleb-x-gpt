// src/index.ts
import qrcode from "qrcode";
import { Client, Message, Events, LocalAuth } from "whatsapp-web.js";
import constants from "./constants";
import * as cli from "./cli/ui";
import { handleIncomingMessage } from "./handlers/message";
import { initAiConfig } from "./handlers/ai-config";
import { initOpenAI } from "./providers/openai";
import { initDatabase } from "./database/subscription";
import { BOT_INFO } from "./config";

let botReadyTimestamp: Date | null = null;

const start = async () => {
  const wwebVersion = "2.2412.54";
  cli.printIntro();

  // WhatsApp Client
  const client = new Client({
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(process.env.ANDROID && {
        executablePath: "/data/data/com.termux/files/usr/bin/chromium-browser"
      })
    },
    authStrategy: new LocalAuth({
      dataPath: constants.sessionPath
    }),
    webVersionCache: {
      type: "remote",
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`
    }
  });

  // WhatsApp auth
  client.on(Events.QR_RECEIVED, (qr: string) => {
    console.log("");
    qrcode.toString(qr, {
      type: "terminal",
      small: true,
      margin: 2,
      scale: 1
    }, (err, url) => {
      if (err) throw err;
      cli.printQRCode(url);
    });
  });

  client.on(Events.LOADING_SCREEN, (percent) => {
    if (percent == "0") {
      cli.printLoading();
    }
  });

  client.on(Events.AUTHENTICATED, () => {
    cli.printAuthenticated();
  });

  client.on(Events.AUTHENTICATION_FAILURE, () => {
    cli.printAuthenticationFailure();
  });

  client.on(Events.READY, () => {
    cli.printOutro();
    botReadyTimestamp = new Date();
    initAiConfig();
    initOpenAI();
    initDatabase();
    console.log(`🤖 ${BOT_INFO.name} جاهز للاستخدام!`);
  });

  // معالجة الرسائل الواردة
  client.on(Events.MESSAGE_RECEIVED, async (message: Message) => {
    if (message.from == constants.statusBroadcast) return;
    if (message.hasQuotedMsg) return;
    await handleIncomingMessage(message, client);
  });

  // معالجة الرسائل من نفسي
  client.on(Events.MESSAGE_CREATE, async (message: Message) => {
    if (message.from == constants.statusBroadcast) return;
    if (message.hasQuotedMsg) return;
    if (!message.fromMe) return;
    await handleIncomingMessage(message, client);
  });

  client.initialize();
};

start();

export { botReadyTimestamp };
