import { ScheduleEntry } from "@/types";

export const getNewEvents = (events: ScheduleEntry[], todayTimestamp: Date): ScheduleEntry[] => {
	return events.filter(({ startTime, date }) => {
		const [startTimeHours, startTimeMins] = startTime.split(":").map(Number);
		const startDate = new Date(date.year, date.month - 1, date.day, startTimeHours, startTimeMins);

		const isFutureEvent = startDate.getTime() > todayTimestamp.getTime();
		return isFutureEvent;
	});
};
