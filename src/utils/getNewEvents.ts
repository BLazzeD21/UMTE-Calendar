import { ScheduleItem } from "../types/index.js";

export const getNewEvents = (events: ScheduleItem[]) => {
	const todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);

	return events
		.map((eventsElement) => {
			const { startTime, date } = eventsElement;

			const [startTimeMins, startTimeHours] = startTime.split(":").map(Number);
			const startDate = new Date(date.year, date.month - 1, date.day, startTimeMins, startTimeHours);

			if (startDate.getTime() > todayDate.getTime()) {
				return eventsElement;
			}

			return null;
		})
		.filter((item) => item !== null);
};
