import { CalendarEvent  } from "@/types";

const todayTimestamp = new Date();
todayTimestamp.setHours(0, 0, 0, 0);

export const getOldEvents = (events: CalendarEvent []): CalendarEvent [] => {
    return events.filter((event) => event.start.getTime() < todayTimestamp.getTime());
};