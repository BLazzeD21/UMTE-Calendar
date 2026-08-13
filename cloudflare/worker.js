const API_ROOT = "https://api.telegram.org";
const BOT_PATH = /^\/(?:file\/)?bot([^/]+)\//;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const match = url.pathname.match(BOT_PATH);

		if (!match) {
			return new Response("Not found", { status: 404 });
		}

		if (env.BOT_TOKEN && match[1] !== env.BOT_TOKEN) {
			return new Response("Forbidden", { status: 403 });
		}

		return fetch(new Request(API_ROOT + url.pathname + url.search, request));
	},
};
