import { colors } from "@/utils";

export const log = (message: string, color = colors.reset): void => {
	console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
};
