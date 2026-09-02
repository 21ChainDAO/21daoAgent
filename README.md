# 21DAO

**Chain-agnostic tooling for the onchain world.**

21DAO is an open-source, local-first agent workspace for developers building onchain applications.

It combines repository-aware AI agents, development tools, blockchain interfaces, and auditable execution into a single environment designed for experimenting, debugging, and shipping onchain software.

Solana is the first deeply integrated network, with the architecture designed to remain chain-agnostic.

---

## Overview

Modern onchain development is fragmented across repositories, RPC providers, explorers, wallets, CLIs, documentation, testing environments, and deployment tooling.

21DAO brings these workflows into one programmable runtime.

Agents can understand a repository, inspect programs, execute development tools, interact with Solana infrastructure, simulate transactions, analyze results, and maintain a persistent record of their actions.

The goal is simple:

**Make onchain development agent-native.**

---

## Core Principles

### Local First

Projects, agent state, execution history, and development context remain local by default.

21DAO is designed as a developer environment rather than a remote black box.

### Auditable Execution

Agent activity is represented as structured events.

Messages, tool calls, tool results, transaction simulations, permission decisions, errors, and termination events can be recorded as an append-only execution history.

This makes agent behavior inspectable and reproducible.

### Repository Aware

21DAO agents operate with knowledge of the repository they are working inside.

Agents can inspect project structure, source code, dependencies, configuration, Git history, and development scripts before taking action.

### Onchain Native

Blockchain interaction is treated as a first-class development primitive.

21DAO provides interfaces for:

* RPC interaction
* wallet operations
* transaction construction
* transaction simulation
* program inspection
* account inspection
* instruction decoding
* deployment workflows
* onchain debugging

### Chain Agnostic

Solana is the first major integration.

The runtime itself is not designed around a single blockchain.

Protocol adapters allow additional chains, execution environments, and developer stacks to be integrated without rebuilding the core agent system.

---

## Solana

21DAO ships with dedicated tooling for Solana developers.

The Solana adapter provides agents with structured access to programs, accounts, transactions, instructions, RPC methods, and development environments.

Example workflows include:

```text
> inspect this Solana program

> explain why this transaction failed

> trace the instructions executed by this transaction

> analyze this repository before deployment

> simulate this transaction locally

> inspect all accounts touched by this instruction

> find potential problems in this Anchor program

> generate tests for this program
```

The objective is not to replace existing Solana tooling.

21DAO gives agents a common interface for using it.

---

## Architecture

```text
21dao/
│
├── apps/
│   ├── cli/
│   └── workspace/
│
├── packages/
│   ├── agent/
│   ├── core/
│   ├── runtime/
│   ├── github/
│   ├── solana/
│   ├── wallet/
│   ├── rpc/
│   ├── simulator/
│   └── tools/
│
├── protocols/
│   ├── solana/
│   └── adapters/
│
├── skills/
│   ├── program-inspector/
│   ├── transaction-debugger/
│   ├── repo-analysis/
│   └── contract-review/
│
├── examples/
├── docs/
├── scripts/
└── tests/
```

### `agent`

Agent lifecycle, context management, reasoning interfaces, permissions, and execution control.

### `runtime`

Coordinates agents, tools, execution environments, events, and state.

### `github`

Repository-aware tooling for source inspection, Git operations, project discovery, and development workflows.

### `solana`

Native Solana integration and developer primitives.

### `rpc`

RPC abstraction and provider management.

### `simulator`

Transaction and program simulation interfaces.

### `tools`

Standardized tools exposed to agents during execution.

### `protocols`

Chain-specific adapters that connect the 21DAO runtime to external execution environments.

---

## Execution Model

Every agent session can be represented as a sequence of events.

```text
Session Started
      │
      ▼
User Request
      │
      ▼
Repository Context
      │
      ▼
Agent Decision
      │
      ▼
Tool Call
      │
      ▼
Tool Result
      │
      ▼
Onchain Simulation
      │
      ▼
Agent Response
      │
      ▼
Session Completed
```

Rather than hiding this process, 21DAO makes execution history inspectable.

This allows developers to understand not only **what** an agent produced, but **how it got there**.

---

## GitHub-Native Development

21DAO treats the repository as the primary unit of context.

Agents can reason about:

```text
source code
dependencies
commits
branches
configuration
tests
documentation
program interfaces
deployment scripts
```

This allows agents to operate with substantially more context than isolated code-generation prompts.

---

## Tools

Tools are modular capabilities exposed to the agent runtime.

```ts
interface Tool {
  name: string;
  description: string;

  execute(
    input: ToolInput,
    context: RuntimeContext
  ): Promise<ToolResult>;
}
```

Tools can interact with local development environments, repositories, blockchain infrastructure, or external developer services.

Developers can also create their own tools and expose them to 21DAO agents.

---

## Skills

Skills are reusable workflows built on top of the runtime.

Initial skills include:

**Program Inspector**

Analyze program architecture, instructions, accounts, and dependencies.

**Transaction Debugger**

Inspect failed transactions and identify likely failure conditions.

**Repository Analysis**

Map an unfamiliar repository and explain its architecture.

**Contract Review**

Perform structured analysis of onchain programs before deployment.

---

## Why 21DAO?

AI coding agents are becoming capable developers.

Blockchains are becoming programmable financial infrastructure.

The tooling connecting those two worlds is still primitive.

21DAO explores what happens when agents become first-class participants in onchain development.

Not another chatbot.

Not another explorer.

Not another RPC wrapper.

**An execution environment for onchain agents.**

---

## Roadmap

**01 — Solana Runtime**

Repository analysis, RPC tooling, program inspection, transaction simulation, and local agent execution.

**02 — Developer Skills**

Reusable workflows for debugging, security analysis, testing, deployment, and protocol research.

**03 — Multi-Agent Execution**

Specialized agents collaborating across larger repositories and development tasks.

**04 — Additional Chains**

Introduce protocol adapters while keeping the core runtime chain-agnostic.

**05 — Open Agent Infrastructure**

Allow developers to build, publish, and compose their own onchain tools and skills.

---

## Status

21DAO is experimental software under active development.

Interfaces, packages, and architecture may change rapidly.

Do not use experimental agent-generated transactions with production wallets or valuable assets without independent verification.

---

## Contributing

21DAO is built for hackers, protocol developers, security researchers, and developers experimenting at the intersection of AI and crypto.

Issues, experiments, integrations, tools, and pull requests are welcome.

```bash
git clone https://github.com/21dao/21dao.git
cd 21dao
```

Build something weird.

---

## 21DAO

**Chain-agnostic hackers building tools for the onchain world.**

Solana first.
Onchain everywhere.
