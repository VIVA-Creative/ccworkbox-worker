import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { GoogleHandler } from "./google-handler";
import type { Props } from "./utils";

export class CCWorkboxMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "CC's Workbox",
    version: "1.1.0",
  });

  async init() {
    const env = (this as unknown as { env: Env }).env;

    const workboxFetch = async (path: string, init?: RequestInit) => {
      return fetch(`${env.CCWORKBOX_API}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.CCWORKBOX_TOKEN ?? ""}`,
          "X-Caller-Email": this.props?.email ?? "unknown",
          ...(init?.headers ?? {}),
        },
      });
    };

    this.server.tool(
      "send_task",
      {
        instructions: z.string().describe("Full instruction set for Claude Code. Markdown, any length."),
        work_dir: z.string().optional().describe("Absolute path CC should work in on the backing host."),
        task_label: z.string().optional().describe("Short human-readable label for this task."),
      },
      async ({ instructions, work_dir, task_label }) => {
        try {
          const response = await workboxFetch("/task", {
            method: "POST",
            body: JSON.stringify({ instructions, work_dir, task_label }),
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    this.server.tool(
      "get_status",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await workboxFetch(`/task/${task_id}/status`);
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    this.server.tool(
      "get_results",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await workboxFetch(`/task/${task_id}/results`);
          const text = await response.text();
          return { content: [{ type: "text", text }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    this.server.tool(
      "get_log",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await workboxFetch(`/task/${task_id}/log`);
          const text = await response.text();
          return { content: [{ type: "text", text }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    this.server.tool(
      "list_tasks",
      { limit: z.number().optional().describe("Max tasks to return (default 10).") },
      async ({ limit }) => {
        try {
          const response = await workboxFetch(`/tasks?limit=${limit || 10}`);
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    this.server.tool(
      "cancel_task",
      { task_id: z.string().describe("The task_id to cancel.") },
      async ({ task_id }) => {
        try {
          const response = await workboxFetch(`/task/${task_id}/cancel`, { method: "POST" });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );
  }
}

export default new OAuthProvider({
  apiHandler: CCWorkboxMCP.serve("/mcp") as never,
  apiRoute: "/mcp",
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GoogleHandler as never,
  tokenEndpoint: "/token",
});
