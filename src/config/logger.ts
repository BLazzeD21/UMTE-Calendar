import { createLogger, format, transports } from "winston";

const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	purple: "\x1b[35m",
};

const { combine, timestamp, printf, errors, json } = format;

const isProduction = process.env.NODE_ENV === "production";

const customColorize = format((info) => {
	const levelColors = {
		error: colors.red,
		warn: colors.yellow,
		info: colors.green,
		debug: colors.cyan,
		verbose: colors.purple,
	};

	if (levelColors[info.level]) {
		info.level = `${levelColors[info.level]}${info.level}${colors.reset}`;
	}

	return info;
});

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
	let format = `[${level}]: ${message}`;

	if (stack) {
		format = `[${level}]: ${colors.red}${stack}${colors.reset}`;
	}

	if (typeof message === "object") {
		format = `[${level}]: ${colors.cyan}${JSON.stringify(message, null, 2)}${colors.reset}`;
	}

	if (!isProduction) {
		format = `${timestamp} ` + format;
	}

	return format;
});

const logger = createLogger({
	level: "info",
	format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), json()),
	transports: [
		new transports.Console({
			format: combine(customColorize(), timestamp({ format: "HH:mm:ss" }), consoleFormat),
		}),
		new transports.File({
			filename: "logs/error.log",
			level: "error",
			format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), json()),
		}),
		new transports.File({
			filename: "logs/combined.log",
			format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
		}),
	],
});

export { logger };
