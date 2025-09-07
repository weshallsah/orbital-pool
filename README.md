## Introduction

Orbital is an automated market maker for pools of 2, 3, or 10,000 stablecoins. It unlocks capital efficiency by bringing concentrated liquidity to higher dimensions.

By bending liquidity into a torus-shaped universe, Orbital unlocks concentrated liquidity for three or more stablecoins at once. This isn’t your usual 2D liquidity grid—it’s an entirely new dimension where LPs can laser-focus around the sacred $1 mark, while still guaranteeing fair prices even if an entire stablecoin implodes to zero.

It’s like Uniswap V3’s surgical precision colliding head-on with Curve’s bulletproof stability, and the result is something that shouldn’t even exist, but somehow, it does.

Orbital is the AMM where capital efficiency doesn’t just scale, it warps!

## Mathematical Visualization
<p float="left"><img src="https://raw.githubusercontent.com/leeederek/sphere-swap/main/media/orbital-gif-1.gif" width="49%" alt="Orbital GIF 1" /> <img src="https://raw.githubusercontent.com/leeederek/sphere-swap/main/media/orbital-gif-2.gif" width="49%" alt="Orbital GIF 2" />
</p>

## Key Features

- **Multi-Token Stability Engine**: Seamlessly trade across three or more stablecoins in a single pool with no more fragmented liquidity.

- **Warped Concentrated Liquidity**: Liquidity providers can laser-focus capital around $1, achieving maximum efficiency while still keeping markets resilient.

- **Torus Invariant Model**: A breakthrough mathematical invariant that curves liquidity across dimensions, ensuring fair pricing even in extreme scenarios.

- **Fusion of Giants (Uniswap × Curve)**: Orbital takes Uniswap V3’s precision and Curve’s stability, merging them into a next-generation AMM.

- **Powered by Arbitrum Stylus + Rust**: Our entire mathematical engine runs in Rust via Stylus, unlocking performance and gas efficiency for complex calculations.

## Mathematical Foundation

### The Orbital Model

The Orbital AMM is built on the mathematical foundation described in the [Paradigm Orbital Whitepaper](https://www.paradigm.xyz/2025/06/orbital). The core innovation lies in extending concentrated liquidity to higher dimensions using spherical geometry.

#### Core Mathematical Concepts

**1. Sphere AMM Formula**

<img src="public/orbital_equation.png" width="400" alt="Orbital Equation" /> 

Where:
- `r(vector) = (r, r, ..., r)` vector is the center of the sphere
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

## Contract Addresses

- **Orbital AMM Pool**: `0xdCED0759B526257f98c1e0FFDD27c1Fdbe0A549E`
- **Math Helper (Stylus)**: `0x112F137fcB7fA9Ed84A54767aD4d555904F274d9`
- **MUSDC-A**: `0x55ED71f5232EdBf6EE38A8696051a15eeF5a1dc4`
- **MUSDC-B**: `0x88c7714B73809BEabA25AE8f4C5892d15c536012`
- **MUSDC-C**: `0x8b2aC3bb0c07F0f82c9e31d3E8FFE88dd4976fE9`
- **MUSDC-D**: `0x12c2ef6F20db8878A2c00fA56169e86D7FA7aca0`
- **MUSDC-E**: `0xd6a69962522C52ad687102CFdfc52EFa8a0B78A7`

## Architecture & User Flow

<img src="public/userflow.png" width="600" alt="UserFlow" /> 

<img src="public/_architecture.png" width="600" alt="Architecture" /> 

## 🚀 Quick Start

### Prerequisites

- Foundry installed
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

### Steps to configure your own pool

```bash
# Deploy pool and the mock tokens
forge script script/DeployAndConfig.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

# Command to add liqudity
cast send $POOL_ADDRESS "addLiquidity(uint256,uint256[5])" 3000000000000000 "[1000000000000000000000,1000000000000000000000,1000000000000000000000,1000000000000000000000,1000000000000000000000]" --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Command to swap 
cast send $POOL_ADDRESS "swap(uint256,uint256,uint256,uint256)" 0 1 20000000000000000000 0 --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### Frontend installation

#### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

All contract addresses are pre-configured for Arbitrum Sepolia testnet.

## Documentation

### Whitepaper Reference

This implementation is based on the [Paradigm Orbital Whitepaper](https://www.paradigm.xyz/2025/06/orbital), which provides the mathematical foundation for the Orbital AMM model.

### Key Concepts from Whitepaper

1. **Sphere AMM**: Base mathematical model using spherical geometry
2. **Torus Invariant**: Combined interior and boundary tick behavior
3. **Tick Consolidation**: Efficient aggregation of similar ticks
4. **Global Trade Invariant**: Method for calculating large trades across multiple ticks

### Development Team

- [@agrawalx](https://github.com/agrawalx)
- [@IshaanXCoder](https://github.com/IshaanXCoder) 
- [@groverInnovate](https://github.com/groverInnovate)
- [@akronim26](https://github.com/akronim26) 

## 📄 License

This project is licensed under the MIT License.

*Built with ❤️ by the Orbital*
