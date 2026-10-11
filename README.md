# HackerGames_backend

### Backend for zkBob, an autonomous AI DeFi agent on Starknet

🏆 **1st place, Agentic track, Starknet Hacker Games** · Frontend: [StarknetHackerGames](https://github.com/Devanshgoel-123/StarknetHackerGames)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000?logo=express&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-D97757?logo=anthropic&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Starknet](https://img.shields.io/badge/Starknet-EC796B?logo=starknet&logoColor=white)

An Express + LangGraph service that turns chat prompts into Starknet DeFi actions. It also runs scheduled strategies: portfolio rebalancing, profit maximisation, and volatility swaps.

## Architecture

```mermaid
flowchart TB
    FE["zkBob frontend<br/>(Next.js)"] -->|REST| API

    subgraph Svc["Express service"]
        API["Routes<br/>POST /agent · GET /beststrategy · GET /volatile<br/>/userPortfolio · /rebalance · /autonomous<br/>/depositWithdraw · /userContact"]
        Agent["Chat agent<br/>LangGraph createReactAgent<br/>Claude 3.5 Sonnet + MemorySaver"]
        DWAgent["Deposit / withdraw agent"]
        Tools["LangChain tools"]
        Jobs["CronJob every 6h (IST)<br/>• rebalance each user to target split<br/>• maximise profit<br/>• swap out of volatile tokens"]
    end

    API --> Agent
    API --> DWAgent
    Agent --> Tools
    DWAgent --> Tools
    Jobs --> Fn["Strategy functions<br/>Portfolio · StrkFarm · EnduFi<br/>MaximisingStrategy · Autonomous"]
    Tools --> Fn

    Fn --> DEX["Swaps: AVNU · Ekubo"]
    Fn --> Yield["Yield: STRKFarm · Endur · Nostra · Vesu"]
    Tools --> Mkt["Market data: DefiLlama · CoinGecko"]
    Tools --> Tw["Twitter scraper<br/>sentiment"]
    Tools --> Meme["Unruggable<br/>memecoin launch"]

    API <--> DB[("PostgreSQL · Prisma<br/>User · UserContact · Token<br/>Agent · Deposit · Trade<br/>UserPortfolioPreference")]
    Jobs <--> DB
```

## Agent tools

| Tool | Purpose |
|---|---|
| `get_token_details`, `get_token_exchange_data` | Price, volume history, and exchange data for Starknet tokens |
| `get_supported_tokens`, `execute_swap` | Token swaps routed through AVNU |
| `deposit_token_starkfarm`, `withdraw_token_starkfarm` | STRKFarm vault deposits and withdrawals |
| `deposit_token_endufi`, `withdraw_token_endufi` | Endur liquid staking |
| `get_pool_details` | Answers questions about pool APYs and TVL |
| `analyze_starknet_sentiment` | Twitter sentiment for the Starknet ecosystem, plus a trading recommendation |
| `create_memecoin`, `launch_memecoin` | Launch tokens through Unruggable |
| `generate_suggestions`, `cache_chat` | Suggested follow-up prompts and conversation memory |

## Scheduled jobs

All three jobs run every 6 hours (`0 0 */6 * * *`, Asia/Kolkata):

- **Rebalancer.** For every saved `UserPortfolioPreference`, it swaps the portfolio back to the user's target split of stablecoins, native tokens, and other assets.
- **Profit maximiser.** Moves delegated funds into the best available strategy.
- **Volatility guard.** Finds volatile holdings and swaps out of them.

## Getting started

```bash
git clone https://github.com/Devanshgoel-123/HackerGames_backend.git
cd HackerGames_backend
pnpm install
cp .env.example .env      # fill in the values below
npx prisma migrate deploy
pnpm dev                  # http://localhost:3002
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL connection strings |
| `ANTHROPIC_API_KEY`, `OPEN_AI_API_KEY`, `GEMINI_API_KEY` | LLM providers |
| `COINMARKETCAP_API_KEY`, `HISTORY_API_KEY`, `BLOCK_API_KEY`, `ALCHEMY_API_KEY` | Market and chain data |
| `TWITTER_USERNAME`, `TWITTER_PASSWORD`, `TWITTER_EMAIL` | Account used by the sentiment scraper |
| `WALLET_ADDRESS`, `PVT_KEY`, `STARKNET_PROVIDER_URL` | Agent wallet and RPC (keep these out of git) |

## Project structure

```
src
├── index.ts         Express app, routes, cron jobs
├── Agents/          Chat and deposit agents, system prompts
├── tools/           LangChain tools (swap, yield, data, sentiment, memecoins)
├── Functions/       Strategy logic: portfolio, StrkFarm, EnduFi, autonomous trading
├── Routes/          Express routers
├── utils/           RPC, Ekubo, and DeFi helpers
└── config/, constants/, types/
prisma/schema.prisma
```
