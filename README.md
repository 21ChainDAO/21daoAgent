````markdown
# 21Agent

**The coding agent for EVM & Solana.**

21Agent is an open-source coding agent built by **21DAO** for developers building on Solana.

It combines repository-aware AI with native Solana tooling, giving agents the ability to understand source code, inspect programs and accounts, analyze transactions, interact with RPCs, run tests, simulate execution, and work across the Solana development stack directly from the terminal.

**Minimal core. Solana-native. Extend everything.**

---

## Why 21Agent?

Coding agents understand repositories.

Onchain development extends beyond the repository.

A Solana developer works across:

```text
Repository
    │
    ├── Rust
    ├── Anchor
    ├── TypeScript
    ├── Tests
    │
    ▼
Programs
    │
    ▼
Instructions
    │
    ▼
Accounts / PDAs
    │
    ▼
Transactions
    │
    ▼
Solana
````

21Agent brings those environments into a single agent context.

Ask it to understand your code.

Ask it to inspect a program.

Ask it why a transaction failed.

Ask it to analyze an account.

Ask it to simulate a transaction.

Ask it to build the tooling it doesn't have yet.

---

## Quick Start

Install 21Agent:

```bash
npm install -g @21dao/21agent
```

Enter your project:

```bash
cd my-solana-project
21agent
```

Then start building.

```text
> explain this repository

> inspect the programs in this Anchor workspace

> find every instruction that can move tokens

> inspect this Solana account

> decode this transaction

> explain why this transaction failed

> identify every PDA used by this program

> generate tests for this instruction

> review this program before deployment
```

---

## Solana Native

Solana isn't an API bolted onto 21Agent.

It's part of the development context.

```text
                      21Agent
                         │
            ┌────────────┴────────────┐
            │                         │
       Local Context             Solana Context
            │                         │
     ┌──────┼──────┐          ┌───────┼───────┐
     │      │      │          │       │       │
   Source   Git   Tests     Programs Accounts  TXs
     │      │      │          │       │       │
     └──────┴──────┘          └───────┴───────┘
            │                         │
            └────────────┬────────────┘
                         │
                       Solana
```

21Agent can reason across your local repository and onchain state within the same development session.

---

## Repository Aware

Start 21Agent inside a repository and it can build context around the project.

```text
programs/
tests/
migrations/
scripts/
app/
Anchor.toml
Cargo.toml
package.json
.git/
```

Reference individual files:

```text
@programs/vault/src/lib.rs

@programs/vault/src/instructions/deposit.rs

@tests/vault.ts

@Anchor.toml
```

Or reason across the entire repository:

```text
> map this program's architecture

> explain how tokens move through this protocol

> find every authority check

> identify all PDAs and their seeds

> review account validation

> find every CPI

> explain the complete deposit flow
```

---

## Solana Tools

21Agent exposes development and onchain capabilities to the agent as tools.

```text
read
write
edit
bash
grep
find
git

solana
rpc
program
account
transaction
instruction
simulate
logs
deploy
```

This allows the agent to move between source code and Solana without breaking context.

For example:

```text
> debug this transaction
```

21Agent can inspect the transaction, decode its instructions, examine program logs, identify relevant accounts, connect execution back to your source code, and help determine why it failed.

---

## Program Intelligence

21Agent understands Solana programs as more than source files.

```text
Program
│
├── Instructions
├── Accounts
├── PDAs
├── Authorities
├── CPIs
├── Events
├── Errors
└── IDL
```

Ask:

```text
> inspect this program
```

Or:

```text
> show every instruction that modifies authority
```

Or:

```text
> find every CPI made by this program
```

Or compare local code against deployed state:

```text
> compare this repository with the deployed program
```

---

## Account Inspection

Accounts are first-class context.

```text
> inspect 8xK...
```

21Agent can work with:

```text
owner
lamports
data
executable state
account type
decoded fields
token balances
mint information
authorities
PDA derivation
```

This makes it possible to move directly from a program implementation to the state it operates on.

---

## Transaction Debugging

Onchain debugging shouldn't require jumping between five different tools.

Give 21Agent a signature:

```text
> debug 5VERv8...
```

The agent can reason across:

```text
Transaction
    │
    ├── Signatures
    ├── Instructions
    ├── Accounts
    ├── Programs
    ├── Inner Instructions
    ├── Logs
    ├── Compute Units
    └── Errors
```

Then connect the execution back to your repository.

```text
> find the source code responsible for this failure
```

---

## Anchor Aware

21Agent supports Anchor-native development workflows.

It can reason about:

```text
Anchor.toml
#[program]
#[derive(Accounts)]
#[account]
seeds
bumps
constraints
CPIs
IDLs
workspace configuration
tests
deployments
```

Example:

```text
> review every Accounts struct for unsafe constraints
```

```text
> identify PDAs that use user-controlled seeds
```

```text
> generate an Anchor test for initialize
```

---

## Skills

21Agent stays small by moving specialized workflows into reusable skills.

```text
skills/
├── solana/
├── anchor-review/
├── program-inspector/
├── account-inspector/
├── transaction-debugger/
├── deployment-review/
├── security-review/
└── protocol-research/
```

Run a skill directly:

```text
/skill:transaction-debugger
```

or:

```text
/skill:anchor-review
```

Skills can also be loaded by the agent when they're relevant to the current task.

Build your own and share them.

---

## Extensions

21Agent is designed to be hacked.

Need another tool?

Build it.

Need another RPC provider?

Add it.

Need protocol-specific context?

Extend it.

```ts
export default function (agent: ExtensionAPI) {
  agent.registerTool({
    name: "inspect_program",
    execute: inspectSolanaProgram
  });

  agent.registerCommand("simulate", {
    // ...
  });
}
```

Extensions can provide:

```text
custom tools
commands
RPC integrations
wallet integrations
protocol adapters
security scanners
indexers
deployment workflows
sub-agents
custom interfaces
Git workflows
additional chains
```

The agent adapts to your workflow.

Not the other way around.

---

## Multiple Models

21Agent isn't tied to one model provider.

Use whichever model fits the job.

```bash
21agent --provider anthropic
```

```bash
21agent --provider openai
```

```bash
21agent --provider google
```

Or specify a model directly:

```bash
21agent --model <provider/model>
```

Models change.

The development environment shouldn't have to.

---

## Interactive Mode

Launch:

```bash
21agent
```

Then work with 21Agent directly from your terminal.

```text
$ 21agent

21Agent v0.1

RPC             Solana
Repository      ./vault
Framework       Anchor

21agent >

> inspect this repository

Scanning...

Anchor.toml
programs/
tests/
migrations/

Detected:
Solana
Anchor
Rust
TypeScript

21agent >

> inspect programs/vault

Reading program...

Instructions       8
Accounts           14
PDAs                4
CPIs                3
Authorities         2

21agent >

> review authority handling

Analyzing account constraints...
```

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
21agent --tools read,grep,find "Perform a read-only review"
```

```bash
21agent "Identify every PDA in this workspace"
```

---

## Sessions

Development work can be persisted as sessions.

```text
Developer
    │
    ▼
Prompt
    │
    ▼
21Agent
    │
    ├── Repository
    ├── Tools
    ├── Solana RPC
    ├── Programs
    ├── Accounts
    └── Transactions
    │
    ▼
Result
```

Sessions preserve development context so longer debugging and implementation workflows can continue without starting from zero.

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
│   ├── solana/
│   ├── rpc/
│   ├── programs/
│   ├── accounts/
│   └── tools/
│
├── skills/
│   ├── solana/
│   ├── anchor-review/
│   ├── program-inspector/
│   ├── account-inspector/
│   ├── transaction-debugger/
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

---

## Primitives, Not Features

21Agent intentionally keeps the core small.

Instead of trying to predict every workflow a Solana developer might need, it provides primitives developers can compose themselves.

```text
                    21AGENT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      TOOLS          SKILLS       EXTENSIONS
        │              │              │
        └──────────────┼──────────────┘
                       │
                    SOLANA
```

### Tools

Low-level capabilities the model can execute.

### Skills

Reusable instructions and specialized development workflows.

### Extensions

Code that adds new tools, commands, providers, integrations, and behavior.

---

## What We Didn't Build

21Agent stays minimal so it doesn't dictate how you build.

### No locked model

Bring the provider and model that works for you.

### No closed workflows

Build skills and extensions around your own stack.

### No explorer dependency

Give the agent direct access to the Solana context it needs.

### No black-box execution

Development actions remain visible from the terminal.

### No single framework

Use Anchor, native Rust, TypeScript, or your own tooling.

### No fixed agent

If 21Agent doesn't work the way you want, change it.

---

## Philosophy

21Agent is built around four ideas.

### Minimal

Keep the core understandable.

### Solana Native

Programs, accounts, instructions, transactions and RPC state should be first-class development context.

### Extensible

Developers should change the agent around their workflow instead of changing their workflow around the agent.

### Open

Developer infrastructure becomes more useful when developers can inspect it, modify it, break it and rebuild it.

---

## Built by 21DAO

**21DAO** is a chain-agnostic collective of onchain hackers and developers.

We build experimental open-source infrastructure at the intersection of crypto, AI, and programmable systems.

21Agent started with a simple question:

> What would a coding agent look like if it understood the chain as well as it understood the repository?

Solana is our first implementation of that idea.

---

## Contributing

21Agent is open source.

Clone the repository:

```bash
git clone https://github.com/21dao/21agent.git
cd 21agent
```

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Contributions are welcome.

Build a skill.

Add an RPC integration.

Improve program inspection.

Write an extension.

Break something.

Fix it.

Ship it.

---

## License

MIT

---

# 21Agent

**The coding agent for Solana.**

Code locally.
Execute onchain.

Built by **21DAO**.

```
```
