# Orbital AMM Subgraph

This subgraph indexes events from the Orbital AMM smart contract on Arbitrum Sepolia.

## Quick Start

```bash
# Install dependencies
npm install

# Generate code
npm run codegen

# Build subgraph
npm run build

# Deploy to The Graph Studio
npm run deploy
```

## Configuration

- **Network**: Arbitrum Sepolia
- **Contract**: `0x83EC719A6F504583d0F88CEd111cB8e8c0956431`
- **Start Block**: 196174286

## Events Indexed

- `LiquidityAdded`: When users add liquidity to the pool
- `LiquidityRemoved`: When users remove liquidity from the pool
- `Swap`: When users perform token swaps
- `TickStatusChanged`: When tick statuses are updated

## Query URL

The deployed subgraph is available at:
```
https://api.studio.thegraph.com/query/121293/orbital-amm-subgraph/v0.0.1
```

## Local Development

For local development, you can run a local Graph node:

```bash
# Start local Graph node (requires Docker)
docker-compose up

# Deploy to local node
npm run deploy-local
```
