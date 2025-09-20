# Getting Started

How to use the Orbital Pool API.

## You'll need

- MetaMask
- Some Arbitrum Sepolia ETH for gas
- Test tokens (you can get these from the pool)

## Step 1: Check if it's working

```bash
curl http://localhost:8000/health
```

You should get back something like:
```json
{
  "status": "healthy",
  "pool_address": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
  "network": "Arbitrum Sepolia",
  "chain_id": 421614
}
```

## Step 2: See what tokens are available

```bash
curl http://localhost:8000/tokens
```

This shows you the 5 tokens and their addresses.

## Step 3: Make a swap

Here's how to swap token 0 for token 1:

```bash
curl -X POST http://localhost:8000/swap \
  -H "Content-Type: application/json" \
  -d '{
    "token_in_index": 0,
    "token_out_index": 1,
    "amount_in": "1000000000000000000",
    "min_amount_out": "0",
    "user_address": "0xYourWalletAddress"
  }'
```

The API gives you back transaction data. You sign it with your wallet and send it.

## Step 4: Using with JavaScript

```javascript
// Get swap transaction data
const response = await fetch('http://localhost:8000/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token_in_index: 0,
    token_out_index: 1,
    amount_in: "1000000000000000000",
    min_amount_out: "0",
    user_address: await signer.getAddress()
  })
});

const data = await response.json();

// Sign and send with your wallet
if (data.success) {
  const tx = await signer.sendTransaction(data.transaction_data);
  await tx.wait();
  console.log('Done!');
}
```

## Quick tips

- Make sure you're on Arbitrum Sepolia (chain ID 421614)
- Approve tokens before swapping them
- All amounts are in wei (18 decimals)
- The API never touches your private keys

## Analytics

Want to see what's happening? Try these:

```bash
# Protocol stats
curl http://localhost:8000/analytics/stats

# Recent swaps
curl http://localhost:8000/analytics/swaps?limit=5

# Token data
curl http://localhost:8000/analytics/token/0
```

---

[API Reference →](./api-reference.md)
