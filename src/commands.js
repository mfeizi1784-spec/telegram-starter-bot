import { InlineKeyboard } from "grammy";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AVALAI_API_KEY,
  baseURL: "https://api.avalai.ir/v1",
});

const conversationHistory = {};

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(`سلام ${ctx.from?.first_name || ''}! من ایجنت هوشمند بورس هستم. هر سوالی داری بپرس.`, {
      reply_markup: new InlineKeyboard().text("راهنما", "help_button")
    })
  );

  bot.command("help", (ctx) =>
    ctx.reply("من یک دستیار هوشمند هستم. کافیه هر سوالی داری بنویسی. همچنین می‌تونی دستور /filter رو بزنی تا سهام‌های ارزنده رو برات پیدا کنم.")
  );

  bot.command("ping", (ctx) => ctx.reply("Pong! 🏓"));

  // دستور جدید: اجرای فیلتر بورسی
  bot.command("filter", async (ctx) => {
    await ctx.reply("⏳ در حال دریافت اطلاعات لحظه‌ای از بورس و اجرای فیلتر... (چند ثانیه صبر کنید)");
    
    try {
      // دریافت دیتای بازار از API بورس
      const response = await fetch("https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch");
      const json = await response.json();
      const marketData = json.closingPrice || [];

      // اجرای فیلترها
      const filteredStocks = marketData.filter(item => {
        const pe = parseFloat(item.pe);
        const eps = parseFloat(item.eps);
        const tvol = parseFloat(item.tvol);
        const buyI = parseFloat(item.buy_I_vol);
        const sellI = parseFloat(item.sell_I_vol);

        // فیلتر: PE < 7 ، EPS > 300 ، حجم > 5 میلیون ، خرید حقیقی > فروش حقیقی
        return pe > 0 && pe < 7 && 
               eps > 300 && 
               tvol > 5000000 && 
               buyI > sellI;
      });

      if (filteredStocks.length === 0) {
        return ctx.reply("❌ امروز هیچ سهمی با این شرایط پیدا نشد.");
      }

      // ساخت پیام پاسخ (حداکثر ۱۰ سهم اول)
      let message = `✅ **${filteredStocks.length} سهم** با فیلتر شما پیدا شد:\n\n`;
      filteredStocks.slice(0, 10).forEach((stock, index) => {
        message += `${index + 1}. **${stock.l18}**\n`;
        message += `PE: ${stock.pe} | EPS: ${stock.eps}\n`;
        message += `حجم: ${Number(stock.tvol).toLocaleString('fa-IR')}\n\n`;
      });

      await ctx.reply(message, { parse_mode: "Markdown" });

    } catch (error) {
      console.error("Filter Error:", error);
      await ctx.reply("❌ متاسفانه در دریافت اطلاعات از سایت بورس مشکلی پیش اومد.");
    }
  });

  bot.callbackQuery("help_button", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("کافیه هر سوالی داری بنویسی، من جواب می‌دم! برای فیلتر بورسی هم /filter رو بزن.");
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return; 

    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    if (!conversationHistory[chatId]) {
      conversationHistory[chatId] = [
        { role: "system", content: "تو یک کارشناس ارشد بورس هستی. تو باید فقط و فقط به زبان فارسی روان و محاوره‌ای جواب بدی. از هر کلمه غیرفارسی به شدت پرهیز کن. پاسخ‌هایت باید دقیق و کوتاه باشد." }
      ];
    }

    conversationHistory[chatId].push({ role: "user", content: userMessage });
    await ctx.replyWithChatAction("typing");

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationHistory[chatId].slice(-10),
        temperature: 0.3, 
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
