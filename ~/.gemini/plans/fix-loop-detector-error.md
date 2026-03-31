# Plan: Fix AbortError (Loop Detector) for Long Reminders

## Objective
Prevent the Gemini CLI from aborting long-duration reminders by introducing a `nonce` parameter that makes each consecutive call unique to the loop detector.

## Key Files & Context
- `src/types.ts`: Update arguments interface.
- `src/tool_code.ts`: Update tool schema and `CONTINUE_WAIT` logic.

## Implementation Steps

### 1. Update Types
- Add `nonce?: string` to the `ScheduleReminderArgs` interface in `src/types.ts`.

### 2. Update Tool Schema
- In `src/tool_code.ts`, add the `nonce` property to the `schedule_reminder` tool schema.
- Update the description to explain that the `nonce` must be passed back when provided.

### 3. Update Continue Wait Logic
- In `src/tool_code.ts`, when generating the `CONTINUE_WAIT` signal:
    - Generate a random string or a timestamp as a `nonce`.
    - Include the `nonce` in the base64-encoded instructions for the model.
    - Update the return message to mention that the `nonce` is required for loop detection safety.

### 4. Version Bump
- Update version to `0.1.9` in `package.json` and ensure synchronization via `npm run update:version`.

## Verification & Testing
1. Schedule a reminder for 21 minutes (triggers two `CONTINUE_WAIT` cycles).
2. Verify that the CLI does not trigger `AbortError: GeminiClient._recoverFromLoop`.
3. Verify that the model uses the provided `nonce` in its follow-up calls.

## Migration & Rollback
- No migration required.
- Rollback by reverting the `nonce` logic if unexpected side effects occur.
