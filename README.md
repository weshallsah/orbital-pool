# 🌌 Orbital Pool

> **A multi-token Automated Market Maker implementing the Paradigm's Orbital mathematical model for stablecoin trading**

## 📖 Overview

Orbital Pool is an innovative Automated Market Maker (AMM) that extends concentrated liquidity to pools of 3 or more stablecoins using a torus-based mathematical model. Unlike traditional 2D concentrated liquidity, Orbital allows liquidity providers to focus their capital around the $1 equal price point while maintaining fair pricing even when one stablecoin depegs to zero.
### Mathematical Visualization
| <img src="https://raw.githubusercontent.com/leeederek/sphere-swap/main/media/orbital-gif-1.gif" width="400" alt="Orbital GIF 1" /> | <img src="https://raw.githubusercontent.com/leeederek/sphere-swap/main/media/orbital-gif-2.gif" width="400" alt="Orbital GIF 2" /> |

### 🎯 Key Features

- **Multi-token Support**: Trade between multiple different stablecoins in a single pool
- **Concentrated Liquidity**: Focus capital around the $1 equal price point for maximum efficiency
- **Torus Invariant**: Advanced mathematical model for price discovery and liquidity management
- **Marketplay**: Made an efficient usage of best part's of the existing marketplayers - Uniswap and Curve
- **Made a usecase of Arbitrum's Stylus**: Our entire mathemaitcal engine for complex calulations was based in Rust using stylus for precision, performance and gad efficiency. 

## 🔬 Mathematical Foundation

### The Orbital Model

The Orbital AMM is built on the mathematical foundation described in the [Paradigm Orbital Whitepaper](https://www.paradigm.xyz/2025/06/orbital). The core innovation lies in extending concentrated liquidity to higher dimensions using spherical geometry.

#### Core Mathematical Concepts

**1. Sphere AMM Formula**
```
||r⃗ - x⃗||² = Σᵢ₌₁ⁿ (r - xᵢ)² = r²
```
Where:
- `r⃗ = (r, r, ..., r)` vector is the center of the sphere
- `xᵢ` is the AMM's reserve of asset i
- `r` is the radius of the sphere

**2. Torus Invariant**
The pool uses a torus (donut-shaped) invariant that combines:
- **Interior Ticks**: Behave like spheres for normal trading
- **Boundary Ticks**: Behave like circles when reserves hit boundaries

**3. Tick Geometry**
Each tick is defined by:
- **k**: Plane constant (tick identifier)
- **r**: Radius of the tick
- **Status**: Interior or Boundary

#### K-Value Validation

The k-value must satisfy the constraint:
```
k ≥ (r × PRECISION) / SQRT5_SCALED
```

Where:
- `PRECISION = 1e15`
- `SQRT5_SCALED = 2236067977499790`



## 🏗️ Architecture



### Mathematical Flow

```
img will come here

```

### Tick States

**Interior Tick**: Normal trading state where reserves can move freely within the sphere
**Boundary Tick**: Constrained state where reserves are pinned to the tick boundary


## 📊 Core Functions

### Adding Liquidity

```solidity
function addLiquidity(
    uint256 k,                    // Valid k-value for the tick
    uint256[5] memory amounts     // Amounts for each token
) external
```

**Example Usage:**
```javascript
const kValue = 87403204888; // For 1000 tokens each
const amounts = [
    ethers.utils.parseEther("1000"), // USD1
    ethers.utils.parseEther("1000"), // USD2
    ethers.utils.parseEther("1000"), // USD3
    ethers.utils.parseEther("1000"), // USD4
    ethers.utils.parseEther("1000")  // USD5
];

await pool.addLiquidity(kValue, amounts);
```

### Swapping Tokens

```solidity
function swap(
    uint256 tokenIn,     // Index of input token (0-4)
    uint256 tokenOut,    // Index of output token (0-4)
    uint256 amountIn,    // Input amount
    uint256 minAmountOut // Minimum output amount (slippage protection)
) external returns (uint256)
```

**Example Usage:**
```javascript
const tokenIn = 0;  // USD1
const tokenOut = 1; // USD2
const amountIn = ethers.utils.parseEther("100");
const minAmountOut = ethers.utils.parseEther("90");

const amountOut = await pool.swap(tokenIn, tokenOut, amountIn, minAmountOut);
```

### Removing Liquidity

```solidity
function removeLiquidity(
    uint256 k,              // Tick identifier
    uint256 lpSharesToRemove // Number of LP shares to remove
) external
```

## 📸 Screenshots & Visualizations

    screenshots aaynge idhar
    
## 🚀 Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Node.js 16+ (for testing)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/orbital-pool.git
cd orbital-pool

# Install dependencies
forge install

# Build the project
forge build

# Run tests
forge test
```

### Deployment

```bash
# Deploy to local network
forge script script/DeployProductionReady.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to testnet
forge script script/DeployProductionReady.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

## 📚 Documentation

### Whitepaper Reference

This implementation is based on the [Paradigm Orbital Whitepaper](https://www.paradigm.xyz/2025/06/orbital), which provides the mathematical foundation for the Orbital AMM model.

### Key Concepts from Whitepaper

1. **Sphere AMM**: Base mathematical model using spherical geometry
2. **Torus Invariant**: Combined interior and boundary tick behavior
3. **Tick Consolidation**: Efficient aggregation of similar ticks
4. **Global Trade Invariant**: Method for calculating large trades across multiple ticks

### Development Team

- [@agrawalx](https://github.com/agrawalx) - Core Development
- [@IshaanXCoder](https://github.com/IshaanXCoder) - Smart Contracts
- [@groverInnovate](https://github.com/groverInnovate) - Mathematical Implementation
- [@akronim26](https://github.com/akronim26) - Testing & Security

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Built with ❤️ by the Orbital*