# ccworkbox-worker

Cloudflare Worker MCP shim for the VIVA bridge system.

This Worker is the OAuth-gated front door for a vivabridge. One source tree
backs every deployment; per-bridge configuration lives in
`wrangler.<project>.jsonc` files alongside the canonical `wrangler.jsonc`.

For architecture, setup, operations, and troubleshooting documentation, see
**[VIVA-Creative/vivabridge](https://github.com/VIVA-Creative/vivabridge)**.

## License

MIT. See [LICENSE](./LICENSE).
