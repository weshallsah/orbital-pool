/**
 * Orbital AMM - Configuration Constants
 *
 * Centralized configuration for tokens, pools, and protocol parameters.
 *
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

export const TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x9666526dcF585863f9ef52D76718d810EE77FB8D",
    decimals: 18,
    logo: "/tokens/usdc.svg",
    color: "#2775CA",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC",
    decimals: 18,
    logo: "/tokens/usdt.svg",
    color: "#26A17B",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xbEDC66545b8A4763eF8962860901F817DB7C2199",
    decimals: 18,
    logo: "/tokens/dai.svg",
    color: "#F5AC37",
  },
  {
    symbol: "FRAX",
    name: "Frax",
    address: "0x13f62264A2Eb0834DEfb513D7A3c69fde9cc1fD2",
    decimals: 18,
    logo: "/tokens/frax.svg",
    color: "#000000",
  },
  {
    symbol: "LUSD",
    name: "Liquity USD",
    address: "0x0510Bf5F38ca1Db3DE4B97E40FFfb9b195B60d41",
    decimals: 18,
    logo: "/tokens/lusd.svg",
    color: "#745DDF",
  },
] as const;

// Pool configuration
export const POOL_CONFIG = {
  address: "0x83EC719A6F504583d0F88CEd111cB8e8c0956431", // Orbital AMM Pool (redeployed)
  mathHelper: "0x112F137fcB7fA9Ed84A54767aD4d555904F274d9", // Math Helper
  fee: 0.003, // 0.3%
  maxSlippage: 0.05, // 5%
  minLiquidity: 1000,
  demoK: "3000000000000000", // Valid K value for demo
  demoAmount: "1000", // 1000 tokens for demo (will be converted to 1000 * 1e18 with parseEther)
} as const;

// UI Constants
export const ANIMATION_DURATION = 0.3;
export const DEBOUNCE_DELAY = 500;

// Orbital AMM specific constants
export const ORBITAL_CONSTANTS = {
  PRECISION: BigInt("1000000000000000000"), // 10^18
  MAX_TOKENS: 1000,
  MIN_LIQUIDITY: BigInt("1000000000000000"), // 10^15
  CONVERGENCE_TOLERANCE: BigInt("1000000"), // 10^6
  MAX_SLIPPAGE: BigInt("100000000000000000"), // 10%
} as const;

// Chart colors for different tokens
export const CHART_COLORS = [
  "#2775CA", // USDC Blue
  "#26A17B", // USDT Green
  "#F5AC37", // DAI Yellow
  "#000000", // FRAX Black
  "#745DDF", // LUSD Purple
  "#FF6B6B", // Additional colors
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
] as const;
