// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../../src/IntegratedOrbital.sol";

contract MockOrbitalMathHelper is IOrbitalMathHelper {
    uint256 private _mockRadius;
    uint256 private _mockSwapOutput;
    uint256 private _mockBoundaryTickS;
    
    uint256 private constant PRECISION = 1e15;
    uint256 private constant SQRT5_SCALED = 2236067977499790;
    
    function setRadius(uint256 radius) external {
        _mockRadius = radius;
    }
    
    function setSwapOutput(uint256 output) external {
        _mockSwapOutput = output;
    }
    
    function setBoundaryTickS(uint256 s) external {
        _mockBoundaryTickS = s;
    }
    
    function solveTorusInvariant(
        Helper.ConsolidatedData calldata,
        uint256[] calldata,
        uint256,
        uint256,
        uint256
    ) external view override returns (uint256) {
        return _mockSwapOutput;
    }
    
    function calculateRadius(
        uint256[] calldata reserves
    ) external view override returns (uint256) {
        if (_mockRadius > 0) {
            return _mockRadius;
        }
        
        // Fallback to actual calculation for testing
        uint256 sumSquares = 0;
        for (uint256 i = 0; i < reserves.length; i++) {
            sumSquares += (reserves[i] * reserves[i]) / PRECISION;
        }
        return _sqrt(sumSquares * PRECISION);
    }
    
    function calculateBoundaryTickS(
        uint256 r,
        uint256 k
    ) external view override returns (uint256) {
        if (_mockBoundaryTickS > 0) {
            return _mockBoundaryTickS;
        }
        
        // Fallback to actual calculation
        uint256 rOverSqrt5 = (r * PRECISION) / SQRT5_SCALED;
        uint256 diff = (k > rOverSqrt5) ? k - rOverSqrt5 : rOverSqrt5 - k;
        uint256 diffSquared = (diff * diff) / PRECISION;
        uint256 rSquared = (r * r) / PRECISION;
        
        if (rSquared <= diffSquared) return 0;
        return _sqrt((rSquared - diffSquared) * PRECISION);
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
