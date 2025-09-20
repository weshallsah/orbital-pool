
## **Step 1: Add Subgraph Dependencies**

First, let's create a `requirements.txt` file in your `api` folder:

```txt
flask==2.3.3
flask-cors==4.0.0
web3==6.11.0
requests==2.31.0
python-dotenv==1.0.0
```


## **Step 2: Create Subgraph Service**

Create a new file `api/services/subgraph_client.py`:

```python
"""
Subgraph client for Orbital AMM analytics
Handles GraphQL queries to The Graph protocol
"""

import requests
import os
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta

class OrbitalSubgraphClient:
    def __init__(self):
        # Use environment variable for subgraph URL
        self.endpoint = os.getenv('ORBITAL_SUBGRAPH_URL', 
            'https://api.thegraph.com/subgraphs/name/your-github/orbital-amm-subgraph')
        self.timeout = 30
        
    def query(self, query_string: str, variables: Dict = None) -> Dict:
        """Execute GraphQL query against subgraph"""
        try:
            payload = {
                'query': query_string,
                'variables': variables or {}
            }
            
            response = requests.post(
                self.endpoint, 
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            result = response.json()
            
            if 'errors' in result:
                raise Exception(f"GraphQL error: {result['errors']}")
                
            return result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Subgraph request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response: {str(e)}")
    
    def get_protocol_stats(self) -> Dict:
        """Get overall Orbital AMM protocol statistics"""
        query = """
        query {
          orbitalProtocol(id: "orbital-protocol") {
            totalValueLockedUSD
            totalVolumeUSD
            totalSwapCount
            totalTokenCount
            protocolFeeRate
            orbitalPool {
              id
              tokenCount
              swapCount
              totalVolumeUSD
              supportedTokens {
                symbol
                name
                priceUSD
                totalVolumeUSD
              }
            }
          }
        }
        """
        
        result = self.query(query)
        protocol_data = result.get('data', {}).get('orbitalProtocol')
        
        if not protocol_data:
            return {
                "totalValueLockedUSD": "0",
                "totalVolumeUSD": "0", 
                "totalSwapCount": "0",
                "totalTokenCount": "5",  # Your 5 test tokens
                "protocolFeeRate": "0.003"
            }
            
        return protocol_data
    
    def get_recent_swaps(self, limit: int = 100, skip: int = 0) -> List[Dict]:
        """Get recent swaps with pagination"""
        query = """
        query GetRecentSwaps($first: Int!, $skip: Int!) {
          swaps(
            first: $first
            skip: $skip
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            tokenIn { 
              symbol 
              name
              id
            }
            tokenOut { 
              symbol 
              name 
              id
            }
            amountIn
            amountOut
            amountInUSD
            amountOutUSD
            priceImpact
            sender
            recipient
            timestamp
            blockNumber
            gasUsed
            gasPrice
            feeAmount
            feeAmountUSD
          }
        }
        """
        
        result = self.query(query, {'first': min(limit, 1000), 'skip': skip})
        return result.get('data', {}).get('swaps', [])
    
    def get_token_stats(self, token_address: str = None, token_index: int = None) -> Dict:
        """Get statistics for specific token by address or index"""
        
        # If token_index provided, convert to address using your TOKENS mapping
        if token_index is not None and token_address is None:
            from app import TOKENS  # Import your TOKENS dict
            if token_index in TOKENS:
                token_address = TOKENS[token_index]['address']
            else:
                raise ValueError(f"Invalid token index: {token_index}")
        
        if not token_address:
            raise ValueError("Either token_address or token_index must be provided")
            
        query = """
        query GetToken($id: ID!) {
          token(id: $id) {
            id
            symbol
            name
            decimals
            priceUSD
            totalVolumeUSD
            totalLiquidityUSD
            txCount
            isActive
            addedAtTimestamp
            swapsIn(first: 5, orderBy: timestamp, orderDirection: desc) {
              amountIn
              amountOut
              timestamp
            }
            swapsOut(first: 5, orderBy: timestamp, orderDirection: desc) {
              amountIn
              amountOut
              timestamp
            }
          }
        }
        """
        
        result = self.query(query, {'id': token_address.lower()})
        return result.get('data', {}).get('token')
    
    def get_daily_volume(self, days: int = 30) -> List[Dict]:
        """Get daily volume data for charts"""
        query = """
        query GetDailyData($first: Int!) {
          poolDayDatas(
            first: $first
            orderBy: date
            orderDirection: desc
          ) {
            id
            date
            dailyVolumeUSD
            dailySwapCount
            dailyActiveUsers
            totalValueLockedUSD
            dailyFeesUSD
            tokenCount
          }
        }
        """
        
        result = self.query(query, {'first': days})
        return result.get('data', {}).get('poolDayDatas', [])
    
    def get_user_stats(self, user_address: str) -> Dict:
        """Get statistics for specific user"""
        query = """
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            totalSwaps
            totalVolumeUSD
            totalFeesUSD
            firstSwapTimestamp
            lastSwapTimestamp
            swaps(first: 10, orderBy: timestamp, orderDirection: desc) {
              tokenIn { symbol }
              tokenOut { symbol }
              amountInUSD
              timestamp
            }
          }
        }
        """
        
        result = self.query(query, {'id': user_address.lower()})
        return result.get('data', {}).get('user')
    
    def get_top_tokens_by_volume(self, limit: int = 10) -> List[Dict]:
        """Get top tokens by trading volume"""
        query = """
        query GetTopTokens($first: Int!) {
          tokens(
            first: $first
            orderBy: totalVolumeUSD
            orderDirection: desc
            where: { isActive: true }
          ) {
            id
            symbol
            name
            totalVolumeUSD
            totalLiquidityUSD
            txCount
            priceUSD
          }
        }
        """
        
        result = self.query(query, {'first': limit})
        return result.get('data', {}).get('tokens', [])
    
    def get_swap_by_tx(self, tx_hash: str) -> List[Dict]:
        """Get swaps from specific transaction"""
        query = """
        query GetSwapsByTx($txHash: String!) {
          swaps(where: { transaction: $txHash }) {
            id
            tokenIn { symbol }
            tokenOut { symbol }
            amountIn
            amountOut
            amountInUSD
            amountOutUSD
            sender
            recipient
            timestamp
            priceImpact
          }
        }
        """
        
        result = self.query(query, {'txHash': tx_hash.lower()})
        return result.get('data', {}).get('swaps', [])
```


## **Step 3: Update Your Main app.py**

Replace your existing `app.py` with this enhanced version:

```python
"""
Orbital Pool API - Enhanced with Subgraph Analytics
Provides swap, liquidity, and analytics endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json
import os
from datetime import datetime

# Import our new subgraph client
try:
    from services.subgraph_client import OrbitalSubgraphClient
    SUBGRAPH_AVAILABLE = True
except ImportError:
    SUBGRAPH_AVAILABLE = False
    print("⚠️  Subgraph client not available - analytics endpoints will be disabled")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration - Use environment variables in production
RPC_URL = os.getenv('RPC_URL', "https://sepolia-rollup.arbitrum.io/rpc")
CHAIN_ID = int(os.getenv('CHAIN_ID', '421614'))
POOL_ADDRESS = os.getenv('POOL_ADDRESS', "0x83EC719A6F504583d0F88CEd111cB8e8c0956431")
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Token addresses (from README.md)
TOKENS = {
    0: {"address": "0x9666526dcF585863f9ef52D76718d810EE77FB8D", "symbol": "MUSDC-A"},
    1: {"address": "0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC", "symbol": "MUSDC-B"},
    2: {"address": "0x7e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C", "symbol": "MUSDC-C"},
    3: {"address": "0x8e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C", "symbol": "MUSDC-D"},
    4: {"address": "0x9e8b5C5d5d5C5d5C5d5C5d5C5d5C5d5C5d5C5d5C", "symbol": "MUSDC-E"}
}

# Web3 setup
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Initialize subgraph client if available
if SUBGRAPH_AVAILABLE:
    subgraph_client = OrbitalSubgraphClient()

# Contract ABI (keeping your existing ABI)
POOL_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "tokenIn", "type": "uint256"},
            {"internalType": "uint256", "name": "tokenOut", "type": "uint256"},
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "uint256", "name": "minAmountOut", "type": "uint256"}
        ],
        "name": "swap",
        "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "k", "type": "uint256"},
            {"internalType": "uint256[^14_5]", "name": "amounts", "type": "uint256[^14_5]"}
        ],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "k", "type": "uint256"},
            {"internalType": "uint256", "name": "lpSharesToRemove", "type": "uint256"}
        ],
        "name": "removeLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# Contract instance
pool_contract = w3.eth.contract(address=POOL_ADDRESS, abi=POOL_ABI)

# [Keep all your existing helper functions]
def get_gas_price():
    """Get current gas price"""
    try:
        return w3.eth.gas_price
    except:
        return w3.to_wei(0.1, 'gwei')

def estimate_gas(transaction):
    """Estimate gas for a transaction"""
    try:
        return w3.eth.estimate_gas(transaction)
    except:
        return 300000

def to_checksum_address(address):
    """Convert address to checksum format"""
    try:
        return w3.to_checksum_address(address)
    except:
        return address

# [Keep all your existing endpoints: health, tokens, swap, liquidity/add, liquidity/remove, gas-price]

@app.route('/health', methods=['GET'])
def health():
    """Enhanced health check with subgraph status"""
    health_data = {
        "status": "healthy",
        "pool_address": POOL_ADDRESS,
        "network": "Arbitrum Sepolia",
        "chain_id": CHAIN_ID,
        "subgraph_available": SUBGRAPH_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if SUBGRAPH_AVAILABLE:
        try:
            # Test subgraph connection
            stats = subgraph_client.get_protocol_stats()
            health_data["subgraph_status"] = "connected"
            health_data["total_volume_usd"] = stats.get("totalVolumeUSD", "0")
        except Exception as e:
            health_data["subgraph_status"] = "error"
            health_data["subgraph_error"] = str(e)
    
    return jsonify(health_data)

@app.route('/tokens', methods=['GET'])
def get_tokens():
    """Get supported tokens with enhanced data from subgraph"""
    response_data = {
        "tokens": TOKENS,
        "pool_address": POOL_ADDRESS
    }
    
    if SUBGRAPH_AVAILABLE:
        try:
            # Add volume and stats data from subgraph
            top_tokens = subgraph_client.get_top_tokens_by_volume(limit=5)
            token_stats = {}
            
            for token_data in top_tokens:
                token_stats[token_data['id'].lower()] = {
                    "volume_usd": token_data['totalVolumeUSD'],
                    "liquidity_usd": token_data['totalLiquidityUSD'],
                    "tx_count": token_data['txCount'],
                    "price_usd": token_data['priceUSD']
                }
            
            response_data["token_stats"] = token_stats
            
        except Exception as e:
            response_data["subgraph_error"] = str(e)
    
    return jsonify(response_data)

# [Keep your existing swap, add_liquidity, remove_liquidity, gas_price endpoints as they are]

@app.route('/swap', methods=['POST'])
def swap():
    """Execute token swap - keeping your existing implementation"""
    try:
        data = request.get_json()
        
        required_fields = ['token_in_index', 'token_out_index', 'amount_in', 'min_amount_out', 'user_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        token_in_index = int(data['token_in_index'])
        token_out_index = int(data['token_out_index'])
        amount_in = int(data['amount_in'])
        min_amount_out = int(data['min_amount_out'])
        user_address = to_checksum_address(data['user_address'])
        
        if token_in_index not in TOKENS or token_out_index not in TOKENS:
            return jsonify({"success": False, "error": "Invalid token index"}), 400
        
        if token_in_index == token_out_index:
            return jsonify({"success": False, "error": "Cannot swap same token"}), 400
        
        transaction_data = pool_contract.functions.swap(
            token_in_index,
            token_out_index,
            amount_in,
            min_amount_out
        ).build_transaction({
            'from': user_address,
            'gas': estimate_gas({'from': user_address, 'to': POOL_ADDRESS}),
            'gasPrice': get_gas_price(),
            'nonce': w3.eth.get_transaction_count(user_address),
            'chainId': CHAIN_ID
        })
        
        return jsonify({
            "success": True,
            "token_in": TOKENS[token_in_index],
            "token_out": TOKENS[token_out_index],
            "transaction_data": transaction_data,
            "gas_estimate": transaction_data['gas'],
            "gas_price": str(transaction_data['gasPrice'])
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/liquidity/add', methods=['POST'])
def add_liquidity():
    """Add liquidity to a tick - keeping your existing implementation"""
    try:
        data = request.get_json()
        
        required_fields = ['k_value', 'amounts', 'user_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        k_value = int(data['k_value'])
        amounts = [int(amount) for amount in data['amounts']]
        user_address = to_checksum_address(data['user_address'])
        
        if len(amounts) != 5:
            return jsonify({"success": False, "error": "Must provide exactly 5 token amounts"}), 400
        
        transaction_data = pool_contract.functions.addLiquidity(
            k_value,
            amounts
        ).build_transaction({
            'from': user_address,
            'gas': estimate_gas({'from': user_address, 'to': POOL_ADDRESS}),
            'gasPrice': get_gas_price(),
            'nonce': w3.eth.get_transaction_count(user_address),
            'chainId': CHAIN_ID
        })
        
        return jsonify({
            "success": True,
            "k_value": str(k_value),
            "amounts": amounts,
            "transaction_data": transaction_data,
            "gas_estimate": transaction_data['gas'],
            "gas_price": str(transaction_data['gasPrice'])
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/liquidity/remove', methods=['POST'])
def remove_liquidity():
    """Remove liquidity from a tick - keeping your existing implementation"""
    try:
        data = request.get_json()
        
        required_fields = ['k_value', 'lp_shares', 'user_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        k_value = int(data['k_value'])
        lp_shares = int(data['lp_shares'])
        user_address = to_checksum_address(data['user_address'])
        
        transaction_data = pool_contract.functions.removeLiquidity(
            k_value,
            lp_shares
        ).build_transaction({
            'from': user_address,
            'gas': estimate_gas({'from': user_address, 'to': POOL_ADDRESS}),
            'gasPrice': get_gas_price(),
            'nonce': w3.eth.get_transaction_count(user_address),
            'chainId': CHAIN_ID
        })
        
        return jsonify({
            "success": True,
            "k_value": str(k_value),
            "lp_shares": str(lp_shares),
            "transaction_data": transaction_data,
            "gas_estimate": transaction_data['gas'],
            "gas_price": str(transaction_data['gasPrice'])
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/gas-price', methods=['GET'])
def gas_price():
    """Get current gas price"""
    return jsonify({
        "gas_price": str(get_gas_price()),
        "gas_price_gwei": str(w3.from_wei(get_gas_price(), 'gwei'))
    })

# ============= NEW ANALYTICS ENDPOINTS =============

@app.route('/analytics/stats', methods=['GET'])
def get_analytics_stats():
    """Get overall protocol statistics"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        stats = subgraph_client.get_protocol_stats()
        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/swaps', methods=['GET'])
def get_recent_swaps():
    """Get recent swaps with pagination"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        swaps = subgraph_client.get_recent_swaps(limit=limit, skip=skip)
        
        return jsonify({
            "success": True,
            "data": {
                "swaps": swaps,
                "pagination": {
                    "limit": limit,
                    "skip": skip,
                    "returned": len(swaps)
                }
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/token/<int:token_index>', methods=['GET'])
def get_token_analytics_by_index(token_index):
    """Get analytics for token by index"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        if token_index not in TOKENS:
            return jsonify({"success": False, "error": "Invalid token index"}), 400
        
        token_stats = subgraph_client.get_token_stats(token_index=token_index)
        
        if not token_stats:
            return jsonify({"success": False, "error": "Token not found in subgraph"}), 404
        
        return jsonify({
            "success": True,
            "data": {
                "token_info": TOKENS[token_index],
                "stats": token_stats
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/token/<token_address>', methods=['GET'])
def get_token_analytics_by_address(token_address):
    """Get analytics for token by address"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        token_stats = subgraph_client.get_token_stats(token_address=token_address)
        
        if not token_stats:
            return jsonify({"success": False, "error": "Token not found in subgraph"}), 404
        
        return jsonify({
            "success": True,
            "data": token_stats
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/volume', methods=['GET'])
def get_volume_data():
    """Get daily volume data for charts"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        days = int(request.args.get('days', 30))
        days = min(days, 365)  # Cap at 1 year
        
        volume_data = subgraph_client.get_daily_volume(days=days)
        
        return jsonify({
            "success": True,
            "data": {
                "volume_data": volume_data,
                "days_requested": days,
                "days_returned": len(volume_data)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/user/<user_address>', methods=['GET'])
def get_user_analytics(user_address):
    """Get analytics for specific user"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        user_stats = subgraph_client.get_user_stats(user_address)
        
        if not user_stats:
            return jsonify({"success": False, "error": "User not found or no trading history"}), 404
        
        return jsonify({
            "success": True,
            "data": user_stats
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/top-tokens', methods=['GET'])
def get_top_tokens():
    """Get top tokens by volume"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        limit = int(request.args.get('limit', 10))
        limit = min(limit, 50)  # Cap at 50
        
        top_tokens = subgraph_client.get_top_tokens_by_volume(limit=limit)
        
        return jsonify({
            "success": True,
            "data": {
                "tokens": top_tokens,
                "limit": limit
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analytics/swap/<tx_hash>', methods=['GET'])
def get_swap_by_transaction(tx_hash):
    """Get swap details by transaction hash"""
    if not SUBGRAPH_AVAILABLE:
        return jsonify({"error": "Subgraph not available"}), 503
    
    try:
        swaps = subgraph_client.get_swap_by_tx(tx_hash)
        
        return jsonify({
            "success": True,
            "data": {
                "transaction_hash": tx_hash,
                "swaps": swaps
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Enhanced Orbital Pool API...")
    print(f"📍 Pool Address: {POOL_ADDRESS}")
    print(f"🌐 Network: Arbitrum Sepolia")
    print(f"🔗 RPC: {RPC_URL}")
    print(f"📊 Subgraph Available: {SUBGRAPH_AVAILABLE}")
    if SUBGRAPH_AVAILABLE:
        print(f"📈 Analytics Endpoints: /analytics/*")
    print(f"📖 API Documentation: http://localhost:8000/")
    print(f"❤️  Health Check: http://localhost:8000/health")
    
    debug_mode = ENVIRONMENT == 'development'
    port = int(os.getenv('PORT', '8000'))
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
```


## **Step 4: Update Your .env File**

Add to your `.env.example` file:

```bash
# Existing environment variables
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
CHAIN_ID=421614
POOL_ADDRESS=0x83EC719A6F504583d0F88CEd111cB8e8c0956431
ENVIRONMENT=development
PORT=8000

# New subgraph configuration
ORBITAL_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/your-github/orbital-amm-subgraph
```


## **Step 5: Create the services Directory**

```bash
mkdir -p api/services
touch api/services/__init__.py
```


## **Step 6: Test Your Enhanced API**

After setting up the subgraph client, you can test the new endpoints:

```bash
# Install new dependencies
cd api
pip install -r requirements.txt

# Test the enhanced API
python app.py

# Test new analytics endpoints:
# GET http://localhost:8000/analytics/stats
# GET http://localhost:8000/analytics/swaps?limit=10
# GET http://localhost:8000/analytics/token/0
# GET http://localhost:8000/analytics/volume?days=7
# GET http://localhost:8000/analytics/user/0x123...
```


## **Step 7: Your Final File Structure**

```
api/
├── .env.example
├── app.py                    # Enhanced with subgraph endpoints
├── client.html               # Your existing client
├── map.md                    # Your existing documentation
├── Procfile                  # Your existing Procfile
├── production_requirements.txt
├── README.md
├── requirements.txt          # Updated with new dependencies
└── services/
    ├── __init__.py
    └── subgraph_client.py    # New subgraph client
```


## **New API Endpoints Available**

1. **GET /analytics/stats** - Protocol overview
2. **GET /analytics/swaps?limit=100\&skip=0** - Recent swaps with pagination
3. **GET /analytics/token/{index}** - Token stats by index (0-4)
4. **GET /analytics/token/{address}** - Token stats by address
5. **GET /analytics/volume?days=30** - Daily volume charts
6. **GET /analytics/user/{address}** - User trading history
7. **GET /analytics/top-tokens?limit=10** - Top tokens by volume
8. **GET /analytics/swap/{tx_hash}** - Swap details by transaction

Your API now has both **real-time trading functionality** and **rich historical analytics** powered by subgraphs - exactly like Uniswap's architecture!
<span style="display:none">[^14_1]</span>

<div style="text-align: center">⁂</div>

[^14_1]: Screenshot-2025-09-20-at-11.39.00-AM.jpg

