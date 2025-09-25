import { compareICSFiles, getFile } from "@/utils";

export const hasICSChanges = async (calendarContent: string, ACTUAL_CALENDAR_PATH: string) => {
	const existingCalendarContent = await getFile(ACTUAL_CALENDAR_PATH);

	return [!compareICSFiles(calendarContent, existingCalendarContent), existingCalendarContent];
};
