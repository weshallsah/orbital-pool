// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IOrbitalMathHelper
 * @notice Interface for interacting with the deployed Stylus Math Helper contract
 * @dev Provides mathematical computations for the Orbital AMM including torus invariant solving
 * @dev This interface should match the deployed Stylus contract on Arbitrum Sepolia testnet
 * @dev The Stylus contract (orbitalHelper.rs) handles complex mathematical calculations
 */
interface IOrbitalMathHelper {
    /**
     * @notice Solves the torus invariant to calculate swap output amount
     * @param sum_interior_reserves Sum of interior reserves from consolidated data
     * @param interior_consolidated_radius Interior consolidated radius
     * @param boundary_consolidated_radius Boundary consolidated radius
     * @param boundary_total_k_bound Boundary total k bound
     * @param total_reserves Current total reserves across all ticks
     * @param token_in_index Index of the input token (0-4)
     * @param token_out_index Index of the output token (0-4)
     * @param amount_in_after_fee Input amount after fee deduction
     * @return The computed output amount
     */
    function solveTorusInvariant(
        uint256 sum_interior_reserves,
        uint128 interior_consolidated_radius,
        uint128 boundary_consolidated_radius,
        uint128 boundary_total_k_bound,
        uint64 token_in_index,
        uint64 token_out_index,
        uint256 amount_in_after_fee,
        uint256[] memory total_reserves
    ) external returns (uint256);

    /**
     * @notice Calculates the radius of a tick from its reserves
     * @param reserves Array of token reserves for the tick
     * @return The calculated radius
     */
    function calculateRadius(
        uint256[] memory reserves
    ) external returns (uint256);

    /**
     * @notice Calculates the s value for a boundary tick
     * @param r The radius of the tick
     * @param k The plane constant for the tick
     * @return The calculated s value
     */
    function calculateBoundaryTickS(
        uint128 r,
        uint128 k
    ) external returns (uint256);

    function createTickFromParameter(
        uint256 p,
        uint256 reserve_amount
    ) external view returns (uint256[] memory, uint256, uint256, bool);
}

/**
 * @title OrbitalPool
 * @notice A 5-token AMM implementing the Orbital mathematical model
 * @dev Uses a torus-based invariant for price discovery and liquidity management
 * @author Orbital Protocol
 */
contract OrbitalPool {
    using SafeERC20 for IERC20;

    uint256 public constant TOKENS_COUNT = 5;
    uint256 private constant SQRT5_SCALED = 2236067977499790;
    uint256 private constant PRECISION = 1e15;
    IOrbitalMathHelper public immutable mathHelper;
    uint256 public constant swapFee = 3000;
    uint256 public constant FEE_DENOMINATOR = 1000000;
    IERC20[TOKENS_COUNT] public tokens;
    uint256[TOKENS_COUNT] public totalReserves;
    mapping(uint256 p => Tick) public activeTicks;

    /**
     * @notice Status of a tick in the pool
     */
    enum TickStatus {
        Interior, /// @dev Tick is in the interior region
        Boundary /// @dev Tick is on the boundary
    }

    /**
     * @notice Represents a liquidity tick in the pool
     * @dev Each tick has its own reserves and LP shares
     */
    struct Tick {
        uint256 p;
        uint128 r; /// @dev Radius of the tick
        uint128 k; /// @dev Plane constant for the tick
        uint256 liquidity; /// @dev Total liquidity in the tick
        uint256 totalLpShares; /// @dev Total LP shares issued
        uint256 accruedFees; /// @dev Total fees accrued
        TickStatus status; /// @dev Current status of the tick
        mapping(address => uint256) lpShares; /// @dev LP shares per address
        uint256[TOKENS_COUNT] reserves; /// @dev Reserves of each token
    }

    /**
     * @notice Consolidated data for interior and boundary ticks
     * @dev Used for efficient swap calculations
     */
    struct ConsolidatedTickData {
        uint256 totalLiquidity; /// @dev Combined liquidity
        uint128 tickCount; /// @dev Number of ticks
        uint128 consolidatedRadius; /// @dev Combined radius
        uint128 totalKBound; /// @dev Sum of k values for boundary ticks
        uint256[TOKENS_COUNT] totalReserves; /// @dev Sum of reserves across ticks
        uint256[TOKENS_COUNT] sumSquaredReserves; /// @dev Sum of squared reserves
    }

    /**
     * @notice Emitted when liquidity is added to a tick
     * @param provider Address of the liquidity provider
     * @param amounts Amounts of each token added
     * @param lpShares LP shares minted
     */
    event LiquidityAdded(
        uint256[TOKENS_COUNT] amounts,
        uint256 lpShares,
        address indexed provider,
        uint256 p
    );

    /**
     * @notice Emitted when liquidity is removed from a tick
     * @param provider Address of the liquidity provider
     * @param amounts Amounts of each token removed
     */
    event LiquidityRemoved(
        uint256[TOKENS_COUNT] amounts,
        address indexed provider,
        uint256 p
    );

    /**
     * @notice Emitted when a swap is executed
     * @param trader Address of the trader
     * @param tokenIn Index of input token
     * @param tokenOut Index of output token
     * @param amountIn Input amount
     * @param amountOut Output amount
     * @param fee Fee charged
     */
    event Swap(
        address indexed trader,
        uint64 tokenIn,
        uint64 tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    /**
     * @notice Emitted when a tick's status changes
     * @param oldStatus Previous status
     * @param newStatus New status
     */
    event TickStatusChanged(
        uint256 p,
        TickStatus oldStatus,
        TickStatus newStatus
    );

    error InvalidKValue();
    error InvalidAmounts();
    error TickAlreadyExists();
    error InsufficientLiquidity();
    error InvalidTokenIndex();
    error SlippageExceeded();
    error MathHelperError(string reason);
    error NumericalError();
    error UnsatisfiedInvariant();

    /**
     * @notice Initializes the Orbital pool
     * @param _tokens Array of 5 ERC20 tokens for the pool
     * @param _mathHelperAddress Address of the Stylus math helper contract
     */
    constructor(
        IERC20[TOKENS_COUNT] memory _tokens,
        address _mathHelperAddress
    ) {
        tokens = _tokens;
        mathHelper = IOrbitalMathHelper(_mathHelperAddress);
    }

    function _toDynamic(
        uint256[TOKENS_COUNT] memory arrayIn
    ) internal pure returns (uint256[] memory arrayOut) {
        arrayOut = new uint256[](TOKENS_COUNT);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) arrayOut[i] = arrayIn[i];
    }

    function _callCalculateRadius(
        uint256[TOKENS_COUNT] memory reserves
    ) internal returns (uint128) {
        uint256[] memory dyn = _toDynamic(reserves);
        (bool ok, bytes memory ret) = address(mathHelper).call(
            abi.encodeWithSignature("calculateRadius(uint256[])", dyn)
        );
        if (!ok || ret.length == 0) revert NumericalError();
        return abi.decode(ret, (uint128));
    }

    function _callBoundaryTickS(
        uint128 r,
        uint128 k
    ) internal returns (uint256) {
        (bool ok, bytes memory ret) = address(mathHelper).call(
            abi.encodeWithSignature(
                "calculateBoundaryTickS(uint256,uint256)",
                r,
                k
            )
        );
        if (!ok || ret.length == 0) revert NumericalError();
        return abi.decode(ret, (uint256));
    }

    function _callSolveTorusInvariant(
        uint256 sumInterior,
        uint128 interiorR,
        uint128 boundaryR,
        uint128 boundaryK,
        uint64 tokenIn,
        uint64 tokenOut,
        uint256 amountInAfterFee,
        uint256[TOKENS_COUNT] memory _totalReserves
    ) internal returns (uint256) {
        uint256[] memory dyn = _toDynamic(_totalReserves);
        (bool ok, bytes memory ret) = address(mathHelper).call(
            abi.encodeWithSignature(
                "solveTorusInvariant(uint256,uint256,uint256,uint256,uint256[],uint256,uint256,uint256)",
                sumInterior,
                interiorR,
                boundaryR,
                boundaryK,
                tokenIn,
                tokenOut,
                amountInAfterFee,
                dyn
            )
        );
        if (!ok || ret.length == 0) revert NumericalError();
        return abi.decode(ret, (uint256));
    }

    /**
     * @notice Gets LP shares for a user in a specific tick
     * @param user User address
     * @return LP shares owned by the user
     */
    function getLpShares(
        uint256 p,
        address user
    ) external view returns (uint256) {
        return activeTicks[p].lpShares[user];
    }

    /**
     * @notice Gets total LP shares for a tick
     * @return Total LP shares for the tick
     */
    function getTotalLpShares(uint256 p) external view returns (uint256) {
        return activeTicks[p].totalLpShares;
    }

    /**
     * @notice Gets accrued fees for a tick
     * @return Total fees accrued to the tick
     */
    function getAccruedFees(uint256 p) external view returns (uint256) {
        return activeTicks[p].accruedFees;
    }

    /**
     * @notice Gets the radius of a tick
     * @return Radius of the tick
     */
    function getTickRadius(uint256 p) external view returns (uint128) {
        return activeTicks[p].r;
    }

    /**
     * @notice Gets the liquidity of a tick
     * @return Liquidity of the tick
     */
    function getTickLiquidity(uint256 p) external view returns (uint256) {
        return activeTicks[p].liquidity;
    }

    /**
     * @notice Gets the status of a tick
     * @return Current status of the tick
     */
    function getTickStatus(uint256 p) external view returns (TickStatus) {
        return activeTicks[p].status;
    }

    /**
     * @notice Gets total reserves across all active ticks
     * @return totalReserves Array of total reserves for each token
     */
    function _getTotalReserves()
        public
        view
        returns (uint256[TOKENS_COUNT] memory)
    {
        return totalReserves;
    }

    /**
     * @notice Adds liquidity to a tick
     * @param amounts Array of token amounts to add (all must be > 0)
     * @dev Creates new tick if it doesn't exist, updates existing tick otherwise
     */
    function addLiquidity(
        uint256 p,
        uint256[TOKENS_COUNT] memory amounts
    ) external {
        bool tickExists = activeTicks[p].r > 0;
        uint128 previousRadius = tickExists ? activeTicks[p].r : 0;
        uint256 previousTotalLpShares = tickExists
            ? activeTicks[p].totalLpShares
            : 0;
        uint256 previousLiquidity = tickExists
            ? activeTicks[p].totalLiquidity
            : 0;

        uint256[TOKENS_COUNT] memory reservesForRadiusCalc;
        if (!tickExists) {
            reservesForRadiusCalc = amounts;
        } else {
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                reservesForRadiusCalc[i] =
                    activeTicks[p].reserves[i] +
                    amounts[i];
            }
        }

        (uint128 newRadius, uint128 k) = mathHelper.createTickFromParameter(
            p,
            reservesForRadiusCalc
        );

        TickStatus tickStatus = checkInvariants(
            k,
            newRadius,
            reservesForRadiusCalc
        );

        if (!tickExists) {
            Tick storage newTick = activeTicks[p];
            newTick.r = newRadius;
            newTick.k = k;
            newTick.liquidity = uint256(newRadius) * uint256(newRadius);
            newTick.reserves = reservesForRadiusCalc;
            newTick.status = tickStatus;
        } else {
            activeTicks[p].r = newRadius;
            activeTicks[p].reserves = reservesForRadiusCalc;
            activeTicks[p].liquidity = uint256(newRadius) * uint256(newRadius);
            activeTicks[p].status = tickStatus;
        }

        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amounts[i] > 0) {
                tokens[i].safeTransferFrom(
                    msg.sender,
                    address(this),
                    amounts[i]
                );
            } else {
                revert InvalidAmounts();
            }
        }

        uint256 lpShares;
        if (!tickExists || previousTotalLpShares == 0) {
            lpShares = uint256(newRadius) * uint256(newRadius);
        } else {
            uint256 newLiquidity = activeTicks[p].liquidity;
            lpShares =
                ((newLiquidity - previousLiquidity) * previousTotalLpShares) /
                previousLiquidity;
        }

        activeTicks[p].lpShares[msg.sender] += lpShares;
        activeTicks[p].totalLpShares += lpShares;

        emit LiquidityAdded(amounts, lpShares, msg.sender, p);
    }

    /**
     * @notice Removes liquidity from a tick
     * @param lpSharesToRemove Number of LP shares to remove
     * @dev Proportionally removes reserves and updates tick state
     */
    function removeLiquidity(uint256 p, uint256 lpSharesToRemove) external {
        if (lpSharesToRemove == 0) revert InvalidAmounts();

        Tick storage tick = activeTicks[p];
        if (tick.r == 0) revert InvalidKValue();

        uint256 userLpShares = tick.lpShares[msg.sender];
        if (userLpShares < lpSharesToRemove) revert InsufficientLiquidity();

        uint256 removalProportion = (lpSharesToRemove * PRECISION) /
            tick.totalLpShares;

        uint256[TOKENS_COUNT] memory amountsToReturn;
        uint256[TOKENS_COUNT] memory newReserves;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            amountsToReturn[i] =
                (tick.reserves[i] * removalProportion) /
                PRECISION;
            newReserves[i] = tick.reserves[i] - amountsToReturn[i];
        }

        (uint128 newRadius, uint128 k) = mathHelper.createTickFromParameters(
            p,
            newReserves
        );

        tick.r = newRadius;
        tick.reserves = newReserves;
        tick.liquidity = uint256(newRadius) * uint256(newRadius);
        tick.lpShares[msg.sender] -= lpSharesToRemove;
        tick.totalLpShares -= lpSharesToRemove;

        TickStatus tickStatus = checkInvariants(newRadius, k, newReserves);

        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amountsToReturn[i] > 0) {
                tokens[i].safeTransfer(msg.sender, amountsToReturn[i]);
            }
        }

        emit LiquidityRemoved(amountsToReturn, msg.sender, p);
    }

    /**
     * @notice Executes a token swap
     * @param tokenIn Index of input token (0-4)
     * @param tokenOut Index of output token (0-4)
     * @param amountIn Amount of input tokens to swap
     * @param minAmountOut Minimum amount of output tokens expected
     * @return amountOut Actual amount of output tokens received
     * @dev Uses torus invariant to calculate output amount and updates all tick reserves
     */
    function swap(
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        if (tokenIn >= TOKENS_COUNT || tokenOut >= TOKENS_COUNT)
            revert InvalidTokenIndex();
        if (tokenIn == tokenOut) revert InvalidAmounts();
        if (amountIn == 0) revert InvalidAmounts();

        tokens[tokenIn].safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountInAfterFee = (amountIn * (FEE_DENOMINATOR - swapFee)) /
            FEE_DENOMINATOR;

        uint256[TOKENS_COUNT] memory totalReserves = _getTotalReserves();

        amountOut = _calculateSwapOutput(
            totalReserves,
            tokenIn,
            tokenOut,
            amountInAfterFee
        );

        if (amountOut < minAmountOut) revert SlippageExceeded();

        totalReserves[tokenIn] += amountInAfterFee;
        if (totalReserves[tokenOut] >= amountOut) {
            totalReserves[tokenOut] -= amountOut;
        } else {
            totalReserves[tokenOut] = 0;
        }
        _updateTickReservesWithCrossings(totalReserves);

        tokens[tokenOut].safeTransfer(msg.sender, amountOut);

        _distributeFees(amountIn - amountInAfterFee, tokenIn);

        emit Swap(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            amountIn - amountInAfterFee
        );
    }

    // ===================================================================
    //
    //                        INTERNAL CALCULATIONS
    //
    // ===================================================================

    /**
     * @notice Gets consolidated data for interior and boundary ticks
     * @return interiorData Consolidated data for interior ticks
     * @return boundaryData Consolidated data for boundary ticks
     * @dev Used for efficient swap calculations by consolidating similar ticks
     */
    function _getConsolidatedTickData()
        internal
        returns (
            ConsolidatedTickData memory interiorData,
            ConsolidatedTickData memory boundaryData
        )
    {
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];

            if (tick.r == 0) continue;

            if (tick.status == TickStatus.Interior) {
                interiorData.consolidatedRadius += tick.r;
                interiorData.totalLiquidity += tick.liquidity;
                interiorData.tickCount++;
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    interiorData.totalReserves[j] += tick.reserves[j];
                }
            } else {
                uint256 s = _callBoundaryTickS(tick.r, tick.k);
                boundaryData.consolidatedRadius += s;
                boundaryData.totalLiquidity += tick.liquidity;
                boundaryData.tickCount++;
                boundaryData.totalKBound += tick.k;
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    boundaryData.totalReserves[j] += tick.reserves[j];
                }
            }
        }
    }

    /**
     * @notice Calculates swap output using torus invariant
     * @param reserves Current total reserves
     * @param tokenIn Index of input token
     * @param tokenOut Index of output token
     * @param amountIn Input amount after fees
     * @return Output amount calculated by solving torus invariant
     * @dev Delegates to Stylus math helper for complex calculations
     */
    function _calculateSwapOutput(
        uint256[TOKENS_COUNT] memory reserves,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn
    ) internal returns (uint256) {
        (
            ConsolidatedTickData memory interiorData,
            ConsolidatedTickData memory boundaryData
        ) = _getConsolidatedTickData();

        uint256 sumInteriorReserves = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sumInteriorReserves += interiorData.totalReserves[i];
        }

        uint256[] memory reservesVec = new uint256[](TOKENS_COUNT);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            reservesVec[i] = reserves[i];
        }

        uint256 amount = _callSolveTorusInvariant(
            sumInteriorReserves,
            interiorData.consolidatedRadius,
            boundaryData.consolidatedRadius,
            boundaryData.totalKBound,
            reserves,
            tokenIn,
            tokenOut,
            amountIn
        );

        if (amount == 0) {
            uint256 fallbackAmount = _fallbackSwapCalculation(
                reserves,
                tokenIn,
                tokenOut,
                amountIn
            );
            if (fallbackAmount == 0) revert InsufficientLiquidity();
            return fallbackAmount;
        }
        if (amount >= reserves[tokenOut]) revert InsufficientLiquidity();
        return amount;
    }

    /**
     * @notice Fallback swap calculation using constant product formula
     * @param reserves Current reserves
     * @param tokenIn Input token index
     * @param tokenOut Output token index
     * @param amountIn Input amount
     * @return Fallback output amount
     * @dev Used when Stylus contract fails or returns 0
     */
    function _fallbackSwapCalculation(
        uint256[TOKENS_COUNT] memory reserves,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn
    ) internal pure returns (uint256) {
        if (reserves[tokenIn] == 0 || reserves[tokenOut] == 0) return 0;

        // Simple constant product formula: y = (amountIn * reserveOut) / (reserveIn + amountIn)
        uint256 numerator = amountIn * reserves[tokenOut];
        uint256 denominator = reserves[tokenIn] + amountIn;

        if (denominator == 0) return 0;

        uint256 result = numerator / denominator;
        // Apply 2% safety margin
        return (result * 98) / 100;
    }

    function checkInvariants(
        uint128 r,
        uint128 k,
        uint256[TOKENS_COUNT] calldata amounts
    ) internal returns (TickStatus) {
        uint256 sumOfDifferenceOfReserves = 0;
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += amounts[i];
            uint256 difference = r - amounts[i];
            sumOfDifferenceOfReserves += difference * difference;
        }
        uint256 invariant = uint256(r) * uint256(r);
        if (
            sumOfDifferenceOfReserves < invariant - 1 ||
            sumOfDifferenceOfReserves > invariant + 1
        ) {
            revert UnsatisfiedInvariant();
        }
        uint256 lhs = (sum * PRECISION) / SQRT5_SCALED;
        return
            (lhs >= k - 1 && lhs <= k + 1)
                ? TickStatus.Boundary
                : TickStatus.Interior;
    }

    /**
     * @notice Calculates the average (alpha) of reserves
     * @param reserves Array of token reserves
     * @return Average of all reserves
     */
    function _calculateAlpha(
        uint256[TOKENS_COUNT] memory reserves
    ) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += reserves[i];
        }
        return sum / TOKENS_COUNT;
    }

    /**
     * @notice Calculates square root using Babylonian method
     * @param x Number to calculate square root of
     * @return Square root of x
     * @dev Kept for potential future use by other functions
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // ===================================================================
    //
    //                        TICK MANAGEMENT
    //
    // ===================================================================

    /**
     * @notice Updates tick reserves and handles status crossings
     * @param newTotalReserves New total reserves after swap
     * @dev Updates individual tick reserves and checks for status changes
     */
    function _updateTickReservesWithCrossings(
        uint256[TOKENS_COUNT] memory newTotalReserves
    ) internal {
        uint256 newProjection = _calculateAlpha(newTotalReserves);
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            if (tick.r == 0) continue;
            uint256 normalizedProjection = (newProjection * PRECISION) / tick.r;
            uint256 normalizedBoundary = (tick.k * PRECISION) / tick.r;
            TickStatus oldStatus = tick.status;
            TickStatus newStatus = (normalizedProjection < normalizedBoundary)
                ? TickStatus.Interior
                : TickStatus.Boundary;
            if (oldStatus != newStatus) {
                tick.status = newStatus;
                emit TickStatusChanged(k, oldStatus, newStatus);
            }
        }
        _updateIndividualTickReserves(newTotalReserves);
    }

    /**
     * @notice Updates individual tick reserves based on new totals
     * @param newTotalReserves New total reserves across all ticks
     * @dev Distributes reserves proportionally among interior ticks, projects boundary ticks
     */
    function _updateIndividualTickReserves(
        uint256[TOKENS_COUNT] memory newTotalReserves
    ) internal {
        uint256 totalInteriorRadius = 0;
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            if (ticks[k].r > 0 && ticks[k].status == TickStatus.Interior) {
                totalInteriorRadius += ticks[k].r;
            }
        }
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            if (tick.r == 0) continue;
            if (tick.status == TickStatus.Interior && totalInteriorRadius > 0) {
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    tick.reserves[j] =
                        (newTotalReserves[j] * tick.r) /
                        totalInteriorRadius;
                }
            } else if (tick.status == TickStatus.Boundary) {
                _projectTickToBoundary(k, newTotalReserves);
            }
        }
    }

    /**
     * @notice Projects a boundary tick to its boundary constraint
     * @param k Tick identifier
     * @dev Adjusts tick reserves to maintain boundary constraint
     */
    function _projectTickToBoundary(
        uint256 k,
        uint256[TOKENS_COUNT] memory
    ) internal {
        Tick storage tick = ticks[k];
        uint256 currentProjection = _calculateAlpha(tick.reserves);
        if (currentProjection != tick.k) {
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                tick.reserves[i] =
                    (tick.reserves[i] * tick.k) /
                    currentProjection;
            }
        }
    }

    /**
     * @notice Distributes swap fees among all active ticks
     * @param feeAmount Total fee amount to distribute
     * @dev Distributes fees proportionally based on tick liquidity
     */
    function _distributeFees(uint256 feeAmount, uint256) internal {
        uint256 totalLiquidity = 0;
        for (uint256 i = 0; i < activeTicks.length; i++) {
            totalLiquidity += ticks[activeTicks[i]].liquidity;
        }
        if (totalLiquidity == 0) return;
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            if (tick.liquidity == 0) continue;
            uint256 tickFee = (feeAmount * tick.liquidity) / totalLiquidity;
            tick.accruedFees += tickFee;
        }
    }
}
