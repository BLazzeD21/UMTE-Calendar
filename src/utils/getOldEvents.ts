import { ICalEvent } from "../types/index.js";

export const getOldEvents = (events: ICalEvent[]) => {
	const todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);

	return events
		.map((eventsElement) => {
			if (eventsElement.start.getTime() < todayDate.getTime()) {
				return eventsElement;
			}

			return null;
		})
		.filter((item) => item !== null);
};
