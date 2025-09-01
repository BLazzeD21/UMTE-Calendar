import { CalendarEvent } from "@/types";

export const getOldEvents = (events: CalendarEvent[], todayTimestamp: Date): CalendarEvent[] => {
	return events.filter((event) => event.start.getTime() < todayTimestamp.getTime());
};
