import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import { CONFIG } from "@/config";

import { createCalendar, parseSchedule, updateCalendar } from "@/scripts";

import { getFile, log } from "@/utils";

import { lexicon } from "@/lexicon";

import { TelegramBot } from "@/bot";

const runOnce = async (bot: TelegramBot) => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const existingFile = await getFile(CONFIG.files.calendar);
	if (existingFile) {
		await updateCalendar(schedule, existingFile, bot);
	} else {
		log("No existing calendar found. Generating new calendar...", "yellow");
		await createCalendar(schedule);
	}
};

const scheduledUpdate = async (bot: TelegramBot) => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const existingFile = await getFile(CONFIG.files.calendar);
	if (!existingFile) {
		log("Existing calendar not found. Skipping update...", "yellow");
		return;
	}

	await updateCalendar(schedule, existingFile, bot);
};

const main = async () => {
	if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
		log("Missing environment variables. Exiting...", "red");
		return;
	}

	let bot: TelegramBot | null = null;

	if (process.env.TELEGRAM_BOT_TOKEN && process.env.CHAT_ID) {
		const token = process.env.TELEGRAM_BOT_TOKEN;
		const chatID = process.env.CHAT_ID;
		const topicID = process.env.TOPIC_ID || undefined;

		bot = new TelegramBot({
			token: token,
			startMessage: lexicon.startMessage,
			replyMessage: lexicon.replyMessage,
			chatId: chatID,
			topicId: topicID,
		});

		bot.start();
	} else {
		log("Bot: launching without a bot...", "purple");
	}

	await promises.mkdir(CONFIG.dirs.calendar, { recursive: true });
	await promises.mkdir(CONFIG.dirs.backup, { recursive: true });

	await runOnce(bot);

	setTimeout(() => {
		scheduleJob("*/60 * * * *", () => scheduledUpdate(bot));
	}, CONFIG.schedulerDelay);
};

(async () => {
	await main();
})();
