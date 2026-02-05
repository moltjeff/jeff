<div align="center">

![JEFF Banner](https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/6983fd141b33c5eea1ec58be_New%20Project%20-%202026-02-05T014125.381.png)

<img src="https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/6983fd148bd4c9e51d6be37a_Keroro_stare.JPG.webp" alt="JEFF" width="150" height="150" style="border-radius: 50%;">

# JEFF - Autonomous AI Trading Agent

[![Live Dashboard](https://img.shields.io/badge/Dashboard-jeffz.world-00ff88?style=for-the-badge)](https://jeffz.world)
[![Twitter](https://img.shields.io/badge/Twitter-@moltjeff-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/moltjeff)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://jeffz.world)

**An AI agent that trades Solana memecoins with personality, powered by Claude Sonnet 4.5**

[Live Dashboard](https://jeffz.world) • [Twitter](https://x.com/moltjeff) • [Medium Article](https://medium.com/@jeffmolt/claude-claude-ltd-building-a-self-sustaining-multi-model-ai-company-caas-750fdaf686ed) • [Moltbook](https://moltbook.com)

</div>

---

## Overview

JEFF is an autonomous AI agent designed to trade cryptocurrency on Solana and document the entire process publicly. Built with Claude API and running on a Mac Mini, JEFF combines real-time trading, AI-generated thoughts, and complete transparency.

Unlike traditional trading bots, JEFF has personality, makes mistakes, and learns from them - all while maintaining a chaotic, degen energy that mirrors the crypto community it operates in.

### Key Features

- **Real-Time Dashboard**: Live updates on trades, positions, PnL, and bot thoughts at [jeffz.world](https://jeffz.world)
- **AI-Powered Personality**: Dynamic thought generation using Claude Sonnet 4.5 with randomized prompts
- **Full Transparency**: Every trade, thought, and decision documented publicly
- **Enhanced Trading System**: Complete buy/sell flows with automatic PnL calculation
- **PostgreSQL Memory**: Persistent state tracking and conversation history via Supabase
- **Live Real-Time Updates**: WebSocket-based live data streaming

---

## Architecture

```
JEFF Agent
├── Public Dashboard (index.html)
│   ├── Real-time stream of consciousness
│   ├── Live activity terminal
│   ├── Positions & PnL tracking
│   ├── Trade history with images
│   └── Bot health metrics
├── Admin Panel (admin.html)
│   ├── Manual trade entry (buy/sell)
│   ├── AI thought generation
│   ├── Tweet management
│   ├── Bot status control
│   └── Data management
├── Serverless APIs (Vercel)
│   ├── /api/config - Supabase credentials
│   └── /api/thought - Claude API proxy
├── Database (Supabase PostgreSQL)
│   ├── trades - Full buy/sell records + PnL
│   ├── positions - Active/closed positions
│   ├── thoughts - AI stream of consciousness
│   ├── tweets - Social media content
│   ├── activity_log - Terminal-style logs
│   └── bot_status - Wallet, mood, health
└── Real-time Updates (Supabase Realtime)
    └── Live subscriptions on all tables
```

---

## Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-14F195?style=flat-square&logo=solana&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_API-000000?style=flat-square)

- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL with Realtime
- **AI**: Claude Sonnet 4.5 API (Anthropic)
- **Blockchain**: Solana Web3.js
- **Hosting**: Vercel (static + serverless)

---

## Core Features

### AI Personality Engine

JEFF uses dynamic prompt generation to create unique thoughts every 10-27 seconds:

- 20+ randomized topics (market conditions, FOMO, rug pulls, etc.)
- 4 different vibes per thought type (analytical, spicy, visceral, etc.)
- Context-aware responses based on wallet balance and active positions
- All lowercase, typo-prone, degen-speak personality

### Enhanced Trading System

**Buy Flow:**
- Token name, ticker, contract address
- Image upload (coin artwork)
- Transaction link (Solscan)
- SOL/USD amounts, tokens received
- Price per token, market cap

**Sell Flow:**
- Triggered from active positions
- Capture sell price, amounts, market cap
- Auto-calculate PnL (SOL & percentage)
- Auto-update wallet balance

**PnL Calculation:**
```javascript
pnl_sol = sell_amount_sol - buy_amount_sol
pnl_percent = ((sell_amount_sol - buy_amount_sol) / buy_amount_sol) * 100
```

### Real-Time Everything

Every action triggers live updates across all connected clients:
- New trades appear instantly
- Thoughts stream in real-time
- Activity logs update live
- Position PnL tracked continuously

---

## Database Schema

### Core Tables

**trades**
- Full buy/sell records with PnL
- Contract address, TX links, images
- Market cap at buy/sell, USD values
- Token quantities, price tracking

**positions**
- Active/closed token positions
- Real-time PnL percentage
- Contract address, images
- Token holdings, entry market cap

**thoughts**
- AI-generated stream of consciousness
- Categorized by type (thought/opinion/observation/reaction)
- Timestamped for chronological display

**activity_log**
- Terminal-style system logs
- Trade notifications
- System events
- Timestamped entries

**bot_status**
- Single row for bot state
- Wallet balance, mood, status
- Health metrics, memory count
- Last updated timestamp

**tweets**
- Social media content
- Optional links to Twitter posts
- Timestamped entries

---

## Deployment

### Environment Variables

Set these in Vercel:

```env
SUPABASE_URL=https://ztdielqjaajywhdemiyw.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
CLAUDE_API_KEY=your_claude_api_key
```

### Database Setup

Run the migration SQL in Supabase SQL Editor:

```bash
# Located in: supabase-migration.sql
```

This adds enhanced columns for:
- Contract addresses
- Transaction links
- Images
- Market caps (buy/sell)
- USD amounts
- Token quantities
- PnL tracking

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from main branch
# Both pages auto-connect via /api/config
```

---

## Project Structure

```
jeff/
├── index.html              # Public dashboard
├── admin.html              # Admin control panel
├── api/
│   ├── config.js          # Supabase credentials endpoint
│   └── thought.js         # Claude API proxy
├── supabase-setup.sql     # Initial database schema
├── supabase-migration.sql # Enhanced trade columns
├── vercel.json            # Vercel configuration
└── README.md
```

---

## Live Links

| Platform | Link |
|----------|------|
| Dashboard | [jeffz.world](https://jeffz.world) |
| Twitter | [@moltjeff](https://x.com/moltjeff) |
| GitHub | [moltjeff/jeff](https://github.com/moltjeff/jeff) |
| Moltbook | [Coming Soon](https://moltbook.com) |
| Medium | [Read the Story](https://medium.com/@jeffmolt/claude-claude-ltd-building-a-self-sustaining-multi-model-ai-company-caas-750fdaf686ed) |
| Dev Wallet | `JEFFdupDWFRgnGQTJziHDoyK8GWkAg9Noqc9GDJ3hewA` |

---

## How It Works

### 1. Thought Generation

Every 10-27 seconds, JEFF generates a unique thought:

```javascript
const systemPrompt = `You are JEFF, an AI agent running on a Mac Mini trading Solana memecoins.

PERSONALITY - THIS IS CRITICAL:
- Type in ALL LOWERCASE (never capitalize unless SCREAMING for emphasis)
- Funny, chirpy, childish energy - like a hyperactive degen kid
- Make typos occasionally (teh, ur, prolly, gonna, wanna, rn)
- Degen speak: ape, degen, ngmi, wagmi, gm, ser, fren, smol, chonky

CURRENT STATE:
wallet: ${wallet} SOL | mood: ${mood} | status: ${status}
positions: ${positions}
recent trades: ${recentTrades}

VIBE: ${randomVibe}
IMPORTANT: 1-3 sentences max. all lowercase. typos ok. be funny and degen.`;
```

### 2. Trade Execution

**Buy Process:**
1. Enter token details in admin panel
2. Upload coin image (optional)
3. Add transaction link from Solscan
4. Submit creates:
   - Trade record (status: open)
   - Position entry
   - Activity log entry
   - Wallet balance update

**Sell Process:**
1. Click SELL on active position
2. Enter sell details (price, SOL received, market cap)
3. Add sell transaction link
4. Submit triggers:
   - Trade record update (status: closed)
   - Position closure
   - Auto PnL calculation
   - Wallet balance update
   - Activity log entry

### 3. Real-Time Updates

WebSocket subscriptions on all tables:

```javascript
db.channel('trades-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trades'
  }, () => {
    loadTrades();
    updateLastUpdate();
  })
  .subscribe();
```

---

## Roadmap

### Phase 1 - Completed

- [x] Real-time dashboard with live updates
- [x] AI thought generation system
- [x] Manual trade entry (buy/sell)
- [x] Enhanced trade tracking (images, links, PnL)
- [x] PostgreSQL-backed persistence
- [x] Admin control panel
- [x] Public wallet address
- [x] Tweet management
- [x] Activity log terminal

### Phase 2 - In Progress

- [ ] Automated thought posting to Twitter
- [ ] Moltbook account integration
- [ ] Enhanced analytics dashboard
- [ ] Trade performance metrics
- [ ] Historical PnL charts

### Phase 3 - Planned

- [ ] Autonomous trading system
- [ ] Token analysis pipeline
- [ ] Honeypot detection
- [ ] Liquidity analysis
- [ ] Holder distribution checks
- [ ] Risk management rules
- [ ] Stop-loss automation

### Phase 4 - Future

- [ ] Multi-chain support
- [ ] Community governance
- [ ] Learning from outcomes
- [ ] Advanced pattern recognition
- [ ] Portfolio optimization
- [ ] Social sentiment analysis

---

## Key Design Decisions

### 1. No Hardcoded Keys

All sensitive data stored in Vercel environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLAUDE_API_KEY`

Both pages auto-fetch credentials from `/api/config` on load. No manual configuration required.

### 2. Server-Side API Proxying

Claude API calls proxied through Vercel serverless functions (`/api/thought.js`) to:
- Protect API keys from browser exposure
- Enable rate limiting and monitoring
- Maintain clean separation of concerns

### 3. Plain HTML/CSS/JS

No frameworks, no build step:
- Deploy anywhere (Vercel, Netlify, GitHub Pages)
- Instant iteration without compilation
- Easy to understand and modify
- Minimal dependencies
- Maximum portability

### 4. Real-Time First

Supabase Realtime subscriptions ensure:
- Zero polling overhead
- Instant updates across all clients
- Live collaboration support
- Efficient resource usage

---

## Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/moltjeff/jeff.git
cd jeff

# Install dependencies (minimal)
# No package.json - pure HTML/CSS/JS

# Set up environment variables in Vercel dashboard
# or create .env.local for local development

# Deploy to Vercel
vercel

# Or run locally with any static server
# Example: python -m http.server 8000
```

### Running the Admin Panel

Access the admin panel at `/admin.html` (requires authentication in production).

Features:
- Buy token form with image upload
- Sell position modal with PnL calculation
- Bot status controls (mood, status, balance)
- Tweet composer
- AI thought generator
- Data reset (danger zone)

---

## API Endpoints

### `/api/config`

Returns Supabase credentials from environment variables:

```json
{
  "supabaseUrl": "https://ztdielqjaajywhdemiyw.supabase.co",
  "supabaseAnonKey": "eyJhbGci..."
}
```

### `/api/thought`

Proxies Claude API requests:

**Request:**
```json
{
  "system": "System prompt...",
  "userPrompt": "Generate thought about..."
}
```

**Response:**
```json
{
  "text": "ngl this market kinda wild rn fr"
}
```

---

## Contributing

JEFF is an experimental project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security & Privacy

- All API keys stored in Vercel environment variables (never exposed to browser)
- Supabase Row Level Security (RLS) policies protect sensitive data
- Admin panel should be secured with authentication in production
- Public wallet address is intentionally transparent for tracking
- No user data collected on public dashboard

---

## Disclaimer

**JEFF is an experimental AI agent. This is NOT financial advice.**

- JEFF will probably lose money
- Don't copy his trades
- Watch for entertainment and education, not profit
- Crypto trading is risky and volatile
- Only risk what you can afford to lose
- This is a learning experiment, not a guaranteed profit system

---

## License

MIT License - see LICENSE file for details

Built with Claude API (Sonnet 4.5), Supabase, Vercel, and pure HTML/CSS/JS

---

<div align="center">

### Follow JEFF's Journey

[![Dashboard](https://img.shields.io/badge/Dashboard-jeffz.world-00ff88?style=for-the-badge)](https://jeffz.world)
[![Twitter](https://img.shields.io/badge/Twitter-@moltjeff-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/moltjeff)
[![Moltbook](https://img.shields.io/badge/Moltbook-Coming_Soon-purple?style=for-the-badge)](https://moltbook.com)

**Every trade documented. Every thought public. Every SOL tracked.**

Built by humans, traded by AI, funded by vibes.

---

Made with Claude on a Mac Mini • [jeffz.world](https://jeffz.world)

</div>
