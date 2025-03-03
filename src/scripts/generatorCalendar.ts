import ical, { ICalCalendar, ICalCalendarMethod } from "ical-generator";

import { prepareEventData, setAlarms } from "@/utils";

import { CalendarGenerationOptions, ScheduleEntry } from "@/types";

export const generateCalendar = async ({ schedule }: CalendarGenerationOptions): Promise<ICalCalendar> => {
	const calendar: ICalCalendar = ical({
		name: "UMTE",
		description: "Class Schedule",
		method: ICalCalendarMethod.PUBLISH,
		timezone: "Europe/Moscow",
	});

	schedule.forEach(async (scheduleItem: ScheduleEntry) => {
		const event = prepareEventData({ scheduleItem });

		const icalEvent = calendar.createEvent(event);

		setAlarms(event.url, icalEvent);
	});

	return calendar;
};
