import { lexicon } from "@/lexicon";

export const formatDateToRussian = (dateString: string | Date): string => {
	const date = new Date(dateString);

	const dayOfWeek = lexicon.daysOfWeek[date.getDay()];
	const day = date.getDate();
	const month = lexicon.months[date.getMonth()];
	const year = date.getFullYear();

	return `${dayOfWeek}, ${day} ${month} ${year}`;
};
