import { promises } from "fs";
import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { getCurrentCalendarEvents } from "@/scripts";

import { getNewEvents, getOldEvents, log, setOldCalendarEvents } from "@/utils";

import { ClassSchedule } from "@/types";

export const updateCalendar = async (calendarFile: string, schedule: ClassSchedule): Promise<void> => {
	log("Existing calendar file found. Updating...", "cyan");
	const calendarEvents = getCurrentCalendarEvents(calendarFile);
	const oldCalendarEvents = getOldEvents(calendarEvents);
	const newCalendarEvents = getNewEvents(schedule);

	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	if (!oldCalendarEvents.length || !newCalendarEvents.length) {
		log("There are no old events.", "red");
		return;
	}
	await setOldCalendarEvents(oldCalendarEvents, newCalendarEvents, calendar);

	await promises.writeFile("calendar/calendar.ics", calendar.toString(), "utf-8");

	const [oldEventsLength, parsedEventsLength] = [oldCalendarEvents.length, newCalendarEvents.length];
	const totalEventsLength = oldEventsLength + parsedEventsLength;

	log(
		`Old events: ${oldEventsLength} | Parsed events: ${parsedEventsLength} | Total events: ${totalEventsLength}`,
		"blue",
	);

	log(`Calendar successfully updated!`, "green");
};
