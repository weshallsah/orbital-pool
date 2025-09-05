// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/IntegratedOrbital.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockOrbitalMathHelper.sol";

contract DebugKValidationTest is Test {
    uint256 private constant SQRT5_SCALED = 2236067977499790; // sqrt(5) * 1e15 for precision
    uint256 private constant PRECISION = 1e15;
    
    function testKValidationBounds() public {
        uint256 radius = 223606797749978969640; // From our test
        
        // Calculate bounds from _isValidK function
        uint256 sqrt5MinusOne = SQRT5_SCALED - PRECISION; // 1236067977499790
        uint256 lowerBound = (sqrt5MinusOne * radius) / PRECISION;
        uint256 upperBound = (4 * radius * PRECISION) / SQRT5_SCALED;
        uint256 reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
        
        console.log("Radius:", radius);
        console.log("sqrt5MinusOne:", sqrt5MinusOne);
        console.log("Lower bound:", lowerBound);
        console.log("Upper bound:", upperBound);
        console.log("Reserve constraint:", reserveConstraint);
        console.log("Our calculated k:", reserveConstraint + 1000);
        
        // Test the validation logic manually
        uint256 k = reserveConstraint + 1000;
        bool isValid = _isValidK(k, radius);
        console.log("Is our k valid?", isValid);
        
        // Test exact boundary
        k = reserveConstraint;
        isValid = _isValidK(k, radius);
        console.log("Is boundary k valid?", isValid);
        
        // Test slightly above upper bound
        k = upperBound + 1;
        isValid = _isValidK(k, radius);
        console.log("Is k above upper bound valid?", isValid);
        
        // Test slightly below lower bound
        k = lowerBound - 1;
        isValid = _isValidK(k, radius);
        console.log("Is k below lower bound valid?", isValid);
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
}
