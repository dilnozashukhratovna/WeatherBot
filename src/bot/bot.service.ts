import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bot } from './model/bot.model';
import { Command, InjectBot } from 'nestjs-telegraf';
import { BOT_NAME } from '../app.constants';
import { Context, Markup, Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botRepo: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
  ) {}

  async start(ctx: Context) {
    const userId = ctx.from.id;

    const user = await this.botRepo.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      await this.botRepo.create({
        user_id: userId,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });
      await ctx.reply(
        `First you need to register yourself. Click the button below to register⬇️`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([[Markup.button.contactRequest('Register')]])
            .oneTime()
            .resize(),
        },
      );
    } else if (!user.status) {
      await ctx.reply(
        `First you need to register yourself. Click the button below to register⬇️`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([[Markup.button.contactRequest('Register')]])
            .oneTime()
            .resize(),
        },
      );
    } else {
      await this.bot.telegram.sendChatAction(userId, 'typing');
      const botInfo =
        '👋🏻Hello, this bot can help you to find about the weather in the location\
 you entered. To start the action simply begin with clicking\
 /location command :)';
      await ctx.reply(botInfo, {
        parse_mode: 'HTML',
        ...Markup.removeKeyboard(),
      });
    }
  }

  async onContact(ctx: Context) {
    if ('contact' in ctx.message) {
      const userId = ctx.from.id;
      const user = await this.botRepo.findOne({
        where: { user_id: userId },
      });
      if (!user) {
        ctx.reply(`Please click <b>Start</b> button⬇️`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']])
            .oneTime()
            .resize(),
        });
      } else if (ctx.message.contact.user_id != userId) {
        await ctx.reply('❗️Please, enter your own phone number', {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            [Markup.button.contactRequest('📞Send my phone number')],
          ])
            .oneTime()
            .resize(),
        });
      } else {
        let phone: string;
        ctx.message.contact.phone_number[0] == '+'
          ? (phone = ctx.message.contact.phone_number)
          : (phone = '+' + ctx.message.contact.phone_number);
        await this.botRepo.update(
          {
            phone_number: phone,
            status: true,
          },
          {
            where: { user_id: userId },
          },
        );
        await ctx.reply(
          `🎉Congratulations, you registered to the weather bot!\
 This bot can help you to find about the weather in the location\
 you entered. To start the action simply begin with clicking\
 /location command :)`,
          {
            parse_mode: 'HTML',
            ...Markup.removeKeyboard(),
          },
        );
      }
    }
  }

  async onStop(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.botRepo.findOne({
      where: { user_id: userId },
    });

    if (user.status) {
      await this.botRepo.update(
        {
          status: false,
          phone_number: null,
        },
        { where: { user_id: userId } },
      );
    }
    await ctx.reply(`You stopped the bot🛑`, {
      parse_mode: 'HTML',
      ...Markup.keyboard([['/start']])
        .oneTime()
        .resize(),
    });
  }

}
