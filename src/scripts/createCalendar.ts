import { promises } from "fs";

import { CONFIG } from "@/config";

import { backup, generateCalendar } from "@/scripts";

import { log } from "@/utils";

import { ClassSchedule } from "@/types";

export const createCalendar = async (schedule: ClassSchedule) => {
	const calendar = await generateCalendar({ schedule });
	if (!calendar) {
		log("Error generating calendar.", "red");
		return;
	}

	await promises.writeFile(CONFIG.files.calendar, calendar.toString(), "utf-8").then(async () => {
		log(`New calendar events: ${schedule.length}`, "blue");
		log("New calendar successfully created!", "green");

		await backup(calendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
	});
};
