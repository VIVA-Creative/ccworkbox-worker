// Secrets and non-var bindings that `wrangler types` does not emit into
// worker-configuration.d.ts. Declared here via interface merging so they
// appear on the global `Env` type used in handlers.

declare namespace Cloudflare {
	interface Env {
		// Workbox backend bearer token (set via `wrangler secret put CCWORKBOX_TOKEN`)
		CCWORKBOX_TOKEN: string;

		// Google OAuth client credentials (set via `wrangler secret put`)
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;

		// Random key used by workers-oauth-utils to sign approval cookies.
		// Generate via `openssl rand -hex 32` and store via `wrangler secret put`.
		COOKIE_ENCRYPTION_KEY: string;
	}
}
