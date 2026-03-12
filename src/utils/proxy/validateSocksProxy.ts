import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";

import { logger } from "@/config";

export async function validateSocksProxy(proxyUrl: string | undefined): Promise<boolean> {
	if (!proxyUrl) {
		logger.info("Bot: The bot will be launched without using a proxy");
		return false;
	}

	try {
		const agent = new SocksProxyAgent(proxyUrl);

		const response = await axios.get("https://api.ipify.org?format=json", {
			httpAgent: agent,
			httpsAgent: agent,
			timeout: 5000,
		});

		logger.info(`External IP via ${process.env.PROXY_URL ? "proxy" : "direct"}: ${response.data.ip}`);

		return Boolean(response.data?.ip);
	} catch (error) {
		logger.error(`Failed to fetch external IP: ${error}`);
		logger.info("Bot: The bot will be launched without using a proxy");
		return false;
	}
}
