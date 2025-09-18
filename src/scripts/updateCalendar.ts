import { promises } from "fs";

import { CONFIG } from "@/config";

import { backup } from "@/scripts";

import { getFile, hasICSChanges, log } from "@/utils";

import { ClassSchedule } from "@/types";

import { getUpdatedCalendar } from "./getUpdatedCalendar";

export const updateCalendar = async (schedule: ClassSchedule, existingFile: string) => {
	const updatedCalendar = await getUpdatedCalendar(existingFile, schedule);
	if (!updatedCalendar) return;

	const hasChanges = await hasICSChanges(updatedCalendar.toString(), CONFIG.files.calendar);

	if (!hasChanges) {
		const existingBackup = await getFile(CONFIG.files.backupActual.path);
		if (!existingBackup) {
			await backup(updatedCalendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
		}
		log("No changes detected, update skipped", "gray");
		return;
	}

	await promises.writeFile(CONFIG.files.calendar, updatedCalendar.toString(), "utf-8").then(async () => {
		log("Calendar successfully updated!", "green");

		await backup(updatedCalendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
	});
};
