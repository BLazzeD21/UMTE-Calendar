export const normalizeICS = (calendar: string): string => {
	return calendar
		.replace(/DTSTAMP:[^\r\n]*/g, "")
		.replace(/SEQUENCE:[^\r\n]*/g, "")
		.replace(/LAST-MODIFIED:[^\r\n]*/g, "")
		.replace(/CREATED:[^\r\n]*/g, "")
		.replace(/\r\n/g, "\n")
		.replace(/\n+/g, "\n")
		.trim();
};
