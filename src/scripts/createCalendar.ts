import { promises } from "fs";

import { CONFIG, logger } from "@/config";

import { backup, generateCalendar } from "@/scripts";

import { ClassSchedule } from "@/types";

import { lexicon } from "@/lexicon";

export const createCalendar = async (schedule: ClassSchedule) => {
	const calendar = await generateCalendar({ schedule });
	if (!calendar) {
		logger.error(lexicon.log.errorGeneratingCalendar);
		return;
	}

	await promises.writeFile(CONFIG.files.calendar, calendar.toString(), "utf-8").then(async () => {
		logger.info(lexicon.log.newCalendarEvents(schedule.length));
		logger.info(lexicon.log.newCalendarCreated);

		await backup(calendar, CONFIG.files.backupActual.path, CONFIG.files.backupActual.name, CONFIG.dirs.backup);
	});
};
