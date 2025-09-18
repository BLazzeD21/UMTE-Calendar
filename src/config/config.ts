import path from "path";

export const CONFIG = {
	dirs: {
		calendar: path.join(process.cwd(), "calendar"),
		backup: path.join(process.cwd(), "backup"),
	},
	files: {
		calendar: path.join(process.cwd(), "calendar", "calendar.ics"),
		backupActual: {
			name: "ActualCalendar.ics",
			path: path.join(process.cwd(), "backup", "ActualCalendar.ics"),
		},
	},
	schedulerDelay: 60 * 60 * 1000, // 1 hour
};
