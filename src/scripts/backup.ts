import { existsSync, promises } from "fs";
import { ICalCalendar } from "ical-generator";
import path from "path";

import { logger } from "@/config";

import { lexicon } from "@/lexicon";

export const backup = async (
	calendar: ICalCalendar,
	ACTUAL_CALENDAR_PATH: string,
	ACTUAL_CALENDAR_NAME: string,
	BACKUP_DIR: string,
): Promise<void> => {
	try {
		const calendarContent = calendar.toString();
		const isExistActual = existsSync(ACTUAL_CALENDAR_PATH);

		if (!isExistActual) {
			await promises.writeFile(ACTUAL_CALENDAR_PATH, calendarContent, "utf-8");
			logger.info(lexicon.log.currentCalendarSaved(ACTUAL_CALENDAR_NAME));
			return;
		}

		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");

		const dateString = `${now.toDateString()} ${hours}-${minutes}`;
		const backupFileName = `Сalendar ${dateString}.ics`;

		const backupFilePath = path.join(BACKUP_DIR, backupFileName);

		await promises.rename(ACTUAL_CALENDAR_PATH, backupFilePath);
		logger.info(lexicon.log.previousCalendarSaved(backupFileName));

		await promises.writeFile(ACTUAL_CALENDAR_PATH, calendarContent, "utf-8");
		logger.info(lexicon.log.currentCalendarSaved(ACTUAL_CALENDAR_NAME));
	} catch (error) {
		logger.error(`${lexicon.log.backupFailed}: ${error.message}`);
		throw error;
	}
};
