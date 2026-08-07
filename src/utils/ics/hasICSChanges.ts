import { compareICSFiles } from "@/utils";

export const hasICSChanges = (calendarContent: string, existingContent: string): boolean => {
	return !compareICSFiles(calendarContent, existingContent);
};
