import { InlineKeyboard } from "grammy";
import { handleAIMessage } from "./ai.js"; 

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

  // هندل کردن پیام‌های متنی که با / شروع نمی‌شن
  bot.on("message:text", async (ctx) => {
    if (!ctx.message.text.startsWith("/")) {
      await handleAIMessage(ctx);
    }
  });
}
