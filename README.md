# Gemini CLI Reminder Extension

[![Version](https://img.shields.io/github/v/release/hermannhahn/gemini-cli-reminder)](https://github.com/hermannhahn/gemini-cli-reminder/releases)
[![License](https://img.shields.io/github/license/hermannhahn/gemini-cli-reminder)](https://github.com/hermannhahn/gemini-cli-reminder/blob/main/LICENSE)
[![GitHub Topics](https://img.shields.io/github/topics/hermannhahn/gemini-cli-reminder)](https://github.com/hermannhahn/gemini-cli-reminder/topics)

A specialized MCP extension for Gemini CLI that provides an interactive task reminder system with context blocking support.

## 🛠️ Architecture

- **TypeScript Stack**: Strong static typing and modern syntax (ES2022) ensure code reliability.
- **Production Bundling**: Optimized with `webpack` to minify and bundle into a single `tool_code.js` artifact.
- **Clean Code Enforcer**: Strict `ESLint` rules and `TypeScript-ESLint` integration prevent common bugs.
- **Context Management**: Designed to block the agent's execution until the specified time is reached, maintaining perfect context alignment.
- **Persistence**: Reminders are stored in JSON to survive application restarts.

## 🚀 Features

- **Relative Scheduling**: Set reminders in human terms (e.g., "in 5 minutes", "in 1 hour").
- **Agent Blocking**: This tool blocks the current agent, which is essential for monitoring loops and sequential task dependencies.
- **Reliable Persistence**: Your reminders are saved locally in the extension's data store.

## 📋 Prerequisites

1. **Node.js 20+**
2. **npm**
3. **Git**

## 🔧 Installation and Setup

To build and prepare the extension locally:

```bash
npm install
npx webpack
```

### Installation in Gemini CLI

```bash
gemini extensions install https://github.com/hermannhahn/gemini-cli-reminder.git
```

## 🛠️ Available Tools

- **`reminder_in`**: Create a reminder that triggers after a relative time interval (specified in minutes).
  - **Wait Behavior**: This tool _blocks_ the agent until the time is up.

## 📖 How to Use

Thinking of this as an **alarm clock for YOU** (the current agent). Use it for monitoring loops or when you must maintain the exact context of the current conversation to proceed.

> "Set a reminder for 10 minutes to check the server logs."
> "Check the database connection every 30 minutes and report any issues."

## 🤝 Contributing

We value your contributions! Check our [CONTRIBUTING.md](./CONTRIBUTING.md) to understand how to propose changes.

## 📜 License

Licensed under the **ISC License**. Refer to the [LICENSE](./LICENSE) file for more information.
