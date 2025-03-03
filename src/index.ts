import "dotenv/config";
import { promises } from "fs";
import { scheduleJob } from "node-schedule";

import { generateCalendar, parseSchedule, updateCalendar } from "@/scripts";

import { colors, getFile, log } from "@/utils";

const dirname = "./calendar";

const main = async () => {
	if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
		log("Missing environment variables. Exiting...", colors.red);
		return;
	}

	await promises.mkdir(dirname, { recursive: true });

	const schedule = await parseSchedule({
		username: process.env.UMTE_USERNAME,
		password: process.env.UMTE_PASSWORD,
	});

	if (!schedule.length) {
		log("No schedule data found. Exiting...", colors.red);
		return;
	}

	const calendarFile = await getFile("../../calendar/calendar.ics");

	if (calendarFile) {
		await updateCalendar(calendarFile, schedule);
	} else {
		log("No existing calendar found. Generating new calendar...", colors.yellow);
		const calendar = await generateCalendar({ schedule });
		if (calendar) {
			await promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");
			log(`New calendar events: ${schedule.length}`, colors.blue);
			log(`New calendar successfully created!`, colors.green);
		} else {
			log("Error generating calendar.", colors.red);
		}
	}
};

main();

const job = scheduleJob("0 */2 * * *", main);
