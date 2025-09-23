import { Bot, Context } from "grammy";
import { ParseMode } from "grammy/types";

interface TelegramBotOptions {
	token: string;
	startMessage: string;
	replyMessage: string;
	chatId: string;
	topicId?: string;
}

export class TelegramBot {
	private bot: Bot<Context>;
	private chatId: string;
	private topicId?: number;
	private startMessage: string;
	private replyMessage: string;

	constructor(options: TelegramBotOptions) {
		this.bot = new Bot(options.token);
		this.chatId = options.chatId;
		this.topicId = options.topicId ? Number(options.topicId) : undefined;
		this.startMessage = options.startMessage;
		this.replyMessage = options.replyMessage;

		this.registerHandlers();
	}

	public start() {
		this.bot.start();
	}

	public updateChat(chatId: string, topicId?: string | number) {
		this.chatId = chatId;
		if (topicId !== undefined) {
			this.topicId = Number(topicId);
		}
	}

	private registerHandlers() {
		this.bot.command("start", async (ctx) => {
			await ctx.reply(this.startMessage);
		});

		this.bot.on("message:text", async (ctx) => {
			await ctx.reply(this.replyMessage);
		});
	}

	public async sendMessage(message: string, parseMode: ParseMode = "MarkdownV2") {
		const options: {
			parse_mode: ParseMode;
			message_thread_id?: number;
		} = {
			parse_mode: parseMode,
		};

		if (this.topicId) {
			options.message_thread_id = this.topicId;
		}

		return this.bot.api.sendMessage(this.chatId, message, options);
	}
}
