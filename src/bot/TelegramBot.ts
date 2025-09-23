import { Bot, Context } from "grammy";
import { ParseMode } from "grammy/types";

import { log } from "@/utils";

const PARSE_MODE = "HTML";

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
		log("Bot: Starting...", "purple");
		this.bot.start().catch((err) => {
			log(`Bot: Error starting the bot - ${err}`, "red");
		});
	}

	public updateChat(chatId: string, topicId?: string | number) {
		this.chatId = chatId;
		if (topicId !== undefined) {
			this.topicId = Number(topicId);
		}
	}

	private registerHandlers() {
		this.bot.command("start", async (ctx) => {
			await ctx.reply(this.startMessage, { parse_mode: PARSE_MODE });
		});

		this.bot.on("message:text", async (ctx) => {
			await ctx.reply(this.replyMessage, { parse_mode: PARSE_MODE });
		});
	}

	public async sendMessage(message: string, parseMode: ParseMode = PARSE_MODE) {
		const options: {
			parse_mode: ParseMode;
			message_thread_id?: number;
		} = {
			parse_mode: parseMode,
		};

		if (this.topicId) {
			options.message_thread_id = this.topicId;
		}

		return this.bot.api
			.sendMessage(this.chatId, message, options)
			.then(() => {
				log("Bot: The message has been sent successfully", "purple");
			})
			.catch((error) => {
				log(`Bot: Error sending message: ${error}`, "red");
			});
	}
}
