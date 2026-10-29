import { Bot } from "grammy";
import { registerCommands } from "./commands.js";

const bot = new Bot(process.env.BOT_TOKEN);

// وصل کردن دستورات و هوش مصنوعی به بات
registerCommands(bot);

// مدیریت خطاهای کلی
bot.catch((err) => {
  console.error("Bot Error:", err);
});

// روشن کردن بات
bot.start();
console.log("🤖 Bourse Agent is running...");
