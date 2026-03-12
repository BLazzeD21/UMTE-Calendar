import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";

import { logger } from "@/config";

import { lexicon } from "@/lexicon";

export async function validateSocksProxy(proxyUrl: string | undefined): Promise<boolean> {
	if (!proxyUrl) {
		logger.info(lexicon.log.proxyDisabled);
		return false;
	}

	try {
		const agent = new SocksProxyAgent(proxyUrl);

		const response = await axios.get("https://api.ipify.org?format=json", {
			httpAgent: agent,
			httpsAgent: agent,
			timeout: 5000,
		});

		const type = process.env.PROXY_URL ? "proxy" : "direct";

		logger.info(lexicon.log.externalIp(type, response.data.ip));

		return Boolean(response.data?.ip);
	} catch (error) {
		logger.error(lexicon.log.failedFetchExternalIp(error));
		logger.info(lexicon.log.proxyDisabled);

		return false;
	}
}
