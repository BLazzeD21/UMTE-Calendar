import { existsSync, promises } from "fs";
import { ICalCalendar } from "ical-generator";
import path from "path";

import { compareICSFiles, log } from "@/utils";

const BACKUP_DIR = path.join(process.cwd(), "backup");
const ACTUAL_CALENDAR_NAME = "ActualCalendar.ics";
const ACTUAL_CALENDAR_PATH = path.join(BACKUP_DIR, ACTUAL_CALENDAR_NAME);

export const backup = async (calendar: ICalCalendar): Promise<void> => {
	try {
		const calendarContent = calendar.toString();
		const isExistActual = existsSync(ACTUAL_CALENDAR_PATH);

		if (!isExistActual) {
			await promises.writeFile(ACTUAL_CALENDAR_PATH, calendarContent, "utf-8");
			log(`The current calendar has been saved: ${ACTUAL_CALENDAR_NAME}`, "purple");
			return;
		}

		const existingCalendarContent = await promises.readFile(ACTUAL_CALENDAR_PATH, "utf-8");

		const hasChanges = !compareICSFiles(calendarContent, existingCalendarContent);
		if (!hasChanges) {
			log("No changes detected, skipping backup", "gray");
			return;
		}

		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");

		const dateString = `${now.toDateString()} ${hours}-${minutes}`;
		const backupFileName = `Сalendar ${dateString}.ics`;

		const backupFilePath = path.join(BACKUP_DIR, backupFileName);

		await promises.rename(ACTUAL_CALENDAR_PATH, backupFilePath);
		log(`The previous calendar has been saved: ${backupFileName}`, "purple");

		await promises.writeFile(ACTUAL_CALENDAR_PATH, calendarContent, "utf-8");
		log(`The current calendar has been saved: ${ACTUAL_CALENDAR_NAME}`, "purple");
	} catch (error) {
		log(`Backup failed: ${error.message}`, "red");
		throw error;
	}
};
