# Orbital AMM Frontend Integration

This frontend is integrated with the Orbital AMM smart contract deployed on Arbitrum Sepolia testnet.

## Contract Addresses

- **Orbital AMM Pool**: `0xdCED0759B526257f98c1e0FFDD27c1Fdbe0A549E`
- **Math Helper (Stylus)**: `0x112F137fcB7fA9Ed84A54767aD4d555904F274d9`
- **MUSDC-A**: `0x55ED71f5232EdBf6EE38A8696051a15eeF5a1dc4`
- **MUSDC-B**: `0x88c7714B73809BEabA25AE8f4C5892d15c536012`
- **MUSDC-C**: `0x8b2aC3bb0c07F0f82c9e31d3E8FFE88dd4976fE9`
- **MUSDC-D**: `0x12c2ef6F20db8878A2c00fA56169e86D7FA7aca0`
- **MUSDC-E**: `0xd6a69962522C52ad687102CFdfc52EFa8a0B78A7`

## Features Implemented

### 1. Wallet Connection
- **MetaMask Integration**: Connect specifically with MetaMask wallet
- **Network Switching**: Automatically switches to Arbitrum Sepolia testnet
- **Balance Display**: Shows ETH balance and wallet address

### 2. Swap Functionality
- **Token Selection**: Choose from any of the 5 mock USDC tokens
- **Amount Input**: Enter amount to swap
- **Expected Output**: Shows calculated output amount (using mock exchange rate)
- **Slippage Protection**: Configurable slippage tolerance
- **Token Approval**: Automatic token approval before swap
- **Transaction Execution**: Calls the smart contract swap function

### 3. Add Liquidity
- **Demo Mode**: One-click demo with predefined values
  - K Value: `3000000000000000`
  - Amount: `1000` tokens for each of the 5 tokens
- **Custom Mode**: Enter custom K value and token amounts
- **Token Approval**: Approve all 5 tokens before adding liquidity
- **Pool Display**: Shows current total reserves for each token

### 4. UI/UX Features
- **Futuristic Design**: Orbital-themed interface with animations
- **Loading States**: Visual feedback during transactions
- **Error Handling**: User-friendly error messages
- **Transaction Status**: Success/failure notifications

## Demo Instructions

### Prerequisites
1. Install MetaMask browser extension
2. Switch to Arbitrum Sepolia testnet
3. Get some testnet ETH for gas fees
4. Ensure you have mock USDC tokens in your wallet

### Demo Flow

#### 1. Connect Wallet
- Click "Connect Wallet" button
- MetaMask should prompt automatically
- Confirm connection and network switch

#### 2. Add Liquidity (Demo)
- Navigate to "Liquidity" tab
- Click "Add Demo Liquidity (1000 tokens each)"
- Approve all 5 tokens when prompted
- Confirm the add liquidity transaction
- This adds 1000 tokens of each MUSDC token with K value `3000000000000000`

#### 3. Perform Swap
- Navigate to "Swap" tab
- Select input token (e.g., MUSDC-A)
- Select output token (e.g., MUSDC-B)
- Enter amount to swap
- Approve token if needed
- Click "Execute Swap"
- Confirm transaction

## Technical Details

### Contract Integration
- Uses the full contract ABI
- Properly handles token indices (0-4 for the 5 tokens)
- Implements proper token approval flow
- Uses parseEther for amount formatting (all tokens are 18 decimals)

### Key Functions Used
- `addLiquidity(uint256 k, uint256[5] amounts)`
- `swap(uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 minAmountOut)`
- `_getTotalReserves()` for display
- Token `approve()` and `allowance()` for ERC20 interactions

### Architecture
- **Wagmi**: Ethereum library for React
- **RainbowKit**: Wallet connection UI
- **Viem**: TypeScript interface for Ethereum
- **Next.js**: React framework
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

All contract addresses are pre-configured for Arbitrum Sepolia testnet.

## Notes

- All tokens use 18 decimals
- Exchange rates are mocked for demo purposes
- Price impact calculations are simplified
- Liquidity calculations use hardcoded USD values
- The interface removes "expected amount out" as requested
- Focus is on MetaMask-only wallet connection
- Graphs and analytics show placeholder/hardcoded data
