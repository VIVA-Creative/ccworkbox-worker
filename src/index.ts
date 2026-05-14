import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

export class CCWorkboxMCP extends McpAgent {
  server = new McpServer({
    name: "CC's Workbox (Viva)",
    version: "1.0.0",
  });

  async init() {
    const env = (this as any).env;

    // ── send_task ─────────────────────────────────────────────────────────────
    this.server.tool(
      "send_task",
      {
        instructions: z.string().describe("Full instruction set for Claude Code. Markdown, any length."),
        work_dir: z.string().optional().describe("Absolute path CC should work in on Viva."),
        task_label: z.string().optional().describe("Short human-readable label for this task."),
      },
      async ({ instructions, work_dir, task_label }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/task`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
            body: JSON.stringify({ instructions, work_dir, task_label }),
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    // ── get_status ────────────────────────────────────────────────────────────
    this.server.tool(
      "get_status",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/task/${task_id}/status`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    // ── get_results ───────────────────────────────────────────────────────────
    this.server.tool(
      "get_results",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/task/${task_id}/results`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
          });
          const text = await response.text();
          return { content: [{ type: "text", text }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    // ── get_log ───────────────────────────────────────────────────────────────
    this.server.tool(
      "get_log",
      { task_id: z.string().describe("The task_id returned by send_task.") },
      async ({ task_id }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/task/${task_id}/log`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
          });
          const text = await response.text();
          return { content: [{ type: "text", text }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    // ── list_tasks ────────────────────────────────────────────────────────────
    this.server.tool(
      "list_tasks",
      { limit: z.number().optional().describe("Max tasks to return (default 10).") },
      async ({ limit }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/tasks?limit=${limit || 10}`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );

    // ── cancel_task ───────────────────────────────────────────────────────────
    this.server.tool(
      "cancel_task",
      { task_id: z.string().describe("The task_id to cancel.") },
      async ({ task_id }) => {
        try {
          const response = await fetch(`${env.CCWORKBOX_API}/task/${task_id}/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env?.CCWORKBOX_TOKEN || ""}`,
            },
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error}` }] };
        }
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return CCWorkboxMCP.serve("/mcp").fetch(request, env, ctx);
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: env.CCWORKBOX_SERVICE }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("CC's Workbox MCP (Viva). Use /mcp endpoint.", { status: 200 });
  },
};
