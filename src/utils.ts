export function parseDateTime(datetime: string): Date {
	const now = new Date();
	let date = new Date(datetime);

	// Relative time: "in 5 minutes", "in 1 hour", etc.
	const relativeMatch = datetime.match(/in (\d+) (second|minute|hour|day)s?/i);
	if (relativeMatch) {
		const amount = parseInt(relativeMatch[1]);
		const unit = relativeMatch[2].toLowerCase();
		date = new Date(now);

		if (unit.startsWith("second")) date.setSeconds(now.getSeconds() + amount);
		if (unit.startsWith("minute")) date.setMinutes(now.getMinutes() + amount);
		if (unit.startsWith("hour")) date.setHours(now.getHours() + amount);
		if (unit.startsWith("day")) date.setDate(now.getDate() + amount);
		return date;
	}

	// If datetime is just HH:mm:ss, assume today at that time
	if (datetime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
		const [hours, minutes, seconds] = datetime.split(":").map(Number);
		date = new Date(now);
		date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
		
		// If the time has already passed today, assume tomorrow
		if (date <= now) {
			date.setDate(date.getDate() + 1);
		}
	}
	return date;
}
