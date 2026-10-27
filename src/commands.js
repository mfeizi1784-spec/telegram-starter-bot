// Your bot's behaviour. Add commands here; grammy ...

import { InlineKeyboard } from "grammy"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(`Hi ${ctx.from?.first_name ?? "there"}!`, {
      reply_markup: new InlineKeyboard().text("Ping me", "ping")
    }),
  )

  bot.command("help", (ctx) =>
    ctx.reply(["Commands:", "/start say hello", "/help this list", "/ping check", "/id get id", "/price gold & usd"]),
  )

  bot.command("ping", (ctx) => ctx.reply("pong"))

  bot.command("id", (ctx) => ctx.reply(`Chat id: ${ctx.chat.id}\nYour id: ${ctx.from?.id}`))

  bot.callbackQuery("ping", (ctx) => ctx.answerCallbackQuery({ text: "pong" }))

  bot.command("hello", (ctx) => ctx.reply("سلام محسن! من یک ربات شخصی‌سازی شده هستم."));

  // دستور قیمت طلا و دلار 👇
  bot.command("price", async (ctx) => {
    try {
      const res = await fetch("https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/popular.json");
      const json = await res.json();
      const data = json.data;

      const dollar = data.find(item => item.symbol === "USD_IRR_FREE");
      const gold = data.find(item => item.symbol === "GOLD_18K_IRR");

      if (!dollar || !gold) {
        return ctx.reply("متأسفانه قیمت‌ها در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.");
      }

      const format = (num) => num.toLocaleString("fa-IR");

      const message = `💰 قیمت‌های لحظه‌ای بازار:\n\n💵 دلار آمریکا: ${format(dollar.price)} تومان\n🥇 طلای ۱۸ عیار (هر گرم): ${format(gold.price)} تومان\n\n⏰ آخرین بروزرسانی: ${dollar.timestamp_jalali || "نامشخص"}`;

      await ctx.reply(message);
    } catch (error) {
      console.error("خطا در دریافت قیمت:", error);
      await ctx.reply("خطایی در دریافت قیمت رخ داد. لطفاً بعداً دوباره تلاش کنید.");
    }
  });

  // این خط (Echo) همیشه باید آخرین دستور باشه 👇
  bot.on("message:text", (ctx) => ctx.reply(ctx.message.text))
}
