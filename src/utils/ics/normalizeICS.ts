const VOLATILE_PROPERTIES = ["DTSTAMP", "SEQUENCE", "LAST-MODIFIED", "CREATED"];

export const normalizeICS = (calendar: string): string => {
	return calendar
		.replace(/\r\n/g, "\n")
		.replace(/\n[ \t]/g, "")
		.replace(new RegExp(`^(?:${VOLATILE_PROPERTIES.join("|")}):[^\n]*\n?`, "gm"), "")
		.trim();
};
