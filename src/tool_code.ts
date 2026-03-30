import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ScheduleReminderArgs } from "./types";
import { parseDateTime } from "./utils";
import * as schedule from "node-schedule";

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
					"Schedule a reminder. CRITICAL: This tool BLOCKS (suspends) the current agent until the specified time. It acts as an 'alarm clock' for YOU (the Main Agent). IMPORTANT: For long durations (>9 min), this tool returns a 'CONTINUE_WAIT|timestamp|message' signal to bypass host timeouts. If you receive this signal, you MUST IMMEDIATELY call 'schedule_reminder' again using the provided 'targetTimestamp' (the second field) and the same 'message' to continue the wait. DO NOT inform the user that the wait is over until you receive the final 'REMINDER:' message.",
				inputSchema: {
					type: "object",
					properties: {
						datetime: {
							type: "string",
							description:
								"When to remind. Supports: relative ('in 5 minutes', '10 mins'), fixed time ('14:30', '14:30:00'), or absolute date/time strings.",
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
			const { datetime, message, targetTimestamp } = args as unknown as ScheduleReminderArgs;

			try {
				const executeAt = targetTimestamp ? new Date(targetTimestamp) : parseDateTime(datetime);
				const now = new Date();
				const totalDelay = executeAt.getTime() - now.getTime();

				if (totalDelay <= 0) {
					return {
						content: [
							{
								type: "text",
								text: `⚠️ Scheduled time has already passed: ${executeAt.toLocaleString()}. Firing immediately.\nREMINDER: ${message}`,
							},
						],
					};
				}

				// Fractional wait: if delay > 9 minutes, wait 9 mins and ask for re-call to avoid host timeout
				const MAX_WAIT_MS = 9 * 60 * 1000; // 9 minutes
				const isFractional = totalDelay > MAX_WAIT_MS;
				const partialTarget = isFractional ? new Date(now.getTime() + MAX_WAIT_MS) : executeAt;

				// Wait for the specified delay using node-schedule
				await new Promise((resolve) => {
					console.error(`📅 Job scheduled to: ${partialTarget.toLocaleString()} (Target: ${executeAt.toLocaleString()})`);
					
					// Heartbeat to prevent host timeout (extra safety)
					const heartbeat = setInterval(() => {
						console.error(`💓 Heartbeat: ${new Date().toLocaleString()} - Waiting for job...`);
					}, 60000); // Every 1 minute

					schedule.scheduleJob(partialTarget, () => {
						clearInterval(heartbeat);
						console.error(`🔔 Job triggered at: ${new Date().toLocaleString()}`);
						resolve(null);
					});
				});

				if (isFractional) {
					const remainingMs = executeAt.getTime() - new Date().getTime();
					return {
						content: [
							{
								type: "text",
								text: `CONTINUE_WAIT|${executeAt.getTime()}|${message}|Remaining: ${Math.round(remainingMs / 1000 / 60)} minutes. MANDATORY: Call schedule_reminder again with targetTimestamp=${executeAt.getTime()} and same message to continue waiting.`,
							},
						],
					};
				}

				return {
					content: [
						{
							type: "text",
							text: `REMINDER: ${message}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `❌ Error scheduling reminder: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
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
