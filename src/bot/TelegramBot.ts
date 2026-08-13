import { Bot, Context } from "grammy";
import { ParseMode } from "grammy/types";
import { SocksProxyAgent } from "socks-proxy-agent";

import { CONFIG, logger } from "@/config";

import { MessageTarget, TelegramBotOptions } from "@/types";

import { lexicon } from "@/lexicon";

const PARSE_MODE = "HTML";

export class TelegramBot {
	private bot: Bot<Context>;
	private socksProxyAgent?: SocksProxyAgent;
	private startMessage: string;
	private replyMessage: string;

	constructor(options: TelegramBotOptions) {
		this.startMessage = options.startMessage;
		this.replyMessage = options.replyMessage;

		const proxyUrl = options.proxyUrl;

		this.socksProxyAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

		this.bot = new Bot<Context>(options.token, {
			client: {
				...(options.apiRoot ? { apiRoot: options.apiRoot } : {}),
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

	private registerHandlers() {
		this.bot.command("start", async (ctx) => {
			await ctx.reply(this.startMessage, { parse_mode: PARSE_MODE });
		});

		this.bot.on("message:text", async (ctx) => {
			await ctx.reply(this.replyMessage, { parse_mode: PARSE_MODE });
		});
	}

	public async sendMessage(
		target: MessageTarget,
		message: string,
		parseMode: ParseMode = PARSE_MODE,
	): Promise<boolean> {
		const options: {
			parse_mode: ParseMode;
			message_thread_id?: number;
		} = { parse_mode: parseMode };

		const topicId = target.topicId ? Number(target.topicId) : undefined;

		if (topicId) {
			options.message_thread_id = topicId;
		}

		for (let attempt = 1; attempt <= CONFIG.sendAttempts; attempt++) {
			try {
				await this.bot.api.sendMessage(target.chatId, message, options);
				logger.info(lexicon.log.messageSentSuccessfully);

				return true;
			} catch (error) {
				logger.error(lexicon.log.sendMessageAttemptFailed(attempt, error));

				if (attempt < CONFIG.sendAttempts) {
					await new Promise((resolve) => setTimeout(resolve, CONFIG.sendRetryDelay));
				}
			}
		}

		logger.error(lexicon.log.errorSendingMessage(CONFIG.sendAttempts));

		return false;
	}
}
