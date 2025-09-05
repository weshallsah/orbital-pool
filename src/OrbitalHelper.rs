//! lib.rs: Arbitrum Stylus contract for Orbital AMM mathematical computations.
#![cfg_attr(not(feature = "export-abi"), no_main)]
#![allow(non_snake_case)] // Allows camelCase function names to match Solidity.

extern crate alloc;

/// Use the Stylus SDK prelude, which brings in many common types and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};

// ===================================================================
//
//                        CONSTANTS AND STRUCTS
//
// ===================================================================

const TOKENS_COUNT: usize = 5;
const PRECISION: U256 = U256::from_limbs([1000000000000000000_u64, 0, 0, 0]);
const SQRT5_SCALED: U256 = U256::from_limbs([2236067977499790000_u64, 0, 0, 0]);
const TOLERANCE_FACTOR: U256 = U256::from_limbs([100000000_u64, 0, 0, 0]);
const EPSILON_SCALED: U256 = U256::from_limbs([1000000000000_u64, 0, 0, 0]);
const TINY_SCALED: U256 = U256::from_limbs([1000000_u64, 0, 0, 0]);

#[storage]
#[entrypoint]
pub struct OrbitalMathHelper {
    _placeholder: StorageU256,
}

#[derive(Debug, Clone, Copy)]
pub enum MathError {
    InvalidArrayLength,
    InsufficientLiquidity,
    ConvergenceError,
    InvalidTokenIndex,
    NegativeSqrt,
}

// ===================================================================
//
//                  ORBITAL MATH HELPER IMPLEMENTATION
//
// ===================================================================

#[public]
impl OrbitalMathHelper {
    /// @notice Calculates the output amount for a swap by solving the torus invariant
    /// @dev Implements a robust version of Newton's method for root-finding using fixed-point arithmetic
    /// Solves the Orbital AMM torus invariant to determine swap output amount
    ///
    /// This implements the core equation from the Orbital whitepaper:
    /// (1/√n * Σ(x_int,i) - k_bound - r_int * √n)² + (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)² = C
    ///
    /// @param sum_interior_reserves Sum of interior reserves from consolidated data
    /// @param interior_consolidated_radius Interior consolidated radius
    /// @param boundary_consolidated_radius Boundary consolidated radius  
    /// @param boundary_total_k_bound Boundary total k bound
    /// @param total_reserves Current total reserves across all ticks
    /// @param token_in_index Index of the input token (0-4)
    /// @param token_out_index Index of the output token (0-4)
    /// @param amount_in_after_fee Input amount after fee deduction
    /// @return The computed output amount (0 if error)
    pub fn solveTorusInvariant(
        &self,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        total_reserves: Vec<U256>,
        token_in_index: U256,
        token_out_index: U256,
        amount_in_after_fee: U256,
    ) -> U256 {
        let token_in_idx = token_in_index.to::<usize>();
        let token_out_idx = token_out_index.to::<usize>();

        // --- 1. Comprehensive input validation ---
        if token_in_idx >= TOKENS_COUNT || token_out_idx >= TOKENS_COUNT {
            return U256::ZERO;
        }
        if token_in_idx == token_out_idx {
            return U256::ZERO;
        }
        if total_reserves.len() != TOKENS_COUNT {
            return U256::ZERO;
        }
        if amount_in_after_fee.is_zero() {
            return U256::ZERO;
        }

        // Additional validations for liquidity
        if sum_interior_reserves.is_zero() && boundary_consolidated_radius.is_zero() {
            return U256::ZERO;
        }

        // Check for overflow risks - use a reasonable max value
        let max_safe_reserve = U256::from(2).pow(U256::from(200)); // Leave room for calculations
        for reserve in total_reserves.iter() {
            if *reserve >= max_safe_reserve {
                return U256::ZERO;
            }
        }

        // --- 2. Calculate initial invariant using fixed-point arithmetic ---
        let initial_invariant = match self.compute_torus_invariant_fixed(
            sum_interior_reserves,
            interior_consolidated_radius,
            boundary_consolidated_radius,
            boundary_total_k_bound,
            &total_reserves,
        ) {
            Ok(inv) => inv,
            Err(_) => return U256::ZERO,
        };

        if initial_invariant.is_zero() {
            return U256::ZERO;
        }

        // --- 3. Initial guess using constant product approximation (fixed-point) ---
        let r_in = total_reserves[token_in_idx];
        let r_out = total_reserves[token_out_idx];

        if r_in.is_zero() || r_out.is_zero() {
            return U256::ZERO;
        }

        // y = (amount_in * r_out) / (r_in + amount_in)
        let numerator = self.mul_fixed(amount_in_after_fee, r_out);
        let denominator = r_in.saturating_add(amount_in_after_fee);

        if denominator.is_zero() {
            return U256::ZERO;
        }

        let mut y = self.div_fixed(numerator, denominator);

        // Boundary checks for the initial guess
        if y.is_zero() {
            y = self.div_fixed(amount_in_after_fee, U256::from(10));
        }
        if y >= r_out {
            y = self.div_fixed(r_out, U256::from(2));
        }

        // --- 4. Newton's Method Iteration with Trust Region (fixed-point) ---
        const MAX_ITER: usize = 50;
        let base_tol = self.div_fixed(initial_invariant, TOLERANCE_FACTOR);
        let mut trust_radius = self.div_fixed(y, U256::from(2));

        for iter in 0..MAX_ITER {
            let tol = if iter < 10 {
                self.mul_fixed(base_tol, U256::from(10))
            } else {
                base_tol
            };

            // Calculate f(y) = new_invariant - initial_invariant
            let f_y = match self.evaluate_function_at_y(
                y,
                &total_reserves,
                token_in_idx,
                token_out_idx,
                amount_in_after_fee,
                sum_interior_reserves,
                interior_consolidated_radius,
                boundary_consolidated_radius,
                boundary_total_k_bound,
                initial_invariant,
            ) {
                Ok(val) => val,
                Err(_) => return U256::ZERO,
            };

            // Check convergence
            if self.abs_fixed(f_y) <= tol {
                break;
            }

            // Calculate numerical derivative
            let eps = self.max_fixed(
                self.mul_fixed(self.abs_fixed(y), EPSILON_SCALED),
                TINY_SCALED,
            );

            let y_plus = y.saturating_add(eps);
            let y_minus = if y >= eps {
                y.saturating_sub(eps)
            } else {
                U256::ZERO
            };

            let f_plus = match self.evaluate_function_at_y(
                y_plus,
                &total_reserves,
                token_in_idx,
                token_out_idx,
                amount_in_after_fee,
                sum_interior_reserves,
                interior_consolidated_radius,
                boundary_consolidated_radius,
                boundary_total_k_bound,
                initial_invariant,
            ) {
                Ok(val) => val,
                Err(_) => return U256::ZERO,
            };

            let f_minus = match self.evaluate_function_at_y(
                y_minus,
                &total_reserves,
                token_in_idx,
                token_out_idx,
                amount_in_after_fee,
                sum_interior_reserves,
                interior_consolidated_radius,
                boundary_consolidated_radius,
                boundary_total_k_bound,
                initial_invariant,
            ) {
                Ok(val) => val,
                Err(_) => return U256::ZERO,
            };

            // deriv = (f_plus - f_minus) / (2 * eps)
            let f_diff = if f_plus >= f_minus {
                f_plus.saturating_sub(f_minus)
            } else {
                f_minus.saturating_sub(f_plus)
            };
            let two_eps = eps.saturating_mul(U256::from(2));
            if two_eps.is_zero() {
                break;
            }
            let deriv = self.div_fixed(f_diff, two_eps);

            // Check if derivative is too small
            let min_deriv = self.div_fixed(tol, U256::from(10000));
            if deriv < min_deriv {
                // Use gradient descent step
                let grad_step = self.mul_fixed(self.sign_fixed(f_y), trust_radius);
                y = if f_y >= PRECISION {
                    // f_y is positive, subtract grad_step
                    if y >= grad_step {
                        y.saturating_sub(grad_step)
                    } else {
                        U256::ZERO
                    }
                } else {
                    // f_y is negative, add grad_step
                    y.saturating_add(grad_step)
                };
                trust_radius = self.mul_fixed(trust_radius, U256::from(2));
            } else {
                // Newton step
                let newton_step = self.div_fixed(self.abs_fixed(f_y), deriv);
                let clamped_step = self.min_fixed(newton_step, trust_radius);

                if f_y >= PRECISION {
                    // f_y is positive, subtract step
                    y = if y >= clamped_step {
                        y.saturating_sub(clamped_step)
                    } else {
                        U256::ZERO
                    };
                } else {
                    // f_y is negative, add step
                    y = y.saturating_add(clamped_step);
                }
                trust_radius = self.mul_fixed(trust_radius, U256::from(11)) / U256::from(10);
            }

            // Enforce feasibility constraints
            if y.is_zero() {
                y = TINY_SCALED;
            }
            if y >= r_out {
                y = self.mul_fixed(r_out, U256::from(95)) / U256::from(100);
            }
        }

        // --- 5. Final Validation ---
        if y.is_zero() || y >= r_out {
            // Fallback to simple constant product with safety margin
            let fallback_num = self.mul_fixed(amount_in_after_fee, r_out);
            let fallback_den = r_in.saturating_add(amount_in_after_fee);
            if fallback_den.is_zero() {
                return U256::ZERO;
            }
            let fallback = self.div_fixed(fallback_num, fallback_den);
            return self.mul_fixed(fallback, U256::from(98)) / U256::from(100);
        }

        y
    }
    /// @notice Calculates the radius (or liquidity) of a tick from its reserves using fixed-point arithmetic
    /// @dev Uses the formula: radius = sqrt(sum of squared reserves)
    /// @param reserves Array of token reserves for the tick
    /// @return The calculated radius as U256
    pub fn calculateRadius(&self, reserves: Vec<U256>) -> U256 {
        if reserves.is_empty() {
            return U256::ZERO;
        }

        let mut sum_squares = U256::ZERO;
        for &reserve in reserves.iter() {
            // Calculate reserve^2 using fixed-point arithmetic
            let squared = self.mul_fixed(reserve, reserve);
            sum_squares = sum_squares.saturating_add(squared);
        }

        // Calculate integer square root
        self.sqrt_fixed(sum_squares)
    }

    /// @notice Calculates the s value for a boundary tick using fixed-point arithmetic
    /// @dev Implements the boundary tick calculation: s = sqrt(r² - (k - r/√n)²)
    /// @param r The radius of the tick
    /// @param k The plane constant for the tick
    /// @return The calculated s value as U256
    pub fn calculateBoundaryTickS(&self, r: U256, k: U256) -> U256 {
        if r.is_zero() {
            return U256::ZERO;
        }

        // Calculate r / sqrt(5) using fixed-point arithmetic
        // r_over_sqrt_n = (r * PRECISION) / SQRT5_SCALED
        let r_scaled = self.mul_fixed(r, PRECISION);
        let r_over_sqrt_n = self.div_fixed(r_scaled, SQRT5_SCALED);

        // Calculate (k - r/sqrt(n))^2
        let diff = if k >= r_over_sqrt_n {
            k.saturating_sub(r_over_sqrt_n)
        } else {
            r_over_sqrt_n.saturating_sub(k)
        };
        let diff_squared = self.mul_fixed(diff, diff);

        // Calculate r^2
        let r_squared = self.mul_fixed(r, r);

        // If r^2 <= diff^2, return 0
        if r_squared <= diff_squared {
            return U256::ZERO;
        }

        // Calculate sqrt(r^2 - diff^2)
        let result_squared = r_squared.saturating_sub(diff_squared);
        self.sqrt_fixed(result_squared)
    }
}

// ===================================================================
//
//                 PRIVATE HELPERS AND MATH LOGIC
//
// ===================================================================

impl OrbitalMathHelper {
    /// @notice Computes the torus invariant for a given state using fixed-point arithmetic
    /// @dev Implements: (1/√n * Σ(x_int,i) - k_bound - r_int * √n)² + (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)² = C
    /// @param sum_interior_reserves Sum of interior reserves
    /// @param interior_consolidated_radius Interior consolidated radius
    /// @param boundary_consolidated_radius Boundary consolidated radius
    /// @param boundary_total_k_bound Boundary total k bound
    /// @param total_reserves Current total reserves across all tokens
    /// @return Result containing the invariant value or an error
    fn compute_torus_invariant_fixed(
        &self,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        total_reserves: &[U256],
    ) -> Result<U256, MathError> {
        // Validate input
        if total_reserves.len() != TOKENS_COUNT {
            return Err(MathError::InvalidArrayLength);
        }

        // Term 1: (1/√n * Σ(x_int,i) - k_bound - r_int * √n)²
        // one_over_sqrt_n = PRECISION / SQRT5_SCALED
        let one_over_sqrt_n = self.div_fixed(PRECISION, SQRT5_SCALED);

        // term1_a = sum_interior * one_over_sqrt_n
        let term1_a = self.mul_fixed(sum_interior_reserves, one_over_sqrt_n);

        // term1_b = k_bound + (r_int * sqrt5)
        let r_int_times_sqrt5 = self.mul_fixed(interior_consolidated_radius, SQRT5_SCALED);
        let term1_b = boundary_total_k_bound.saturating_add(r_int_times_sqrt5);

        // term1_diff = max(0, term1_a - term1_b)
        let term1_diff = if term1_a >= term1_b {
            term1_a.saturating_sub(term1_b)
        } else {
            U256::ZERO
        };
        let term1 = self.mul_fixed(term1_diff, term1_diff);

        // Term 2: (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)²
        let mut sum_total_reserves = U256::ZERO;
        let mut sum_squares = U256::ZERO;

        // Calculate sum and sum of squares
        for &r in total_reserves {
            sum_total_reserves = sum_total_reserves.saturating_add(r);
            let r_squared = self.mul_fixed(r, r);
            sum_squares = sum_squares.saturating_add(r_squared);
        }

        // Calculate mean squared: (sum_total)² / n
        let sum_squared = self.mul_fixed(sum_total_reserves, sum_total_reserves);
        let mean_squared = self.div_fixed(sum_squared, U256::from(TOKENS_COUNT));

        // Calculate variance-like term: sum_squares - mean_squared
        let variance_term = if sum_squares >= mean_squared {
            sum_squares.saturating_sub(mean_squared)
        } else {
            // This shouldn't happen mathematically, but handle gracefully
            U256::ZERO
        };

        // Calculate sqrt of variance term
        let sqrt_term = self.sqrt_fixed(variance_term);

        // term2_diff = max(0, sqrt_term - r_bound)
        let term2_diff = if sqrt_term >= boundary_consolidated_radius {
            sqrt_term.saturating_sub(boundary_consolidated_radius)
        } else {
            U256::ZERO
        };
        let term2 = self.mul_fixed(term2_diff, term2_diff);

        Ok(term1.saturating_add(term2))
    }

    /// @notice Evaluates the function f(y) = new_invariant - initial_invariant at point y
    /// @dev Used in Newton's method to find the root of the torus invariant equation
    /// @param y The output amount to evaluate
    /// @param total_reserves Current total reserves
    /// @param token_in_idx Index of input token
    /// @param token_out_idx Index of output token
    /// @param amount_in Input amount after fees
    /// @param sum_interior_reserves Sum of interior reserves
    /// @param interior_consolidated_radius Interior consolidated radius
    /// @param boundary_consolidated_radius Boundary consolidated radius
    /// @param boundary_total_k_bound Boundary total k bound
    /// @param initial_invariant Initial invariant value
    /// @return Result containing the function value or an error
    fn evaluate_function_at_y(
        &self,
        y: U256,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in: U256,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        initial_invariant: U256,
    ) -> Result<U256, MathError> {
        if y.is_zero() {
            return Ok(U256::MAX); // Return large positive value to indicate infeasible
        }

        // Create new reserves after the swap
        let mut new_reserves = total_reserves.to_vec();
        new_reserves[token_in_idx] = new_reserves[token_in_idx].saturating_add(amount_in);

        if new_reserves[token_out_idx] < y {
            return Ok(U256::MAX); // Infeasible swap
        }
        new_reserves[token_out_idx] = new_reserves[token_out_idx].saturating_sub(y);

        // Calculate new invariant
        let new_invariant = self.compute_torus_invariant_fixed(
            sum_interior_reserves,
            interior_consolidated_radius,
            boundary_consolidated_radius,
            boundary_total_k_bound,
            &new_reserves,
        )?;

        // Return new_invariant - initial_invariant (signed difference represented as U256)
        if new_invariant >= initial_invariant {
            Ok(new_invariant
                .saturating_sub(initial_invariant)
                .saturating_add(PRECISION))
        } else {
            Ok(initial_invariant.saturating_sub(new_invariant))
        }
    }

    // ===================================================================
    //                    FIXED-POINT ARITHMETIC HELPERS
    // ===================================================================

    /// @notice Fixed-point multiplication: (a * b) / PRECISION
    /// @param a First operand
    /// @param b Second operand
    /// @return Result of fixed-point multiplication
    fn mul_fixed(&self, a: U256, b: U256) -> U256 {
        let product = a.saturating_mul(b);
        product / PRECISION
    }

    /// @notice Fixed-point division: (a * PRECISION) / b
    /// @param a Dividend
    /// @param b Divisor
    /// @return Result of fixed-point division
    fn div_fixed(&self, a: U256, b: U256) -> U256 {
        if b.is_zero() {
            return U256::ZERO;
        }
        let numerator = a.saturating_mul(PRECISION);
        numerator / b
    }

    /// @notice Fixed-point square root using Newton's method
    /// @param x Value to calculate square root of
    /// @return Square root of x in fixed-point representation
    fn sqrt_fixed(&self, x: U256) -> U256 {
        if x.is_zero() {
            return U256::ZERO;
        }
        if x == PRECISION {
            return PRECISION; // sqrt(1) = 1 in fixed-point
        }

        let mut z = x;
        let mut y = x.saturating_add(PRECISION) / U256::from(2);

        // Newton's method: y = (x/y + y) / 2
        for _ in 0..256 {
            if y >= z {
                return z;
            }
            z = y;
            let x_div_y = self.div_fixed(x, y);
            y = x_div_y.saturating_add(y) / U256::from(2);
        }
        z
    }

    /// @notice Returns absolute value (since we're using U256, this just returns the value)
    /// @param x Value to get absolute value of
    /// @return Absolute value of x
    fn abs_fixed(&self, x: U256) -> U256 {
        x
    }

    /// @notice Returns the sign of a value (1 for positive, 0 for zero)
    /// @dev In our encoding, values >= PRECISION are positive, < PRECISION are negative
    /// @param x Value to get sign of
    /// @return PRECISION for positive, 0 for zero/negative
    fn sign_fixed(&self, x: U256) -> U256 {
        if x >= PRECISION {
            PRECISION
        } else {
            U256::ZERO
        }
    }

    /// @notice Returns the maximum of two fixed-point numbers
    /// @param a First value
    /// @param b Second value
    /// @return Maximum of a and b
    fn max_fixed(&self, a: U256, b: U256) -> U256 {
        if a >= b {
            a
        } else {
            b
        }
    }

    /// @notice Returns the minimum of two fixed-point numbers
    /// @param a First value
    /// @param b Second value
    /// @return Minimum of a and b
    fn min_fixed(&self, a: U256, b: U256) -> U256 {
        if a <= b {
            a
        } else {
            b
        }
    }
}
