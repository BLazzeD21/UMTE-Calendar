import { colors } from "@/utils";

export const log = (message: string, color = colors.reset): void => {
	console.log(`${color}${message}${colors.reset}`);
};
