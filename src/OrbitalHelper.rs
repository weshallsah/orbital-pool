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
const PRECISION: U256 = U256::from_limbs([1000000000000000_u64, 0, 0, 0]); // 1e15 to match Solidity
const SQRT5_SCALED: U256 = U256::from_limbs([2236067977499790_u64, 0, 0, 0]); // Match Solidity scaling
const TOLERANCE_FACTOR: U256 = U256::from_limbs([100000000_u64, 0, 0, 0]);
const EPSILON_SCALED: U256 = U256::from_limbs([1000000000000_u64, 0, 0, 0]);
const TINY_SCALED: U256 = U256::from_limbs([1000000_u64, 0, 0, 0]);

// Additional mathematical constants for robustness
const MAX_SAFE_MULTIPLY: U256 = U256::from_limbs([0xFFFFFFFFFFFFFFFF_u64, 0xFFFFFFFFFFFFFFFF_u64, 0, 0]); // 2^128 - 1
const MAX_ITERATIONS_SQRT: usize = 64; // Reduced from 256 for efficiency
const MAX_NEWTON_ITERATIONS: usize = 100; // Increased for better convergence
const CONVERGENCE_THRESHOLD: U256 = U256::from_limbs([1000_u64, 0, 0, 0]); // 1e-12 in scaled terms

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
    /// @dev Implements a robust version of Newton's method with comprehensive error handling
    pub fn solveTorusInvariant(
        &self,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        token_in_index: U256,
        token_out_index: U256,
        amount_in_after_fee: U256,
        total_reserves: Vec<U256>,
    ) -> U256 {
        let token_in_idx = token_in_index.to::<usize>();
        let token_out_idx = token_out_index.to::<usize>();

        // Enhanced input validation
        if !self.validate_inputs(
            &total_reserves,
            token_in_idx,
            token_out_idx,
            amount_in_after_fee,
            sum_interior_reserves,
            boundary_consolidated_radius,
        ) {
            return U256::ZERO;
        }

        // Calculate initial invariant with error handling
        let initial_invariant = match self.compute_torus_invariant_fixed(
            sum_interior_reserves,
            interior_consolidated_radius,
            boundary_consolidated_radius,
            boundary_total_k_bound,
            &total_reserves,
        ) {
            Ok(inv) if inv > U256::ZERO => inv,
            _ => return U256::ZERO,
        };

        // Enhanced initial guess with bounds checking
        let (r_in, r_out) = (total_reserves[token_in_idx], total_reserves[token_out_idx]);
        
        let initial_guess = match self.calculate_initial_guess(amount_in_after_fee, r_in, r_out) {
            Some(guess) => guess,
            None => return U256::ZERO,
        };

        // Robust Newton's method with multiple fallback strategies
        match self.solve_newton_with_fallbacks(
            initial_guess,
            &total_reserves,
            token_in_idx,
            token_out_idx,
            amount_in_after_fee,
            sum_interior_reserves,
            interior_consolidated_radius,
            boundary_consolidated_radius,
            boundary_total_k_bound,
            initial_invariant,
            r_out,
        ) {
            Some(result) => result,
            None => self.fallback_constant_product(amount_in_after_fee, r_in, r_out),
        }
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

impl OrbitalMathHelper {
    /// @notice Comprehensive input validation
    fn validate_inputs(
        &self,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in_after_fee: U256,
        sum_interior_reserves: U256,
        boundary_consolidated_radius: U256,
    ) -> bool {
        // Basic index and length validation
        if token_in_idx >= TOKENS_COUNT || token_out_idx >= TOKENS_COUNT {
            return false;
        }
        if token_in_idx == token_out_idx {
            return false;
        }
        if total_reserves.len() != TOKENS_COUNT {
            return false;
        }
        if amount_in_after_fee.is_zero() {
            return false;
        }

        // Liquidity validation
        if sum_interior_reserves.is_zero() && boundary_consolidated_radius.is_zero() {
            return false;
        }

        // Overflow protection - check each reserve is within safe bounds
        for &reserve in total_reserves.iter() {
            if reserve >= MAX_SAFE_MULTIPLY || reserve.is_zero() {
                return false;
            }
        }

        // Check input amount is reasonable relative to reserves
        let max_reserve = total_reserves.iter().max().unwrap_or(&U256::ZERO);
        if amount_in_after_fee > self.mul_fixed(*max_reserve, U256::from(10)) {
            return false; // Input too large relative to reserves
        }

        true
    }

    /// @notice Calculate robust initial guess with bounds checking
    fn calculate_initial_guess(&self, amount_in: U256, r_in: U256, r_out: U256) -> Option<U256> {
        if r_in.is_zero() || r_out.is_zero() {
            return None;
        }

        // Constant product approximation with overflow protection
        let numerator = self.safe_mul(amount_in, r_out)?;
        let denominator = r_in.saturating_add(amount_in);
        
        if denominator.is_zero() {
            return None;
        }

        let mut guess = self.div_fixed(numerator, denominator);

        // Bound the initial guess
        if guess.is_zero() {
            guess = self.div_fixed(amount_in, U256::from(100)); // Conservative lower bound
        }
        
        // Upper bound: 95% of output reserve
        let max_output = self.mul_fixed(r_out, U256::from(95)) / U256::from(100);
        if guess >= max_output {
            guess = max_output;
        }

        Some(guess)
    }

    /// @notice Robust Newton's method with multiple fallback strategies
    fn solve_newton_with_fallbacks(
        &self,
        initial_guess: U256,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in: U256,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        initial_invariant: U256,
        r_out: U256,
    ) -> Option<U256> {
        let mut y = initial_guess;
        let base_tolerance = self.calculate_adaptive_tolerance(initial_invariant);
        let mut trust_radius = self.div_fixed(y, U256::from(4)); // Start with smaller trust region
        let mut consecutive_failures = 0;

        for iteration in 0..MAX_NEWTON_ITERATIONS {
            let current_tolerance = if iteration < 20 {
                self.mul_fixed(base_tolerance, U256::from(5)) // Relaxed tolerance initially
            } else {
                base_tolerance
            };

            // Evaluate function with error handling
            let f_y = match self.safe_evaluate_function(
                y, total_reserves, token_in_idx, token_out_idx, amount_in,
                sum_interior_reserves, interior_consolidated_radius,
                boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
            ) {
                Some(val) => val,
                None => {
                    consecutive_failures += 1;
                    if consecutive_failures > 3 {
                        return None;
                    }
                    // Try reducing y and continuing
                    y = self.mul_fixed(y, U256::from(9)) / U256::from(10);
                    continue;
                }
            };

            // Check convergence
            if self.abs_fixed(f_y) <= current_tolerance {
                return self.validate_final_result(y, r_out);
            }

            // Calculate robust numerical derivative
            let derivative = match self.calculate_robust_derivative(
                y, total_reserves, token_in_idx, token_out_idx, amount_in,
                sum_interior_reserves, interior_consolidated_radius,
                boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
            ) {
                Some(deriv) if deriv > TINY_SCALED => deriv,
                _ => {
                    // Derivative too small, use gradient descent
                    return self.gradient_descent_fallback(
                        y, f_y, trust_radius, r_out, iteration,
                        total_reserves, token_in_idx, token_out_idx, amount_in,
                        sum_interior_reserves, interior_consolidated_radius,
                        boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
                    );
                }
            };

            // Adaptive step calculation
            let step_size = self.calculate_adaptive_step(f_y, derivative, trust_radius, iteration);
            
            // Update y with bounds enforcement
            y = self.update_y_with_bounds(y, f_y, step_size, r_out);

            // Adaptive trust radius adjustment
            trust_radius = self.adjust_trust_radius(trust_radius, iteration, consecutive_failures);
            consecutive_failures = 0; // Reset on successful iteration
        }

        None // Failed to converge
    }

    /// @notice Safe function evaluation with comprehensive error handling
    fn safe_evaluate_function(
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
    ) -> Option<U256> {
        if y.is_zero() || y >= total_reserves[token_out_idx] {
            return None;
        }

        // Create new reserves with overflow protection
        let mut new_reserves = total_reserves.to_vec();
        new_reserves[token_in_idx] = new_reserves[token_in_idx].saturating_add(amount_in);
        
        if new_reserves[token_out_idx] < y {
            return None;
        }
        new_reserves[token_out_idx] = new_reserves[token_out_idx].saturating_sub(y);

        // Validate new reserves are still reasonable
        for &reserve in new_reserves.iter() {
            if reserve >= MAX_SAFE_MULTIPLY {
                return None;
            }
        }

        // Calculate new invariant with error handling
        match self.compute_torus_invariant_fixed(
            sum_interior_reserves,
            interior_consolidated_radius,
            boundary_consolidated_radius,
            boundary_total_k_bound,
            &new_reserves,
        ) {
            Ok(new_invariant) => {
                if new_invariant >= initial_invariant {
                    Some(new_invariant.saturating_sub(initial_invariant).saturating_add(PRECISION))
                } else {
                    Some(initial_invariant.saturating_sub(new_invariant))
                }
            }
            Err(_) => None,
        }
    }

    /// @notice Calculate robust numerical derivative with multiple approaches
    fn calculate_robust_derivative(
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
    ) -> Option<U256> {
        // Adaptive epsilon based on y magnitude
        let base_eps = self.max_fixed(
            self.mul_fixed(y, EPSILON_SCALED) / U256::from(1000), // Smaller epsilon
            TINY_SCALED,
        );

        // Try central difference first
        if let Some(deriv) = self.central_difference_derivative(
            y, base_eps, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        ) {
            if deriv > TINY_SCALED {
                return Some(deriv);
            }
        }

        // Fallback to forward difference with smaller step
        let small_eps = base_eps / U256::from(10);
        self.forward_difference_derivative(
            y, small_eps, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        )
    }

    /// @notice Central difference derivative calculation
    fn central_difference_derivative(
        &self,
        y: U256,
        eps: U256,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in: U256,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        initial_invariant: U256,
    ) -> Option<U256> {
        let y_plus = y.saturating_add(eps);
        let y_minus = if y >= eps { y.saturating_sub(eps) } else { return None; };

        let f_plus = self.safe_evaluate_function(
            y_plus, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        )?;

        let f_minus = self.safe_evaluate_function(
            y_minus, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        )?;

        let f_diff = if f_plus >= f_minus {
            f_plus.saturating_sub(f_minus)
        } else {
            f_minus.saturating_sub(f_plus)
        };

        let two_eps = eps.saturating_mul(U256::from(2));
        if two_eps.is_zero() {
            return None;
        }

        Some(self.div_fixed(f_diff, two_eps))
    }

    /// @notice Forward difference derivative calculation
    fn forward_difference_derivative(
        &self,
        y: U256,
        eps: U256,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in: U256,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        initial_invariant: U256,
    ) -> Option<U256> {
        let y_plus = y.saturating_add(eps);
        
        let f_y = self.safe_evaluate_function(
            y, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        )?;

        let f_plus = self.safe_evaluate_function(
            y_plus, total_reserves, token_in_idx, token_out_idx, amount_in,
            sum_interior_reserves, interior_consolidated_radius,
            boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
        )?;

        let f_diff = if f_plus >= f_y {
            f_plus.saturating_sub(f_y)
        } else {
            f_y.saturating_sub(f_plus)
        };

        if eps.is_zero() {
            return None;
        }

        Some(self.div_fixed(f_diff, eps))
    }

    // ===================================================================
    //                    ENHANCED MATHEMATICAL HELPERS
    // ===================================================================

    /// @notice Safe multiplication with overflow detection
    fn safe_mul(&self, a: U256, b: U256) -> Option<U256> {
        if a.is_zero() || b.is_zero() {
            return Some(U256::ZERO);
        }
        
        // Check for potential overflow
        if a > MAX_SAFE_MULTIPLY / b {
            return None;
        }
        
        Some(a.saturating_mul(b))
    }

    /// @notice Enhanced fixed-point multiplication with overflow protection
    fn mul_fixed(&self, a: U256, b: U256) -> U256 {
        if let Some(product) = self.safe_mul(a, b) {
            product / PRECISION
        } else {
            // Handle overflow by using high precision arithmetic approximation
            let a_high = a / U256::from(1000000);
            let b_high = b / U256::from(1000000);
            let scale_factor = U256::from(1000000000000_u64); // 1e12
            
            (a_high.saturating_mul(b_high).saturating_mul(scale_factor)) / PRECISION
        }
    }

    /// @notice Enhanced fixed-point division with better precision
    fn div_fixed(&self, a: U256, b: U256) -> U256 {
        if b.is_zero() {
            return U256::ZERO;
        }
        
        // Check for potential overflow in numerator
        if a <= MAX_SAFE_MULTIPLY / PRECISION {
            let numerator = a.saturating_mul(PRECISION);
            numerator / b
        } else {
            // Use scaled division to avoid overflow
            let scale = U256::from(1000000);
            let a_scaled = a / scale;
            let precision_scaled = PRECISION / scale;
            let numerator = a_scaled.saturating_mul(precision_scaled);
            numerator / b
        }
    }

    /// @notice Robust square root with enhanced convergence
    fn sqrt_fixed(&self, x: U256) -> U256 {
        if x.is_zero() {
            return U256::ZERO;
        }
        if x == PRECISION {
            return PRECISION;
        }
        if x < PRECISION {
            // For values less than 1, use a different initial guess
            let mut z = x;
            let mut y = PRECISION;
            
            for _ in 0..MAX_ITERATIONS_SQRT {
                if y >= z {
                    return z;
                }
                z = y;
                if y.is_zero() {
                    break;
                }
                let x_div_y = self.div_fixed(x, y);
                y = x_div_y.saturating_add(y) / U256::from(2);
            }
            return z;
        }

        // Standard Newton's method for values >= 1
        let mut z = x;
        let mut y = x.saturating_add(PRECISION) / U256::from(2);

        for _ in 0..MAX_ITERATIONS_SQRT {
            if y >= z {
                return z;
            }
            z = y;
            if y.is_zero() {
                break;
            }
            let x_div_y = self.div_fixed(x, y);
            y = x_div_y.saturating_add(y) / U256::from(2);
        }
        z
    }

    /// @notice Calculate adaptive tolerance based on invariant magnitude
    fn calculate_adaptive_tolerance(&self, invariant: U256) -> U256 {
        let base_tolerance = self.div_fixed(invariant, TOLERANCE_FACTOR);
        self.max_fixed(base_tolerance, CONVERGENCE_THRESHOLD)
    }

    /// @notice Calculate adaptive step size for Newton's method
    fn calculate_adaptive_step(&self, f_y: U256, derivative: U256, trust_radius: U256, iteration: usize) -> U256 {
        let newton_step = self.div_fixed(self.abs_fixed(f_y), derivative);
        let max_step = if iteration < 10 {
            trust_radius
        } else {
            trust_radius / U256::from(2) // More conservative in later iterations
        };
        
        self.min_fixed(newton_step, max_step)
    }

    /// @notice Update y with strict bounds enforcement
    fn update_y_with_bounds(&self, y: U256, f_y: U256, step_size: U256, r_out: U256) -> U256 {
        let new_y = if f_y >= PRECISION {
            // f_y is positive, subtract step
            if y >= step_size {
                y.saturating_sub(step_size)
            } else {
                TINY_SCALED
            }
        } else {
            // f_y is negative, add step
            y.saturating_add(step_size)
        };

        // Enforce bounds
        let max_output = self.mul_fixed(r_out, U256::from(98)) / U256::from(100);
        if new_y.is_zero() {
            TINY_SCALED
        } else if new_y >= max_output {
            max_output
        } else {
            new_y
        }
    }

    /// @notice Adaptive trust radius adjustment
    fn adjust_trust_radius(&self, current_radius: U256, iteration: usize, failures: u32) -> U256 {
        if failures > 0 {
            // Reduce trust radius on failures
            current_radius / U256::from(2)
        } else if iteration < 20 {
            // Expand trust radius in early iterations
            self.mul_fixed(current_radius, U256::from(11)) / U256::from(10)
        } else {
            // Keep steady in later iterations
            current_radius
        }
    }

    /// @notice Validate final result before returning
    fn validate_final_result(&self, y: U256, r_out: U256) -> Option<U256> {
        if y.is_zero() || y >= r_out {
            return None;
        }
        
        // Additional sanity checks
        if y > self.mul_fixed(r_out, U256::from(99)) / U256::from(100) {
            return None; // Too close to total reserves
        }
        
        Some(y)
    }

    /// @notice Fallback to constant product formula
    fn fallback_constant_product(&self, amount_in: U256, r_in: U256, r_out: U256) -> U256 {
        if r_in.is_zero() || r_out.is_zero() {
            return U256::ZERO;
        }

        let numerator = self.mul_fixed(amount_in, r_out);
        let denominator = r_in.saturating_add(amount_in);
        
        if denominator.is_zero() {
            return U256::ZERO;
        }
        
        let result = self.div_fixed(numerator, denominator);
        // Apply 5% safety margin for fallback
        self.mul_fixed(result, U256::from(95)) / U256::from(100)
    }

    /// @notice Gradient descent fallback when derivative is too small
    fn gradient_descent_fallback(
        &self,
        y: U256,
        f_y: U256,
        mut step_size: U256,
        r_out: U256,
        _iteration: usize,
        total_reserves: &[U256],
        token_in_idx: usize,
        token_out_idx: usize,
        amount_in: U256,
        sum_interior_reserves: U256,
        interior_consolidated_radius: U256,
        boundary_consolidated_radius: U256,
        boundary_total_k_bound: U256,
        initial_invariant: U256,
    ) -> Option<U256> {
        let max_gd_iterations = 20;
        let current_y = y;
        
        for _ in 0..max_gd_iterations {
            let direction = if f_y >= PRECISION { 
                step_size 
            } else { 
                step_size 
            };
            
            let new_y = if f_y >= PRECISION {
                if current_y >= direction { current_y.saturating_sub(direction) } else { TINY_SCALED }
            } else {
                current_y.saturating_add(direction)
            };
            
            // Bounds check
            if new_y.is_zero() || new_y >= r_out {
                step_size = step_size / U256::from(2);
                if step_size < TINY_SCALED {
                    break;
                }
                continue;
            }
            
            // Check if this is an improvement
            if let Some(new_f_y) = self.safe_evaluate_function(
                new_y, total_reserves, token_in_idx, token_out_idx, amount_in,
                sum_interior_reserves, interior_consolidated_radius,
                boundary_consolidated_radius, boundary_total_k_bound, initial_invariant,
            ) {
                if self.abs_fixed(new_f_y) < self.abs_fixed(f_y) {
                    return Some(new_y);
                }
            }
            
            step_size = step_size / U256::from(2);
            if step_size < TINY_SCALED {
                break;
            }
        }
        
        None
    }

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

    // ===================================================================
    //                    FIXED-POINT ARITHMETIC HELPERS
    // ===================================================================

    /// @notice Returns absolute value (since we're using U256, this just returns the value)
    /// @param x Value to get absolute value of
    /// @return Absolute value of x
    fn abs_fixed(&self, x: U256) -> U256 {
        x
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
