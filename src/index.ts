import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import {
	CONFIG,
	createGroupLogger,
	getAdminId,
	getApiRoot,
	getCalendarUrl,
	getGroupPaths,
	loadGroups,
	logger,
} from "@/config";

import { cleanupBackups, createCalendar, parseSchedule, updateCalendar } from "@/scripts";

import { getFile, validateSocksProxy } from "@/utils";

import { BotGroupTarget, GroupConfig, GroupContext } from "@/types";

import { lexicon } from "@/lexicon";

import { TelegramBot } from "@/bot";

const runGroup = async (group: GroupConfig, bot: TelegramBot | null, createIfMissing: boolean) => {
	const context: GroupContext = {
		group: group,
		paths: getGroupPaths(group.id),
		log: createGroupLogger(group.name),
	};

	const schedule = await parseSchedule({
		username: group.username,
		password: group.password,
		log: context.log,
	});

	if (!schedule.length) {
		context.log.error(lexicon.log.noScheduleData);
		return;
	}

	const existingFile = await getFile(context.paths.calendar);

	if (existingFile) {
		await updateCalendar(schedule, existingFile, context, bot);
		return;
	}

	if (!createIfMissing) {
		context.log.warn(lexicon.log.existingCalendarNotFound);
		return;
	}

	context.log.warn(lexicon.log.generatingNewCalendar);
	await createCalendar(schedule, context);
};

const runGroups = async (groups: GroupConfig[], bot: TelegramBot | null, createIfMissing: boolean) => {
	logger.info(lexicon.log.cycleStarted(groups.length));

	for (const group of groups) {
		try {
			await runGroup(group, bot, createIfMissing);
		} catch (error) {
			logger.error(lexicon.log.groupFailed(group.name, error));
		}
	}

	logger.info(lexicon.log.cycleFinished);
};

const logCalendarLocations = (groups: GroupConfig[]) => {
	const locations = groups.map((group) => ({
		name: group.name,
		url: getCalendarUrl(group.id),
		path: getGroupPaths(group.id).calendar,
	}));

	logger.info(lexicon.log.calendarsHeader);

	for (const location of locations) {
		logger.info(lexicon.log.calendarLocation(location.name, location.url || location.path));
	}

	if (locations.some((location) => !location.url)) {
		logger.warn(lexicon.log.calendarBaseUrlMissing);
	}
};

const cleanupGroups = async (groups: GroupConfig[]) => {
	for (const group of groups) {
		await cleanupBackups(getGroupPaths(group.id), createGroupLogger(group.name));
	}
};

const getBotTargets = (groups: GroupConfig[]): BotGroupTarget[] => {
	return groups
		.filter((group) => group.chatId)
		.map((group) => ({
			id: group.id,
			name: group.name,
			chatId: group.chatId,
			topicId: group.topicId,
		}));
};

const createBot = async (groups: GroupConfig[]): Promise<TelegramBot | null> => {
	const token = process.env.TELEGRAM_BOT_TOKEN;

	if (!token || !groups.some((group) => group.chatId)) {
		logger.warn(lexicon.log.launchingWithoutBot);
		return null;
	}

	const apiRoot = getApiRoot();

	if (apiRoot) {
		logger.info(lexicon.log.apiRootOverridden(apiRoot));
	}

	const adminId = getAdminId();

	logger.info(adminId ? lexicon.log.adminEnabled(adminId) : lexicon.log.adminDisabled);

	const proxyUrl = process.env.PROXY_URL;
	const validProxy = await validateSocksProxy(proxyUrl);

	const bot = new TelegramBot({
		token: token,
		startMessage: lexicon.startMessage,
		replyMessage: lexicon.replyMessage,
		proxyUrl: validProxy ? proxyUrl : undefined,
		apiRoot: apiRoot,
		adminId: adminId,
		groups: getBotTargets(groups),
	});

	bot.start();

	return bot;
};

const main = async () => {
	const groups = loadGroups();

	if (!groups.length) {
		logger.error(lexicon.log.noGroupsConfigured);
		return;
	}

	logCalendarLocations(groups);

	const bot = await createBot(groups);

	await promises.mkdir(CONFIG.dirs.calendar, { recursive: true });
	await promises.mkdir(CONFIG.dirs.backup, { recursive: true });

	await runGroups(groups, bot, true);

	setTimeout(() => {
		scheduleJob(CONFIG.schedulerRule, () => {
			runGroups(groups, bot, false).catch((error) => logger.error(lexicon.log.fatalError(error)));
		});
	}, CONFIG.schedulerDelay);

	scheduleJob(CONFIG.cleanupRule, () => {
		cleanupGroups(groups).catch((error) => logger.error(lexicon.log.fatalError(error)));
	});
};

main().catch((error) => {
	logger.error(lexicon.log.fatalError(error));
	process.exit(1);
});
