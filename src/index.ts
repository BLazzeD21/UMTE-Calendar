import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import { CONFIG } from "@/config";

import { createCalendar, parseSchedule, updateCalendar } from "@/scripts";

import { getFile, log } from "@/utils";

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
