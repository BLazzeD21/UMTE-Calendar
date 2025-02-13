import { ICalEvent } from "../types/index.js";

export const getOldEvents = (events: ICalEvent[]) => {
	return events
		.map((eventsElement) => {
			const todayDate = new Date();
			todayDate.setHours(9, 0, 0, 0);

			if (eventsElement.start.getTime() < todayDate.getTime()) {
				return eventsElement;
			}

			return null;
		})
		.filter((item) => item !== null);
};
