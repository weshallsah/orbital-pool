// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
        uint256 interior_consolidated_radius,
        uint256 boundary_consolidated_radius,
        uint256 boundary_total_k_bound,
        uint256 token_in_index,
        uint256 token_out_index,
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
}

contract OrbitalPool {
    uint256 public constant TOKENS_COUNT = 5;
    IERC20[TOKENS_COUNT] public tokens;
    IOrbitalMathHelper public immutable mathHelper;
    uint256 SCALE = 1e18;
    uint256 sqrt5 = 2236067977499789696;

    enum TickStatus {
        Interior,
        Boundary
    }

    struct Tick {
        TickStatus status;
        uint128 r;
        uint128 k;
        uint256[TOKENS_COUNT] reserves;
    }

    mapping(uint128 => Tick) public ticks;

    mapping(address => mapping(uint128 => uint256[TOKENS_COUNT]))
        public lpContributions;

    event LiquidityAdded(
        uint128 r,
        uint128 k,
        address indexed provider,
        uint256[TOKENS_COUNT] amounts
    );

    event LiquidityRemoved(
        uint128 r,
        uint128 k,
        address indexed provider,
        uint256[TOKENS_COUNT] amounts
    );

    error InvalidRadius();
    error InvalidK();
    error UnsatisfiedInvariant();

    constructor(
        IERC20[TOKENS_COUNT] memory _tokens,
        address _mathHelperAddress
    ) {
        tokens = _tokens;
        mathHelper = IOrbitalMathHelper(_mathHelperAddress);
    }

    function setTick(
        uint128 r,
        uint128 k,
        uint256[TOKENS_COUNT] calldata reserves,
        TickStatus status
    ) external {
        Tick storage t = ticks[k];
        t.status = status;
        t.r = r;
        t.k = k;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            t.reserves[i] = reserves[i];
        }
    }

    function getTick(uint128 k) external view returns (Tick memory) {
        return ticks[k];
    }

    function getLpContribution(
        address lp,
        uint128 k
    ) external view returns (uint256[TOKENS_COUNT] memory) {
        return lpContributions[lp][k];
    }

    function hasLiquidityInTick(
        address lp,
        uint128 k
    ) external view returns (bool) {
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (lpContributions[lp][k][i] > 0) {
                return true;
            }
        }
        return false;
    }

    function addLiquidity(
        uint128 k,
        uint128 r,
        uint256[TOKENS_COUNT] calldata amounts
    ) external {
        _checkValidK(k, r);
        TickStatus status;
        status = _checkTickInvariants(r, k, amounts);
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            require(
                tokens[i].transferFrom(msg.sender, address(this), amounts[i]),
                "Transfer failed"
            );
        }
        Tick storage tick = ticks[k];
        if (tick.r == 0) {
            tick.status = status;
            tick.r = r;
            tick.k = k;
            for (uint256 i = 0; i < TOKENS_COUNT; i++) {
                tick.reserves[i] = amounts[i];
            }
        }

        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            lpContributions[msg.sender][k][i] += amounts[i];
        }

        emit LiquidityAdded(r, k, msg.sender, amounts);
    }

    function removeLiquidity(uint128 k) external {
        Tick storage tick = ticks[k];
        if (tick.r == 0) {
            revert InvalidRadius();
        }
        _checkValidK(k, tick.r);

        uint256[TOKENS_COUNT] memory lpAmounts = lpContributions[msg.sender][k];

        bool hasContribution = false;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            if (lpAmounts[i] > 0) {
                hasContribution = true;
                break;
            }
        }
        require(hasContribution, "No liquidity contribution found");

        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            require(lpAmounts[i] <= tick.reserves[i], "Insufficient reserves");
        }

        uint256[TOKENS_COUNT] memory newReserves;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            newReserves[i] = tick.reserves[i] - lpAmounts[i];
        }

        // uint256 newRadius = mathHelper.calculateRadius(newReserves);

        // tick.r = uint128(newRadius);
        // for (uint256 i = 0; i < TOKENS_COUNT; i++) {
        //     tick.reserves[i] = newReserves[i];
        // }

        // for (uint256 i = 0; i < TOKENS_COUNT; i++) {
        //     lpContributions[msg.sender][k][i] = 0;
        // }

        // for (uint256 i = 0; i < TOKENS_COUNT; i++) {
        //     if (lpAmounts[i] > 0) {
        //         require(
        //             tokens[i].transfer(msg.sender, lpAmounts[i]),
        //             "Transfer failed"
        //         );
        //     }
        // }

        // emit LiquidityRemoved(uint128(newRadius), k, msg.sender, lpAmounts);
    }

    function _checkValidK(uint128 k, uint128 r) internal view {
        if (r == 0) {
            revert InvalidRadius();
        }
        uint256 kMin = (r * (sqrt5 - SCALE)) / SCALE;
        uint256 kMax = (r * 4 * SCALE) / sqrt5;
        if (k < kMin || k > kMax) {
            revert InvalidK();
        }
    }

    function _checkTickInvariants(
        uint128 r,
        uint128 k,
        uint256[TOKENS_COUNT] calldata amounts
    ) internal view returns (TickStatus) {
        uint256 sumOfDifferenceOfReserves = 0;
        uint256 sum = 0;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += amounts[i];
            uint256 difference = r - amounts[i];
            sumOfDifferenceOfReserves += difference * difference;
        }
        if (sumOfDifferenceOfReserves != r * r) {
            revert UnsatisfiedInvariant();
        }
        uint256 lhs = (sum * SCALE) / sqrt5;
        return
            (lhs >= k - 1 && lhs <= k + 1)
                ? TickStatus.Boundary
                : TickStatus.Interior;
    }
}
