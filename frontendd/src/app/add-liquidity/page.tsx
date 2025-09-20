'use client'
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Info,
  Layers
} from 'lucide-react';
import { ethers } from 'ethers';

interface LiquidityState {
  amounts: string[];
  tolerance: string;
  mode: 'add' | 'remove';
}

// Simple mock hook for add liquidity
const useAddLiquidity = () => {
  return {
    mutate: async (params: unknown) => {
      console.log('Add liquidity:', params);
      // Mock implementation
    },
    mutateAsync: async (params: unknown) => {
      console.log('Add liquidity async:', params);
      // Mock implementation
      return Promise.resolve({ 
        success: true, 
        data: { 
          to: '0x83EC719A6F504583d0F88CEd111cB8e8c0956431',
          data: '0x',
          gas: 200000,
          gasPrice: '100000000',
          value: '0'
        } 
      });
    },
    isLoading: false
  };
};

const OrbitalLiquidityPage = () => {
  const { address, isConnected } = useAccount();
  const addLiquidityMutation = useAddLiquidity();
  
  // Real stablecoin tokens
  const staticTokens = [
    { index: 0, symbol: 'USDC', address: '0x9666526dcF585863f9ef52D76718d810EE77FB8D' },
    { index: 1, symbol: 'USDT', address: '0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC' },
    { index: 2, symbol: 'DAI', address: '0x...' },
    { index: 3, symbol: 'FRAX', address: '0x...' },
    { index: 4, symbol: 'LUSD', address: '0x...' }
  ];

  const [liquidityState, setLiquidityState] = useState<LiquidityState>({
    amounts: ['', '', '', '', ''],
    tolerance: '0.5',
    mode: 'add'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Use static tokens - no API call needed
  const orbitalTokens = staticTokens;

  // Token Icon Component for stablecoins
  const TokenIcon = ({ symbol, size = 24 }: { symbol: string; size?: number }) => {
    const getTokenColor = (symbol: string) => {
      switch (symbol) {
        case 'USDC': return 'from-blue-500 to-blue-600';
        case 'USDT': return 'from-green-500 to-green-600';
        case 'DAI': return 'from-yellow-500 to-yellow-600';
        case 'FRAX': return 'from-purple-500 to-purple-600';
        case 'LUSD': return 'from-red-500 to-red-600';
        default: return 'from-orange-500 to-red-500';
      }
    };
    
    return (
      <div className={`w-6 h-6 bg-gradient-to-br ${getTokenColor(symbol)} rounded-full flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{symbol.slice(0, 2)}</span>
      </div>
    );
  };

  // Handle amount change - all tokens must have the same amount
  const handleAmountChange = (value: string) => {
    // Set the same amount for all 5 tokens
    const newAmounts = Array(5).fill(value);
    setLiquidityState(prev => ({ ...prev, amounts: newAmounts }));
  };


  // Execute add liquidity
  const executeAddLiquidity = async () => {
    if (!address || !liquidityState.amounts.some(amt => parseFloat(amt) > 0)) return;

    setIsLoading(true);
    try {
      const liquidityRequest = {
        amounts: liquidityState.amounts.map(amt => 
          ethers.parseEther(amt || '0').toString()
        ),
        tolerance: parseFloat(liquidityState.tolerance),
        user_address: address
      };

      const response = await addLiquidityMutation.mutateAsync(liquidityRequest);
      
      if (response.success && response.data) {
        // Get transaction data and send it
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tx = await signer.sendTransaction(response.data);
        console.log('Add liquidity transaction sent:', tx.hash);
        
        // Reset form
        setLiquidityState(prev => ({ 
          ...prev, 
          amounts: ['', '', '', '', '']
        }));
        
        alert(`Liquidity added successfully! Transaction: ${tx.hash}`);
      }
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // No loading needed - everything is instant!
  const hasAmounts = liquidityState.amounts.some(amt => parseFloat(amt || '0') > 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Liquidity
            </h1>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-neutral-900/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setLiquidityState(prev => ({ ...prev, mode: 'add' }))}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                liquidityState.mode === 'add'
                  ? 'bg-blue-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Add Liquidity
            </button>
            <button
              onClick={() => setLiquidityState(prev => ({ ...prev, mode: 'remove' }))}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                liquidityState.mode === 'remove'
                  ? 'bg-blue-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Remove Liquidity
            </button>
          </div>

          {/* Liquidity Card */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>{liquidityState.mode === 'add' ? 'Add' : 'Remove'} Liquidity</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Amount Input - Single input for all tokens */}
              <div className="space-y-4">
                <label className="text-sm text-neutral-400">
                  Amount (same for all 5 tokens)
                </label>
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={liquidityState.amounts[0] || ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-transparent text-2xl font-semibold focus:outline-none text-center"
                  />
                  <p className="text-center text-sm text-neutral-500 mt-2">
                    This amount will be applied to all 5 tokens
                  </p>
                </div>
              </div>

              {/* Token Display */}
              <div className="space-y-3">
                <label className="text-sm text-neutral-400">Tokens</label>
                {orbitalTokens.map((token, index) => (
                  <div key={token.index} className="flex items-center justify-between bg-neutral-800/30 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <TokenIcon symbol={token.symbol} />
                      <span className="font-semibold">{token.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{liquidityState.amounts[index] || '0.0'}</div>
                      <div className="text-xs text-neutral-500">Balance: 0.00</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tolerance */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Tolerance (%)</label>
                <div className="flex space-x-2">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setLiquidityState(prev => ({ ...prev, tolerance: value }))}
                      className={`px-3 py-1 rounded text-sm ${
                        liquidityState.tolerance === value 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.1"
                    value={liquidityState.tolerance}
                    onChange={(e) => setLiquidityState(prev => ({ ...prev, tolerance: e.target.value }))}
                    className="flex-1 px-3 py-1 bg-neutral-800 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Custom"
                  />
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={executeAddLiquidity}
                disabled={!isConnected || !hasAmounts || isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
              >
                {!isConnected ? 'Connect Wallet' : 
                 isLoading ? `${liquidityState.mode === 'add' ? 'Adding' : 'Removing'} Liquidity...` :
                 !hasAmounts ? 'Enter Amount' :
                 `${liquidityState.mode === 'add' ? 'Add' : 'Remove'} Liquidity`}
              </Button>

              {/* Info */}
              <div className="bg-neutral-800/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div className="text-sm text-neutral-300">
                    <p className="font-semibold mb-1">Important Notes:</p>
                    <ul className="text-xs text-neutral-400 space-y-1">
                      <li>• All 5 tokens must have the same amount</li>
                      <li>• You&apos;ll receive LP tokens representing your pool share</li>
                      <li>• Tolerance helps protect against price changes</li>
                      <li>• You earn fees proportional to your liquidity share</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pool Info */}
          <div className="mt-6 text-center text-sm text-neutral-500">
            <p>Pool Address: 0x83EC719A6F504583d0F88CEd111cB8e8c0956431</p>
            <p>Network: Arbitrum Sepolia</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrbitalLiquidityPage;
