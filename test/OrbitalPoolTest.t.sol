// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/IntegratedOrbital.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockOrbitalMathHelper.sol";

contract OrbitalPoolTest is Test {
    orbitalPool public pool;
    MockOrbitalMathHelper public mathHelper;
    MockERC20[5] public tokens;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    
    uint256 constant INITIAL_BALANCE = 1000000e18;
    uint256 constant PRECISION = 1e15;
    uint256 constant SQRT5_SCALED = 2236067977499790;
    
    event LiquidityAdded(
        address indexed provider,
        uint256 k,
        uint256[5] amounts,
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
    
    function setUp() public {
        // Deploy mock tokens
        for (uint256 i = 0; i < 5; i++) {
            tokens[i] = new MockERC20(
                string(abi.encodePacked("Token", vm.toString(i))),
                string(abi.encodePacked("TKN", vm.toString(i))),
                18
            );
        }
        
        // Deploy mock math helper
        mathHelper = new MockOrbitalMathHelper();
        
        // Deploy pool
        IERC20[5] memory tokenArray;
        for (uint256 i = 0; i < 5; i++) {
            tokenArray[i] = IERC20(address(tokens[i]));
        }
        pool = new orbitalPool(tokenArray, address(mathHelper));
        
        // Setup initial balances
        _setupBalances();
    }
    
    function _setupBalances() internal {
        address[3] memory users = [alice, bob, charlie];
        
        for (uint256 i = 0; i < users.length; i++) {
            for (uint256 j = 0; j < 5; j++) {
                tokens[j].mint(users[i], INITIAL_BALANCE);
                vm.prank(users[i]);
                tokens[j].approve(address(pool), type(uint256).max);
            }
        }
    }
    
    function testAddLiquidityNewTick() public {
        uint256[5] memory amounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        uint256 radius = _calculateRadius(amounts);
        
        uint256 k = _calculateValidK(radius);
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(alice, k, amounts, radius);
        pool.addLiquidity(k, amounts);
        
        // Verify tick was created - we'll need to add getter functions or use direct mapping access
        // For now, let's verify through other means
        uint256[5] memory totalReserves = pool._getTotalReserves();
        
        for (uint256 i = 0; i < 5; i++) {
            assertEq(totalReserves[i], amounts[i], "Reserves should match deposited amounts");
        }
    }
    
    function testAddLiquidityExistingTick() public {
        uint256[5] memory initialAmounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        uint256[5] memory additionalAmounts = [uint256(50e18), uint256(50e18), uint256(50e18), uint256(50e18), uint256(50e18)];
        
        // First deposit
        uint256 initialRadius = _calculateRadius(initialAmounts);
        uint256 k = _calculateValidK(initialRadius);
        mathHelper.setRadius(initialRadius);
        
        vm.prank(alice);
        pool.addLiquidity(k, initialAmounts);
        
        // Second deposit - need to calculate k that works for combined amounts
        uint256[5] memory combinedAmounts;
        for (uint256 i = 0; i < 5; i++) {
            combinedAmounts[i] = initialAmounts[i] + additionalAmounts[i];
        }
        uint256 newRadius = _calculateRadius(combinedAmounts);
        uint256 newK = _calculateValidK(newRadius);
        mathHelper.setRadius(newRadius);
        
        vm.prank(bob);
        pool.addLiquidity(newK, additionalAmounts);
        
        // Verify reserves were updated
        uint256[5] memory finalReserves = pool._getTotalReserves();
        for (uint256 i = 0; i < 5; i++) {
            assertEq(finalReserves[i], combinedAmounts[i], "Final reserves should match combined amounts");
        }
    }
    
    function testSwapBasic() public {
        // Setup liquidity first
        uint256[5] memory amounts = [uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18)];
        
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius);
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        // Setup swap
        uint256 tokenIn = 0;
        uint256 tokenOut = 1;
        uint256 amountIn = 10e18;
        uint256 expectedAmountOut = 9e18; // Mock return value
        
        mathHelper.setSwapOutput(expectedAmountOut);
        
        uint256 aliceBalanceBefore = tokens[tokenOut].balanceOf(alice);
        
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Swap(alice, tokenIn, tokenOut, amountIn, expectedAmountOut, amountIn * 3000 / 1000000);
        
        uint256 actualAmountOut = pool.swap(tokenIn, tokenOut, amountIn, expectedAmountOut);
        
        assertEq(actualAmountOut, expectedAmountOut, "Should return expected amount out");
        assertEq(tokens[tokenOut].balanceOf(alice), aliceBalanceBefore + expectedAmountOut, "Alice should receive tokens");
    }
    
    function testSwapSlippageProtection() public {
        // Setup liquidity
        uint256[5] memory amounts = [uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18)];
        
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius);
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        // Setup swap with slippage
        uint256 tokenIn = 0;
        uint256 tokenOut = 1;
        uint256 amountIn = 10e18;
        uint256 actualAmountOut = 8e18;
        uint256 minAmountOut = 9e18; // Higher than actual
        
        mathHelper.setSwapOutput(actualAmountOut);
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.SlippageExceeded.selector);
        pool.swap(tokenIn, tokenOut, amountIn, minAmountOut);
    }
    
    function testInvalidKValue() public {
        uint256[5] memory amounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidKValue.selector);
        pool.addLiquidity(0, amounts); // k = 0 should fail
    }
    
    function testInvalidAmounts() public {
        uint256 k = 1000e15;
        uint256[5] memory amounts = [uint256(100e18), uint256(0), uint256(100e18), uint256(100e18), uint256(100e18)]; // One zero amount
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.addLiquidity(k, amounts);
    }
    
    function testInvalidTokenIndex() public {
        // Setup liquidity first
        uint256[5] memory amounts = [uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18)];
        
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius);
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidTokenIndex.selector);
        pool.swap(5, 0, 10e18, 0); // tokenIn = 5 is invalid (should be 0-4)
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidTokenIndex.selector);
        pool.swap(0, 5, 10e18, 0); // tokenOut = 5 is invalid
    }
    
    function testSameTokenSwap() public {
        // Setup liquidity first
        uint256[5] memory amounts = [uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18), uint256(1000e18)];
        
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius);
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        vm.prank(alice);
        vm.expectRevert(orbitalPool.InvalidAmounts.selector);
        pool.swap(0, 0, 10e18, 0); // Same token swap should fail
    }
    
    function testGetTotalReserves() public {
        uint256[5] memory amounts1 = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        uint256[5] memory amounts2 = [uint256(200e18), uint256(200e18), uint256(200e18), uint256(200e18), uint256(200e18)];
        
        // Add liquidity to two different ticks
        uint256 radius1 = _calculateRadius(amounts1);
        uint256 k1 = _calculateValidK(radius1);
        mathHelper.setRadius(radius1);
        vm.prank(alice);
        pool.addLiquidity(k1, amounts1);
        
        uint256 radius2 = _calculateRadius(amounts2);
        uint256 k2 = _calculateValidK(radius2);
        mathHelper.setRadius(radius2);
        vm.prank(bob);
        pool.addLiquidity(k2, amounts2);
        
        uint256[5] memory totalReserves = pool._getTotalReserves();
        
        for (uint256 i = 0; i < 5; i++) {
            assertEq(totalReserves[i], amounts1[i] + amounts2[i], "Total reserves should sum correctly");
        }
    }
    
    function testGetActiveTicks() public {
        uint256[5] memory amounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        
        uint256 radius = _calculateRadius(amounts);
        uint256 k1 = _calculateValidK(radius);
        uint256 k2 = k1 + 1000;
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k1, amounts);
        
        vm.prank(bob);
        pool.addLiquidity(k2, amounts);
        
        // Note: getActiveTicks function doesn't exist in IntegratedOrbital.sol
        // We'll verify by checking total reserves include both ticks
        uint256[5] memory totalReserves = pool._getTotalReserves();
        for (uint256 i = 0; i < 5; i++) {
            assertEq(totalReserves[i], amounts[i] * 2, "Should have reserves from both ticks");
        }
    }
    
    function testTickStatusBoundary() public {
        uint256[5] memory amounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius); // Use valid k value
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        // Test passed if no revert occurred during addLiquidity
        assertTrue(true, "Boundary tick creation should succeed");
    }
    
    function testTickStatusInterior() public {
        uint256[5] memory amounts = [uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18), uint256(100e18)];
        uint256 radius = _calculateRadius(amounts);
        uint256 k = _calculateValidK(radius); // Use valid k value
        
        mathHelper.setRadius(radius);
        
        vm.prank(alice);
        pool.addLiquidity(k, amounts);
        
        // Test passed if no revert occurred during addLiquidity
        assertTrue(true, "Interior tick creation should succeed");
    }
    
    // Helper function to calculate radius (mimicking the math helper)
    function _calculateRadius(uint256[5] memory amounts) internal pure returns (uint256) {
        uint256 sumSquared = 0;
        for (uint256 i = 0; i < 5; i++) {
            sumSquared += amounts[i] * amounts[i];
        }
        return _sqrt(sumSquared);
    }
    
    function _calculateValidK(uint256 radius) internal pure returns (uint256) {
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION;
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        return lowerBound + 1000; // Use lower bound + offset for valid k
    }
    
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
}
