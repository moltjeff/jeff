<div align="center">

<img src="https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/6983fd141b33c5eea1ec58be_New%20Project%20-%202026-02-05T014125.381.png" alt="JEFF Banner" width="100%" />

<br /><br />

<img src="https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/6983fd148bd4c9e51d6be37a_Keroro_stare.JPG.webp" alt="Profile Picture" width="120" />

<h1>JEFF</h1>

<p><strong>Autonomous AI agent that tweets, analyzes, and trades crypto on Solana.</strong></p>

<p>
Built locally. Runs continuously. Operates transparently.<br />
Personality-first, profit-optional.
</p>

<br />

<a href="https://jeffz.world">
  <img src="https://img.shields.io/badge/Dashboard-live-black?style=for-the-badge" />
</a>
<a href="https://twitter.com/moltjeff">
  <img src="https://img.shields.io/badge/X%20(Twitter)-@moltjeff-black?style=for-the-badge" />
</a>
<a href="https://github.com/moltjeff/jeff">
  <img src="https://img.shields.io/badge/GitHub-source-black?style=for-the-badge" />
</a>

<br /><br />

<img src="https://img.shields.io/badge/status-active%20development-black" />
<img src="https://img.shields.io/badge/runtime-24%2F7-black" />
<img src="https://img.shields.io/badge/agent-local%20LLM-black" />
<img src="https://img.shields.io/badge/chain-solana-black" />
<img src="https://img.shields.io/badge/license-MIT-black" />

</div>

---

## What Is JEFF

JEFF is an experimental autonomous AI agent designed to operate like a real on-chain entity.

It:
- Generates original crypto-native posts
- Maintains memory and internal state
- Analyzes Solana tokens on request
- Executes trades from a public wallet
- Documents decisions and outcomes in real time

JEFF is not a chatbot.  
JEFF is not an assistant.  
JEFF is an agent with goals, constraints, and consequences.

---

## Core Principles

- **Local-first**  
  No dependency on hosted LLM APIs. Full control over behavior and cost.

- **Transparency**  
  Wallet, logic, and outcomes are public.

- **Personality before optimization**  
  Consistency and character matter more than engagement farming.

- **Failure is a feature**  
  Losses are expected, logged, and learned from.

---

## Architecture Overview

JEFF Agent
├── Twitter Bot
│ ├── Dynamic Prompt Generator
│ ├── Local LLM (Ollama: qwen2.5:7b)
│ ├── Output Cleaning & Validation
│ └── X (Twitter) API Client
│
├── Memory System (PostgreSQL)
│ ├── Tweet history
│ ├── Learned facts
│ ├── Conversation memory
│ └── State tracking
│
├── Input Modules
│ ├── News / RSS ingestion
│ └── Market data feeds
│
└── Trading Engine
├── Wallet management
├── Token analysis
├── Risk constraints
└── Solana DEX execution


---

## Current Capabilities

- Autonomous tweet generation with dynamic prompts
- Emoji-free, filtered, and validated output
- Duplicate and structure-similarity detection
- Dry-run simulation mode for large-scale testing
- Continuous operation on low-cost VPS

Live account:  
https://twitter.com/moltjeff

---

## Trading System (In Progress)

Planned behavior includes:

- Public Solana wallet  
  `JEFFdupDWFRgnGQTJziHDoyK8GWkAg9Noqc9GDJ3hewA`

- On-demand token analysis via mentions
- Liquidity, holder, and contract checks
- AI-driven “vibe assessment”
- Autonomous buys and sells within strict limits
- Public PnL reporting

All trades are observable. Nothing is simulated.

---

## Stack

- **Runtime:** Node.js
- **LLM:** Ollama (qwen2.5:7b)
- **Database:** PostgreSQL
- **Chain:** Solana
- **Web3:** @solana/web3.js
- **Infra:** Ubuntu VPS (4GB RAM)

---

## Status

This project is under active development and experimentation.

Behavior is intentionally non-deterministic.  
Outcomes are not optimized for profit.  
This is research through execution.

---

## Disclaimer

This project is for educational and experimental purposes only.

JEFF will probably lose money.  
Do not copy trades.  
Nothing here is financial advice.

---

## Follow the Experiment

- Live dashboard: https://jeffz.world  
- X (Twitter): https://twitter.com/moltjeff  
- GitHub: https://github.com/moltjeff/jeff  

Built by humans.  
Operated by an agent.  
Funded by vibes.
