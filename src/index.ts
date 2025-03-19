import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import { generateCalendar, parseSchedule, updateCalendar } from "@/scripts";

import { getFile, log } from "@/utils";

const dirname = "./calendar";

const startScript = async () => {
	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", "red");
		return;
	}

	const calendarFile = await getFile("../../calendar/calendar.ics");

	if (calendarFile) {
		await updateCalendar(calendarFile, schedule);
	} else {
		log("No existing calendar found. Generating new calendar...", "yellow");
		const calendar = await generateCalendar({ schedule });
		if (calendar) {
			await promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");
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

	const calendarFile = await getFile("../../calendar/calendar.ics");

	if (!calendarFile) {
		log("Existing calendar not found. Skipping update...", "yellow");
		return;
	}

	await updateCalendar(calendarFile, schedule);
	await promises.writeFile("calendar/calendar.ics", calendarFile.toString(), "utf-8");
};

const main = async () => {
	if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
		log("Missing environment variables. Exiting...", "red");
		return;
	}

	await promises.mkdir(dirname, { recursive: true });

	await startScript();

	setTimeout(
		() => {
			scheduleJob("0 */2 * * *", setScheduleUpdate);
		},
		120 * 60 * 1000,
	);
};

main();
