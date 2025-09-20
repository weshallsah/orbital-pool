# Orbital Pool API

Simple REST API for the Orbital Pool - a 5-token AMM on Arbitrum Sepolia.

## Quick Start

```bash
# Check if everything's working
curl http://localhost:8000/health

# Swap some tokens
curl -X POST http://localhost:8000/swap \
  -H "Content-Type: application/json" \
  -d '{
    "token_in_index": 0,
    "token_out_index": 1,
    "amount_in": "1000000000000000000",
    "min_amount_out": "0",
    "user_address": "0xYourAddress"
  }'
```

## Docs

- [Overview](./overview.md) - What this is
- [Getting Started](./getting-started.md) - How to use it
- [API Reference](./api-reference.md) - All endpoints
- [Examples](./examples.md) - Code samples

## What you can do

**Trading stuff:**
- Swap tokens (any of the 5 for any other)
- Add liquidity to earn fees
- Remove liquidity when you want out
- Check gas prices

**Analytics stuff:**
- See protocol stats (volume, TVL, etc.)
- Check recent swaps
- Get token data
- Track user activity

## The basics

- **Network**: Arbitrum Sepolia (testnet)
- **Pool**: `0x83EC719A6F504583d0F88CEd111cB8e8c0956431`
- **Tokens**: MUSDC-A through MUSDC-E (5 test tokens)
