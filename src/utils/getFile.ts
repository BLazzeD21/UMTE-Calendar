import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

export const getFile = (filePath: string): string | null => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const fullPath = path.join(__dirname, filePath);

	if (!fs.existsSync(filePath)) {
		return null;
	}

	const fileData = fs.readFileSync(fullPath, "utf-8");

	return fileData;
};
