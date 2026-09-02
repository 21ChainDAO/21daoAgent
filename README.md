# 21Agent

**The onchain coding agent by 21DAO.**

21Agent is an open-source coding agent built for developers working across Solana and the onchain ecosystem.

It combines an AI-native terminal workflow with repository awareness, blockchain tooling, transaction inspection, program analysis, and extensible developer skills.

Built by **21DAO** — chain-agnostic hackers building infrastructure for the onchain world.

---

## What is 21Agent?

21Agent is a coding environment designed around a simple idea:

**Your coding agent should understand the chain you're building on.**

Traditional coding agents understand files, repositories, terminals, and development environments.

21Agent extends that model into the onchain world.

It can work with:

* source code
* Git repositories
* terminal commands
* Solana programs
* RPC endpoints
* transactions
* accounts
* instructions
* IDLs
* Anchor projects
* wallets
* program logs
* deployment workflows

Instead of switching between your coding agent, explorer, RPC console, CLI, documentation, and debugging tools, 21Agent brings those workflows into one programmable environment.

---

## Quick Start

```bash
npm install -g @21dao/21agent
```

Start 21Agent inside your project:

```bash
cd my-project
21agent
```

Then talk to it.

```text
> explain this repository

> find the bug in this program

> inspect the Anchor instructions

> analyze this Solana transaction

> explain why this transaction failed

> generate tests for this program

> inspect the accounts touched by this instruction

> review this program before deployment
```

---

## Solana Native

Solana is the first deeply integrated network in 21Agent.

21Agent understands common Solana development primitives and can expose them directly to the model.

```text
Repository
    │
    ├── Source
    ├── Anchor
    ├── IDL
    └── Tests
         │
         ▼
     21Agent
         │
    ┌────┼──────────┐
    │    │          │
   RPC  Programs  Transactions
    │    │          │
    └────┼──────────┘
         ▼
       Solana
```

Use 21Agent to inspect programs, reason about instructions, decode transactions, analyze accounts, simulate execution, and debug onchain behavior without leaving your development workflow.

---

## Repository Aware

21Agent operates inside your repository.

It can inspect:

```text
src/
programs/
tests/
scripts/
migrations/
package.json
Anchor.toml
Cargo.toml
.git/
```

This gives the model context about what you're actually building before it starts changing code.

Reference files directly:

```text
@programs/vault/src/lib.rs

@Anchor.toml

@tests/vault.ts
```

Or ask questions across the entire project:

```text
> map this codebase

> explain how funds move through this protocol

> find every instruction that can modify authority

> review the repository for unsafe account validation
```

---

## Tools

21Agent exposes development capabilities as tools.

Core tools include:

```text
read
write
edit
bash
grep
find
git
rpc
solana
simulate
inspect
```

The agent decides when and how to use them while working through a task.

Additional capabilities can be installed or implemented without changing the core agent.

---

## Skills

Skills provide reusable onchain workflows.

```text
skills/
├── anchor-review/
├── program-inspector/
├── transaction-debugger/
├── repo-analysis/
├── account-inspector/
├── security-review/
├── deployment-check/
└── protocol-research/
```

Example:

```text
/skill:transaction-debugger
```

21Agent can then inspect the transaction, retrieve execution information, analyze program logs, identify relevant instructions, and explain likely failure conditions.

Developers can build and distribute their own skills.

---

## Sessions

Development sessions can be persisted locally.

A session records the interaction between the developer, model, repository, and tools.

```text
Developer Prompt
      │
      ▼
Agent Reasoning
      │
      ▼
Tool Call
      │
      ▼
Tool Result
      │
      ▼
Code / Chain Interaction
      │
      ▼
Agent Response
```

Sessions make complex development workflows easier to continue, inspect, reproduce, and debug.

---

## Multiple Models

21Agent is designed to remain model-agnostic.

Use the model that fits your workflow.

```bash
21agent --provider anthropic
21agent --provider openai
21agent --provider google
```

Model providers and available models can be configured independently from the core runtime.

21DAO does not believe your development environment should be permanently tied to a single model provider.

---

## Interactive Mode

Run:

```bash
21agent
```

to launch the interactive terminal environment.

From there you can work with the agent like another developer sitting inside your repository.

```text
21agent >

> inspect programs/token-vault

Reading program...

> identify the authority model

Analyzing instructions and account constraints...

> now check whether any instruction can bypass it

Searching program instructions...
```

The agent can read files, modify code, execute commands, inspect repository state, and invoke onchain development tools.

---

## CLI

```bash
21agent [options] [@files...] [prompt]
```

Examples:

```bash
21agent "Explain this repository"
```

```bash
21agent @programs/vault/src/lib.rs "Review this program"
```

```bash
21agent -p "Find potential security issues"
```

```bash
21agent --model claude "Refactor this instruction"
```

```bash
21agent --tools read,grep,find "Perform a read-only review"
```

---

## Extensions

21Agent is designed to be hacked.

Extensions can add:

* custom tools
* custom commands
* Solana integrations
* protocol integrations
* RPC providers
* security scanners
* deployment systems
* wallet interfaces
* sub-agents
* custom UI
* Git workflows
* sandbox environments

Example:

```ts
export default function (agent: ExtensionAPI) {
  agent.registerTool({
    name: "inspect_transaction",
    // ...
  });

  agent.registerCommand("audit", {
    // ...
  });
}
```

If your workflow needs something 21Agent doesn't have, build it.

---

## Architecture

```text
21agent/
│
├── packages/
│   ├── agent/
│   ├── core/
│   ├── runtime/
│   ├── cli/
│   ├── tui/
│   ├── github/
│   ├── solana/
│   ├── rpc/
│   ├── wallet/
│   └── tools/
│
├── skills/
│   ├── anchor-review/
│   ├── program-inspector/
│   ├── transaction-debugger/
│   ├── account-inspector/
│   └── security-review/
│
├── extensions/
│   ├── solana/
│   ├── github/
│   └── providers/
│
├── examples/
├── docs/
├── scripts/
└── tests/
```

The core stays small.

Everything else is composable.

---

## Chain Agnostic

21Agent starts with Solana.

It does not end with Solana.

Blockchain-specific functionality is implemented through adapters and extensions rather than being permanently embedded into the core runtime.

```text
                 21Agent
                    │
          ┌─────────┼─────────┐
          │         │         │
       Solana      EVM      Other
          │         │         │
       Adapter    Adapter    Adapter
```

The long-term goal is a common agent interface for building software across onchain environments.

---

## Philosophy

21Agent is built around four principles.

### Minimal Core

Keep the agent runtime small and understandable.

### Onchain Native

Blockchains should be first-class development environments, not external APIs bolted onto an AI coding tool.

### Extensible

Developers should be able to modify the agent around their workflow instead of modifying their workflow around the agent.

### Chain Agnostic

Networks change.

Models change.

Developer tooling changes.

The core should survive all three.

---

## Built by 21DAO

21DAO is a chain-agnostic collective of onchain hackers, developers, and researchers.

We build experimental infrastructure at the intersection of crypto, AI, and open-source software.

21Agent is our coding agent for that world.

**Hack locally. Ship onchain.**

---

## Contributing

21Agent is open source.

Contributions from protocol developers, security researchers, AI engineers, Solana developers, and people building strange things onchain are welcome.

```bash
git clone https://github.com/21dao/21agent.git
cd 21agent
npm install
npm run build
```

Open an issue.

Build a skill.

Write an extension.

Add a chain.

Break something.

Fix it.

---

## License

MIT

---

**21Agent**

*The onchain coding agent by 21DAO.*

**Solana first. Chain agnostic by design.**
