import { promises } from "fs";

import { CONFIG } from "@/config";

import { backup, generateCalendar } from "@/scripts";

import { log } from "@/utils";

import { ClassSchedule } from "@/types";

import { lexicon } from "@/lexicon";

export const createCalendar = async (schedule: ClassSchedule) => {
	const calendar = await generateCalendar({ schedule });
	if (!calendar) {
		log(lexicon.log.errorGeneratingCalendar, "red");
		return;
	}

	await promises.writeFile(CONFIG.files.calendar, calendar.toString(), "utf-8").then(async () => {
		log(lexicon.log.newCalendarEvents(schedule.length), "blue");
		log(lexicon.log.newCalendarCreated, "green");

		await backup(calendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
	});
};
