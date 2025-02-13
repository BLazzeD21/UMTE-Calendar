import "dotenv/config";
import fs from "fs";
import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";
import { scheduleJob } from "node-schedule";

import { generateCalendar, getCurrentCalendarEvents, parseSchedule } from "@/scripts";

import { colors, getFile, getNewEvents, getOldEvents, log, prepareEventData, setAlarms } from "@/utils";

const dirname = "./calendar";

const main = async () => {
	log("Starting the script...", colors.yellow);

	try {
		if (!process.env.UMTE_USERNAME || !process.env.UMTE_PASSWORD) {
			log("Missing UMTE_USERNAME or UMTE_PASSWORD in environment variables. Exiting...", colors.red);
			return;
		}

		log("Starting schedule parsing...", colors.blue);

		const schedule = await parseSchedule({
			username: process.env.UMTE_USERNAME,
			password: process.env.UMTE_PASSWORD,
		});

		if (schedule.length) {
			log("Schedule successfully retrieved!", colors.green);
		} else {
			log("No schedule data found. Exiting...", colors.red);
			return;
		}

		log("Checking if the calendar directory exists...", colors.cyan);
		await fs.promises.mkdir(dirname, { recursive: true });

		const calendarFile = getFile("../../calendar/calendar.ics");

		if (calendarFile) {
			const calendarEvents = getCurrentCalendarEvents(calendarFile);
			const oldCalendarEvents = getOldEvents(calendarEvents);
			const parsedEvents = getNewEvents(schedule);

			const calendar: ICalCalendar = ical({
				name: "UMTE",
				description: "Class Schedule",
				method: ICalCalendarMethod.PUBLISH,
				timezone: "Europe/Moscow",
			});

			oldCalendarEvents.forEach((calEvent) => {
				const url =
					typeof calEvent.url === "object" && "val" in calEvent.url ? calEvent.url.val.toString() : calEvent.url || "";

				const icalEvent = calendar.createEvent({
					id: calEvent.uid,
					start: calEvent.start,
					end: calEvent.end,
					summary: calEvent.summary,
					description: calEvent.description,
					location: calEvent.location,
					url: url,
				});
				setAlarms(url, icalEvent);
			});

			parsedEvents.forEach((calEvent) => {
				const { startDate, endDate, description, summary, url, uid, place } = prepareEventData({
					scheduleItem: calEvent,
				});

				const icalEvent = calendar.createEvent({
					id: uid,
					start: startDate,
					end: endDate,
					summary: summary,
					description: description,
					location: place,
					url: url,
				});
				setAlarms(url, icalEvent);
			});

			await fs.promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");
			log("Calendar successfully created and written to calendar.ics!", colors.green);
		} else {
			const calendar = await generateCalendar({ schedule });

			if (calendar) {
				await fs.promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");
				log("Calendar successfully created and written to calendar.ics!", colors.green);
			} else {
				log("Error generating calendar.", colors.red);
			}
		}
	} catch (error) {
		log(`An error occurred: ${error.message}`, colors.red);
	}
};

main();

scheduleJob("0 */3 * * *", main);
