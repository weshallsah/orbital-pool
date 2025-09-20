/**
 * API client for Orbital Pool AMM Backend
 */

const API_BASE_URL = 'http://localhost:8000';

// Core API Response Type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Transaction data structure
export interface TransactionData {
  to: string;
  data: string;
  gas: number;
  gasPrice: string;
  value: string;
}

// Basic API functions for the Orbital Pool
export const orbitalAPI = {
  // Health check
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: 'Health check failed' };
    }
  },

  // Get tokens
  async getTokens() {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens`);
      return await response.json();
    } catch (error) {
      console.error('Get tokens failed:', error);
      return { success: false, error: 'Get tokens failed' };
    }
  },

  // Get gas price
  async getGasPrice() {
    try {
      const response = await fetch(`${API_BASE_URL}/gas-price`);
      return await response.json();
    } catch (error) {
      console.error('Get gas price failed:', error);
      return { success: false, error: 'Get gas price failed' };
    }
  }
};

export default orbitalAPI;