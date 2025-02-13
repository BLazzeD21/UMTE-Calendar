import { ScheduleItem } from "@/types";

const todayTimestamp = new Date();
todayTimestamp.setHours(0, 0, 0, 0);

export const getNewEvents = (events: ScheduleItem[]) => {
	return events
			.filter(({ startTime, date }) => {
					const [startTimeHours, startTimeMins] = startTime.split(":").map(Number);
					const startDate = new Date(date.year, date.month - 1, date.day, startTimeHours, startTimeMins);

					const isFutureEvent = startDate.getTime() > todayTimestamp.getTime();
					return isFutureEvent;
			});
};