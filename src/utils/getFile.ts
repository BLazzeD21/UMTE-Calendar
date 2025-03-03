import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { colors, log } from "@/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getFile = async (filePath: string): Promise<string | null> => {
	const fullPath = path.resolve(__dirname, filePath);

	try {
		if (!fs.existsSync(fullPath)) {
			log(`Error: File not found at ${filePath}`, colors.red);
			return null;
		}

		const fileData = fs.promises.readFile(fullPath, "utf-8");

		return fileData;
	} catch (error) {
		log(`Error reading file at", ${error}`, colors.red);
	}
};
