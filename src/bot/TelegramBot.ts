import { Bot, Context, InlineKeyboard } from "grammy";
import { ParseMode } from "grammy/types";
import { SocksProxyAgent } from "socks-proxy-agent";

import { CONFIG, logger } from "@/config";

import { BotGroupTarget, MessageTarget, TelegramBotOptions } from "@/types";

import { lexicon } from "@/lexicon";

const PARSE_MODE = "HTML";
const SEND_PREFIX = "send:";
const SEND_ALL = "*";
const SEND_CANCEL = "!";

export class TelegramBot {
	private bot: Bot<Context>;
	private socksProxyAgent?: SocksProxyAgent;
	private startMessage: string;
	private replyMessage: string;
	private adminId?: string;
	private groups: BotGroupTarget[];
	private pendingMessage: string | null = null;

	constructor(options: TelegramBotOptions) {
		this.startMessage = options.startMessage;
		this.replyMessage = options.replyMessage;
		this.adminId = options.adminId;
		this.groups = options.groups || [];

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
		this.bot.catch((error) => {
			logger.error(lexicon.log.botHandlerFailed(error));
		});

		this.bot.command("start", async (ctx) => {
			await ctx.reply(this.startMessage, { parse_mode: PARSE_MODE });
		});

		this.bot.command("test", async (ctx) => {
			if (!this.isAdmin(ctx)) {
				await ctx.reply(this.replyMessage, { parse_mode: PARSE_MODE });
				return;
			}

			logger.info(lexicon.log.adminCommand("test", this.adminId));

			if (!this.groups.length) {
				await ctx.reply(lexicon.admin.noTargets, { parse_mode: PARSE_MODE });
				return;
			}

			await ctx.reply(lexicon.admin.testStarted(this.groups.length), { parse_mode: PARSE_MODE });
			await this.broadcast(ctx, this.groups, lexicon.admin.testMessage);
		});

		this.bot.command("send", async (ctx) => {
			if (!this.isAdmin(ctx)) {
				await ctx.reply(this.replyMessage, { parse_mode: PARSE_MODE });
				return;
			}

			logger.info(lexicon.log.adminCommand("send", this.adminId));
			await this.askTarget(ctx, ctx.match.trim());
		});

		this.bot.on("callback_query:data", async (ctx) => {
			await this.handleTargetChoice(ctx);
		});

		this.bot.on("message:text", async (ctx) => {
			await ctx.reply(this.replyMessage, { parse_mode: PARSE_MODE });
		});
	}

	private isAdmin(ctx: Context): boolean {
		if (!this.adminId) {
			return false;
		}

		return String(ctx.from?.id) === this.adminId;
	}

	private async askTarget(ctx: Context, message: string) {
		if (!message) {
			await ctx.reply(lexicon.admin.sendUsage, { parse_mode: PARSE_MODE });
			return;
		}

		if (!this.groups.length) {
			await ctx.reply(lexicon.admin.noTargets, { parse_mode: PARSE_MODE });
			return;
		}

		const keyboard = new InlineKeyboard();

		for (const group of this.groups) {
			keyboard.text(group.name, `${SEND_PREFIX}${group.id}`).row();
		}

		if (this.groups.length > 1) {
			keyboard.text(lexicon.admin.sendToAllButton, `${SEND_PREFIX}${SEND_ALL}`).row();
		}

		keyboard.text(lexicon.admin.sendCancelButton, `${SEND_PREFIX}${SEND_CANCEL}`);

		try {
			await ctx.reply(lexicon.admin.sendChooseTarget(message), {
				parse_mode: PARSE_MODE,
				reply_markup: keyboard,
			});
		} catch (error) {
			logger.error(lexicon.log.botHandlerFailed(error));
			await ctx.reply(lexicon.admin.invalidMarkup);
			return;
		}

		this.pendingMessage = message;
	}

	private async handleTargetChoice(ctx: Context) {
		const data = ctx.callbackQuery?.data || "";

		await ctx.answerCallbackQuery();

		if (!data.startsWith(SEND_PREFIX) || !this.isAdmin(ctx)) {
			return;
		}

		await ctx.editMessageReplyMarkup().catch(() => undefined);

		const targetId = data.slice(SEND_PREFIX.length);

		if (targetId === SEND_CANCEL) {
			this.pendingMessage = null;
			await ctx.reply(lexicon.admin.sendCancelled, { parse_mode: PARSE_MODE });
			return;
		}

		const message = this.pendingMessage;

		if (!message) {
			await ctx.reply(lexicon.admin.sendExpired, { parse_mode: PARSE_MODE });
			return;
		}

		const targets = targetId === SEND_ALL ? this.groups : this.groups.filter((group) => group.id === targetId);

		if (!targets.length) {
			await ctx.reply(lexicon.admin.unknownTarget, { parse_mode: PARSE_MODE });
			return;
		}

		this.pendingMessage = null;
		await this.broadcast(ctx, targets, message);
	}

	private async broadcast(ctx: Context, targets: BotGroupTarget[], message: string) {
		const lines: string[] = [];

		for (const target of targets) {
			const delivered = await this.sendMessage(target, message);

			lines.push(lexicon.admin.reportLine(target.name, delivered));
		}

		await ctx.reply(lexicon.admin.report(lines), { parse_mode: PARSE_MODE });
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
