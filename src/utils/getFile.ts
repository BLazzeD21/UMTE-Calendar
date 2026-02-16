import fs, { promises } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { logger } from "@/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getFile = async (filePath: string): Promise<string | null> => {
	const fullPath = path.resolve(__dirname, filePath);

	try {
		if (!fs.existsSync(fullPath)) {
			logger.warn(`Warning: File not found at ${filePath}`);
			return null;
		}

		const fileData = await promises.readFile(fullPath, "utf-8");

		return fileData;
	} catch (error) {
		logger.error(`Error reading file at", ${error}`);
	}
};
