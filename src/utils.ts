/**
 * Constructs an authorization URL for an upstream OAuth service (Google).
 */
export function getUpstreamAuthorizeUrl({
	upstreamUrl,
	clientId,
	scope,
	redirectUri,
	state,
	hostedDomain,
}: {
	upstreamUrl: string;
	clientId: string;
	scope: string;
	redirectUri: string;
	state?: string;
	hostedDomain?: string;
}) {
	const upstream = new URL(upstreamUrl);
	upstream.searchParams.set("client_id", clientId);
	upstream.searchParams.set("redirect_uri", redirectUri);
	upstream.searchParams.set("scope", scope);
	upstream.searchParams.set("response_type", "code");
	if (state) upstream.searchParams.set("state", state);
	if (hostedDomain) upstream.searchParams.set("hd", hostedDomain);
	return upstream.href;
}

/**
 * Exchanges an authorization code for an access token at an upstream token endpoint.
 */
export async function fetchUpstreamAuthToken({
	clientId,
	clientSecret,
	code,
	redirectUri,
	upstreamUrl,
	grantType,
}: {
	code: string | undefined;
	upstreamUrl: string;
	clientSecret: string;
	redirectUri: string;
	clientId: string;
	grantType: string;
}): Promise<[string, null] | [null, Response]> {
	if (!code) {
		return [null, new Response("Missing code", { status: 400 })];
	}

	const resp = await fetch(upstreamUrl, {
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			grant_type: grantType,
			redirect_uri: redirectUri,
		}).toString(),
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		method: "POST",
	});
	if (!resp.ok) {
		console.log(await resp.text());
		return [null, new Response("Failed to fetch access token", { status: 500 })];
	}

	interface authTokenResponse {
		access_token: string;
	}

	const body = (await resp.json()) as authTokenResponse;
	if (!body.access_token) {
		return [null, new Response("Missing access token", { status: 400 })];
	}
	return [body.access_token, null];
}

/**
 * Context derived from the OAuth flow, encrypted and stored in the worker-issued
 * access token. Made available to the MCP agent as `this.props` and to tool
 * handlers via `extra.authInfo` plumbing.
 */
export type Props = {
	email: string;
	name: string;
	sub: string;
};
