# API Documentation

This page contains all the API endpoints of Orbital you can use as a developer.

**Base URL**: FRONTEND_URL

## Endpoints

### Health Check

This endpoint checks whether the server is working fine or not.

```http
GET /health
```

**Success Response (200):**
```json
{
  "status": "healthy",
  "pool_address": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
  "network": "Arbitrum Sepolia",
  "chain_id": 421614
}
```

**Response Fields:**
- `status` - The working status of server
- `pool_address` - The address of the Orbital Pool
- `network` - The network where the server is running
- `chain_id` - The chain ID of the network
---

### Get Tokens

This endpoints fetches all the tokens available in the protocol.

```http
GET /tokens
```

**Success Response (200):**
```json
{
  "tokens": {
    "0": {
      "address": "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
      "symbol": "MUSDC-A"
    },
    "1": {
      "address": "0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC", 
      "symbol": "MUSDC-B"
    },
    "2": {
      "address": "0x...",
      "symbol": "MUSDC-C"
    },
    "3": {
      "address": "0x...",
      "symbol": "MUSDC-D"
    },
    "4": {
      "address": "0x...",
      "symbol": "MUSDC-E"
    }
  },
  "pool_address": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431"
}
```

**Response Fields:**
- `tokens` - The object mapping token indices to token info
- `tokens[index].address` - The token contract address
- `tokens[index].symbol` - The token symbol
- `pool_address` - The address of the Orbital Pool

---

### Execute Token Swap

This endpoint generates quote for a swap transaction.

```http
POST /swap
```

**Request Body:**
```json
{
  "token_in_index": 0,
  "token_out_index": 1,
  "amount_in": "1000000000000000000",
  "min_amount_out": "950000000000000000",
  "user_address": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
}
```

**Request Fields:**
- `token_in_index` - The index of the inoput token
- `token_out_index` - The index of the output token
- `amount_in` - The input amount (in wei)
- `min_amount_out` - The minimmum input amount the user will accept (in wei)
- `user_address` - The wallet address of the user

**Success Response (200):**
```json
{
  "success": true,
  "token_in": {
    "address": "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
    "symbol": "MUSDC-A"
  },
  "token_out": {
    "address": "0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC",
    "symbol": "MUSDC-B"
  },
  "transaction_data": {
    "to": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
    "data": "0x5673b02d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000d2f13f7789f0000",
    "gasLimit": 300000,
    "gasPrice": "100000000",
    "value": 0,
    "chainId": 421614,
    "nonce": 42,
    "from": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
  },
  "gas_estimate": 300000,
  "gas_price": "100000000"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid token index"
}
```

**Response Fields:**
- `success` - The success status
- `token_in` - The input token
- `token_out` - The output token  
- `transaction_data` - The 'unsigned' transaction object
- `gas_estimate` - The estimated uints of gas required
- `gas_price` - The current gas price (in wei)

---

### Add Liquidity

Generate transaction data for adding liquidity to a tick.

```http
POST /liquidity/add
```

**Request Body:**
```json
{
  "k_value": 1000,
  "amounts": [
    "1000000000000000000",
    "1000000000000000000", 
    "1000000000000000000",
    "1000000000000000000",
    "1000000000000000000"
  ],
  "user_address": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
}
```

**Request Fields:**
- `k_value` *(integer)* - Tick identifier (k value)
- `amounts` *(array[string])* - Array of 5 token amounts in wei
- `user_address` *(string)* - User's wallet address

**Success Response (200):**
```json
{
  "success": true,
  "k_value": "1000",
  "amounts": [
    "1000000000000000000",
    "1000000000000000000",
    "1000000000000000000", 
    "1000000000000000000",
    "1000000000000000000"
  ],
  "transaction_data": {
    "to": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
    "data": "0x...",
    "gasLimit": 400000,
    "gasPrice": "100000000",
    "value": 0,
    "chainId": 421614,
    "nonce": 43,
    "from": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
  },
  "gas_estimate": 400000,
  "gas_price": "100000000"
}
```

---

### Remove Liquidity

Generate transaction data for removing liquidity from a tick.

```http
POST /liquidity/remove
```

**Request Body:**
```json
{
  "k_value": 1000,
  "lp_shares": "500000000000000000",
  "user_address": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
}
```

**Request Fields:**
- `k_value` *(integer)* - Tick identifier (k value)
- `lp_shares` *(string)* - LP shares to remove in wei
- `user_address` *(string)* - User's wallet address

**Success Response (200):**
```json
{
  "success": true,
  "k_value": "1000",
  "lp_shares": "500000000000000000",
  "transaction_data": {
    "to": "0x83EC719A6F504583d0F88CEd111cB8e8c0956431",
    "data": "0x...",
    "gasLimit": 350000,
    "gasPrice": "100000000", 
    "value": 0,
    "chainId": 421614,
    "nonce": 44,
    "from": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
  },
  "gas_estimate": 350000,
  "gas_price": "100000000"
}
```

---

### Get Gas Price

Retrieve current network gas price.

```http
GET /gas-price
```

**Response:**
```json
{
  "gas_price": "100000000",
  "gas_price_gwei": "0.1"
}
```

**Response Fields:**
- `gas_price` - Gas price in wei
- `gas_price_gwei` - Gas price in Gwei for readability

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

### Common Error Codes

| HTTP Status | Error | Description |
|-------------|-------|-------------|
| `400` | Bad Request | Invalid request parameters |
| `404` | Not Found | Endpoint not found |
| `500` | Internal Server Error | Server error |

### Specific Error Messages

#### Swap Errors
- `"Missing field: {field_name}"` - Required field missing
- `"Invalid token index"` - Token index not in range 0-4
- `"Cannot swap same token"` - Input and output tokens are identical
- `"Insufficient liquidity"` - Not enough liquidity for swap
- `"Amount too small"` - Input amount below minimum

#### Liquidity Errors  
- `"Must provide exactly 5 token amounts"` - Amounts array wrong length
- `"Invalid k value"` - K value out of valid range
- `"Insufficient LP shares"` - Not enough LP shares to remove

#### General Errors
- `"Invalid address format"` - Malformed Ethereum address
- `"Gas estimation failed"` - Unable to estimate gas
- `"Network error"` - Blockchain connection issue

# Analytics Endpoints

The Orbital Pool API includes advanced analytics endpoints powered by The Graph Protocol subgraph integration. These endpoints provide insights into trading activity, volume data, and protocol statistics.

**Note**: Analytics endpoints require subgraph integration to be enabled. If subgraph is unavailable, these endpoints will return a 503 error.

---

## Protocol Statistics

Get overall protocol statistics and metrics.

```http
GET /analytics/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValueLockedUSD": "1250000.50",
    "totalVolumeUSD": "5000000.25", 
    "totalSwapCount": "1543",
    "totalTokenCount": "5",
    "protocolFeeRate": "0.003",
    "latestBlock": "12345678"
  }
}
```

**Response Fields:**
- `totalValueLockedUSD` - Total value locked in the protocol (USD)
- `totalVolumeUSD` - Cumulative trading volume (USD)
- `totalSwapCount` - Total number of swaps executed
- `totalTokenCount` - Number of supported tokens
- `protocolFeeRate` - Protocol fee rate (0.3%)
- `latestBlock` - Latest indexed block number

---

## Recent Swaps

Get recent swap transactions with pagination.

```http
GET /analytics/swaps?limit=100&skip=0
```

**Query Parameters:**
- `limit` *(integer, optional)* - Number of swaps to return (default: 100, max: 1000)
- `skip` *(integer, optional)* - Number of swaps to skip for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "swaps": [
      {
        "id": "0x123...abc-0",
        "trader": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c",
        "tokenIn": "0",
        "tokenOut": "1", 
        "amountIn": "1000000000000000000",
        "amountOut": "995000000000000000",
        "fee": "3000000000000000",
        "blockNumber": "12345678",
        "blockTimestamp": "1695123456",
        "transactionHash": "0x123...abc"
      }
    ],
    "pagination": {
      "limit": 100,
      "skip": 0,
      "returned": 1
    }
  }
}
```

---

## Token Analytics by Index

Get analytics for a specific token using its index (0-4).

```http
GET /analytics/token/{token_index}
```

**Path Parameters:**
- `token_index` *(integer)* - Token index (0-4)

**Example:**
```http
GET /analytics/token/0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token_info": {
      "address": "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
      "symbol": "MUSDC-A"
    },
    "stats": {
      "id": "token-0",
      "symbol": "Token A",
      "name": "Token A",
      "totalVolumeUSD": "1500000.75",
      "totalLiquidityUSD": "250000.50",
      "txCount": "342",
      "priceUSD": "1.0"
    }
  }
}
```

---

## Token Analytics by Address

Get analytics for a specific token using its contract address.

```http
GET /analytics/token/{token_address}
```

**Path Parameters:**
- `token_address` *(string)* - Token contract address

**Example:**
```http
GET /analytics/token/0x9666526dcF585863f9ef52D76718d810EE77FB8D
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
    "symbol": "Token A",
    "name": "Token A", 
    "totalVolumeUSD": "1500000.75",
    "totalLiquidityUSD": "250000.50",
    "txCount": "342",
    "priceUSD": "1.0"
  }
}
```

---

## Volume Data

Get daily volume data for charts and analytics.

```http
GET /analytics/volume?days=30
```

**Query Parameters:**
- `days` *(integer, optional)* - Number of days to retrieve (default: 30, max: 365)

**Response:**
```json
{
  "success": true,
  "data": {
    "volume_data": [
      {
        "date": "2023-09-20",
        "volumeUSD": "125000.50",
        "txCount": "45"
      },
      {
        "date": "2023-09-19", 
        "volumeUSD": "98000.25",
        "txCount": "38"
      }
    ],
    "days_requested": 30,
    "days_returned": 2
  }
}
```

---

## User Analytics

Get trading statistics for a specific user address.

```http
GET /analytics/user/{user_address}
```

**Path Parameters:**
- `user_address` *(string)* - User's wallet address

**Example:**
```http
GET /analytics/user/0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c",
    "totalSwaps": 25,
    "totalVolumeUSD": "50000.75",
    "totalFeesUSD": "150.25",
    "firstSwapTimestamp": "1695000000",
    "lastSwapTimestamp": "1695123456"
  }
}
```

**Response Fields:**
- `totalSwaps` - Number of swaps executed by user
- `totalVolumeUSD` - Total trading volume (USD)
- `totalFeesUSD` - Total fees paid (USD)
- `firstSwapTimestamp` - Unix timestamp of first swap
- `lastSwapTimestamp` - Unix timestamp of most recent swap

---

## Top Tokens

Get top tokens ranked by trading volume.

```http
GET /analytics/top-tokens?limit=10
```

**Query Parameters:**
- `limit` *(integer, optional)* - Number of tokens to return (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "id": "token-0",
        "symbol": "Token A",
        "name": "Token A",
        "totalVolumeUSD": "1500000.75",
        "totalLiquidityUSD": "250000.50", 
        "txCount": "342",
        "priceUSD": "1.0"
      },
      {
        "id": "token-1",
        "symbol": "Token B",
        "name": "Token B",
        "totalVolumeUSD": "1200000.25",
        "totalLiquidityUSD": "200000.75",
        "txCount": "298",
        "priceUSD": "1.0"
      }
    ],
    "limit": 10
  }
}
```

---

## Swap by Transaction

Get swap details for a specific transaction hash.

```http
GET /analytics/swap/{tx_hash}
```

**Path Parameters:**
- `tx_hash` *(string)* - Transaction hash

**Example:**
```http
GET /analytics/swap/0x123...abc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_hash": "0x123...abc",
    "swaps": [
      {
        "id": "0x123...abc-0",
        "trader": "0xd2D16c0c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c",
        "tokenIn": "0",
        "tokenOut": "1",
        "amountIn": "1000000000000000000",
        "amountOut": "995000000000000000",
        "fee": "3000000000000000",
        "blockTimestamp": "1695123456"
      }
    ]
  }
}
```

---

## Analytics Error Responses

Analytics endpoints return specific error responses:

**Subgraph Unavailable (503):**
```json
{
  "error": "Subgraph not available"
}
```

**User Not Found (404):**
```json
{
  "success": false,
  "error": "User not found or no trading history"
}
```

**Token Not Found (404):**
```json
{
  "success": false,
  "error": "Token not found in subgraph"
}
```

---

**Next**: [Examples →](./examples.md)
