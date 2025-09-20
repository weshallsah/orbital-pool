# Integration Guides

Step-by-step guides for integrating Orbital Pool API into different types of applications.

## Frontend Integration

### React/Next.js Integration

Perfect for DeFi dApps, portfolio managers, and wallet interfaces.

#### 1. Install Dependencies

```bash
npm install ethers
```

#### 2. Create Orbital Hook

```typescript
// hooks/useOrbital.ts
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface SwapParams {
  tokenIn: number;
  tokenOut: number;
  amountIn: string;
  minAmountOut: string;
}

export const useOrbital = (apiUrl: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = useCallback(async (params: SwapParams, signer: ethers.Signer) => {
    setLoading(true);
    setError(null);

    try {
      const userAddress = await signer.getAddress();
      
      // Call Orbital API
      const response = await fetch(`${apiUrl}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_in_index: params.tokenIn,
          token_out_index: params.tokenOut,
          amount_in: params.amountIn,
          min_amount_out: params.minAmountOut,
          user_address: userAddress
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      // Send transaction
      const txResponse = await signer.sendTransaction(data.transaction_data);
      const receipt = await txResponse.wait();
      
      return { txHash: receipt.transactionHash, receipt };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  return { swap, loading, error };
};
```

#### 3. Create Swap Component

```tsx
// components/SwapWidget.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useOrbital } from '../hooks/useOrbital';

const TOKENS = [
  { index: 0, symbol: 'MUSDC-A', address: '0x9666526dcF585863f9ef52D76718d810EE77FB8D' },
  { index: 1, symbol: 'MUSDC-B', address: '0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC' },
  // ... other tokens
];

export const SwapWidget: React.FC = () => {
  const [tokenIn, setTokenIn] = useState(0);
  const [tokenOut, setTokenOut] = useState(1);
  const [amountIn, setAmountIn] = useState('');
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  const { swap, loading, error } = useOrbital('http://localhost:8000');

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      setSigner(provider.getSigner());
    }
  };

  const handleSwap = async () => {
    if (!signer || !amountIn) return;

    try {
      const amountWei = ethers.utils.parseEther(amountIn);
      const result = await swap({
        tokenIn,
        tokenOut,
        amountIn: amountWei.toString(),
        minAmountOut: '0' // Add slippage protection in production
      }, signer);
      
      console.log('Swap successful:', result.txHash);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  return (
    <div className="swap-widget">
      <h2>Orbital Pool Swap</h2>
      
      {!signer ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <div>
            <label>From:</label>
            <select value={tokenIn} onChange={(e) => setTokenIn(Number(e.target.value))}>
              {TOKENS.map(token => (
                <option key={token.index} value={token.index}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="Amount"
            />
          </div>

          <div>
            <label>To:</label>
            <select value={tokenOut} onChange={(e) => setTokenOut(Number(e.target.value))}>
              {TOKENS.map(token => (
                <option key={token.index} value={token.index}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleSwap} disabled={loading || !amountIn}>
            {loading ? 'Swapping...' : 'Swap'}
          </button>

          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
};
```

#### 4. Add to Your App

```tsx
// pages/index.tsx
import { SwapWidget } from '../components/SwapWidget';

export default function Home() {
  return (
    <div>
      <h1>My DeFi App</h1>
      <SwapWidget />
    </div>
  );
}
```

---

## Backend Integration

### Node.js Trading Bot

Perfect for automated trading, arbitrage, and market making.

#### 1. Setup Project

```bash
mkdir orbital-bot
cd orbital-bot
npm init -y
npm install ethers axios dotenv
```

#### 2. Create Bot Class

```javascript
// bot.js
const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

class OrbitalBot {
  constructor() {
    this.apiUrl = process.env.ORBITAL_API_URL;
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.poolAddress = process.env.POOL_ADDRESS;
  }

  async getTokenBalance(tokenAddress) {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    return await tokenContract.balanceOf(this.wallet.address);
  }

  async approveToken(tokenAddress, amount) {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.wallet
    );
    
    const tx = await tokenContract.approve(this.poolAddress, amount);
    await tx.wait();
    console.log(`Approved ${amount} tokens: ${tx.hash}`);
  }

  async executeSwap(tokenIn, tokenOut, amountIn, minAmountOut = '0') {
    try {
      console.log(`Swapping ${tokenIn} -> ${tokenOut}, amount: ${amountIn}`);

      // Get transaction data from API
      const response = await axios.post(`${this.apiUrl}/swap`, {
        token_in_index: tokenIn,
        token_out_index: tokenOut,
        amount_in: amountIn,
        min_amount_out: minAmountOut,
        user_address: this.wallet.address
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      // Send transaction
      const txResponse = await this.wallet.sendTransaction(
        response.data.transaction_data
      );
      
      console.log(`Transaction sent: ${txResponse.hash}`);
      
      const receipt = await txResponse.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error('Swap failed:', error.message);
      throw error;
    }
  }

  async arbitrageOpportunity() {
    // Example: Check price difference between token pairs
    const amount = ethers.utils.parseEther('1');
    
    try {
      // Check A -> B price
      const responseAB = await axios.post(`${this.apiUrl}/swap`, {
        token_in_index: 0,
        token_out_index: 1,
        amount_in: amount.toString(),
        min_amount_out: '0',
        user_address: this.wallet.address
      });

      // Check B -> A price  
      const responseBA = await axios.post(`${this.apiUrl}/swap`, {
        token_in_index: 1,
        token_out_index: 0,
        amount_in: amount.toString(),
        min_amount_out: '0',
        user_address: this.wallet.address
      });

      // Analyze profitability
      console.log('A->B rate:', responseAB.data);
      console.log('B->A rate:', responseBA.data);
      
      // Implement arbitrage logic here
      
    } catch (error) {
      console.error('Arbitrage check failed:', error.message);
    }
  }

  async startBot() {
    console.log('Starting Orbital Bot...');
    console.log('Wallet:', this.wallet.address);
    
    // Check balances
    const tokens = await axios.get(`${this.apiUrl}/tokens`);
    for (const [index, token] of Object.entries(tokens.data.tokens)) {
      const balance = await this.getTokenBalance(token.address);
      console.log(`${token.symbol} balance:`, ethers.utils.formatEther(balance));
    }

    // Start monitoring loop
    setInterval(() => {
      this.arbitrageOpportunity();
    }, 30000); // Check every 30 seconds
  }
}

// Start bot
const bot = new OrbitalBot();
bot.startBot().catch(console.error);
```

#### 3. Environment Configuration

```bash
# .env
ORBITAL_API_URL=https://your-orbital-api.com
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here
POOL_ADDRESS=0x83EC719A6F504583d0F88CEd111cB8e8c0956431
```

#### 4. Run the Bot

```bash
node bot.js
```

---

## Python Integration

### Flask API Wrapper

Create a Python wrapper for your existing application.

#### 1. Install Dependencies

```bash
pip install flask web3 requests python-dotenv
```

#### 2. Create Wrapper Service

```python
# orbital_service.py
import os
import requests
from web3 import Web3
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

class OrbitalService:
    def __init__(self):
        self.api_url = os.getenv('ORBITAL_API_URL')
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('RPC_URL')))
        self.pool_address = os.getenv('POOL_ADDRESS')
        
    def get_quote(self, token_in, token_out, amount_in):
        """Get swap quote without executing"""
        response = requests.post(f'{self.api_url}/swap', json={
            'token_in_index': token_in,
            'token_out_index': token_out,
            'amount_in': str(amount_in),
            'min_amount_out': '0',
            'user_address': '0x0000000000000000000000000000000000000000'  # Dummy address for quote
        })
        return response.json()
    
    def execute_swap(self, token_in, token_out, amount_in, private_key, min_amount_out='0'):
        """Execute swap with private key"""
        account = self.w3.eth.account.from_key(private_key)
        
        # Get transaction data
        response = requests.post(f'{self.api_url}/swap', json={
            'token_in_index': token_in,
            'token_out_index': token_out,
            'amount_in': str(amount_in),
            'min_amount_out': str(min_amount_out),
            'user_address': account.address
        })
        
        if not response.json().get('success'):
            raise Exception(response.json().get('error'))
            
        tx_data = response.json()['transaction_data']
        
        # Sign and send transaction
        signed_txn = self.w3.eth.account.sign_transaction(tx_data, private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for confirmation
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt

orbital = OrbitalService()

@app.route('/quote', methods=['POST'])
def get_quote():
    data = request.json
    try:
        quote = orbital.get_quote(
            data['token_in'],
            data['token_out'], 
            data['amount_in']
        )
        return jsonify(quote)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/swap', methods=['POST'])
def execute_swap():
    data = request.json
    try:
        receipt = orbital.execute_swap(
            data['token_in'],
            data['token_out'],
            data['amount_in'],
            data['private_key'],
            data.get('min_amount_out', '0')
        )
        return jsonify({
            'success': True,
            'tx_hash': receipt.transactionHash.hex(),
            'block_number': receipt.blockNumber
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

---

## Mobile Integration

### React Native

#### 1. Install Dependencies

```bash
npm install @walletconnect/react-native ethers
```

#### 2. Create Orbital Hook

```typescript
// hooks/useOrbitalMobile.ts
import { useState } from 'react';
import { ethers } from 'ethers';

export const useOrbitalMobile = () => {
  const [loading, setLoading] = useState(false);

  const swap = async (
    tokenIn: number,
    tokenOut: number,
    amountIn: string,
    provider: ethers.providers.Provider,
    signer: ethers.Signer
  ) => {
    setLoading(true);
    
    try {
      const userAddress = await signer.getAddress();
      
      const response = await fetch('https://your-orbital-api.com/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_in_index: tokenIn,
          token_out_index: tokenOut,
          amount_in: amountIn,
          min_amount_out: '0',
          user_address: userAddress
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      const txResponse = await signer.sendTransaction(data.transaction_data);
      return await txResponse.wait();
      
    } finally {
      setLoading(false);
    }
  };

  return { swap, loading };
};
```

---

---

**Next**: [Examples →](./examples.md)
