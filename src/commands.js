import { InlineKeyboard } from "grammy";
import OpenAI from "openai";

// تنظیمات هوش مصنوعی (مستقیماً اینجا)
const client = new OpenAI({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
});

const conversationHistory = {};

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(`سلام ${ctx.from?.first_name || ''}! من ایجنت هوشمند بورس هستم. هر سوالی داری بپرس.`, {
      reply_markup: new InlineKeyboard().text("راهنما", "help_button")
    })
  );

  bot.command("help", (ctx) =>
    ctx.reply("من یک دستیار هوشمند هستم. کافیه هر سوالی درباره بورس یا هر چیز دیگه‌ای داری برام تایپ کنی.")
  );

  bot.command("ping", (ctx) => ctx.reply("Pong! 🏓"));

  bot.callbackQuery("help_button", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("کافیه هر سوالی داری بنویسی، من جواب می‌دم!");
  });

  // هندل کردن پیام‌های متنی
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return; // اگه دستور بود، رد شو

    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    if (!conversationHistory[chatId]) {
      conversationHistory[chatId] = [
        { role: "system", content: "You are a helpful and intelligent Persian AI assistant specialized in stock market (Bourse) analysis. Answer clearly and concisely in Persian." }
      ];
    }

    conversationHistory[chatId].push({ role: "user", content: userMessage });
    await ctx.replyWithChatAction("typing");

    try {
      const response = await client.chat.completions.create({
        model: process.env.LLM_MODEL || "@cf/meta/llama-3.2-3b-instruct",
        messages: conversationHistory[chatId].slice(-10),
        temperature: 0.7,
      });

      const botReply = response.choices[0]?.message?.content || "متاسفم، نتونستم جوابی پیدا کنم.";
      conversationHistory[chatId].push({ role: "assistant", content: botReply });

      await ctx.reply(botReply);

    } catch (error) {
      console.error("LLM Error:", error);
      await ctx.reply("❌ متاسفانه در ارتباط با هوش مصنوعی مشکلی پیش اومد.");
    }
  });
}
