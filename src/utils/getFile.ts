import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import { log, colors } from "@/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getFile = (filePath: string): string | null => {
	const fullPath = path.resolve(__dirname, filePath);

	try {
		if (!fs.existsSync(fullPath)) {
			log(`Error: File not found at ${filePath}`);
			return null;
		}

		const fileData = fs.readFileSync(fullPath, "utf-8");

		return fileData;
	} catch (error) {
		log(`Error reading file at", ${error}`, colors.red);
	}
};
