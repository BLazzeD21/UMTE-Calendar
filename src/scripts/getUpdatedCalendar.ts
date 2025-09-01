import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { getCurrentCalendarEvents } from "@/scripts";

import { getNewEvents, getOldEvents, log, setCalendarEvents } from "@/utils";

import { ClassSchedule } from "@/types";

export const getUpdatedCalendar = async (
	calendarFile: string,
	schedule: ClassSchedule,
): Promise<ICalCalendar | null> => {
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

	if (!oldCalendarEvents.length && !newCalendarEvents.length) {
		log("There are no events.", "red");
		return null;
	}

	calendar.clear();

	await setCalendarEvents(oldCalendarEvents, newCalendarEvents, calendar);

	const [oldEventsLength, parsedEventsLength] = [oldCalendarEvents.length, newCalendarEvents.length];
	const totalEventsLength = calendar.length();

	log(
		`Old events: ${oldEventsLength} | New events: ${parsedEventsLength} | Total events: ${totalEventsLength}`,
		"blue",
	);

	log(`Calendar successfully updated!`, "green");

	return calendar;
};
