import { promises } from "fs";

import { logger } from "@/config";

import { lexicon } from "@/lexicon";

export const getFile = async (filePath: string): Promise<string | null> => {
	try {
		return await promises.readFile(filePath, "utf-8");
	} catch (error) {
		if (error?.code !== "ENOENT") {
			logger.error(lexicon.log.fileReadFailed(filePath, error));
		}

		return null;
	}
};
