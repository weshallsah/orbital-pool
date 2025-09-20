/**
 * React hooks for Orbital Pool AMM operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { 
  apiClient, 
  SwapRequest, 
  AddLiquidityRequest, 
  RemoveLiquidityRequest,
  ApiError,
  SwapResponse,
  TokensResponse,
  HealthResponse
} from '@/lib/api';

// Query Keys for Orbital Pool
export const orbitalKeys = {
  all: ['orbital'] as const,
  health: () => [...orbitalKeys.all, 'health'] as const,
  tokens: () => [...orbitalKeys.all, 'tokens'] as const,
};

// Health Check Hook
export function useHealth() {
  return useQuery({
    queryKey: orbitalKeys.health(),
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });
}

// Get Tokens Hook
export function useTokens() {
  return useQuery({
    queryKey: orbitalKeys.tokens(),
    queryFn: () => apiClient.getTokens(),
    staleTime: 5 * 60 * 1000, // Tokens don't change often, cache for 5 minutes
  });
}

// Swap Hook
export function useSwap() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (swapData: SwapRequest) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      return apiClient.swap(swapData);
    },
    onSuccess: () => {
      // Swap successful
      console.log('Swap completed successfully');
    },
    onError: (error: ApiError) => {
      console.error('Failed to execute swap:', error);
    },
  });
}

// Add Liquidity Hook
export function useAddLiquidity() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (liquidityData: AddLiquidityRequest) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      return apiClient.addLiquidity(liquidityData);
    },
    onSuccess: () => {
      // Liquidity added successfully
      console.log('Liquidity added successfully');
    },
    onError: (error: ApiError) => {
      console.error('Failed to add liquidity:', error);
    },
  });
}

// Remove Liquidity Hook
export function useRemoveLiquidity() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (liquidityData: RemoveLiquidityRequest) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      return apiClient.removeLiquidity(liquidityData);
    },
    onSuccess: () => {
      // Liquidity removed successfully
      console.log('Liquidity removed successfully');
    },
    onError: (error: ApiError) => {
      console.error('Failed to remove liquidity:', error);
    },
  });
}

// Analytics hooks removed - not needed for now