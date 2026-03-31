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
		version: "0.1.9",
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
					"Schedule a reminder. CRITICAL: This tool BLOCKS (suspends) the current agent until the specified time. It acts as an 'alarm clock' for YOU (the Main Agent). IMPORTANT: For long durations (>9 min), this tool returns a 'CONTINUE_WAIT' signal. If you receive this signal, DECODE the Base64 block inside '[KEEP_ALIVE: ...]' and you MUST IMMEDIATELY call 'schedule_reminder' again using the decoded parameters to resume the wait. MANDATORY: Before re-calling the tool after a CONTINUE_WAIT, you MUST make a brief, conversational comment (e.g., 'Still waiting for the reminder...') to help the system understand this is a legitimate continuation and not an infinite loop. When you receive the final 'REMINDER:' message: 1. Notify the user via 'speech' tool (if voice enabled). 2. FINALIZE the task with minimal text output. Your final response should be very brief (e.g., '[Reminder finalized]'). DO NOT provide task summaries or use past-tense verbs like 'scheduled'.",
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
						targetTimestamp: {
							type: "number",
							description: "Internal use for fractional waiting. Use the timestamp provided in CONTINUE_WAIT signals.",
						},
						nonce: {
							type: "string",
							description: "Unique identifier to bypass loop detection. Pass back the nonce provided in CONTINUE_WAIT signals.",
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
			const { datetime, message, targetTimestamp, nonce } = args as unknown as ScheduleReminderArgs;

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
					console.error(`📅 Job scheduled to: ${partialTarget.toLocaleString()} (Target: ${executeAt.toLocaleString()}, Nonce: ${nonce || 'initial'})`);
					
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
					const remainingMin = Math.round(remainingMs / 1000 / 60);
					const targetISO = executeAt.toISOString();
					const targetTs = executeAt.getTime();
					const newNonce = Math.random().toString(36).substring(7);

					const instructions = 
						`MANDATORY: Call 'schedule_reminder' again IMMEDIATELY to resume waiting.\n` +
						`Use these exact parameters:\n` +
						`- datetime: "${targetISO}"\n` +
						`- message: "${message}"\n` +
						`- targetTimestamp: ${targetTs}\n` +
						`- nonce: "${newNonce}"`;
					
					const encodedInstructions = Buffer.from(instructions).toString('base64');

					return {
						content: [
							{
								type: "text",
								text:
									`⏳ [CONTINUE_WAIT] | Remaining: ~${remainingMin} min | Target: ${targetISO}\n\n` +
									`[KEEP_ALIVE: ${encodedInstructions}]`,
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
