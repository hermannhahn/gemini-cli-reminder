import { parseDateTime } from "./src/utils";

const testCases = [
    "in 5 minutes",
    "in 1 hour",
    "in 1 day",
    "14:30",
    "14:30:00",
    "2024-03-31 10:00:00",
    "invalid",
    "10 minutes"
];

console.log("Current time:", new Date().toLocaleString());
testCases.forEach(tc => {
    try {
        const result = parseDateTime(tc);
        console.log(`Input: "${tc}" -> Result: ${result.toLocaleString()}`);
    } catch (e) {
        console.log(`Input: "${tc}" -> Error: ${e}`);
    }
});
