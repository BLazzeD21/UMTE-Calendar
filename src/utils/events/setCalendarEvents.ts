import { ICalCalendar } from "ical-generator";

import { prepareEventData, setAlarms } from "@/utils";

import { CalendarEvent, ScheduleEntry } from "@/types";

export const setOldCalendarEvents = async (
	oldCalendarEvents: CalendarEvent[],
	newCalendarEvents: ScheduleEntry[],
	calendar: ICalCalendar,
): Promise<void> => {
	const createICalEvent = (eventData: {
		id: string;
		start: Date;
		end: Date;
		summary: string;
		description?: string;
		location?: string;
		url?: string;
	}) => {
		const { id, start, end, summary, description, location, url } = eventData;
		const icalEvent = calendar.createEvent({
			id,
			start,
			end,
			summary,
			description,
			location,
			url,
		});
		setAlarms(url || "", icalEvent);
	};

	oldCalendarEvents.forEach(({ id, start, end, summary, description, location, url }: CalendarEvent) => {
		const eventUrl = typeof url === "object" && "val" in url ? url.val.toString() : url || "";
		createICalEvent({ id, start, end, summary, description, location, url: eventUrl });
	});

	newCalendarEvents.forEach((scheduleItem: ScheduleEntry) => {
		const eventData = prepareEventData({ scheduleItem });
		createICalEvent(eventData);
	});
};
