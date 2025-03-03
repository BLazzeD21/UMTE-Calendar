import "dotenv/config";
import { promises } from "fs";
import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";
import { scheduleJob } from "node-schedule";

import { generateCalendar, getCurrentCalendarEvents, parseSchedule } from "@/scripts";

import { colors, getFile, getNewEvents, getOldEvents, log } from "@/utils";

import { setOldCalendarEvents } from "./utils/events/setCalendarEvents";

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
		log("Existing calendar file found. Updating...", colors.yellow);
		const calendarEvents = getCurrentCalendarEvents(calendarFile);
		const oldCalendarEvents = getOldEvents(calendarEvents);
		const newCalendarEvents = getNewEvents(schedule);

		const calendar: ICalCalendar = ical({
			name: "UMTE",
			description: "Class Schedule",
			method: ICalCalendarMethod.PUBLISH,
			timezone: "Europe/Moscow",
		});

		if (!oldCalendarEvents.length || !parseSchedule.length) {
			log("There are no old events.", colors.red);
			return;
		}
		await setOldCalendarEvents(oldCalendarEvents, newCalendarEvents, calendar);

		await promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");

		const [oldEventsLength, parsedEventsLength] = [oldCalendarEvents.length, newCalendarEvents.length];
		const totalEventsLength = oldEventsLength + parsedEventsLength;

		log(
			`Old events: ${oldEventsLength} | Parsed events: ${parsedEventsLength} | Total events: ${totalEventsLength}`,
			colors.blue,
		);

		log(`Calendar successfully updated!`, colors.green);
	} else {
		log("No existing calendar found. Generating new calendar...", colors.blue);
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
