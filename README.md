# 21Agent

**The coding agent for Robinhood Chain.**

21Agent is an open-source coding agent built by **21DAO** for developers building on Robinhood Chain.

It brings repository-aware AI, EVM tooling, contract interaction, transaction debugging and Robinhood Chain context directly into the terminal.

Minimal core. Onchain primitives. Extend everything.

---

## Why 21Agent?

AI coding agents understand your code.

They don't understand enough about where that code eventually executes.

For onchain developers, the development environment extends beyond the repository:

```text
Repository
    ↓
Contracts
    ↓
Compiler
    ↓
RPC
    ↓
Transactions
    ↓
Chain State
    ↓
Explorer
```

21Agent brings these layers into the agent's development environment.

Instead of treating the blockchain as an external service, 21Agent treats **Robinhood Chain as part of the coding context.**

Ask it to write code.

Ask it to inspect a contract.

Ask it why a transaction reverted.

Ask it what's deployed at an address.

Ask it to build the tooling it doesn't have yet.

---

## Quick Start

```bash
npm install -g @21dao/21agent
```

Enter your project:

```bash
cd my-project
21agent
```

Then start building.

```text
> explain this repository

> inspect the contracts

> compile the project

> review this contract before deployment

> deploy this to Robinhood Chain testnet

> inspect 0x...

> explain why this transaction reverted

> generate tests for this contract

> show me every function capable of moving funds
```

---

## Robinhood Chain Native

Robinhood Chain support is built directly into the 21Agent development workflow.

21Agent can reason across both your local repository and onchain state.

```text
                    21Agent
                       │
          ┌────────────┴────────────┐
          │                         │
     Local Context             Chain Context
          │                         │
    ┌─────┼─────┐            ┌──────┼──────┐
    │     │     │            │      │      │
  Code   Git   Tests         RPC   State   TXs
    │     │     │            │      │      │
    └─────┴─────┘            └──────┴──────┘
          │                         │
          └────────────┬────────────┘
                       │
                 Robinhood Chain
```

The agent can use chain-aware tools while working through development tasks instead of requiring the developer to constantly move between terminals, explorers, RPC dashboards and documentation.

---

## Repository Aware

Start 21Agent from inside a repository and it builds context around the project.

```text
contracts/
src/
script/
test/
lib/
package.json
foundry.toml
hardhat.config.ts
.git/
```

Reference individual files:

```text
@contracts/Vault.sol

@test/Vault.t.sol

@script/Deploy.s.sol
```

Or let 21Agent reason across the project.

```text
> map the architecture of this protocol

> explain how assets move through these contracts

> identify privileged functions

> find every external call

> review the upgrade mechanism

> find potential reentrancy issues
```

---

## Robinhood Chain Tools

21Agent exposes onchain functionality to the coding agent as tools.

```text
read
write
edit
bash
grep
find
git

rpc
contract
call
simulate
transaction
logs
deploy
verify
```

This allows a single agent session to move between code and chain state.

For example:

```text
> debug this transaction
```

21Agent can inspect the transaction, decode calldata, inspect the target contract, analyze logs and revert data, correlate the result with your local source code and suggest a fix.

---

## Contract Intelligence

21Agent can inspect deployed contracts directly.

```text
> inspect 0x742...
```

The agent can reason about:

```text
bytecode
ABI
functions
events
storage
proxy patterns
permissions
transaction history
contract interactions
```

Combine that information with local repository context:

```text
> compare the deployed contract with the version in ./contracts
```

or:

```text
> determine whether this deployment matches the current build
```

---

## Transaction Debugging

Onchain failures shouldn't require jumping through five different tools.

Give 21Agent a transaction:

```text
> debug 0x8ac...
```

21Agent can inspect:

```text
transaction
    │
    ├── sender
    ├── receiver
    ├── calldata
    ├── value
    ├── receipt
    ├── logs
    ├── execution
    └── revert data
```

Then connect the execution back to the relevant source code.

---

## EVM Development

21Agent is compatible with standard EVM development workflows.

Use it alongside tools such as:

```text
Foundry
Hardhat
Solidity
viem
ethers
Node.js
TypeScript
```

21Agent doesn't replace the EVM developer stack.

It gives an agent the ability to operate it.

---

## Skills

21Agent capabilities can be extended through reusable skills.

```text
skills/
├── contract-review/
├── transaction-debugger/
├── deployment-review/
├── repo-analysis/
├── proxy-inspector/
├── token-analysis/
├── security-review/
└── robinhood-chain/
```

Skills provide specialized instructions and workflows without bloating the core agent.

Example:

```text
/skill:contract-review
```

or:

```text
/skill:transaction-debugger
```

Developers can create their own skills and share them with others.

---

## Extensions

21Agent is designed to be modified.

Need another tool?

Build it.

Need another RPC integration?

Add it.

Need a custom deployment workflow?

Extend it.

```ts
export default function (agent: ExtensionAPI) {
  agent.registerTool({
    name: "robinhood_contract",
    // implementation
  });

  agent.registerCommand("deploy-rh", {
    // implementation
  });
}
```

Extensions can add:

```text
custom tools
commands
RPC providers
wallet integrations
contract tooling
deployment systems
security scanners
sub-agents
permission systems
custom UI
Git workflows
additional chains
```

The harness adapts to the developer.

Not the other way around.

---

## Multiple Models

21Agent isn't tied to one model provider.

```bash
21agent --provider anthropic
21agent --provider openai
21agent --provider google
```

Switch models based on the task, cost or workflow.

The agent layer and blockchain layer remain independent.

---

## Sessions

21Agent keeps development work organized into sessions.

```text
Developer
    │
    ▼
Prompt
    │
    ▼
21Agent
    │
    ├── Read repository
    ├── Execute tools
    ├── Query chain
    ├── Modify code
    ├── Run tests
    └── Inspect results
    │
    ▼
Result
```

Sessions can preserve tool calls, results, development context and agent interactions.

This makes complex debugging and development workflows easier to inspect and continue.

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
│   ├── evm/
│   ├── robinhood/
│   ├── rpc/
│   ├── contracts/
│   └── tools/
│
├── skills/
│   ├── robinhood-chain/
│   ├── contract-review/
│   ├── transaction-debugger/
│   ├── deployment-review/
│   └── security-review/
│
├── extensions/
│   ├── robinhood/
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

Instead of trying to predict every workflow an onchain developer might need, it exposes primitives developers can compose themselves.

```text
Agent
+
Tools
+
Skills
+
Extensions
+
Chain Context
```

That's the system.

Everything else can be built on top.

---

## Beyond Robinhood Chain

21Agent is developed around Robinhood Chain, but the architecture is chain-agnostic.

```text
                   21Agent
                      │
             ┌────────┴────────┐
             │                 │
      Robinhood Chain       Adapters
             │                 │
            EVM          Other Networks
```

Robinhood Chain is where we're starting.

The agent runtime doesn't need to stop there.

---

## Built by 21DAO

21DAO is a chain-agnostic collective of hackers and developers building experimental onchain infrastructure.

21Agent started from a simple question:

**What would a coding agent look like if the blockchain itself was part of its development environment?**

Robinhood Chain is our first implementation of that idea.

---

## Contributing

21Agent is open source.

```bash
git clone https://github.com/21dao/21agent.git

cd 21agent

npm install

npm run build
```

Build an extension.

Add a skill.

Improve the Robinhood Chain integration.

Break something.

Fix it.

Ship it.

---

## License

MIT

---

# 21Agent

**Code locally. Execute onchain.**

Built by **21DAO** for **Robinhood Chain**.
