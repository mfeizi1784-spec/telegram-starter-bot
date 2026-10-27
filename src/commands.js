// Your bot's behaviour. Add commands here; grammy ...

import { InlineKeyboard } from "grammy"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(`Hi ${ctx.from?.first_name ?? "there"}!`, {
      reply_markup: new InlineKeyboard().text("Ping me", "ping")
    }),
  )

  bot.command("help", (ctx) =>
    ctx.reply(["Commands:", "/start say hello", "/help this list", "/ping check", "/id get id"]),
  )

  bot.command("ping", (ctx) => ctx.reply("pong"))

  bot.command("id", (ctx) => ctx.reply(`Chat id: ${ctx.chat.id}\nYour id: ${ctx.from?.id}`))

  bot.callbackQuery("ping", (ctx) => ctx.answerCallbackQuery({ text: "pong" }))

  bot.on("message:text", (ctx) => ctx.reply(ctx.message.text))

  bot.command("hello", (ctx) => ctx.reply("سلام محسن! من یک ربات شخصی‌سازی شده هستم."));
}
