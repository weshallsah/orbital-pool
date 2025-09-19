# Orbital Pool API

A minimalistic API for the Orbital Pool AMM that provides core endpoints for token swapping, adding liquidity, and removing liquidity with Web3 integration.

## Overview

This API serves as a backend integration layer for the Orbital Pool - a 5-token Automated Market Maker (AMM) that uses a torus-based invariant for price discovery and liquidity management.

## Installation

1. **Create virtual environment**:
```bash
python3 -m venv orbital_api_env
source orbital_api_env/bin/activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Run the API**:
```bash
python app.py
```

The API will be available at `http://localhost:8000`

## Contract Information

- **Network**: Arbitrum Sepolia Testnet
- **Pool Address**: `0x83EC719A6F504583d0F88CEd111cB8e8c0956431`
- **Chain ID**: 421614

### Supported Tokens
| Index | Symbol | Address |
|-------|--------|---------|
| 0 | MUSDC-A | `0x9666526dcF585863f9ef52D76718d810EE77FB8D` |
| 1 | MUSDC-B | `0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC` |
| 2 | MUSDC-C | `0x7e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C` |
| 3 | MUSDC-D | `0x8e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C` |
| 4 | MUSDC-E | `0x9e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C` |

## API Endpoints

### Health Check
```http
GET /health
```

### Get Supported Tokens
```http
GET /tokens
```

### Token Swap
```http
POST /swap
```

**Request:**
```json
{
  "token_in_index": 0,
  "token_out_index": 1,
  "amount_in": "1000000000000000000",
  "min_amount_out": "0",
  "user_address": "0xYourWalletAddress"
}
```

### Add Liquidity
```http
POST /liquidity/add
```

**Request:**
```json
{
  "k_value": "3000000000000000",
  "amounts": ["1000000000000000000000", "1000000000000000000000", "1000000000000000000000", "1000000000000000000000", "1000000000000000000000"],
  "user_address": "0xYourWalletAddress"
}
```

### Remove Liquidity
```http
POST /liquidity/remove
```

**Request:**
```json
{
  "k_value": "3000000000000000",
  "lp_shares": "1000000000000000000",
  "user_address": "0xYourWalletAddress"
}
```

### Get Gas Price
```http
GET /gas-price
```

## Usage

1. **Start the API**: `python app.py`
2. **Open the client**: `python -m http.server 8080` then visit `http://localhost:8080/client.html`
3. **Connect wallet** and execute transactions

## Important Notes

- API returns **unsigned transaction data** for security
- All amounts are in **wei** (18 decimals)
- Users must approve tokens before swapping/adding liquidity
- Sign transactions using MetaMask or your preferred wallet
