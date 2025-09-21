import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const SOLIDITY_ADDRESS = '0x8E27C670fA1D45a635e916F8bd60F7E5E1AcF19B';
const SOLIDITY_ABI = [{"type":"constructor","inputs":[{"name":"_tokens","type":"address[]","internalType":"contract IERC20[]"},{"name":"mathHelperAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"MATH_HELPER","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IOrbitalMATH_HELPER"}],"stateMutability":"view"},{"type":"function","name":"ROOT_N","inputs":[],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"TOKENS_COUNT","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"_calculateTickParams","inputs":[{"name":"p","type":"uint144","internalType":"uint144"},{"name":"reserveAmount","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"},{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"nonpayable"},{"type":"function","name":"_getTotalReserves","inputs":[],"outputs":[{"name":"","type":"uint144[]","internalType":"uint144[]"}],"stateMutability":"view"},{"type":"function","name":"activeTicks","inputs":[{"name":"p","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"p","type":"uint144","internalType":"uint144"},{"name":"r","type":"uint144","internalType":"uint144"},{"name":"k","type":"uint144","internalType":"uint144"},{"name":"liquidity","type":"uint144","internalType":"uint144"},{"name":"totalLpShares","type":"uint144","internalType":"uint144"},{"name":"status","type":"uint8","internalType":"enum OrbitalPool.TickStatus"}],"stateMutability":"view"},{"type":"function","name":"addLiquidity","inputs":[{"name":"p","type":"uint144","internalType":"uint144"},{"name":"amounts","type":"uint144[]","internalType":"uint144[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"allP","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"getLpShares","inputs":[{"name":"p","type":"uint144","internalType":"uint144"},{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"getTickLiquidity","inputs":[{"name":"p","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"getTickRadius","inputs":[{"name":"p","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"getTickStatus","inputs":[{"name":"p","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"","type":"uint8","internalType":"enum OrbitalPool.TickStatus"}],"stateMutability":"view"},{"type":"function","name":"getTotalLpShares","inputs":[{"name":"p","type":"uint144","internalType":"uint144"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"function","name":"removeLiquidity","inputs":[{"name":"p","type":"uint144","internalType":"uint144"},{"name":"lpSharesToRemove","type":"uint144","internalType":"uint144"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setSquareRootN","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"swap","inputs":[{"name":"amountIn","type":"uint144","internalType":"uint144"},{"name":"tokenIn","type":"uint144","internalType":"uint144"},{"name":"tokenOut","type":"uint144","internalType":"uint144"},{"name":"minAmountOut","type":"uint144","internalType":"uint144"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"tokens","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"type":"function","name":"totalReserves","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint144","internalType":"uint144"}],"stateMutability":"view"},{"type":"event","name":"LiquidityAdded","inputs":[{"name":"amounts","type":"uint144[]","indexed":false,"internalType":"uint144[]"},{"name":"lpShares","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"provider","type":"address","indexed":true,"internalType":"address"},{"name":"p","type":"uint144","indexed":false,"internalType":"uint144"}],"anonymous":false},{"type":"event","name":"LiquidityRemoved","inputs":[{"name":"amounts","type":"uint144[]","indexed":false,"internalType":"uint144[]"},{"name":"provider","type":"address","indexed":true,"internalType":"address"},{"name":"p","type":"uint144","indexed":false,"internalType":"uint144"}],"anonymous":false},{"type":"event","name":"Swap","inputs":[{"name":"trader","type":"address","indexed":true,"internalType":"address"},{"name":"tokenIn","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"tokenOut","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"amountIn","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"amountOut","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"fee","type":"uint144","indexed":false,"internalType":"uint144"}],"anonymous":false},{"type":"event","name":"TickParams","inputs":[{"name":"k","type":"uint144","indexed":false,"internalType":"uint144"},{"name":"r","type":"uint144","indexed":false,"internalType":"uint144"}],"anonymous":false},{"type":"error","name":"InsufficientLiquidity","inputs":[]},{"type":"error","name":"InvalidAmounts","inputs":[]},{"type":"error","name":"InvalidKValue","inputs":[]},{"type":"error","name":"InvalidLength","inputs":[]},{"type":"error","name":"InvalidReserves","inputs":[]},{"type":"error","name":"NoInteriorLiquidity","inputs":[]},{"type":"error","name":"NumericalError","inputs":[]},{"type":"error","name":"SafeERC20FailedOperation","inputs":[{"name":"token","type":"address","internalType":"address"}]},{"type":"error","name":"SameToken","inputs":[]},{"type":"error","name":"SlippageExceeded","inputs":[]},{"type":"error","name":"TorusInvariantCallFailed","inputs":[]},{"type":"error","name":"UnsatisfiedInvariant","inputs":[]}];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format token amount with correct decimals
 */
export function formatTokenAmount(amount: string | number, tokenSymbol: string): string {
  const tokenDecimals: Record<string, number> = {
    'WETH': 18,
    'ETH': 18,
    'USDC': 18,
    'USDT': 18,
    'BTC': 18,
    'MATIC': 18,
    'SOL': 18
  };
  
  const decimals = tokenDecimals[tokenSymbol];
  if (decimals === undefined) {
    // Default to 18 decimals if token not found
    return '0';
  }
  
  // Convert to string first to handle both number and string inputs
  const amountStr = amount.toString();
  
  // Check if the amount contains a decimal point
  if (amountStr.includes('.')) {
    const [whole, fraction] = amountStr.split('.');
    // Truncate to the correct number of decimals without rounding
    const truncatedFraction = fraction.slice(0, decimals).padEnd(decimals, '0');
    return `${whole}.${truncatedFraction}`;
  } else {
    // If no decimal point, add the appropriate number of zeros
    return `${amountStr}.${'0'.repeat(decimals)}`;
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 