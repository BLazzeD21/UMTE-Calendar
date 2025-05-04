import { ICalCalendar } from "ical-generator";

import { createICalEvent, prepareEventData } from "@/utils";

import { CalendarEvent, ScheduleEntry } from "@/types";

export const setCalendarEvents = async (
	oldCalendarEvents: CalendarEvent[],
	newCalendarEvents: ScheduleEntry[],
	calendar: ICalCalendar,
): Promise<void> => {
	oldCalendarEvents.forEach(({ id, start, end, summary, description, location, url }: CalendarEvent) => {
		const eventUrl = typeof url === "object" && "val" in url ? url.val.toString() : url || "";
		createICalEvent({ id, start, end, summary, description, location, url: eventUrl }, calendar);
	});

	newCalendarEvents.forEach((scheduleItem: ScheduleEntry) => {
		const eventData = prepareEventData({ scheduleItem });
		createICalEvent(eventData, calendar);
	});
};
