import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import { CONFIG } from "@/config";

import { backup, generateCalendar, getUpdatedCalendar, parseSchedule } from "@/scripts";

import { getFile, hasICSChanges, log } from "@/utils";

import { ClassSchedule } from "@/types";

const updateCalendar = async (schedule: ClassSchedule, existingFile: string) => {
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

const createCalendar = async (schedule: ClassSchedule) => {
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

const runOnce = async () => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const existingFile = await getFile(CONFIG.files.calendar);
	if (existingFile) {
		await updateCalendar(schedule, existingFile);
	} else {
		log("No existing calendar found. Generating new calendar...", "yellow");
		await createCalendar(schedule);
	}
};

const scheduledUpdate = async () => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const existingFile = await getFile(CONFIG.files.calendar);
	if (!existingFile) {
		log("Existing calendar not found. Skipping update...", "yellow");
		return;
	}

	await updateCalendar(schedule, existingFile);
};

const main = async () => {
	if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
		log("Missing environment variables. Exiting...", "red");
		return;
	}

	await promises.mkdir(CONFIG.dirs.calendar, { recursive: true });
	await promises.mkdir(CONFIG.dirs.backup, { recursive: true });

	await runOnce();

	setTimeout(() => {
		scheduleJob("*/60 * * * *", scheduledUpdate);
	}, CONFIG.schedulerDelay);
};

(async () => {
	await main();
})();
