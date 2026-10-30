import { InlineKeyboard } from "grammy";
import OpenAI from "openai";

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

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return; 

    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    if (!conversationHistory[chatId]) {
      conversationHistory[chatId] = [
        // دستورات سخت‌گیرانه برای زبان فارسی
        { role: "system", content: "تو یک دستیار هوشمند، متخصص و صمیمی در بازار بورس تهران هستی. قانون بسیار مهم: تو باید فقط و فقط به زبان فارسی روان و محاوره‌ای پاسخ دهی. تحت هیچ شرایطی از کلمات، حروف یا اصطلاحات انگلیسی استفاده نکن. حتی اصطلاحات تخصصی بورس (مثل TSE یا Market Cap) را هم معادل فارسی آن (بورس تهران، ارزش بازار) بنویس. پاسخ‌هایت باید دقیق، مفید و بدون حاشیه باشد." }
      ];
    }

    conversationHistory[chatId].push({ role: "user", content: userMessage });
    await ctx.replyWithChatAction("typing");

    try {
      const response = await client.chat.completions.create({
        // ارتقای مدل به نسخه ۸ میلیاردی که فارسی رو بهتر می‌فهمه
        model: process.env.LLM_MODEL || "@cf/meta/llama-3.1-8b-instruct",
        messages: conversationHistory[chatId].slice(-10),
        temperature: 0.3, // کاهش خلاقیت برای جلوگیری از پرت و پلا گفتن
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
