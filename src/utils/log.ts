import { colors } from "@/utils";

export const log = (message: string, color = colors.reset): void => {
	const currentTime = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
	console.log(`${color}${currentTime}: ${message}${colors.reset}`);
};
