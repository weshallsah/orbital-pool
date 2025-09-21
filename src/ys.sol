// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OrbitalHelper
 * @dev Smart contract implementing orbital mechanics for AMM operations
 * All calculations use Q96X48 fixed-point format (96 bits integer, 48 bits fractional)
 */
contract OrbitalHelper {
    
    // Constants for fixed-point arithmetic
    uint256 private constant Q48_SHIFT = 48;
    uint256 private constant MAX_U144 = (1 << 144) - 1;
    
    // Custom errors
    error DivisionByZero();
    error Overflow();
    error InvalidInput();
    
    /**
     * @dev Convert a value to Q96X48 fixed-point format
     * @param value The value to convert
     * @return The value in Q96X48 format
     */
    function convertToQ96X48(uint144 value) public pure returns (uint144) {
        return value << Q48_SHIFT;
    }
    
    /**
     * @dev Convert a value from Q96X48 fixed-point format
     * @param value The value in Q96X48 format
     * @return The converted value
     */
    function convertFromQ96X48(uint144 value) public pure returns (uint144) {
        return value >> Q48_SHIFT;
    }
    
    /**
     * @dev Add two Q96X48 fixed-point numbers
     */
    function addQ96X48(uint144 a, uint144 b) public pure returns (uint144) {
        return a + b;
    }
    
    /**
     * @dev Subtract two Q96X48 fixed-point numbers
     */
    function subQ96X48(uint144 a, uint144 b) public pure returns (uint144) {
        require(a >= b, "Underflow in Q96X48 subtraction");
        return a - b;
    }
    
    /**
     * @dev Multiply two Q96X48 fixed-point numbers
     */
    function mulQ96X48(uint144 a, uint144 b) public pure returns (uint144) {
        uint256 product = uint256(a) * uint256(b);
        uint256 shifted = product >> Q48_SHIFT;
        
        if (shifted > MAX_U144) {
            revert Overflow();
        }
        
        return uint144(shifted);
    }
    
    /**
     * @dev Divide two Q96X48 fixed-point numbers
     */
    function divQ96X48(uint144 a, uint144 b) public pure returns (uint144) {
        if (b == 0) {
            revert DivisionByZero();
        }
        
        uint256 dividend = (uint256(a) << Q48_SHIFT);
        uint256 result = dividend / uint256(b);
        
        if (result > MAX_U144) {
            revert Overflow();
        }
        
        return uint144(result);
    }
    
    /**
     * @dev Square root function for Q96X48 format using Newton's method
     */
    function sqrtQ96X48(uint144 y) public pure returns (uint144) {
        if (y == 0) {
            return 0;
        }
        
        // Convert y to uint256 and shift by 48 to account for fixed-point precision
        uint256 z = (uint256(y) << Q48_SHIFT);
        uint256 x = z / 2 + 1;
        
        // Babylonian method loop
        while (x < z) {
            z = x;
            x = (z + ((uint256(y) << Q48_SHIFT) / z)) / 2;
        }
        
        if (z > MAX_U144) {
            revert Overflow();
        }
        
        return uint144(z);
    }
    
    /**
     * @dev Calculate radius from reserves
     * @param reserve The reserve amount in Q96X48 format
     * @return The calculated radius
     */
    function calculateRadius(uint144 reserve) public pure returns (uint144) {
        // √5 in Q96X48 format (approximation)
        uint144 root5 = 629397181890196;
        uint144 one = convertToQ96X48(1);
        uint144 denominator = subQ96X48(one, divQ96X48(one, root5));
        return divQ96X48(reserve, denominator);
    }
    
    /**
     * @dev Calculate k from p and r using the formula: k = r√n - r(p+n-1)/√(n(p²+n-1))
     * @param depegLimit The depeg limit (p) in Q96X48 format
     * @param radius The radius (r) in Q96X48 format
     * @return The calculated k value
     */
    function calculateK(uint144 depegLimit, uint144 radius) public pure returns (uint144) {
        // Assuming n = 5 based on the context (golden ratio calculations)
        uint144 n = convertToQ96X48(5);
        uint144 one = convertToQ96X48(1);
        
        // Calculate √n
        uint144 sqrtN = sqrtQ96X48(n);
        
        // Calculate first term: r√n
        uint144 firstTerm = mulQ96X48(radius, sqrtN);
        
        // Calculate p² (depegLimit is already in Q96X48 format)
        uint144 pSquared = mulQ96X48(depegLimit, depegLimit);
        
        // Calculate p + n - 1
        uint144 pPlusNMinus1 = subQ96X48(addQ96X48(depegLimit, n), one);
        
        // Calculate p² + n - 1
        uint144 pSquaredPlusNMinus1 = subQ96X48(addQ96X48(pSquared, n), one);
        
        // Calculate n(p² + n - 1)
        uint144 nTimesExpr = mulQ96X48(n, pSquaredPlusNMinus1);
        
        // Calculate √(n(p² + n - 1))
        uint144 sqrtDenominator = sqrtQ96X48(nTimesExpr);
        
        // Calculate r(p + n - 1)
        uint144 numeratorSecondTerm = mulQ96X48(radius, pPlusNMinus1);
        
        // Calculate second term: r(p + n - 1) / √(n(p² + n - 1))
        uint144 secondTerm = divQ96X48(numeratorSecondTerm, sqrtDenominator);
        
        // Calculate final result: r√n - r(p + n - 1) / √(n(p² + n - 1))
        return subQ96X48(firstTerm, secondTerm);
    }
    
    /**
     * @dev Return k and r together
     * @param depegLimit The depeg limit in Q96X48 format
     * @param reserve The reserve amount in Q96X48 format
     * @return k The calculated k value
     * @return r The calculated radius
     */
    function getTickParameters(uint144 depegLimit, uint144 reserve) 
        public 
        pure 
        returns (uint144 k, uint144 r) 
    {
        r = calculateRadius(reserve);
        k = calculateK(depegLimit, r);
        return (k, r);
    }
    
    /**
     * @dev Calculate boundary tick S
     * @param radius The radius value
     * @param k The k value
     * @return The boundary tick S value
     */
    function calculateBoundaryTickS(uint144 radius, uint144 k) public pure returns (uint144) {
        // s = sqrt(r² - (k - r√n)²)
        uint144 sqrtN = sqrtQ96X48(convertToQ96X48(5));
        uint144 rSqrtN = mulQ96X48(radius, sqrtN);
        uint144 difference = subQ96X48(k, rSqrtN);
        uint144 radiusSquared = mulQ96X48(radius, radius);
        uint144 differenceSquared = mulQ96X48(difference, difference);
        return sqrtQ96X48(subQ96X48(radiusSquared, differenceSquared));
    }
    
    /**
     * @dev Solves the quadratic invariant equation to find the amount needed to cross a tick boundary
     */
    function solveQuadraticInvariant(
        uint144 deltaLinear,
        uint144[] memory reserves,
        uint144 tokenInIndex,
        uint144 tokenOutIndex,
        uint144 consolidatedRadius,
        uint144 kCross
    ) public pure returns (uint144) {
        uint144 r = consolidatedRadius;
        uint256 tokenInIdx = uint256(tokenInIndex);
        uint256 tokenOutIdx = uint256(tokenOutIndex);
        
        // Calculate P = k_cross * r - Σx_i
        uint144 sumReserves = 0;
        for (uint256 i = 0; i < reserves.length; i++) {
            sumReserves = addQ96X48(sumReserves, reserves[i]);
        }
        uint144 kCrossTimesR = mulQ96X48(kCross, r);
        uint144 p = subQ96X48(kCrossTimesR, sumReserves);
        
        // Get x_in and x_out
        uint144 xIn = reserves[tokenInIdx];
        uint144 xOut = reserves[tokenOutIdx];
        
        // Calculate C = r² - Σ(r - x_i)² for i ≠ in, out
        uint144 rSquared = mulQ96X48(r, r);
        uint144 sumSquaredDifferences = 0;
        
        for (uint256 i = 0; i < reserves.length; i++) {
            if (i != tokenInIdx && i != tokenOutIdx) {
                uint144 diff = subQ96X48(r, reserves[i]);
                uint144 diffSquared = mulQ96X48(diff, diff);
                sumSquaredDifferences = addQ96X48(sumSquaredDifferences, diffSquared);
            }
        }
        
        uint144 cTerm = subQ96X48(rSquared, sumSquaredDifferences);
        
        // Calculate coefficients for the quadratic equation ax² + bx + c = 0
        uint144 a = convertToQ96X48(1);
        
        // Calculate A = r - x_out - P
        uint144 rMinusXOut = subQ96X48(r, xOut);
        uint144 aTerm = subQ96X48(rMinusXOut, p);
        
        // Calculate B = x_in - r
        uint144 bTerm = subQ96X48(xIn, r);
        
        // Calculate b = x_in - x_out - P (handling potential underflows)
        uint144 b;
        bool bIsPositive = true;
        
        if (xIn >= xOut) {
            uint144 diff = subQ96X48(xIn, xOut);
            if (diff >= p) {
                b = subQ96X48(diff, p);
                bIsPositive = true;
            } else {
                b = subQ96X48(p, diff);
                bIsPositive = false;
            }
        } else {
            uint144 diff = subQ96X48(xOut, xIn);
            b = addQ96X48(diff, p);
            bIsPositive = false;
        }
        
        // c = (A² + B² - C) / 2
        uint144 aSquared = mulQ96X48(aTerm, aTerm);
        uint144 bSquared = mulQ96X48(bTerm, bTerm);
        uint144 numerator = subQ96X48(addQ96X48(aSquared, bSquared), cTerm);
        uint144 two = convertToQ96X48(2);
        uint144 c = divQ96X48(numerator, two);
        
        // Solve quadratic equation: ax² + bx + c = 0
        // Calculate discriminant: b² - 4ac
        uint144 bSquaredForDiscriminant = mulQ96X48(b, b);
        uint144 four = convertToQ96X48(4);
        uint144 fourAC = mulQ96X48(mulQ96X48(four, a), c);
        
        // Check if discriminant is positive
        if (bSquaredForDiscriminant < fourAC) {
            return deltaLinear; // No real solution, return fallback
        }
        
        uint144 discriminant = subQ96X48(bSquaredForDiscriminant, fourAC);
        uint144 sqrtDiscriminant = sqrtQ96X48(discriminant);
        
        // Calculate roots considering the sign of b
        uint144 twoA = mulQ96X48(two, a);
        
        uint144 x1;
        uint144 x2;
        
        if (bIsPositive) {
            // x1 = (√discriminant - b) / 2a
            x1 = sqrtDiscriminant >= b ? divQ96X48(subQ96X48(sqrtDiscriminant, b), twoA) : 0;
            x2 = 0; // Would be negative
        } else {
            // x1 = (b + √discriminant) / 2a
            x1 = divQ96X48(addQ96X48(b, sqrtDiscriminant), twoA);
            // x2 = (b - √discriminant) / 2a
            x2 = b >= sqrtDiscriminant ? divQ96X48(subQ96X48(b, sqrtDiscriminant), twoA) : 0;
        }
        
        // Calculate x1 - P and x2 - P, then return whichever is positive
        uint144 x1MinusP = x1 >= p ? subQ96X48(x1, p) : 0;
        uint144 x2MinusP = x2 >= p ? subQ96X48(x2, p) : 0;
        
        // Return the positive result, prioritizing the smaller positive value
        if (x1MinusP > 0 && x2MinusP > 0) {
            return x1MinusP <= x2MinusP ? x1MinusP : x2MinusP;
        } else if (x1MinusP > 0) {
            return x1MinusP;
        } else if (x2MinusP > 0) {
            return x2MinusP;
        } else {
            return deltaLinear; // No positive solution, return fallback
        }
    }
    
    /**
     * @dev Solves the torus invariant equation to calculate token output amount
     */
    function solveTorusInvariant(
        uint144 sumInteriorReserves,
        uint144 interiorConsolidatedRadius,
        uint144 boundaryConsolidatedRadius,
        uint144 boundaryTotalKBound,
        uint144 tokenInIndex,
        uint144 tokenOutIndex,
        uint144 amountInAfterFee,
        uint144[] memory totalReserves
    ) public pure returns (uint144) {
        uint144 sqrtN = sqrtQ96X48(convertToQ96X48(5));
        
        // Starting from valid reserve state, update xi to xi + d
        uint144[] memory updatedTotalReserves = new uint144[](totalReserves.length);
        for (uint256 i = 0; i < totalReserves.length; i++) {
            updatedTotalReserves[i] = totalReserves[i];
        }
        updatedTotalReserves[tokenInIndex] = addQ96X48(totalReserves[tokenInIndex], amountInAfterFee);
        
        // Now solve for xj using Newton's method
        uint144 tokenOutReserve = totalReserves[tokenOutIndex];
        
        // Better initial guess: for stablecoin swaps, output ≈ input
        uint144 xJ = tokenOutReserve > amountInAfterFee ? 
            subQ96X48(tokenOutReserve, amountInAfterFee) : 
            divQ96X48(tokenOutReserve, convertToQ96X48(2));
            
        uint144 tolerance = convertToQ96X48(1);
        uint144 epsilon = convertToQ96X48(1); // Small value for numerical derivative
        
        // Newton's method to find xj that satisfies the invariant
        for (uint256 iteration = 0; iteration < 20; iteration++) {
            // Calculate f(xj) = target_r_int_squared - current_r_int_squared
            uint144 fValue = calculateInvariantError(
                xJ,
                updatedTotalReserves,
                sumInteriorReserves,
                interiorConsolidatedRadius,
                boundaryConsolidatedRadius,
                boundaryTotalKBound,
                tokenOutIndex,
                sqrtN
            );
            
            // Check convergence
            uint144 absFValue = fValue; // Assuming positive for simplicity
            
            if (absFValue <= tolerance) {
                break;
            }
            
            // Calculate f'(xj) using numerical differentiation
            uint144 xJPlusEpsilon = addQ96X48(xJ, epsilon);
            uint144 fPrimeValue = calculateInvariantError(
                xJPlusEpsilon,
                updatedTotalReserves,
                sumInteriorReserves,
                interiorConsolidatedRadius,
                boundaryConsolidatedRadius,
                boundaryTotalKBound,
                tokenOutIndex,
                sqrtN
            );
            
            // Calculate derivative: (f(x + ε) - f(x)) / ε
            uint144 derivative = divQ96X48(subQ96X48(fPrimeValue, fValue), epsilon);
            
            // Avoid division by zero
            if (derivative == 0) {
                break;
            }
            
            // Newton's update: xj = xj - f(xj) / f'(xj)
            uint144 update = divQ96X48(fValue, derivative);
            xJ = subQ96X48(xJ, update);
            
            // Ensure xj stays within valid bounds
            uint144 maxBound = mulQ96X48(tokenOutReserve, convertToQ96X48(2));
            if (xJ > maxBound) {
                xJ = maxBound;
            }
            
            if (xJ < convertToQ96X48(1)) {
                xJ = convertToQ96X48(1);
            }
        }
        
        // Calculate amount_out = original_reserve - final_xj
        return tokenOutReserve > xJ ? subQ96X48(tokenOutReserve, xJ) : 0;
    }
    
    /**
     * @dev Helper function to calculate variance term from reserves
     */
    function calculateVarianceTerm(uint144[] memory reserves) private pure returns (uint144) {
        uint144 n = convertToQ96X48(5);
        
        uint144 sumTotal = 0;
        uint144 sumSquares = 0;
        
        for (uint256 i = 0; i < reserves.length; i++) {
            sumTotal = addQ96X48(sumTotal, reserves[i]);
            uint144 squared = mulQ96X48(reserves[i], reserves[i]);
            sumSquares = addQ96X48(sumSquares, squared);
        }
        
        // Calculate √(Σx²_total_i - 1/n(Σx_total_i)²)
        uint144 sumTotalSquared = mulQ96X48(sumTotal, sumTotal);
        uint144 oneOverNSumSquared = divQ96X48(sumTotalSquared, n);
        uint144 varianceInner = subQ96X48(sumSquares, oneOverNSumSquared);
        return sqrtQ96X48(varianceInner);
    }
    
    /**
     * @dev Helper function to calculate the invariant error f(xj)
     */
    function calculateInvariantError(
        uint144 xJ,
        uint144[] memory updatedTotalReserves,
        uint144 sumInteriorReserves,
        uint144 interiorConsolidatedRadius,
        uint144 boundaryConsolidatedRadius,
        uint144 boundaryTotalKBound,
        uint144 tokenOutIndex,
        uint144 sqrtN
    ) private pure returns (uint144) {
        // Create reserves with the current xj guess
        uint144[] memory currentReserves = new uint144[](updatedTotalReserves.length);
        for (uint256 i = 0; i < updatedTotalReserves.length; i++) {
            currentReserves[i] = updatedTotalReserves[i];
        }
        currentReserves[tokenOutIndex] = xJ;
        
        // Calculate variance term using helper function
        uint144 sqrtVariance = calculateVarianceTerm(currentReserves);
        
        // Calculate second term: (√variance - boundary_consolidated_radius)²
        uint144 secondTermDiff = subQ96X48(sqrtVariance, boundaryConsolidatedRadius);
        uint144 secondTermSquared = mulQ96X48(secondTermDiff, secondTermDiff);
        
        // Calculate first term: (1/√n * Σ(x_int_i) - k_bound - r_int√n)²
        uint144 scaledInteriorSum = divQ96X48(sumInteriorReserves, sqrtN);
        uint144 rIntSqrtN = mulQ96X48(interiorConsolidatedRadius, sqrtN);
        uint144 firstTermInner = subQ96X48(
            subQ96X48(scaledInteriorSum, boundaryTotalKBound),
            rIntSqrtN
        );
        uint144 firstTermSquared = mulQ96X48(firstTermInner, firstTermInner);
        
        // Calculate target r²_int
        uint144 targetRIntSquared = addQ96X48(firstTermSquared, secondTermSquared);
        
        // Calculate current r²_int from interior_consolidated_radius
        uint144 currentRIntSquared = mulQ96X48(interiorConsolidatedRadius, interiorConsolidatedRadius);
        
        // Return f(xj) = target_r_int_squared - current_r_int_squared
        return subQ96X48(targetRIntSquared, currentRIntSquared);
    }
}