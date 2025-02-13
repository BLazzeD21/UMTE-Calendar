import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { ScheduleEntry, CalendarGenerationOptions  } from "@/types";

import { colors, prepareEventData, log, setAlarms } from "@/utils";

export const generateCalendar = async ({ schedule }: CalendarGenerationOptions ): Promise<ICalCalendar> => {
	log("Creating a new iCalendar instance", colors.blue);

	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	schedule.forEach(async (scheduleItem: ScheduleEntry) => {
		const { startDate, endDate, description, summary, url, uid, place } = prepareEventData({ scheduleItem });

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

	return calendar;
};
