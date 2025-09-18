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
        uint256[] memory total_reserves,
        uint256 token_in_index,
        uint256 token_out_index,
        uint256 amount_in_after_fee
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
        uint256 r,
        uint256 k
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
        uint256 r; 
        uint256 k; 
        uint256[TOKENS_COUNT] reserves; 
    }
    mapping(uint256 => mapping(uint256 => Tick)) public ticks;
    function setTick(
        uint256 r,
        uint256 k,
        TickStatus status,
        uint256[TOKENS_COUNT] calldata reserves
    ) external {
        Tick storage t = ticks[r][k];
        t.status = status;
        t.r = r;
        t.k = k;
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            t.reserves[i] = reserves[i];
        }
    }
    function getTick(uint256 r, uint256 k) external view returns (Tick memory) {
        return ticks[r][k];
    }
    event LiquidityAdded(
        address indexed provider,
        uint256 k,
        uint256[TOKENS_COUNT] amounts,
        uint256 r
    );
    constructor(
        IERC20[TOKENS_COUNT] memory _tokens,
        address _mathHelperAddress
    ) {
        tokens = _tokens;
        mathHelper = IOrbitalMathHelper(_mathHelperAddress);
    }
    function addLiquidity(
        uint256 k,
        uint256 r, 
        uint256[TOKENS_COUNT] memory amounts
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
        Tick storage tick = ticks[r][k];
        if (tick.r == 0) {
        tick.status = status;
        tick.r = r;
        tick.k = k;
        // initialize reserves
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            tick.reserves[i] = amounts[i];
        }}
        emit LiquidityAdded(msg.sender, k, amounts, r);
    }
    function _checkValidK(uint256 k, uint256 r) internal view {
        require(r>0, "Radius must be greater than 0");
        // k_min = r * (sqrt(5) - 1)
        uint256 kMin = (r * (sqrt5 - SCALE)) / SCALE;
        // k_max = r * (4 / sqrt(5))
        uint256 kMax = (r * 4 * SCALE) / sqrt5;
        require(k >= kMin && k <= kMax, "Invalid k");

    }
    function _checkTickInvariants(
        uint256 r,
        uint256 k, 
        uint256[TOKENS_COUNT] memory amounts
    ) internal view returns (TickStatus) {
        uint256 sumOfDifferenceOfReserves = 0;
        uint256 sum = 0; 
        for (uint256 i = 0; i < TOKENS_COUNT; i++) {
            sum += amounts[i];
            uint256 difference = r - amounts[i];
            sumOfDifferenceOfReserves += difference * difference;
        }
        if (sumOfDifferenceOfReserves != r * r) {
            revert("Invariants not satisfied");
        }
        uint256 lhs = (sum * SCALE) / sqrt5;
        return (lhs >= k - 1 && lhs <= k + 1) ? TickStatus.Boundary : TickStatus.Interior;
    }
}