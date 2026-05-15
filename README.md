# ccworkbox-worker

Cloudflare Worker MCP shim for VIVA Workbox.

## What this is

This Worker is an MCP (Model Context Protocol) server hosted on Cloudflare. It is the bridge between Claude.ai (which speaks MCP) and a backing **Workbox API** running on a VIVA machine (which speaks REST). The Worker translates MCP tool calls from Claude.ai into authenticated REST calls against the configured Workbox.

## Architecture

```
Claude.ai (MCP custom connector)
        |
        v
Cloudflare Worker (this code) ── translates MCP -> REST
        |
        | HTTPS + Authorization: Bearer ${CCWORKBOX_TOKEN}
        v
Workbox API on the target VIVA machine
        |
        v
Claude Code session running locally on that machine
```

The Worker exposes the standard six tools (`send_task`, `get_status`, `get_results`, `get_log`, `list_tasks`, `cancel_task`) on the `/mcp` endpoint plus a `/health` check.

## Deployed Workers using this source

| Worker name | Backing Workbox | Backend URL |
|---|---|---|
| `viva-ccworkbox` | Florida Mac | `http://tudorhome.duckdns.org:4014` |
| `ccworkbox-rockville` (planned) | Rockville machine | via Cloudflare Tunnel |

## Required secret

Each deployment needs `CCWORKBOX_TOKEN` set as a Worker secret. The value must match the bearer token of the backing Workbox API (the same `CCWORKBOX_TOKEN` written into the Workbox's `.env`).

Set it with:

```
wrangler secret put CCWORKBOX_TOKEN
```

## Backend URL

The backend URL is hardcoded as the `CCWORKBOX_API` constant in `src/index.ts`. Each variant of this Worker must point at the right machine.

## Creating a new variant

1. Copy this directory to a sibling path (e.g. `ccworkbox-<name>-worker`).
2. Remove the copied `.git` directory so it isn't a confused fork.
3. Edit `wrangler.jsonc` and change the `name` field to a new Worker name.
4. Edit `src/index.ts` and change `CCWORKBOX_API` to the new backend URL.
5. Optionally update the user-facing server name (the `name` field inside `new McpServer({...})`) so the connector identifies itself clearly in Claude.ai.
6. `wrangler secret put CCWORKBOX_TOKEN` with the matching bearer token for that backend.
7. `wrangler deploy`.
8. Register the resulting `*.workers.dev` URL as a custom connector in Claude.ai.
