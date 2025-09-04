// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Library to hold the struct for calling the math helper
library Helper {
    struct ConsolidatedData {
        uint256 sum_interior_reserves;
        uint256 interior_consolidated_radius;
        uint256 boundary_consolidated_radius;
        uint256 boundary_total_k_bound;
    }
}

// Interface to interact with the deployed Stylus Math Helper contract
interface IOrbitalMathHelper {
    function solveTorusInvariant(
        Helper.ConsolidatedData calldata consolidated_data,
        uint256[] calldata total_reserves,
        uint256 token_in_index,
        uint256 token_out_index,
        uint256 amount_in_after_fee
    ) external view returns (uint256);

    function calculateRadius(
        uint256[] calldata reserves
    ) external view returns (uint256);

    function calculateBoundaryTickS(
        uint256 r,
        uint256 k
    ) external view returns (uint256);
}

contract orbitalPool {
    using SafeERC20 for IERC20;

    uint256 public constant TOKENS_COUNT = 5; // 5 tokens pegged to USD
    uint256 private constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15 for precision
    uint256 private constant PRECISION = 1e15;

    // Token addresses for the 5 USD-pegged tokens
    IERC20[TOKENS_COUNT] public tokens;

    // Address of the deployed Stylus math helper contract
    IOrbitalMathHelper public mathHelper;

    enum TickStatus {
        Interior,
        Boundary
    }

    struct Tick {
        uint256 r; // radius of tick
        uint256 k; // plane constant for the tick
        uint256 liquidity; // total liquidity in the tick
        uint256[TOKENS_COUNT] reserves; // reserves of each token in the tick (x vector)
        uint256 totalLpShares; // total LP shares issued for this tick
        mapping(address => uint256) lpShares; // mapping of LP address to their shares
        TickStatus status; // status of the tick (Interior or Boundary)
        uint256 accruedFees; // total fees accrued to this tick
    }

    struct ConsolidatedTickData {
        uint256[TOKENS_COUNT] totalReserves; // Sum of reserves across consolidated ticks
        uint256[TOKENS_COUNT] sumSquaredReserves; // Sum of squared reserves
        uint256 totalLiquidity; // Combined liquidity
        uint256 tickCount; // Number of ticks in this consolidation
        uint256 consolidatedRadius; // Combined radius for the consolidated tick
        uint256 totalKBound; // Sum of k values for boundary ticks
    }

    // Fee configuration
    uint256 public swapFee = 3000; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 1000000;
    mapping(uint256 => Tick) public ticks; // k -> Tick

    // Track active ticks for iteration
    uint256[] public activeTicks;
    mapping(uint256 => bool) public isActiveTick;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 k,
        uint256[TOKENS_COUNT] amounts,
        uint256 lpShares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 k,
        uint256[TOKENS_COUNT] amounts,
        uint256 lpShares
    );
    event Swap(
        address indexed trader,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event TickStatusChanged(
        uint256 k,
        TickStatus oldStatus,
        TickStatus newStatus
    );

    // Errors
    error InvalidKValue();
    error InvalidAmounts();
    error TickAlreadyExists();
    error InsufficientLiquidity();
    error InvalidTokenIndex();
    error SlippageExceeded();

    constructor(
        IERC20[TOKENS_COUNT] memory _tokens,
        address _mathHelperAddress
    ) {
        tokens = _tokens;
        mathHelper = IOrbitalMathHelper(_mathHelperAddress);
    }

    function addLiquidity(
        uint256 k,
        uint256[TOKENS_COUNT] memory amounts
    ) external {
        if (k == 0) revert InvalidKValue();
        if (!_validateAmounts(amounts)) revert InvalidAmounts();

        bool tickExists = ticks[k].r > 0;
        uint256 previousRadius = tickExists ? ticks[k].r : 0;
        uint256 previousTotalLpShares = tickExists ? ticks[k].totalLpShares : 0;

        uint256[TOKENS_COUNT] memory reservesForRadiusCalc;
        // !!
        if (!tickExists) {
            reservesForRadiusCalc = amounts;
        } else {
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                reservesForRadiusCalc[i] = ticks[k].reserves[i] + amounts[i];
            }
        }

        uint256[] memory reservesVec = new uint256[](TOKENS_COUNT);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            reservesVec[i] = reservesForRadiusCalc[i];
        }
        uint256 newRadius = mathHelper.calculateRadius(reservesVec);

        if (!_isValidK(k, newRadius)) revert InvalidKValue();
        uint256 reserveConstraint = (newRadius * PRECISION) / SQRT5_SCALED;
        TickStatus newStatus = (reserveConstraint == k)
            ? TickStatus.Boundary
            : TickStatus.Interior;

        if (!tickExists) {
            Tick storage newTick = ticks[k];
            newTick.r = newRadius;
            newTick.k = k;
            newTick.liquidity = newRadius * newRadius;
            newTick.reserves = amounts;
            newTick.status = newStatus;

            if (!isActiveTick[k]) {
                activeTicks.push(k);
                isActiveTick[k] = true;
            }
        } else {
            ticks[k].r = newRadius;
            ticks[k].reserves = reservesForRadiusCalc; // Use the combined reserves
            ticks[k].liquidity = newRadius * newRadius;
            ticks[k].status = newStatus;
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
            lpShares = ticks[k].r;
        } else {
            if (newRadius > previousRadius) {
                uint256 radiusIncrease = newRadius - previousRadius;
                lpShares =
                    (radiusIncrease * previousTotalLpShares) /
                    previousRadius;
            } else {
                lpShares = 1;
            }
        }

        ticks[k].lpShares[msg.sender] += lpShares;
        ticks[k].totalLpShares += lpShares;

        emit LiquidityAdded(msg.sender, k, amounts, lpShares);
    }

    function removeLiquidity(uint256 k, uint256 lpSharesToRemove) external {
        if (k == 0) revert InvalidKValue();
        if (lpSharesToRemove == 0) revert InvalidAmounts();

        Tick storage tick = ticks[k];
        if (tick.r == 0) revert InvalidKValue();

        uint256 userLpShares = tick.lpShares[msg.sender];
        if (userLpShares < lpSharesToRemove) revert InsufficientLiquidity();

        uint256 removalProportion = (lpSharesToRemove * PRECISION) /
            tick.totalLpShares;

        uint256[TOKENS_COUNT] memory amountsToReturn;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            amountsToReturn[i] =
                (tick.reserves[i] * removalProportion) /
                PRECISION;
        }

        uint256[TOKENS_COUNT] memory newReserves;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            newReserves[i] = tick.reserves[i] - amountsToReturn[i];
        }

        uint256[] memory reservesVec = new uint256[](TOKENS_COUNT);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            reservesVec[i] = newReserves[i];
        }
        uint256 newRadius = mathHelper.calculateRadius(reservesVec);

        tick.r = newRadius;
        tick.reserves = newReserves;
        tick.liquidity = newRadius * newRadius;
        tick.lpShares[msg.sender] -= lpSharesToRemove;
        tick.totalLpShares -= lpSharesToRemove;

        uint256 reserveConstraint = (newRadius * PRECISION) / SQRT5_SCALED;
        tick.status = (reserveConstraint == k)
            ? TickStatus.Boundary
            : TickStatus.Interior;

        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amountsToReturn[i] > 0) {
                tokens[i].safeTransfer(msg.sender, amountsToReturn[i]);
            } else {
                revert InvalidAmounts();
            }
        }

        emit LiquidityRemoved(msg.sender, k, amountsToReturn, lpSharesToRemove);
    }

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

        // MODIFIED: Offload swap calculation to the Stylus contract
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

    function _getConsolidatedTickData()
        internal
        view
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
                // MODIFIED: Offload s calculation to Stylus contract
                uint256 s = mathHelper.calculateBoundaryTickS(tick.r, tick.k);
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

    // MODIFIED: This function now calls the Stylus helper instead of doing the calculation itself
    function _calculateSwapOutput(
        uint256[TOKENS_COUNT] memory reserves,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Step 1: Get consolidated data
        (
            ConsolidatedTickData memory interiorData,
            ConsolidatedTickData memory boundaryData
        ) = _getConsolidatedTickData();

        uint256 sumInteriorReserves = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sumInteriorReserves += interiorData.totalReserves[i];
        }

        // Step 2: Populate the struct to pass to the helper contract
        Helper.ConsolidatedData memory dataForHelper = Helper.ConsolidatedData({
            sum_interior_reserves: sumInteriorReserves,
            interior_consolidated_radius: interiorData.consolidatedRadius,
            boundary_consolidated_radius: boundaryData.consolidatedRadius,
            boundary_total_k_bound: boundaryData.totalKBound
        });

        // Step 3: Convert fixed-size array to dynamic array for the call
        uint256[] memory reservesVec = new uint256[](TOKENS_COUNT);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            reservesVec[i] = reserves[i];
        }

        // Step 4: Call the Stylus contract to perform the heavy computation
        return
            mathHelper.solveTorusInvariant(
                dataForHelper,
                reservesVec,
                tokenIn,
                tokenOut,
                amountIn
            );
    }

    // REMOVED: _computeTorusInvariant is no longer needed in Solidity.
    // REMOVED: _calculateBoundaryTickS is no longer needed in Solidity.
    // REMOVED: _calculateRadiusSquared is no longer needed in Solidity.
    // REMOVED: _sqrt is no longer needed in Solidity, unless used elsewhere.

    // ... The rest of your functions (_isValidK, _calculateAlpha, etc.) remain unchanged ...
    // Note: If any of them use _sqrt, you'll need to keep it or replace its usage.
    // For now, I'm assuming they don't, to show a clean separation.
    // If you need _sqrt for other functions, simply uncomment it.

    /**
     * @dev Calculate square root using Babylonian method (kept in case it's needed by other funcs)
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

    // --- ALL OTHER HELPER FUNCTIONS LIKE _isValidK, _updateTickReservesWithCrossings, etc. stay the same ---
    // (Functions omitted for brevity, they do not need changes for this integration)
    function _getTotalReserves()
        public
        view
        returns (uint256[TOKENS_COUNT] memory totalReserves)
    {
        for (uint256 i = 0; i < activeTicks.length; i++) {
            uint256 k = activeTicks[i];
            Tick storage tick = ticks[k];
            if (tick.r > 0) {
                for (uint256 j = 0; j < TOKENS_COUNT; j++) {
                    totalReserves[j] += tick.reserves[j];
                }
            }
        }
    }

    function _validateAmounts(
        uint256[TOKENS_COUNT] memory amounts
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (amounts[i] == 0) {
                return false;
            }
        }
        return true;
    }

    function _isValidK(uint256 k, uint256 radius) internal pure returns (bool) {
        if (radius == 0) return false;
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        if (k < lowerBound || k > upperBound) return false;
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        return k >= reserveConstraint;
    }

    function _calculateAlpha(
        uint256[TOKENS_COUNT] memory reserves
    ) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += reserves[i];
        }
        return sum / TOKENS_COUNT;
    }

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
