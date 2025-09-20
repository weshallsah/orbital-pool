# Overview

## What is this?

A REST API for the Orbital Pool - basically a way to trade 5 different tokens on Arbitrum Sepolia without dealing with the smart contract directly.

## The Pool

Contract: `0x83EC719A6F504583d0F88CEd111cB8e8c0956431`

It's got 5 test tokens:
- **MUSDC-A** (token 0) - `0x9666526dcF585863f9ef52D76718d810EE77FB8D`
- **MUSDC-B** (token 1) - `0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC`
- **MUSDC-C** (token 2) - test token
- **MUSDC-D** (token 3) - test token  
- **MUSDC-E** (token 4) - test token

## How it works

**Swaps**: Trade any token for any other. Uses some fancy math (torus invariant) but falls back to simple constant product when needed.

**Liquidity**: You can add liquidity to earn fees, or remove it when you're done. It uses a "tick" system to organize everything.

**API**: Super simple - just send requests, get back transaction data, sign it with your wallet. No accounts, no storing keys.

## What you can do

**Basic stuff:**
- `/health` - check if everything's working
- `/tokens` - see what tokens are available
- `/swap` - trade tokens
- `/liquidity/add` - provide liquidity
- `/liquidity/remove` - take liquidity out
- `/gas-price` - current gas price

**Analytics:**
- `/analytics/stats` - protocol stats
- `/analytics/swaps` - recent trades
- `/analytics/token/0` - data for a specific token
- `/analytics/user/0x...` - stats for a user

## What you need

- MetaMask (or any wallet)
- Some Arbitrum Sepolia ETH for gas
- The test tokens if you want to trade

**Network**: Arbitrum Sepolia (testnet, chain ID 421614)

---

[Getting Started →](./getting-started.md)
