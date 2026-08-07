import { promises } from "fs";

import { CONFIG } from "@/config";

import { backup } from "@/scripts";

import { compareCalendarsJSON, formatDiffForUser, getFile, hasICSChanges } from "@/utils";

import { ClassSchedule, GroupContext } from "@/types";

import { lexicon } from "@/lexicon";

import { TelegramBot } from "@/bot";

import { getUpdatedCalendar } from "./getUpdatedCalendar";

export const updateCalendar = async (
	schedule: ClassSchedule,
	existingFile: string,
	{ group, paths, log }: GroupContext,
	bot: TelegramBot | null,
) => {
	const updatedCalendar = await getUpdatedCalendar(existingFile, schedule, log);
	if (!updatedCalendar) return;

	const updatedContent = updatedCalendar.toString();

	if (!hasICSChanges(updatedContent, existingFile)) {
		const existingBackup = await getFile(paths.backupActual.path);

		if (!existingBackup) {
			await backup(updatedCalendar, paths, log);
		}

		log.info(lexicon.log.updateSkipped);
		return;
	}

	await promises.writeFile(paths.calendar, updatedContent, "utf-8");
	log.info(lexicon.log.successfullyUpdated);

	await backup(updatedCalendar, paths, log);

	if (bot && group.chatId) {
		const diffJSON = compareCalendarsJSON(existingFile, updatedContent);
		const changes = formatDiffForUser(JSON.parse(diffJSON));

		const message = lexicon.message(changes, group.calendarUrl);
		const messageText =
			message.length <= CONFIG.messageMaxLength ? message : lexicon.message(lexicon.lengthExceeded, group.calendarUrl);

		await bot.sendMessage({ chatId: group.chatId, topicId: group.topicId }, messageText);
	}
};
