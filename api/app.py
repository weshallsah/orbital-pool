"""
Orbital Pool API - Minimalistic API for Orbital AMM integration
Provides swap, add liquidity, and remove liquidity endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration - Use environment variables in production
import os

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

# Contract ABI (minimal required functions)
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
            {"internalType": "uint256[5]", "name": "amounts", "type": "uint256[5]"}
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

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "pool_address": POOL_ADDRESS,
        "network": "Arbitrum Sepolia",
        "chain_id": CHAIN_ID
    })

@app.route('/tokens', methods=['GET'])
def get_tokens():
    """Get supported tokens"""
    return jsonify({
        "tokens": TOKENS,
        "pool_address": POOL_ADDRESS
    })

@app.route('/swap', methods=['POST'])
def swap():
    """Execute token swap"""
    try:
        data = request.get_json()
        
        # Validate inputs
        required_fields = ['token_in_index', 'token_out_index', 'amount_in', 'min_amount_out', 'user_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        token_in_index = int(data['token_in_index'])
        token_out_index = int(data['token_out_index'])
        amount_in = int(data['amount_in'])
        min_amount_out = int(data['min_amount_out'])
        user_address = to_checksum_address(data['user_address'])
        
        # Validate token indices
        if token_in_index not in TOKENS or token_out_index not in TOKENS:
            return jsonify({"success": False, "error": "Invalid token index"}), 400
        
        if token_in_index == token_out_index:
            return jsonify({"success": False, "error": "Cannot swap same token"}), 400
        
        # Build transaction
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
    """Add liquidity to a tick"""
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
        
        # Build transaction
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
    """Remove liquidity from a tick"""
    try:
        data = request.get_json()
        
        required_fields = ['k_value', 'lp_shares', 'user_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Missing field: {field}"}), 400
        
        k_value = int(data['k_value'])
        lp_shares = int(data['lp_shares'])
        user_address = to_checksum_address(data['user_address'])
        
        # Build transaction
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

if __name__ == '__main__':
    print("🚀 Starting Orbital Pool API...")
    print(f"📍 Pool Address: {POOL_ADDRESS}")
    print(f"🌐 Network: Arbitrum Sepolia")
    print(f"🔗 RPC: {RPC_URL}")
    print(f"📖 API Documentation: http://localhost:8000/")
    print(f"❤️  Health Check: http://localhost:8000/health")
    
    # Production settings
    debug_mode = ENVIRONMENT == 'development'
    port = int(os.getenv('PORT', '8000'))
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
