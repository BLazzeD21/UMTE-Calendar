import { existsSync, promises } from "fs";
import { ICalCalendar } from "ical-generator";
import path from "path";

import { GroupLogger, GroupPaths } from "@/types";

import { lexicon } from "@/lexicon";

export const backup = async (calendar: ICalCalendar, paths: GroupPaths, log: GroupLogger): Promise<void> => {
	try {
		const calendarContent = calendar.toString();

		await promises.mkdir(paths.backupDir, { recursive: true });

		const isExistActual = existsSync(paths.backupActual.path);

		if (!isExistActual) {
			await promises.writeFile(paths.backupActual.path, calendarContent, "utf-8");
			log.info(lexicon.log.currentCalendarSaved(paths.backupActual.name));
			return;
		}

		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");

		const dateString = `${now.toDateString()} ${hours}-${minutes}`;
		const backupFileName = `Calendar ${dateString}.ics`;

		const backupFilePath = path.join(paths.backupDir, backupFileName);

		await promises.rename(paths.backupActual.path, backupFilePath);
		log.info(lexicon.log.previousCalendarSaved(backupFileName));

		await promises.writeFile(paths.backupActual.path, calendarContent, "utf-8");
		log.info(lexicon.log.currentCalendarSaved(paths.backupActual.name));
	} catch (error) {
		log.error(`${lexicon.log.backupFailed}: ${error}`);
		throw error;
	}
};
