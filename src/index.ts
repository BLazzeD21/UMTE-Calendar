import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";
import path from "path";

import { generateCalendar, getUpdatedCalendar, parseSchedule } from "@/scripts";

import { getFile, log } from "@/utils";

const dirname = "./calendar";

const CALENDAR_PATH = path.join(process.cwd(), "calendar", "calendar.ics");

const SCHEDULER_DELAY = 60 * 60 * 1000; // 1 hour

const startScript = async () => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const calendarFile = await getFile(CALENDAR_PATH);

	if (calendarFile) {
		const updatedCalendar = await getUpdatedCalendar(calendarFile, schedule);
		if (!updatedCalendar) return;

		await promises.writeFile(CALENDAR_PATH, updatedCalendar.toString(), "utf-8");
	} else {
		log("No existing calendar found. Generating new calendar...", "yellow");
		const calendar = await generateCalendar({ schedule });
		if (calendar) {
			await promises.writeFile(CALENDAR_PATH, calendar.toString(), "utf-8");
			log(`New calendar events: ${schedule.length}`, "blue");
			log(`New calendar successfully created!`, "green");
		} else {
			log("Error generating calendar.", "red");
		}
	}
};

const setScheduleUpdate = async () => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const calendarFile = await getFile(CALENDAR_PATH);

	if (!calendarFile) {
		log("Existing calendar not found. Skipping update...", "yellow");
		return;
	}

	const updatedCalendar = await getUpdatedCalendar(calendarFile, schedule);
	if (!updatedCalendar) return;

	await promises.writeFile(CALENDAR_PATH, updatedCalendar.toString(), "utf-8");
};

const main = async () => {
	if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
		log("Missing environment variables. Exiting...", "red");
		return;
	}

	await promises.mkdir(dirname, { recursive: true });

	await startScript();

	setTimeout(() => {
		scheduleJob("*/60 * * * *", setScheduleUpdate);
	}, SCHEDULER_DELAY);
};

(async () => {
	await main();
})();
