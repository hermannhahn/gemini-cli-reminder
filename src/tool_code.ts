import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ScheduleReminderArgs } from "./types";
import { parseDateTime } from "./utils";

const server = new Server(
	{
		name: "gemini-cli-reminder",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "schedule_reminder",
				description:
					"Schedule a reminder. CRITICAL: This tool BLOCKS (suspends) the current agent until the specified time. It acts as an \"alarm clock\" for YOU (the Main Agent). Use this when YOU need to 'wake up' later to perform an action while maintaining the current session context. MANDATORY for monitoring loops where the current agent is responsible for the follow-up.",
				inputSchema: {
					type: "object",
					properties: {
						datetime: {
							type: "string",
							description:
								"When to remind. Supports: 'HH:mm:ss' or relative intervals like 'in 10 minutes'.",
						},
						message: {
							type: "string",
							description: "The message you will receive when you 'wake up'.",
						},
					},
					required: ["datetime", "message"],
				},
			},
			{
				name: "get_system_time",
				description: "Returns the current system time.",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	switch (name) {
		case "schedule_reminder": {
			const { datetime, message } = args as unknown as ScheduleReminderArgs;

			const executeAt = parseDateTime(datetime);
			const now = new Date();
			const delay = executeAt.getTime() - now.getTime();

			if (delay <= 0) {
				return {
					content: [
						{
							type: "text",
							text: `REMINDER: ${message}`,
						},
					],
				};
			}

			// Wait for the specified delay (max 24h as per previous logic, but here simple sleep)
			await new Promise((resolve) => setTimeout(resolve, delay));

			return {
				content: [
					{
						type: "text",
						text: `REMINDER: ${message}`,
					},
				],
			};
		}

		case "get_system_time": {
			return {
				content: [
					{
						type: "text",
						text: `🕒 ${new Date().toLocaleString()}`,
					},
				],
			};
		}

		default:
			throw new Error(`Tool not found: ${name}`);
	}
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
