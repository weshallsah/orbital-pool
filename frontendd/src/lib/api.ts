/**
 * API client for Orbital Pool AMM Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_ORBITAL_API_URL || 'http://localhost:8000';

// Orbital Pool API Types
export interface SwapRequest {
  token_in_index: number;
  token_out_index: number;
  amount_in: string;
  min_amount_out: string;
  user_address: string;
}

export interface AddLiquidityRequest {
  amounts: string[]; // Array of 5 token amounts (all equal)
  tolerance: number; // Tolerance percentage
  user_address: string;
}

export interface RemoveLiquidityRequest {
  k_value: number;
  lp_shares: string;
  user_address: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TransactionData {
  to: string;
  data: string;
  gas: number;
  gasPrice: string;
  chainId: number;
  value: number;
  nonce: number;
  from: string;
}

export interface SwapResponse {
  success: boolean;
  transaction_data: TransactionData;
  gas_estimate: number;
  gas_price: string;
  token_in_index: number;
  token_out_index: number;
  amount_in: string;
  expected_amount_out: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
}

export interface TokensResponse {
  tokens: Record<string, TokenInfo>;
  pool_address: string;
}

export interface HealthResponse {
  status: string;
  pool_address: string;
  network: string;
  chain_id: number;
}

export interface GasPriceResponse {
  gas_price: string;
  gas_price_gwei: string;
}

// Analytics types removed - not needed for now

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class OrbitalPoolApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP error! status: ${response.status}`,
          response.status,
          data.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0
      );
    }
  }

  // Core AMM Endpoints
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getTokens(): Promise<TokensResponse> {
    return this.request<TokensResponse>('/tokens');
  }

  async swap(swapData: SwapRequest): Promise<SwapResponse> {
    return this.request<SwapResponse>('/swap', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async addLiquidity(liquidityData: AddLiquidityRequest): Promise<ApiResponse<TransactionData>> {
    return this.request<ApiResponse<TransactionData>>('/liquidity/add', {
      method: 'POST',
      body: JSON.stringify(liquidityData),
    });
  }

  async removeLiquidity(liquidityData: RemoveLiquidityRequest): Promise<ApiResponse<TransactionData>> {
    return this.request<ApiResponse<TransactionData>>('/liquidity/remove', {
      method: 'POST',
      body: JSON.stringify(liquidityData),
    });
  }

  async getGasPrice(): Promise<GasPriceResponse> {
    return this.request<GasPriceResponse>('/gas-price');
  }

  // Analytics endpoints removed - not needed for now
}

// Create singleton instance
export const apiClient = new OrbitalPoolApiClient();

// Export for convenience
export { ApiError };