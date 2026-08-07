import { promises } from "fs";

import { backup, generateCalendar } from "@/scripts";

import { ClassSchedule, GroupContext } from "@/types";

import { lexicon } from "@/lexicon";

export const createCalendar = async (schedule: ClassSchedule, { paths, log }: GroupContext) => {
	const calendar = await generateCalendar({ schedule });
	if (!calendar) {
		log.error(lexicon.log.errorGeneratingCalendar);
		return;
	}

	await promises.writeFile(paths.calendar, calendar.toString(), "utf-8");

	log.info(lexicon.log.newCalendarEvents(schedule.length));
	log.info(lexicon.log.newCalendarCreated);

	await backup(calendar, paths, log);
};
