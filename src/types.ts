export interface ScheduleReminderArgs {
	datetime: string;
	message: string;
	targetTimestamp?: number;
	nonce?: string;
}
