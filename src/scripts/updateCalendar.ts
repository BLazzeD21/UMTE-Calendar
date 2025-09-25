import { promises } from "fs";

import { CONFIG } from "@/config";

import { backup } from "@/scripts";

import { compareCalendarsJSON, formatDiffForUser, getFile, hasICSChanges, log } from "@/utils";

import { ClassSchedule } from "@/types";

import { lexicon } from "@/lexicon";

import { TelegramBot } from "@/bot";

import { getUpdatedCalendar } from "./getUpdatedCalendar";

export const updateCalendar = async (schedule: ClassSchedule, existingFile: string, bot: TelegramBot) => {
	const updatedCalendar = await getUpdatedCalendar(existingFile, schedule);
	if (!updatedCalendar) return;

	const [hasChanges, existingCalendar] = await hasICSChanges(updatedCalendar.toString(), CONFIG.files.calendar);

	if (!hasChanges) {
		const existingBackup = await getFile(CONFIG.files.backupActual.path);
		if (!existingBackup) {
			await backup(updatedCalendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
		}
		log("No changes detected, update skipped", "gray");
		return;
	}

	if (hasChanges && bot != null) {
		const diffJSON = compareCalendarsJSON(existingCalendar.toString(), updatedCalendar.toString());

		const changes = formatDiffForUser(JSON.parse(diffJSON));

		const messageText =
			lexicon.message(changes).length <= 2000 ? lexicon.message(changes) : lexicon.message(lexicon.lengthExceeded);

		bot.sendMessage(messageText);
	}

	await promises.writeFile(CONFIG.files.calendar, updatedCalendar.toString(), "utf-8").then(async () => {
		log("Calendar successfully updated!", "green");

		await backup(updatedCalendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
	});
};
