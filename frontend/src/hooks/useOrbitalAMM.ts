/**
 * Orbital AMM - Contract Interaction Hook
 * 
 * Custom hook for interacting with the Orbital AMM smart contract.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, parseEther } from 'viem';
import { CONTRACTS } from '@/lib/wallet';
import { TOKENS, POOL_CONFIG } from '@/lib/constants';
import { useState } from 'react';

// Full Orbital AMM ABI
const ORBITAL_AMM_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "k",
        "type": "uint256"
      },
      {
        "internalType": "uint256[5]",
        "name": "amounts",
        "type": "uint256[5]"
      }
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "tokenOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minAmountOut",
        "type": "uint256"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "_getTotalReserves",
    "outputs": [
      {
        "internalType": "uint256[5]",
        "name": "totalReserves",
        "type": "uint256[5]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "tokens",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    "name": "approve",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "name": "allowance",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "account", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }]
  }
] as const;

export function useOrbitalAMM() {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { address } = useAccount();

  // Get total reserves
  const { data: totalReserves } = useReadContract({
    address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
    abi: ORBITAL_AMM_ABI,
    functionName: '_getTotalReserves',
  });

  // Check token allowance
  const checkAllowance = (tokenAddress: string) => {
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address!, CONTRACTS.ORBITAL_POOL as `0x${string}`],
      query: {
        enabled: !!address,
      },
    });
  };

  // Get token balance
  const getTokenBalance = (tokenAddress: string) => {
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address!],
      query: {
        enabled: !!address,
      },
    });
  };

  // Approve token spending
  const approveToken = async (tokenAddress: string, amount: string) => {
    try {
      setIsLoading(true);
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ORBITAL_POOL as `0x${string}`, parseEther(amount)],
      });
    } catch (err) {
      console.error('Approval failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Execute swap
  const executeSwap = async (
    tokenInIndex: number,
    tokenOutIndex: number,
    amountIn: string,
    minAmountOut: string = "0"
  ) => {
    try {
      setIsLoading(true);
      await writeContract({
        address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
        abi: ORBITAL_AMM_ABI,
        functionName: 'swap',
        args: [
          BigInt(tokenInIndex),
          BigInt(tokenOutIndex),
          parseEther(amountIn),
          parseEther(minAmountOut)
        ],
      });
    } catch (err) {
      console.error('Swap failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add liquidity with demo values
  const addLiquidityDemo = async () => {
    try {
      setIsLoading(true);
      const demoAmounts: [bigint, bigint, bigint, bigint, bigint] = [
        parseEther(POOL_CONFIG.demoAmount),
        parseEther(POOL_CONFIG.demoAmount),
        parseEther(POOL_CONFIG.demoAmount),
        parseEther(POOL_CONFIG.demoAmount),
        parseEther(POOL_CONFIG.demoAmount)
      ];

      await writeContract({
        address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
        abi: ORBITAL_AMM_ABI,
        functionName: 'addLiquidity',
        args: [
          BigInt(POOL_CONFIG.demoK),
          demoAmounts
        ],
      });
    } catch (err) {
      console.error('Add liquidity failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add custom liquidity
  const addLiquidity = async (k: string, amounts: string[]) => {
    try {
      setIsLoading(true);
      const parsedAmounts: [bigint, bigint, bigint, bigint, bigint] = [
        parseEther(amounts[0] || "0"),
        parseEther(amounts[1] || "0"),
        parseEther(amounts[2] || "0"),
        parseEther(amounts[3] || "0"),
        parseEther(amounts[4] || "0")
      ];

      await writeContract({
        address: CONTRACTS.ORBITAL_POOL as `0x${string}`,
        abi: ORBITAL_AMM_ABI,
        functionName: 'addLiquidity',
        args: [
          BigInt(k),
          parsedAmounts
        ],
      });
    } catch (err) {
      console.error('Add liquidity failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Format reserves for display
  const formatReserves = () => {
    if (!totalReserves) return null;

    return totalReserves.map((reserve, index) => ({
      token: TOKENS[index],
      reserve: formatUnits(reserve, 18),
      reserveFormatted: Number(formatUnits(reserve, 18)).toFixed(2),
    }));
  };

  return {
    // States
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash,

    // Data
    totalReserves: formatReserves(),

    // Functions
    executeSwap,
    addLiquidity,
    addLiquidityDemo,
    approveToken,
    checkAllowance,
    getTokenBalance,

    // Utils
    formatReserves,
  };
}

// Helper function to get token by index
export const getTokenByIndex = (index: number) => {
  return TOKENS[index] || null;
};

// Helper function to get token index
export const getTokenIndex = (tokenAddress: string) => {
  return TOKENS.findIndex(token =>
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
};