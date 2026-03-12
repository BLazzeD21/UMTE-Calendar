import { Bot, Context } from "grammy";
import { ParseMode } from "grammy/types";
import { SocksProxyAgent } from "socks-proxy-agent";

import { logger } from "@/config";

import { TelegramBotOptions } from "@/types";

import { lexicon } from "@/lexicon";

const PARSE_MODE = "HTML";

export class TelegramBot {
	private bot: Bot<Context>;
	private socksProxyAgent: SocksProxyAgent;
	private chatId: string;
	private topicId?: number;
	private startMessage: string;
	private replyMessage: string;

	constructor(options: TelegramBotOptions) {
		this.chatId = options.chatId;
		this.topicId = options.topicId ? Number(options.topicId) : undefined;
		this.startMessage = options.startMessage;
		this.replyMessage = options.replyMessage;

		const proxyUrl = options.proxyUrl;

		this.socksProxyAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

		this.bot = new Bot<Context>(options.token, {
			client: {
				baseFetchConfig: {
					agent: this.socksProxyAgent || undefined,
					compress: true,
				},
			},
		});

		this.registerHandlers();
	}

	public start() {
		this.bot.start().catch((error) => {
			logger.error(`${lexicon.log.botErrorStarting} - ${error}`);
		});

		logger.info(lexicon.log.botStarting);
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
		} = { parse_mode: parseMode };

		if (this.topicId) {
			options.message_thread_id = this.topicId;
		}

		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				await this.bot.api.sendMessage(this.chatId, message, options);
				logger.info(lexicon.log.messageSentSuccessfully);
				return;
			} catch (error) {
				logger.error(`sendMessage attempt ${attempt} failed: ${error.cause ? error.cause : error}`);

				await new Promise((r) => setTimeout(r, 2000));
			}
		}
	}
}
